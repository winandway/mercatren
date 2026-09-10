/**
 * ══ LAS TIENDAS DONDE LA GENTE COMPRA ══
 *
 * Richard, 9 sep 2026: _«nosotros no nos casamos con ninguna empresa,
 * vamos a trabajar con todas»_. La pantalla las nombra para que el
 * comprador entienda de una que su casillero sirve donde ya compra.
 *
 * **Se escriben con nuestra tipografía, no con su logotipo.** Un logotipo
 * ajeno en nuestra página es una marca registrada de otro puesta donde
 * podría leerse como que ellos nos respaldan; el nombre en texto es uso
 * descriptivo y se sostiene solo. Se ve igual de claro y no hay que pedirle
 * permiso a nadie.
 */

export type TiendaConocida = {
  nombre: string;
  /** El color de su marca, solo para la inicial. */
  color: string;
  dominio: string;
};

export const TIENDAS_CONOCIDAS: readonly TiendaConocida[] = [
  { nombre: "Amazon", color: "#FF9900", dominio: "amazon.com" },
  { nombre: "eBay", color: "#E53238", dominio: "ebay.com" },
  { nombre: "Walmart", color: "#0071DC", dominio: "walmart.com" },
  { nombre: "SHEIN", color: "#000000", dominio: "shein.com" },
  { nombre: "Temu", color: "#FB7701", dominio: "temu.com" },
  { nombre: "Best Buy", color: "#0046BE", dominio: "bestbuy.com" },
  { nombre: "Target", color: "#CC0000", dominio: "target.com" },
  { nombre: "Home Depot", color: "#F96302", dominio: "homedepot.com" },
  { nombre: "Nike", color: "#111111", dominio: "nike.com" },
  { nombre: "Apple", color: "#555555", dominio: "apple.com" },
  { nombre: "AliExpress", color: "#E62E04", dominio: "aliexpress.com" },
  { nombre: "Mercatren", color: "#FF6B1A", dominio: "mercatren.com" },
];
