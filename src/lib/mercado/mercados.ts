/**
 * LOS MERCADOS: UN PAÍS = UN DOMINIO = UN CATÁLOGO.
 *
 * ══ LA REGLA QUE LO SOSTIENE TODO ══
 *
 * **El dominio decide el mercado.** Quien entra por mercatren.com ve el
 * mercado principal (el catálogo de Estados Unidos más los comercios de
 * Venezuela); quien entra por mercatren.cl ve SOLO lo de Chile. Un producto
 * que no se puede entregar en Chile no puede salir en mercatren.cl: enseñarlo
 * es prometer una entrega que no existe.
 *
 * ══ POR QUÉ UNA LISTA CERRADA Y NO UNA TABLA ══
 *
 * Abrir un país no es tocar un panel: es dominio, proveedores de mercancía,
 * medios de pago, impuestos y textos. Eso pasa por una publicación mirada
 * (igual que la pausa de ventas), no por alguien creando una fila de
 * madrugada. Agregar México será: una entrada aquí + su fila de trabajo en
 * PLAN-PAISES.md.
 *
 * ══ EL CÓDIGO DEL MERCADO ES EL PAÍS DEL DOMINIO ══
 *
 * `tiendas.mercado` guarda este código. No confundir con `paisOrigen`, que
 * dice desde dónde SALE la mercancía.
 *
 * ══ VENEZUELA SE MUDÓ A SU PROPIO DOMINIO (6 sep 2026) ══
 *
 * Hasta hoy los comercios venezolanos vivían en el mercado `US` porque
 * mercatren.com era su única vitrina: quien entraba veía el catálogo de
 * Estados Unidos Y los productos que se retiran en El Vigía. Dos negocios
 * distintos —uno se despacha a una dirección, el otro se busca en un
 * mostrador— compartiendo portada, buscador y selector de ciudad.
 *
 * Ahora Venezuela tiene `mercatren.com.ve`, y con eso `mercado` vuelve a
 * significar lo que dice: la ferretería es `mercado VE` + `paisOrigen VE`.
 * mercatren.com queda solo para lo que se entrega en Estados Unidos.
 */

export type Mercado = {
  /** El código que guarda `tiendas.mercado`. */
  codigo: string;
  /** El dominio que abre este mercado, sin www y sin puerto. */
  dominio: string;
  /** El nombre del país, para las pantallas. Igual en los dos idiomas. */
  nombre: string;
  /** El mercado que responde cuando el host no se reconoce. Solo uno. */
  principal?: true;
  /**
   * ¿La mercancía se RETIRA en una ciudad de este país?
   *
   * Solo Venezuela. Es lo que enciende el selector de ciudad del encabezado,
   * el filtro «¿dónde lo retiro?» del catálogo y la ciudad de depósito en la
   * ficha de producto. En los demás países todo se despacha a la dirección
   * del comprador y esa pregunta no existe.
   *
   * ══ POR QUÉ NO SE CUELGA DE `principal` ══
   *
   * Hasta el 6 sep 2026 el selector de ciudad se dibujaba «si es el mercado
   * principal», porque principal y Venezuela eran lo mismo. Al mudar
   * Venezuela a su dominio dejaron de serlo: con la regla vieja,
   * mercatren.com le habría seguido preguntando al comprador de Miami en qué
   * ciudad de Venezuela retira su compra.
   */
  retiroEnCiudad?: true;
  /**
   * Otros hosts que abren este mismo mercado. Para ver un país nuevo antes
   * de que su DNS apunte, sin tocar código el día del cambio.
   */
  alias?: readonly string[];
};

export const MERCADOS: readonly Mercado[] = [
  {
    codigo: "US",
    dominio: "mercatren.com",
    nombre: "Estados Unidos",
    principal: true,
  },
  /**
   * VENEZUELA. Es el único mercado donde la mercancía **se retira** en una
   * ciudad en vez de despacharse a una dirección, y por eso lleva
   * `retiroEnCiudad`. Sus comercios ponen su propia mercancía: no se surte
   * de CJ (por eso no tiene entrada en `cj/plazas.ts`) y cobra en dólares.
   */
  {
    codigo: "VE",
    dominio: "mercatren.com.ve",
    nombre: "Venezuela",
    retiroEnCiudad: true,
    /* Para verlo ANTES de que el DNS apunte: cualquiera de estos hosts abre
       la vitrina venezolana. El primero es el subdominio de pruebas de la
       plataforma; en cuanto exista, funciona sin tocar código. */
    alias: ["ve.mercatren.sitios.dev", "ve.localhost"],
  },
  { codigo: "CL", dominio: "mercatren.cl", nombre: "Chile" },
  /**
   * Colombia entra por `mercatren.com.co`, que es el dominio PRINCIPAL de esa
   * plaza — no `mercatren.co`. Ese segundo redirige al primero desde la
   * plataforma, así que aquí no existe: si estuviera declarado, las dos
   * direcciones se disputarían la misma página ante Google.
   */
  { codigo: "CO", dominio: "mercatren.com.co", nombre: "Colombia" },
] as const;

export const MERCADO_PRINCIPAL: Mercado = MERCADOS.find((m) => m.principal)!;

/**
 * El mercado que corresponde a un host.
 *
 * ══ LO DESCONOCIDO CAE EN EL PRINCIPAL, A PROPÓSITO ══
 *
 * localhost, mercatren.sitios.dev, una IP de prueba, un dominio que alguien
 * apunte por su cuenta: todo eso enseña el mercado principal. La alternativa
 * —una pantalla de error para hosts raros— rompería el desarrollo local y
 * las previsualizaciones por proteger algo que no necesita protección: un
 * mercado no esconde secretos, solo acota el catálogo.
 */
export function mercadoPorHost(host: string | null | undefined): Mercado {
  const limpio = (host ?? "")
    .trim()
    .toLowerCase()
    /* El puerto (localhost:3000) y el www. no cambian el mercado. */
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");

  return (
    MERCADOS.find((m) => m.dominio === limpio || m.alias?.includes(limpio)) ??
    MERCADO_PRINCIPAL
  );
}

/**
 * ¿En este mercado la mercancía se retira en una ciudad?
 *
 * La usan el encabezado (selector de ciudad), el catálogo (filtro de zona) y
 * la portada. Es una función y no `mercado.retiroEnCiudad` suelto para que
 * el día que haya un segundo país de retiro no haya que buscar los usos.
 */
export function seRetiraEnCiudad(mercado: Mercado): boolean {
  return mercado.retiroEnCiudad === true;
}

export function mercadoPorCodigo(codigo: string | null | undefined): Mercado {
  const limpio = (codigo ?? "").trim().toUpperCase();
  return MERCADOS.find((m) => m.codigo === limpio) ?? MERCADO_PRINCIPAL;
}

/** ¿Este mercado es el de mercatren.com? Las pantallas lo preguntan para
 *  saber si enseñan las piezas que todavía son solo del principal (el
 *  selector de ciudades de Venezuela, el hero de Estados Unidos). */
export function esMercadoPrincipal(mercado: Mercado): boolean {
  return mercado.codigo === MERCADO_PRINCIPAL.codigo;
}

/**
 * La marca tal como se enseña en ese mercado: «Mercatren.cl».
 *
 * En los países la marca ES el dominio — así lo pidió el dueño al ver la
 * miniatura de WhatsApp de mercatren.cl diciendo «Compra en Estados
 * Unidos»: quien comparte el enlace chileno tiene que ver la casa chilena.
 * En el principal la marca sigue siendo «Mercatren» a secas.
 */
export function marcaDelMercado(mercado: Mercado): string {
  return mercado.dominio.charAt(0).toUpperCase() + mercado.dominio.slice(1);
}

/**
 * A dónde mandar a quien pidió algo que ya no vive en este dominio.
 *
 * Vive AQUÍ y no junto a las consultas de la mudanza porque es pura y hay
 * que poder probarla: un módulo con `server-only` no se puede importar desde
 * una prueba (lo destapó su propio candado al escribirlo).
 *
 * Devuelve la dirección COMPLETA en el dominio nuevo, con el idioma que
 * traía: quien abrió el enlace en inglés sigue en inglés. `null` si no se
 * mudó a ninguna parte — ahí sí es un 404 de verdad.
 */
export function seMudoA(
  aqui: Mercado,
  alla: Mercado | null,
  locale: string,
  ruta: string,
): string | null {
  if (!alla || alla.codigo === aqui.codigo) return null;
  const idioma = locale === "en" ? "en" : "es";
  return `https://${alla.dominio}/${idioma}${ruta}`;
}
