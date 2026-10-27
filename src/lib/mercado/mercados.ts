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
  /** El nombre del país, para las pantallas, en español. */
  nombre: string;
  /**
   * El nombre en inglés, solo cuando cambia («Spain», «United States»).
   * Chile, Colombia y Venezuela se escriben igual. Se lee con
   * `nombreDelMercado`, nunca suelto.
   */
  nombreEn?: string;
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
  /**
   * ══ UN PAÍS QUE TODAVÍA NO TIENE DOMINIO PROPIO (España, 27 oct 2026) ══
   *
   * Vive DENTRO de mercatren.com y se elige tocando su bandera en «Mercatren
   * en el mundo». La elección se guarda en una cookie (`COOKIE_DEL_PAIS`)
   * y desde ahí todo el sitio —catálogo, moneda, altas de comercios, panel—
   * se comporta como en cualquier otro país.
   *
   * Lo pidió Richard para la app: la app abre mercatren.com y no puede saltar
   * a otro dominio sin enseñar la barra del navegador, así que un país nuevo
   * tenía que poder vivir dentro del principal mientras su dominio llega.
   *
   * Su `dominio` es el del principal a propósito: todo lo que arma una
   * dirección con `https://${mercado.dominio}` (enlaces, correos, metadatos)
   * sale bien sin tocar nada. Lo que NO hace es abrir el mercado por host:
   * `mercadoPorHost` lo salta, y el día que tenga dominio se le quita esta
   * marca, se le pone su dominio y queda como Chile.
   */
  enElPrincipal?: true;
};

export const MERCADOS: readonly Mercado[] = [
  {
    codigo: "US",
    dominio: "mercatren.com",
    nombre: "Estados Unidos",
    nombreEn: "United States",
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
  /**
   * ESPAÑA (27 oct 2026). Sin dominio todavía: vive dentro de mercatren.com
   * (ver `enElPrincipal`). Como Venezuela, sus comercios ponen su propia
   * mercancía —no se surte de CJ— pero se despacha a la dirección del
   * comprador, como en Chile. Vende en euros.
   */
  {
    codigo: "ES",
    dominio: "mercatren.com",
    nombre: "España",
    nombreEn: "Spain",
    enElPrincipal: true,
  },
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
    MERCADOS.find(
      (m) =>
        !m.enElPrincipal && (m.dominio === limpio || m.alias?.includes(limpio)),
    ) ?? MERCADO_PRINCIPAL
  );
}

/**
 * LA COOKIE QUE GUARDA EL PAÍS ELEGIDO DENTRO DE mercatren.com.
 *
 * Solo dice un código de país (`ES`): ni datos de nadie ni sesión. La pone
 * y la quita `/datos/pais`, que es a donde llevan las banderas del selector.
 */
export const COOKIE_DEL_PAIS = "mercatren_pais";

/** Un año: quien eligió España no tiene que volver a elegirla cada semana. */
export const DURACION_COOKIE_DEL_PAIS_S = 60 * 60 * 24 * 365;

/**
 * El mercado de una visita: el del dominio, salvo que el dominio sea el
 * principal y la persona haya elegido un país que vive dentro de él.
 *
 * ══ LA COOKIE SOLO MANDA DENTRO DEL PRINCIPAL ══
 *
 * En mercatren.cl la cookie no existe (es de otro dominio), pero aunque
 * alguien la fabricara a mano no cambia nada: el dominio de un país con
 * dominio propio manda siempre. Y la cookie solo puede nombrar un país
 * `enElPrincipal`: con `mercatren_pais=CL` no se ve Chile en el .com, se
 * ve el .com.
 *
 * ══ Y NO HAY REDIRECCIÓN POR GEOLOCALIZACIÓN ══
 *
 * Regla del proyecto: nadie cae en España por su IP. Se cae en España
 * porque se tocó su bandera.
 */
export function mercadoDeLaVisita(
  host: string | null | undefined,
  paisElegido: string | null | undefined,
): Mercado {
  const delHost = mercadoPorHost(host);
  if (!esMercadoPrincipal(delHost)) return delHost;
  const elegido = (paisElegido ?? "").trim().toUpperCase();
  return (
    MERCADOS.find((m) => m.enElPrincipal && m.codigo === elegido) ?? delHost
  );
}

/** ¿Este mercado se ve en mercatren.com (el principal o uno sin dominio)? */
export function viveEnElPrincipal(mercado: Mercado): boolean {
  return mercado.principal === true || mercado.enElPrincipal === true;
}

/**
 * A dónde lleva la bandera de un país en «Mercatren en el mundo».
 *
 * - Desde mercatren.com (el principal o España), toda bandera pasa por
 *   `/datos/pais`: ahí se pone o se quita la cookie y se sigue al destino.
 *   Sin ese paso, quien está en España y toca «Estados Unidos» volvería a
 *   mercatren.com… con la cookie de España puesta, o sea, a España.
 * - Desde otro dominio, el principal y España pasan por el `/datos/pais` de
 *   mercatren.com; los demás países van directo a su dominio.
 */
export function enlaceParaElegirPais(
  destino: Mercado,
  actual: Mercado,
  idioma: string,
): string {
  const paso = `/datos/pais?a=${destino.codigo}&idioma=${idioma}`;
  if (viveEnElPrincipal(actual)) return paso;
  if (viveEnElPrincipal(destino)) {
    return `https://${MERCADO_PRINCIPAL.dominio}${paso}`;
  }
  return `https://${destino.dominio}/${idioma}`;
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

/** El nombre del país en el idioma de quien lee. */
export function nombreDelMercado(mercado: Mercado, idioma: string): string {
  return idioma === "en"
    ? (mercado.nombreEn ?? mercado.nombre)
    : mercado.nombre;
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
  /* Sin dominio propio, la marca no puede ser un dominio: «Mercatren
     España». El día que tenga el suyo, pasa a ser como los demás. */
  if (mercado.enElPrincipal) return `Mercatren ${mercado.nombre}`;
  return mercado.dominio.charAt(0).toUpperCase() + mercado.dominio.slice(1);
}
