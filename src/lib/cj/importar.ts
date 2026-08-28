"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  billeteras,
  fuentesCatalogo,
  imagenesProducto,
  productos,
  tiendas,
  enviosProducto,
} from "@/lib/db/schema";
import { COMISION_US_PB } from "@/lib/dinero";
import { SOCIEDAD } from "@/lib/sociedad";
import { FUENTE_CJ, TIENDA_US } from "@/lib/cj/constantes";
import { idDeDepartamento } from "@/lib/cj/departamento";
import {
  TIENDA_US_GENERAL,
  esDepartamentoReal,
  nombrePropuesto,
  tiendaDeRubro,
} from "@/lib/cj/rubros";
import {
  MINIMO_MAYORISTA,
  TIENDA_MAYORISTA,
  vaAlMayorista,
} from "@/lib/cj/mayorista";
import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";
import { desglosarUs } from "@/lib/destino/precio-us";
import { desglosarChile } from "@/lib/destino/precio-chile";
import { desglosarColombia } from "@/lib/destino/precio-colombia";
import {
  descripcionDePlaza,
  plazaDelMercado,
  type Plaza,
} from "@/lib/cj/plazas";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { fleteDeProducto } from "@/lib/cj/flete";

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

/**
 * La tienda interna, creándola la primera vez.
 *
 * Se crea aquí y no en `schema.sql` porque necesita un propietario, y quién es
 * Soporte depende de la base de cada entorno. La primera vez que se agrega un
 * producto queda hecha, y de ahí en adelante solo se lee.
 */
async function tiendaDeEstadosUnidos(propietarioId: string): Promise<string> {
  return tiendaGeneralDePlaza(
    plazaDelMercado(mercadoPorCodigo("US")),
    propietarioId,
  );
}

/**
 * LA TIENDA GENERAL DE UNA PLAZA, creada la primera vez que hace falta.
 *
 * Es la misma mecánica de siempre, con la plaza decidiendo id, mercado,
 * moneda de la vitrina y ficha. `mercado` va explícito: sin él, la tienda
 * chilena nacería con el default `US` y sus productos no saldrían nunca en
 * mercatren.cl — invisibles sin un solo error en ninguna pantalla.
 */
async function tiendaGeneralDePlaza(
  plaza: Plaza,
  propietarioId: string,
): Promise<string> {
  const db = getDb();
  const general = plaza.tiendaGeneral;

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, general.id))
    .limit(1);

  if (existente) return existente.id;

  const ahora = new Date();
  const ficha = descripcionDePlaza(
    plaza,
    { es: "Productos", en: "Products" },
    SOCIEDAD.nombre,
  );

  await db.insert(tiendas).values({
    id: general.id,
    slug: general.slug,
    nombre: general.nombre,
    propietarioId,
    paisOrigen: plaza.paisEntrega,
    mercado: plaza.mercado,
    estado: "activa",
    /* El margen de este catálogo es el de EE. UU., no el 3 % del mercado
       venezolano: aquí Mercatren compra, despacha y asume la devolución. */
    comisionPuntosBase: COMISION_US_PB,
    descripcionEs: ficha.es,
    descripcionEn: ficha.en,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* Su billetera, como cualquier otra tienda: el resto del sistema la espera. */
  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: general.id })
    .catch(() => undefined);

  return general.id;
}

/**
 * LA FUENTE «CJ», SIN LA CUAL NINGÚN PRODUCTO SE PUEDE GUARDAR.
 *
 * ══ ESTE ERA EL FALLO DEL BOTÓN «AGREGAR AL CATÁLOGO» ══
 *
 * `productos.fuente_id` tiene una llave foránea contra `fuentes_catalogo`. Yo
 * guardaba `"cj"` ahí dando por hecho que era una simple etiqueta de texto, y
 * nunca creé la fila. La base rechaza el producto —«FOREIGN KEY constraint
 * failed»—, la acción revienta, y al dueño le sale un error de servidor sin una
 * sola pista de qué pasó.
 *
 * Y no es una fila de relleno para contentar a la base: es la misma ficha que
 * ya usa el catálogo importado de cualquier comercio. Ahí queda registrado
 * **de dónde salió cada producto**, que es lo que permite volver a
 * sincronizarlo, saber cuándo se miró por última vez, y apagar la fuente sin
 * borrar nada. Sin ella, los productos de CJ serían huérfanos.
 *
 * Se crea una sola vez, la primera; de ahí en adelante solo se lee.
 */
async function fuenteDeCj(tiendaId: string): Promise<string> {
  const db = getDb();

  const [existente] = await db
    .select({ id: fuentesCatalogo.id })
    .from(fuentesCatalogo)
    .where(eq(fuentesCatalogo.id, FUENTE_CJ))
    .limit(1);

  if (existente) return existente.id;

  await db.insert(fuentesCatalogo).values({
    id: FUENTE_CJ,
    tiendaId,
    nombre: "CJ Dropshipping",
    estado: "activa",
    /* SIN `url`, Y A PROPÓSITO. Las otras fuentes leen un archivo que el
       comercio publica; esta se lee por la API de CJ con su propia llave, así
       que aquí no hay dirección que guardar. Inventarle una haría creer que se
       sincroniza sola desde ahí. */
    creadoEn: new Date(),
  });

  return FUENTE_CJ;
}

/**
 * LA TIENDA DEL RUBRO, creándola la primera vez que hace falta.
 *
 * ══ SE CREA AL AGREGAR, NO ANTES ══
 *
 * Pedirle al equipo que dé de alta veintitrés tiendas antes de poder cargar el
 * primer producto es un trámite que nadie hace. Así, la tienda nace cuando
 * entra su primer producto y ya queda lista para el resto.
 *
 * El nombre que se le pone es **una propuesta** —el del departamento— y se
 * cambia después desde el panel como el de cualquier comercio. Un formulario
 * en blanco antes de poder trabajar es lo que hace que nadie empiece.
 *
 * ══ Y EL PRODUCTO MANDA SOBRE LA PANTALLA ══
 *
 * A qué tienda va lo decide el departamento del producto, no lo que estuviera
 * abierto: si estando en repuestos se agrega una cartera, la cartera se va a la
 * de carteras. El equipo no tiene que acordarse de cambiar de tienda antes de
 * cada producto — que es justo donde se equivocaría, y el error no se ve hasta
 * que un comprador entra a una tienda de repuestos llena de bolsos.
 */
/**
 * LA TIENDA MAYORISTA, creándose la primera vez que entra un producto flaco.
 *
 * Los que dejan menos de dos dólares sueltos —donde una sola devolución
 * convierte la venta en pérdida— no se descartan: se venden **de a diez**. El
 * mismo producto que deja $0.90 suelto deja nueve en un lote.
 */
async function tiendaMayorista(propietarioId: string): Promise<string> {
  const db = getDb();

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, TIENDA_MAYORISTA.id))
    .limit(1);

  if (existente) return existente.id;

  await tiendaDeEstadosUnidos(propietarioId);

  const ahora = new Date();

  await db.insert(tiendas).values({
    id: TIENDA_MAYORISTA.id,
    slug: TIENDA_MAYORISTA.slug,
    nombre: TIENDA_MAYORISTA.nombreEs,
    propietarioId,
    paisOrigen: "US",
    estado: "activa",
    comisionPuntosBase: COMISION_US_PB,
    /* EL MÍNIMO SE DICE EN LA PROPIA FICHA DE LA TIENDA, no solo en el
       producto: quien entra por la tienda tiene que saber a qué entró antes de
       elegir nada. Y quién vende y factura, como en todas. */
    descripcionEs: `Compra por lotes con entrega en Estados Unidos en 2 a 5 días hábiles y el envío incluido en el precio. Mínimo ${MINIMO_MAYORISTA} unidades por producto. Vendido y facturado por ${SOCIEDAD.nombre}.`,
    descripcionEn: `Wholesale lots delivered anywhere in the United States in 2 to 5 business days, shipping included in the price. Minimum ${MINIMO_MAYORISTA} units per product. Sold and invoiced by ${SOCIEDAD.nombre}.`,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: TIENDA_MAYORISTA.id })
    .catch(() => undefined);

  return TIENDA_MAYORISTA.id;
}

async function tiendaDelRubro(
  departamento: string | null,
  propietarioId: string,
  plaza: Plaza = plazaDelMercado(mercadoPorCodigo("US")),
): Promise<string> {
  if (!departamento || !esDepartamentoReal(departamento)) {
    /* Sin departamento reconocido se queda en la general: perder mercancía por
       no tener dónde ponerla es peor que tenerla un tiempo en la genérica. */
    return tiendaGeneralDePlaza(plaza, propietarioId);
  }

  const db = getDb();
  /* La pareja id/slug sale de los prefijos de la plaza: `tienda-cl-motos`
     vive en mercatren.cl y `tienda-us-motos` en mercatren.com, sin chocar. */
  const { id, slug } =
    plaza.mercado === "US"
      ? tiendaDeRubro(departamento)
      : {
          id: `${plaza.prefijoTienda}${departamento}`,
          slug: `${plaza.prefijoSlug}${departamento}`,
        };

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, id))
    .limit(1);

  if (existente) return existente.id;

  /* La general tiene que existir igual: es el respaldo de todo lo que no
     encaje, y de ella cuelga la fuente `cj`. */
  await tiendaGeneralDePlaza(plaza, propietarioId);

  const ahora = new Date();
  const nombreEs = nombrePropuesto(departamento, "es");
  const nombreEn = nombrePropuesto(departamento, "en");
  /* QUIÉN VENDE Y FACTURA VA ESCRITO. Con esta línea son marcas de la casa
     —como las marcas propias de cualquier cadena— y es normal. Sin ella son
     vendedores inventados, y eso es tergiversación: causa de suspensión y de
     contracargos que el comprador gana. La ficha sale de la plaza, que NO
     promete plazo fuera de EE. UU.: el real lo dirán las compras de prueba. */
  const ficha = descripcionDePlaza(
    plaza,
    { es: nombreEs, en: nombreEn },
    SOCIEDAD.nombre,
  );

  await db.insert(tiendas).values({
    id,
    slug,
    nombre: nombreEs,
    propietarioId,
    paisOrigen: plaza.paisEntrega,
    mercado: plaza.mercado,
    estado: "activa",
    comisionPuntosBase: COMISION_US_PB,
    descripcionEs: ficha.es,
    descripcionEn: ficha.en,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: id })
    .catch(() => undefined);

  return id;
}

/**
 * Una dirección web a partir del nombre.
 *
 * El nombre de CJ viene en inglés y a veces larguísimo. Se recorta y se le pega
 * un trozo del id: sin eso, dos productos parecidos chocarían en la misma
 * dirección y el segundo no se podría guardar.
 */
function slugDe(nombre: string, id: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return `${base || "producto"}-${id.slice(-6).toLowerCase()}`;
}

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

  const [yaEsta] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(
      and(eq(productos.tiendaId, tiendaId), eq(productos.externoId, externoId)),
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

    return { ok: true, mensaje: `Actualizado: ${nombre.slice(0, 60)}` };
  }

  const id = `prod-${nanoid(12)}`;

  await db.insert(productos).values({
    id,
    tiendaId,
    slug: slugDe(nombre, externoId),
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

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: `Agregado: ${nombre.slice(0, 60)}` };
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

  try {
    const db = getDb();

    const pendientes = await db
      .select({ id: productos.id, categoriaId: productos.categoriaId })
      .from(productos)
      .where(eq(productos.tiendaId, TIENDA_US_GENERAL));

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

      const destino = await tiendaDelRubro(departamento, usuario.id);
      if (destino === TIENDA_US_GENERAL) {
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

/**
 * Deja escrito lo que costó mandar este producto.
 *
 * ══ NUNCA TUMBA LA PUBLICACIÓN ══
 *
 * Va en su propio `try` y después de guardar el producto. Si esta escritura
 * falla, el producto queda publicado con su precio correcto —el envío ya está
 * DENTRO del precio, que es lo que importa— y lo único que se pierde es el
 * papel de trabajo para recalcular después. Tumbar la publicación de un
 * producto por no poder anotar su flete sería cambiar un problema chico por
 * uno grande.
 */
async function guardarEnvio(
  productoId: string,
  envio: { costoCentavos: number; origen: string; transporte: string | null },
  ahora: Date,
) {
  try {
    const db = getDb();
    await db
      .insert(enviosProducto)
      .values({
        productoId,
        costoCentavos: envio.costoCentavos,
        origen: envio.origen,
        transporte: envio.transporte,
        cotizadoEn: ahora,
      })
      .onConflictDoUpdate({
        target: enviosProducto.productoId,
        set: {
          costoCentavos: envio.costoCentavos,
          origen: envio.origen,
          transporte: envio.transporte,
          cotizadoEn: ahora,
        },
      });
  } catch (fallo) {
    console.error("[cj] no se pudo guardar el flete de", productoId, fallo);
  }
}
