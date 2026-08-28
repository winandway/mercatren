"use server";

import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { intentosDescripcion, productos, tiendas } from "@/lib/db/schema";

import { descripcionDeCj } from "@/lib/cj/descripcion";

import {
  traducirDescripciones,
  traducirTanda,
  traductorConfigurado,
} from "./modelo";
import { faltaTraducir, POR_TANDA, type PeticionDeTraduccion } from "./reglas";

/**
 * ══ EL TRADUCTOR TRABAJA SOBRE EL CATÁLOGO DEL PAÍS ELEGIDO (28 ago 2026) ══
 *
 * Iba clavado a `paisOrigen = "US"`, así que los productos chilenos —también
 * guardados con el título de CJ en inglés— no entraban nunca a la cola. Con el
 * selector del panel en Chile se traduce lo de Chile, y el traductor no se
 * mete en otra plaza. Las CUATRO consultas de este archivo pasan por aquí:
 * si una se quedara en «US», el conteo de pendientes hablaría de un catálogo
 * y el botón traduciría otro.
 */
async function paisDelCatalogoDelPanel(): Promise<string> {
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const { plazaDelMercado } = await import("@/lib/cj/plazas");
  return plazaDelMercado(await mercadoDelPanel()).paisEntrega;
}

/**
 * TRADUCIR EL CATÁLOGO DE ESTADOS UNIDOS, POR TANDAS.
 *
 * ══ POR QUÉ UN BOTÓN Y NO UN SCRIPT ══
 *
 * Porque el catálogo vive en la base de producción, y esa no se toca desde una
 * computadora con un script suelto. Igual que «Repartir por rubro» y «Traer
 * las fotos»: quien lo dispara es una persona del equipo, desde el panel, y
 * ve lo que va pasando.
 *
 * ══ SE PUEDE PARAR Y RETOMAR, Y ESO NO ES UN LUJO ══
 *
 * Cada llamada traduce una tanda y devuelve cuántos quedan. La pantalla la
 * vuelve a llamar hasta que no queda ninguno. Si se cierra el navegador a
 * mitad, lo traducido se queda traducido y al volver sigue por donde iba,
 * porque **lo que decide qué falta es el propio dato**, no un contador
 * guardado en algún sitio: un producto está sin traducir cuando su título en
 * español todavía es idéntico al inglés.
 *
 * Eso lo hace idempotente de verdad. Se puede pulsar mil veces.
 */

export type ResultadoTraduccion = {
  ok: boolean;
  traducidos: number;
  restantes: number;
  motivo?: string;
};

const NO_AUTORIZADO: ResultadoTraduccion = {
  ok: false,
  traducidos: 0,
  restantes: 0,
  motivo: "no-autorizado",
};

export async function traducirCatalogoUs(): Promise<ResultadoTraduccion> {
  /* SOLO EL ROL `soporte`, Y COMPROBADO EN EL SERVIDOR.
     Esto reescribe el título de productos publicados —lo que ve el comprador
     y lo que lee Google— así que no basta con «ser del equipo»: se usa el
     mismo candado que los retiros a Mercury. Quien esté mirando el panel de un
     comercio con el disfraz de «ver su panel» tampoco pasa. */
  if (!(await esSoporteDeVerdad())) return NO_AUTORIZADO;

  if (!traductorConfigurado()) {
    return {
      ok: false,
      traducidos: 0,
      restantes: 0,
      motivo:
        "Falta la variable TRADUCCION_LLAVE en el panel del sitio. Sin ella no se traduce nada y el catálogo se queda como está.",
    };
  }

  /**
   * ══ EL TRADUCTOR TRABAJA SOBRE EL CATÁLOGO DEL PAÍS ELEGIDO (28 ago 2026) ══
   *
   * Iba clavado a `paisOrigen = "US"`, así que los productos chilenos —también
   * guardados con el título de CJ en inglés— no entraban nunca a la cola. Lo
   * pidió el dueño con la ficha delante: con el selector del panel en Chile se
   * traduce lo de Chile, y el traductor no se mete en otra plaza.
   */
  const paisDelCatalogo = await paisDelCatalogoDelPanel();

  const db = getDb();

  /* SOLO LAS COLUMNAS QUE HACEN FALTA, NUNCA LA TABLA ENTERA.
     Pedir `productos` completo lista todas las columnas del esquema, incluidas
     las que aún no existen en la base de producción — y eso ya tumbó una
     pantalla entera el 5 ago 2026. */
  const candidatos = await db
    .select({
      id: productos.id,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(tiendas.paisOrigen, paisDelCatalogo),
        isNotNull(productos.tituloEn),
      ),
    );

  const pendientes = candidatos.filter(faltaTraducir);
  if (pendientes.length === 0) {
    return { ok: true, traducidos: 0, restantes: 0 };
  }

  const tanda: PeticionDeTraduccion[] = pendientes
    .slice(0, POR_TANDA)
    .map((p) => ({ id: p.id, tituloEn: (p.tituloEn ?? "").trim() }));

  const resultado = await traducirTanda(tanda);
  if (!resultado.ok) {
    return {
      ok: false,
      traducidos: 0,
      restantes: pendientes.length,
      motivo: resultado.motivo,
    };
  }

  let guardados = 0;
  for (const t of resultado.traducciones) {
    try {
      await db
        .update(productos)
        .set({ tituloEs: t.tituloEs, actualizadoEn: new Date() })
        .where(eq(productos.id, t.id));
      guardados += 1;
    } catch (fallo) {
      /* Que uno falle no detiene a los demás: son productos independientes y
         una tanda a medias es mejor que ninguna. El que falle se vuelve a
         intentar solo en la siguiente pasada, porque sigue sin traducir. */
      console.error("[traduccion] no se pudo guardar", t.id, fallo);
    }
  }

  return {
    ok: true,
    traducidos: guardados,
    restantes: Math.max(0, pendientes.length - guardados),
  };
}

/** Cuántos productos de EE. UU. siguen sin traducir. Para pintar la pantalla. */
export async function contarSinTraducir(): Promise<number> {
  if (!(await esSoporteDeVerdad())) return 0;

  const db = getDb();
  const paisDelCatalogo = await paisDelCatalogoDelPanel();
  const filas = await db
    .select({
      id: productos.id,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(tiendas.paisOrigen, paisDelCatalogo),
        isNotNull(productos.tituloEn),
      ),
    );

  return filas.filter(faltaTraducir).length;
}

/** Para el panel: ¿se puede traducir, o falta la llave? */
export async function estadoDelTraductor(): Promise<{
  configurado: boolean;
  sinTraducir: number;
}> {
  if (!(await esSoporteDeVerdad())) {
    return { configurado: false, sinTraducir: 0 };
  }
  return {
    configurado: traductorConfigurado(),
    sinTraducir: await contarSinTraducir(),
  };
}

/**
 * PROBAR EL TRADUCTOR SIN TOCAR NI UN PRODUCTO.
 *
 * ══ POR QUÉ HACE FALTA UN BOTÓN APARTE ══
 *
 * El botón de traducir escribe en el catálogo publicado. La primera vez que se
 * pulsa, uno quiere saber dos cosas antes de eso: que la llave está bien
 * pegada, y que lo que devuelve el modelo se lee como lo escribiría una
 * tienda. Esto contesta las dos **sin guardar nada**.
 *
 * Es el mismo patrón que «Probar el envío» de los correos, y por el mismo
 * motivo: hay piezas que no se pueden verificar mirando la pantalla porque
 * viven del otro lado de una llamada.
 *
 * ══ SE PRUEBA CON UN TÍTULO REAL DEL CATÁLOGO ══
 *
 * Con un texto inventado se comprueba que la llave funciona y nada más. Con
 * uno de verdad —de los que están publicados ahora mismo— se ve si el modelo
 * sabe lidiar con los títulos de CJ, que vienen cargados de códigos y palabras
 * sueltas. Si no hay ninguno sin traducir, se usa uno de muestra y se dice.
 */
export type PruebaDeTraduccion = {
  ok: boolean;
  original?: string;
  traducido?: string;
  deMuestra?: boolean;
  motivo?: string;
};

const MUESTRA =
  "S24109 Elecony 24 Inch Fat Tire Bike Youth Full Shimano 7 Speed";

export async function probarTraductor(): Promise<PruebaDeTraduccion> {
  if (!(await esSoporteDeVerdad())) {
    return { ok: false, motivo: "no-autorizado" };
  }

  if (!traductorConfigurado()) {
    return {
      ok: false,
      motivo:
        "Falta la variable TRADUCCION_LLAVE en el panel del sitio, o el sitio todavía no se ha vuelto a publicar desde que la agregaste.",
    };
  }

  /* Un título de verdad del catálogo, si lo hay. */
  let original = MUESTRA;
  let deMuestra = true;
  try {
    const paisDelCatalogo = await paisDelCatalogoDelPanel();
    const filas = await getDb()
      .select({
        id: productos.id,
        tituloEs: productos.tituloEs,
        tituloEn: productos.tituloEn,
      })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(
        and(
          eq(tiendas.paisOrigen, paisDelCatalogo),
          isNotNull(productos.tituloEn),
        ),
      );

    const pendiente = filas.filter(faltaTraducir)[0];
    if (pendiente?.tituloEn?.trim()) {
      original = pendiente.tituloEn.trim();
      deMuestra = false;
    }
  } catch {
    /* Si la consulta falla se prueba igual con la muestra: lo que se está
       comprobando aquí es el traductor, no la base. */
  }

  const resultado = await traducirTanda([{ id: "prueba", tituloEn: original }]);

  if (!resultado.ok) {
    return { ok: false, original, deMuestra, motivo: resultado.motivo };
  }

  const traducido = resultado.traducciones[0]?.tituloEs;
  if (!traducido) {
    return {
      ok: false,
      original,
      deMuestra,
      motivo:
        "El traductor contestó, pero lo que devolvió no sirve: o estaba vacío, o era el mismo texto en inglés, o era una parrafada en vez de un título. No se guardó nada.",
    };
  }

  /* NO SE GUARDA. Es una prueba, y la prueba de que es una prueba es que aquí
     no hay ni un UPDATE. */
  return { ok: true, original, traducido, deMuestra };
}

/**
 * TRAER LAS DESCRIPCIONES DE CJ Y DEJARLAS EN ESPAÑOL.
 *
 * ══ LO QUE ARREGLA ══
 *
 * Los 1.071 productos de Estados Unidos estaban SIN descripción — no en
 * inglés: vacía. El catálogo se arma con el buscador de CJ, que devuelve
 * nombre, foto, SKU y precio y nada más; la descripción vive en el detalle del
 * producto, que es otra llamada y nunca se hizo.
 *
 * Se notó mirando el feed de Google: las fichas iban con una «descripción» que
 * era el título con una coletilla pegada. Google no indexa eso, y por eso el
 * catálogo no aparecía en ningún lado.
 *
 * ══ DOS PASOS POR PRODUCTO, EN ESTE ORDEN ══
 *
 * 1. Se le pide a CJ la descripción real (materiales, medidas, qué trae).
 * 2. Se traduce con el mismo traductor que ya funciona.
 *
 * **Si CJ no da nada, se queda vacía.** No se escribe una descripción a partir
 * de la foto ni del título: sería inventar afirmaciones sobre un producto que
 * nunca hemos tocado, y las devoluciones de Estados Unidos las paga Mercatren.
 *
 * ══ POR TANDAS DE CINCO ══
 *
 * Cada producto son dos llamadas —una a CJ y su parte de la del traductor— y
 * las descripciones son largas. Cinco es lo que cabe en una petición del borde
 * sin quedarse a medias.
 */
const POR_TANDA_DESCRIPCION = 5;

export type ResultadoDescripciones = {
  ok: boolean;
  escritas: number;
  sinDatos: number;
  restantes: number;
  motivo?: string;
};

export async function traerDescripciones(): Promise<ResultadoDescripciones> {
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      escritas: 0,
      sinDatos: 0,
      restantes: 0,
      motivo: "no-autorizado",
    };
  }
  if (!traductorConfigurado()) {
    return {
      ok: false,
      escritas: 0,
      sinDatos: 0,
      restantes: 0,
      motivo:
        "Falta la variable TRADUCCION_LLAVE en el panel del sitio. Sin ella se puede traer la descripción de CJ pero no dejarla en español.",
    };
  }

  const db = getDb();
  const paisDelCatalogo = await paisDelCatalogoDelPanel();
  const pendientes = await pendientesDeDescripcion(db);

  if (pendientes.length === 0) {
    return { ok: true, escritas: 0, sinDatos: 0, restantes: 0 };
  }

  const tanda = pendientes.slice(0, POR_TANDA_DESCRIPCION);
  const conTexto: Array<{ id: string; textoEn: string }> = [];
  let sinDatos = 0;
  let ultimoMotivo: string | null = null;
  const ahora = new Date();

  for (const p of tanda) {
    const r = await descripcionDeCj(p.externoId!);

    if (!r.ok) {
      sinDatos += 1;
      ultimoMotivo = r.motivo;
      /* EL MOTIVO QUEDA ESCRITO, en su propia tabla y no pisando la
         descripción. Marcar el fallo dentro del campo que se le enseña al
         comprador fue el error de la primera versión: la ficha dibujaba ese
         espacio y quedaba un hueco en blanco. */
      await db
        .insert(intentosDescripcion)
        .values({ productoId: p.id, motivo: r.motivo, intentadoEn: ahora })
        .onConflictDoUpdate({
          target: intentosDescripcion.productoId,
          set: { motivo: r.motivo, intentadoEn: ahora },
        })
        .catch(() => undefined);
      continue;
    }

    conTexto.push({ id: p.id, textoEn: r.texto });
    /* El original en inglés también se guarda: es el dato de CJ y sirve para
       la ficha en inglés y para volver a traducir si hiciera falta. */
    await db
      .update(productos)
      .set({ descripcionEn: r.texto, actualizadoEn: ahora })
      .where(eq(productos.id, p.id))
      .catch(() => undefined);
  }

  let escritas = 0;
  if (conTexto.length > 0) {
    const traducido = await traducirDescripciones(conTexto);
    if (!traducido.ok) {
      return {
        ok: false,
        escritas: 0,
        sinDatos,
        restantes: pendientes.length - sinDatos,
        motivo: traducido.motivo,
      };
    }
    for (const t of traducido.traducciones) {
      try {
        await db
          .update(productos)
          .set({ descripcionEs: t.texto, actualizadoEn: ahora })
          .where(eq(productos.id, t.id));
        escritas += 1;
      } catch (fallo) {
        console.error("[descripcion] no se pudo guardar", t.id, fallo);
      }
    }
  }

  return {
    ok: true,
    escritas,
    sinDatos,
    restantes: Math.max(0, pendientes.length - escritas - sinDatos),
    /* Si TODA la tanda falló, el motivo de la última sube a la pantalla: sin
       eso, la barra avanza «sin datos» y nadie se entera de que lo que pasa es
       que CJ nos está limitando las llamadas. */
    motivo: escritas === 0 && ultimoMotivo ? ultimoMotivo : undefined,
  };
}

/**
 * Los que todavía no tienen descripción en español.
 *
 * ══ UN TEXTO DE SOLO ESPACIOS CUENTA COMO VACÍO ══
 *
 * La primera versión marcaba los fallos con un espacio dentro del propio
 * campo. Aquí se usa `trim` en el SQL para que esos 1.032 vuelvan a entrar en
 * la cola solos, sin tener que tocar la base a mano.
 */
async function pendientesDeDescripcion(db: ReturnType<typeof getDb>) {
  const paisDelCatalogo = await paisDelCatalogoDelPanel();
  return db
    .select({ id: productos.id, externoId: productos.externoId })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(
      intentosDescripcion,
      eq(intentosDescripcion.productoId, productos.id),
    )
    .where(
      and(
        eq(tiendas.paisOrigen, paisDelCatalogo),
        isNotNull(productos.externoId),
        isNull(intentosDescripcion.productoId),
        or(
          isNull(productos.descripcionEs),
          eq(sql`trim(${productos.descripcionEs})`, ""),
        ),
      ),
    );
}

/** Cuántos productos de EE. UU. siguen sin descripción. */
export async function contarSinDescripcion(): Promise<number> {
  if (!(await esSoporteDeVerdad())) return 0;
  return (await pendientesDeDescripcion(getDb())).length;
}

/**
 * QUÉ DIJO CJ DE LOS QUE FALLARON, AGRUPADO POR MOTIVO.
 *
 * Es lo que convierte «1.032 sin datos» en una respuesta. Tres causas muy
 * distintas dan el mismo síntoma —CJ no tiene descripción de ese producto,
 * CJ nos está limitando las llamadas, o la petición va mal armada— y solo el
 * motivo las separa. Dos de las tres se arreglan.
 */
export async function motivosDeFallo(): Promise<
  Array<{ motivo: string; cuantos: number }>
> {
  if (!(await esSoporteDeVerdad())) return [];

  const filas = await getDb()
    .select({ motivo: intentosDescripcion.motivo })
    .from(intentosDescripcion);

  const cuenta = new Map<string, number>();
  for (const f of filas) {
    /* Se agrupa por el principio del motivo: los de CJ traen el id de la
       petición al final y si no, cada fallo sería un grupo de uno. */
    const clave = f.motivo.slice(0, 90);
    cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
  }

  return [...cuenta.entries()]
    .map(([motivo, cuantos]) => ({ motivo, cuantos }))
    .sort((a, b) => b.cuantos - a.cuantos)
    .slice(0, 6);
}

/**
 * Volver a intentar los que fallaron.
 *
 * Borra las marcas para que vuelvan a entrar en la cola. Se usa cuando el
 * motivo ya se arregló —por ejemplo, si CJ nos estaba limitando las llamadas y
 * al día siguiente ya no—, y no toca ni una descripción de las que sí se
 * trajeron.
 */
export async function reintentarDescripciones(): Promise<number> {
  if (!(await esSoporteDeVerdad())) return 0;
  const borrados = await getDb()
    .delete(intentosDescripcion)
    .returning({ id: intentosDescripcion.productoId });
  return borrados.length;
}
