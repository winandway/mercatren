/**
 * LA DIRECCIÓN DE ENTREGA DE UN PEDIDO, EN LÍNEAS (5 nov 2026).
 *
 * El fallo que la trajo: la ficha del pedido del panel buscaba `linea1` y
 * `linea2`, pero la compra guarda la calle en `direccion` y `direccion2`
 * (`crearPedido`). El comercio veía el nombre, la ciudad y el país… y no la
 * calle: no podía despachar sin escribirle al comprador. Cada pantalla tenía
 * su propia lista de campos, y cada una se equivocaba distinto (la factura y
 * la ficha del equipo se comían el estado y el código postal).
 *
 * Una sola pieza para todas: el panel, la ficha del equipo, la factura y la
 * app. Entiende las dos formas guardadas (`direccion` y la vieja `linea1`) y
 * escribe la ciudad como en un sobre de EE. UU.: «Miami, FL 33101».
 */
export function lineasDeLaEntrega(
  guardada: unknown,
  opciones: { conNombre?: boolean } = {},
): string[] {
  if (!guardada || typeof guardada !== "object") return [];
  const d = guardada as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const estadoYCodigo = [texto(d.estado), texto(d.codigoPostal)]
    .filter(Boolean)
    .join(" ");
  const ciudad = [texto(d.ciudad), estadoYCodigo].filter(Boolean).join(", ");

  return [
    opciones.conNombre === false ? "" : texto(d.nombre),
    texto(d.direccion) || texto(d.linea1),
    texto(d.direccion2) || texto(d.linea2),
    ciudad,
    texto(d.pais),
    texto(d.referencia),
  ].filter(Boolean);
}
