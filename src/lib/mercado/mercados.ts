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
 * `tiendas.mercado` guarda este código. Todas las tiendas existentes (los
 * comercios de Venezuela y las tiendas de CJ) viven en el mercado `US`,
 * porque mercatren.com es su vitrina. No confundir con `paisOrigen`, que
 * dice desde dónde SALE la mercancía: la ferretería de Venezuela tiene
 * paisOrigen VE y mercado US.
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
};

export const MERCADOS: readonly Mercado[] = [
  {
    codigo: "US",
    dominio: "mercatren.com",
    nombre: "Estados Unidos",
    principal: true,
  },
  { codigo: "CL", dominio: "mercatren.cl", nombre: "Chile" },
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

  return MERCADOS.find((m) => m.dominio === limpio) ?? MERCADO_PRINCIPAL;
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
