"use server";

import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { imagenesProducto, productos } from "@/lib/db/schema";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { idDeDepartamento } from "@/lib/cj/departamento";
import { TIENDA_US_GENERAL, esDepartamentoReal } from "@/lib/cj/rubros";
import { vaAlMayorista } from "@/lib/cj/mayorista";
import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";
import { desglosarUs } from "@/lib/destino/precio-us";
import { desglosarChile } from "@/lib/destino/precio-chile";
import { desglosarColombia } from "@/lib/destino/precio-colombia";
import { plazaDelMercado, type Plaza } from "@/lib/cj/plazas";
import { fleteDeProducto } from "@/lib/cj/flete";
import {
  fuenteDeCj,
  guardarEnvio,
  guardarTallas,
  slugDe,
  tiendaDelRubro,
  tiendaMayorista,
} from "@/lib/cj/guardar";

/**
 * AGREGAR UN PRODUCTO DE CJ AL CATÁLOGO DE ESTADOS UNIDOS.
 *
 * ══ CUELGA DE UNA TIENDA INTERNA NUESTRA ══
 *
 * `productos.tiendaId` es obligatorio, y eso resulta ser lo correcto aquí: en
 * Estados Unidos **Mercatren LLC es quien vende y factura**, no un tercero. El
 * producto cuelga de una tienda nuestra con `paisOrigen: "US"`, y de ahí sale
 * su destino sin necesidad de una columna nueva.
 *
 * Es además lo que Merchant Center necesita: un solo vendedor responsable, con
 * una política de envío y una de devoluciones. Un mercado de terceros habría
 * que demostrarlo tienda por tienda.
 *
 * ══ SE GUARDA DE DÓNDE VINO ══
 *
 * `fuenteId` = `cj` y `externoId` = el id del producto en CJ. La pareja
 * (tienda, externoId) ya es única en el esquema, así que volver a agregar el
 * mismo producto **actualiza** en vez de duplicar — igual que el importador de
 * catálogo que ya existe. Sin eso, la segunda pasada llenaría el catálogo de
 * copias.
 *
 * ══ SE PUBLICA AL AGREGARLO, Y CAE EN SU DEPARTAMENTO ══
 *
 * Antes entraba en borrador. La intención era buena —una ficha de dos líneas en
 * inglés es media suspensión en Merchant Center— pero en borrador **no se ve en
 * la tienda**, y entonces el catálogo se arma a ciegas: veinte productos
 * elegidos y una tienda que sigue vacía.
 *
 * El departamento se calcula de la categoría que ya trae CJ (ver
 * `cj/departamento.ts`) y se ve en la tarjeta antes de pulsar el botón, para
 * corregir ahí el que caiga mal y no en una revisión de trescientos.
 *
 * Lo de Merchant Center sigue pendiente y se atiende donde de verdad está: en
 * el archivo que se le manda a Google, no en la tienda. Falta la descripción
 * propia y el título en español.
 */

type Resultado = { ok: boolean; mensaje: string };

export async function agregarProductoDeCj(
  formulario: FormData,
): Promise<Resultado> {
  const quien = await exigirEquipoInterno()
    .then(() => true)
    .catch(() => false);

  if (!quien) {
    return { ok: false, mensaje: "Esta parte es solo para el equipo." };
  }

  const { obtenerUsuario } = await import("@/lib/autorizacion");
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: "Hace falta una sesión." };

  const externoId = String(formulario.get("id") ?? "").trim();
  const nombre = String(formulario.get("nombre") ?? "").trim();
  const imagen = String(formulario.get("imagen") ?? "").trim();
  const sku = String(formulario.get("sku") ?? "").trim();
  const costoCentavos = Number(formulario.get("costo") ?? 0);
  const existencias = Number(formulario.get("existencias") ?? 0);

  /**
   * EL DEPARTAMENTO SE COMPRUEBA CONTRA LA LISTA, no se guarda tal cual.
   *
   * Llega calculado desde la pantalla —para que se vea antes de pulsar— pero
   * `productos.categoria_id` tiene una llave foránea: un slug que no exista
   * haría fallar el guardado entero. Se compara contra la lista real y, si no
   * está, el producto entra sin departamento en vez de no entrar.
   */
  const pedido = String(formulario.get("departamento") ?? "").trim();
  const departamento = DEPARTAMENTOS.some((d) => d.slug === pedido)
    ? pedido
    : null;

  if (
    !externoId ||
    !nombre ||
    !Number.isFinite(costoCentavos) ||
    costoCentavos <= 0
  ) {
    return { ok: false, mensaje: "Ese producto llegó incompleto de CJ." };
  }

  /**
   * ══ LA PLAZA LA DECIDE EL SELECTOR DEL PANEL (27 ago 2026) ══
   *
   * Con el selector en Chile, el producto entra a mercatren.cl con precio en
   * pesos; en Colombia, a .com.co. Es el mismo botón de siempre — el equipo
   * no aprende nada nuevo, y la pantalla dice a dónde va ANTES de pulsar.
   */
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const plaza = plazaDelMercado(await mercadoDelPanel());

  try {
    return await guardarProducto({
      plaza,
      propietarioId: usuario.id,
      externoId,
      nombre,
      imagen,
      sku,
      costoCentavos,
      existencias,
      departamento,
    });
  } catch (fallo) {
    /**
     * ══ EL MOTIVO SE DICE, NO SE ESCONDE ══
     *
     * Sin esto, un fallo de la base sale como «Error del servidor» y hay que
     * adivinar entre la llave foránea, una columna que falta y un permiso.
     * Ya se perdió una noche así con el botón de agregar.
     *
     * Aquí se puede enseñar entero porque esta pantalla es **solo del equipo
     * interno**: no hay un comprador del otro lado a quien filtrarle nada.
     */
    console.error("[cj] no se pudo guardar el producto:", fallo);
    const motivo = fallo instanceof Error ? fallo.message : String(fallo);
    return { ok: false, mensaje: `No se pudo guardar: ${motivo}` };
  }
}

async function guardarProducto({
  plaza,
  propietarioId,
  externoId,
  nombre,
  imagen,
  sku,
  costoCentavos,
  existencias,
  departamento,
}: {
  plaza: Plaza;
  propietarioId: string;
  externoId: string;
  nombre: string;
  imagen: string;
  sku: string;
  costoCentavos: number;
  existencias: number;
  departamento: string | null;
}): Promise<Resultado> {
  const db = getDb();

  /**
   * EL ENVÍO ENTRA EN EL PRECIO, Y SE COTIZA AQUÍ.
   *
   * Hasta el 19 ago 2026 esto era `desglosarUs(costoCentavos, 0)`. Ese cero
   * significaba que el envío salía del margen: medido con MT-000004, el envío
   * fueron $1.57 y un producto que debía dejar $3.09 dejaba $0.82. No se
   * perdía dinero — se ganaba un tercio de lo declarado, y en silencio.
   *
   * Este es el único momento en que se puede cotizar de verdad, porque es
   * cuando el precio deja de ser una estimación de pantalla y se guarda como
   * el precio que va a pagar el comprador.
   *
   * Si CJ no cotiza, `envioAUsar` devuelve un estimado y lo marca como tal.
   * **Nunca cero**: cero es exactamente el fallo que esto cierra.
   */
  const envio = await fleteDeProducto(externoId, plaza);

  /**
   * ══ EL PRECIO SE FIJA SEGÚN LA PLAZA (27 ago 2026) ══
   *
   * EE. UU. publica en dólares con la fórmula de siempre. Chile y Colombia
   * convierten a pesos con la tasa del día — y si la tasa no está cargada,
   * AQUÍ SE DETIENE con el motivo claro: publicar con una tasa vieja o
   * inventada pone el catálogo entero al precio equivocado, en silencio.
   *
   * Y en Chile, lo que pasa del régimen de USD 500 NO SE PUBLICA: en la
   * aduana le cobrarían IVA más arancel de sorpresa al comprador.
   */
  let precioPublicadoCentavos: number;
  let margenParaMayorista: number | null = null;

  if (plaza.mercado === "US") {
    const d = desglosarUs(costoCentavos, envio.costoCentavos);
    precioPublicadoCentavos = d.publicadoCentavos;
    margenParaMayorista = d.margenCentavos;
  } else {
    const { tasaVigente } = await import("@/lib/mercado/tasas");
    const tasa = await tasaVigente(plaza.mercado === "CL" ? "CL" : "CO");
    if (tasa === null) {
      return {
        ok: false,
        mensaje: `Falta la tasa del dólar de ${plaza.mercado === "CL" ? "Chile" : "Colombia"}. Cárgala en Configuración → La tasa del dólar, y vuelve a intentar.`,
      };
    }
    if (plaza.mercado === "CL") {
      const d = desglosarChile(costoCentavos, envio.costoCentavos, tasa);
      if (!d) {
        return { ok: false, mensaje: "No se pudo calcular el precio chileno." };
      }
      if (d.superaTope) {
        return {
          ok: false,
          mensaje: `Este producto pasa del régimen de USD 500 (base $${(d.baseUsdCentavos / 100).toFixed(2)}): en Chile la aduana le cobraría IVA más arancel de sorpresa al comprador. No se publica en Chile.`,
        };
      }
      precioPublicadoCentavos = d.publicadoClp;
    } else {
      const d = desglosarColombia(costoCentavos, envio.costoCentavos, tasa);
      if (!d) {
        return {
          ok: false,
          mensaje: "No se pudo calcular el precio colombiano.",
        };
      }
      precioPublicadoCentavos = d.publicadoCop;
    }
  }

  /**
   * EL MARGEN MANDA SOBRE EL RUBRO — SOLO EN EE. UU.
   *
   * La mayorista es una tienda de mercatren.com: mandarle un producto chileno
   * lo haría desaparecer de .cl. En las otras plazas el rubro manda siempre.
   */
  const tiendaId =
    margenParaMayorista !== null && vaAlMayorista(margenParaMayorista)
      ? await tiendaMayorista(propietarioId)
      : await tiendaDelRubro(departamento, propietarioId, plaza);

  /* La fuente ANTES del producto: `productos.fuente_id` apunta a ella y la base
     rechaza el producto si todavía no existe. Cuelga de la tienda general de
     EE. UU., que existe desde el primer día. */
  await fuenteDeCj(TIENDA_US_GENERAL);

  /* ══ SE BUSCA POR EXTERNO **Y POR SLUG** (30 ago 2026) ══
     El único de la base cubre (tienda, externo) y TAMBIÉN (tienda, slug).
     Un producto guardado antes con otro formato de externo — o movido por
     «Repartir por rubro» — esquivaba la comprobación por externo y el
     insert reventaba contra el único del slug, con el SQL entero en la
     cara del panel. Si está por cualquiera de los dos, se ACTUALIZA. */
  const slugCalculado = slugDe(nombre, externoId);
  const [yaEsta] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(
      and(
        eq(productos.tiendaId, tiendaId),
        or(
          eq(productos.externoId, externoId),
          eq(productos.slug, slugCalculado),
        ),
      ),
    )
    .limit(1);

  const ahora = new Date();

  if (yaEsta) {
    /* Actualizar, nunca duplicar: el precio y las existencias de CJ cambian. */
    await db
      .update(productos)
      .set({
        precioCentavos: precioPublicadoCentavos,
        precioBaseCentavos: costoCentavos,
        existencias,
        externoId,
        categoriaId: idDeDepartamento(departamento),
        /* Volver a pulsar el botón también lo publica, y es a propósito: es lo
           que arregla los que se agregaron cuando nacían en borrador, sin
           tener que ir a buscarlos uno por uno. El precio de esto es que un
           producto retirado a mano vuelve a la tienda si alguien lo agrega de
           nuevo desde aquí — que es, literalmente, lo que dice el botón. */
        estado: "publicado",
        actualizadoEn: ahora,
      })
      .where(eq(productos.id, yaEsta.id));

    await guardarEnvio(yaEsta.id, envio, ahora);
    /* Las tallas se refrescan al reagregar: es lo que arregla los productos
       de ropa que entraron sin ninguna. */
    const tallas = await guardarTallas(
      yaEsta.id,
      externoId,
      plaza.almacen,
      precioPublicadoCentavos,
      ahora,
    );

    return {
      ok: true,
      mensaje: `Actualizado: ${nombre.slice(0, 60)}${tallas > 0 ? ` · ${tallas} tallas` : ""}`,
    };
  }

  const id = `prod-${nanoid(12)}`;

  await db.insert(productos).values({
    id,
    tiendaId,
    slug: slugCalculado,
    sku: sku || null,
    /* El título llega en inglés porque así viene de CJ. Se guarda en los dos
       campos para que la ficha no salga vacía en español, y se corrige al
       revisarla — NO se inventa una traducción automática. */
    tituloEs: nombre,
    tituloEn: nombre,
    precioCentavos: precioPublicadoCentavos,
    precioBaseCentavos: costoCentavos,
    /* La moneda de la plaza. En CLP y COP el número guardado YA son pesos
       enteros: `mercado/moneda.ts` sabe que su divisor es 1. */
    moneda: plaza.moneda,
    existencias,
    controlaExistencias: true,
    categoriaId: idDeDepartamento(departamento),
    /**
     * ══ NACE PUBLICADO (decisión del dueño, 15 ago 2026) ══
     *
     * Antes entraba en borrador para que nadie publicara una ficha de dos
     * líneas en inglés, que es media suspensión en Merchant Center. Pero en
     * borrador **no se ve en la tienda**, así que el catálogo se armaba a
     * ciegas: veinte productos elegidos y una tienda que seguía vacía.
     *
     * El riesgo de Merchant Center no desaparece — se atiende donde de verdad
     * está, que es el archivo que se le manda a Google, no la tienda. Ver la
     * nota del `CLAUDE.md`: al catálogo de EE. UU. le falta la descripción
     * propia y el título en español antes de mandárselo a Google.
     */
    estado: "publicado",
    fuenteId: FUENTE_CJ,
    externoId,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* La foto se guarda por su dirección, como el resto del catálogo importado.
     Traerla a nuestro bucket es el paso de después, con el botón que ya existe
     en Configuración. */
  if (imagen) {
    await db
      .insert(imagenesProducto)
      .values({
        id: `img-${nanoid(12)}`,
        productoId: id,
        url: imagen,
        orden: 0,
      })
      .catch((fallo) => {
        console.error("[cj] producto agregado; la foto no:", fallo);
      });
  }

  await guardarEnvio(id, envio, ahora);
  /* LAS TALLAS, en el mismo acto de agregar: sin esto la ropa se publicaba
     sin talla y el sistema le compraba a CJ «la más barata» (30 ago 2026). */
  const tallas = await guardarTallas(
    id,
    externoId,
    plaza.almacen,
    precioPublicadoCentavos,
    ahora,
  );

  revalidatePath("/[locale]/panel", "layout");
  return {
    ok: true,
    mensaje: `Agregado: ${nombre.slice(0, 60)}${tallas > 0 ? ` · ${tallas} tallas` : ""}`,
  };
}

/**
 * REPARTIR EN SUS TIENDAS LO QUE YA ESTÁ CARGADO.
 *
 * Los productos que entraron antes de que existieran las tiendas por rubro
 * cuelgan todos de la general. Esto los mueve a la que les toca, creando cada
 * tienda a su paso.
 *
 * ══ MUEVE, NO COPIA NI BORRA ══
 *
 * Se cambia la tienda del producto y nada más: **conserva su dirección web, sus
 * fotos, su precio y su historial**. Un producto que ya está en Google no puede
 * cambiar de dirección sin perder lo que tenía.
 *
 * ══ SE PUEDE VOLVER A PULSAR ══
 *
 * Solo mira los que siguen en la general, así que repetirlo no hace nada. Un
 * botón que hay que pulsar una sola vez y exactamente una es un botón que
 * alguien va a pulsar dos veces.
 */
export async function repartirCatalogoUs(): Promise<{
  ok: boolean;
  mensaje: string;
  movidos?: number;
  sinRubro?: number;
}> {
  const permitido = await exigirEquipoInterno()
    .then(() => true)
    .catch(() => false);

  if (!permitido) {
    return { ok: false, mensaje: "Esta parte es solo para el equipo." };
  }

  const { obtenerUsuario } = await import("@/lib/autorizacion");
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: "Hace falta una sesión." };

  /* La plaza del selector: con el panel en Chile se reparte la general
     chilena entre sus rubros, no la americana. */
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const plaza = plazaDelMercado(await mercadoDelPanel());

  try {
    const db = getDb();

    const pendientes = await db
      .select({ id: productos.id, categoriaId: productos.categoriaId })
      .from(productos)
      .where(eq(productos.tiendaId, plaza.tiendaGeneral.id));

    let movidos = 0;
    let sinRubro = 0;

    for (const p of pendientes) {
      /* El departamento se guarda como `dep-<slug>`; se le quita el prefijo
         para volver al slug, que es lo que conoce `tiendaDeRubro`. */
      const departamento = p.categoriaId?.startsWith("dep-")
        ? p.categoriaId.slice(4)
        : null;

      if (!departamento || !esDepartamentoReal(departamento)) {
        sinRubro += 1;
        continue;
      }

      const destino = await tiendaDelRubro(departamento, usuario.id, plaza);
      if (destino === plaza.tiendaGeneral.id) {
        sinRubro += 1;
        continue;
      }

      await db
        .update(productos)
        .set({ tiendaId: destino, actualizadoEn: new Date() })
        .where(eq(productos.id, p.id));

      movidos += 1;
    }

    revalidatePath("/[locale]/panel", "layout");
    revalidatePath("/[locale]", "layout");

    return {
      ok: true,
      mensaje: `Repartidos ${movidos}. ${sinRubro} se quedaron en la tienda general por no tener departamento reconocido.`,
      movidos,
      sinRubro,
    };
  } catch (fallo) {
    console.error("[cj] no se pudo repartir el catálogo:", fallo);
    const motivo = fallo instanceof Error ? fallo.message : String(fallo);
    return { ok: false, mensaje: `No se pudo repartir: ${motivo}` };
  }
}
