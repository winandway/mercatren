import { CAMPOS_SEGURIDAD } from "@/lib/productos/seguridad";
import { baseDesdePublicado } from "@/lib/dinero";
import { divisorDe } from "@/lib/mercado/moneda";

/**
 * EDITAR UN PRODUCTO DESDE LA APP SIN BORRAR LO QUE LA APP NO ENSEÑA
 * (5 nov 2026).
 *
 * `guardarProducto` (la acción de la web) reescribe TODAS las columnas del
 * producto con lo que llega en el formulario: si falta la marca, guarda la
 * marca vacía. La app solo edita seis cosas (nombres, descripciones, precio y
 * unidades); un producto armado en la web con su departamento, su marca, su
 * SKU, su precio «antes» o su ciudad de depósito los perdería en silencio la
 * primera vez que su dueño le cambiara el precio desde el teléfono.
 *
 * Por eso el formulario que llega a `guardarProducto` se arma AQUÍ: lo que la
 * app no toca sale de lo que ya estaba guardado, escrito como lo escribiría el
 * formulario de la web, y encima va lo que mandó la app. El estado tampoco lo
 * cambia la edición (publicar o pausar es otro botón). Pieza pura, con su
 * prueba en `tests/unit/app-movil-ventas.test.ts`.
 */
export { CAMPOS_SEGURIDAD };

export const CAMPOS_DE_LA_APP = [
  "tituloEs",
  "tituloEn",
  "descripcionEs",
  "descripcionEn",
  "precio",
  "existencias",
] as const;

export type ProductoGuardado = {
  sku: string | null;
  categoriaId: string | null;
  marca: string | null;
  unidad: string | null;
  precioAntesCentavos: number | null;
  moneda: string;
  destacado: boolean;
  estado: "borrador" | "publicado" | "agotado";
  /** La ciudad del depósito (solo Venezuela); `null` si no tiene. */
  zonaDeposito: string | null;
  /**
   * España: quién fabrica el producto (Reglamento UE 2023/988). Se manda
   * siempre lo guardado: sin esto, editar el precio desde la app de un
   * producto publicado en España se rechazaría por «falta el fabricante».
   */
  seguridad?:
    { [K in (typeof CAMPOS_SEGURIDAD)[number]]?: string | null } | null;
};

/** De la unidad menor a lo que se escribe en la casilla, POR MONEDA. */
export function textoDeMonto(centavos: number, moneda: string): string {
  const divisor = divisorDe(moneda);
  return (centavos / divisor).toFixed(divisor === 1 ? 0 : 2);
}

export function formularioDeEdicion(
  id: string,
  guardado: ProductoGuardado,
  recibido: Partial<Record<string, string>>,
): Record<string, string> {
  const f: Record<string, string> = { id, estado: guardado.estado };

  /* Lo que la app no enseña, tal como estaba. */
  if (guardado.sku) f.sku = guardado.sku;
  if (guardado.categoriaId) f.categoriaId = guardado.categoriaId;
  if (guardado.marca) f.marca = guardado.marca;
  if (guardado.unidad) f.unidad = guardado.unidad;
  if (guardado.precioAntesCentavos && guardado.precioAntesCentavos > 0) {
    /* Lo guardado lleva el ajuste; la casilla espera el precio del comercio. */
    f.precioAntes = textoDeMonto(
      baseDesdePublicado(guardado.precioAntesCentavos),
      guardado.moneda,
    );
  }
  if (guardado.destacado) f.destacado = "on";
  if (guardado.zonaDeposito) f.ciudadDeposito = guardado.zonaDeposito;

  for (const campo of CAMPOS_SEGURIDAD) {
    const valor = guardado.seguridad?.[campo];
    if (valor) f[campo] = valor;
  }

  /* Lo que sí cambia la app (y, en España, los datos del fabricante). */
  for (const campo of [...CAMPOS_DE_LA_APP, ...CAMPOS_SEGURIDAD]) {
    const valor = recibido[campo];
    if (typeof valor === "string") f[campo] = valor.slice(0, 2000);
  }
  /* Igual que al crear: con unidades escritas se lleva la cuenta; vacío, no. */
  if ((f.existencias ?? "").trim()) f.controlaExistencias = "on";
  return f;
}
