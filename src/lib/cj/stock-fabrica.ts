import "server-only";

import { llamarCjConRitmo } from "./ritmo";
import {
  MAX_VARIANTES_A_MIRAR,
  haceFaltaMirarLaFabrica,
  mezclarStockDeFabrica,
  stockTotalEn,
  type FilaDeStock,
} from "./stock-fabrica-puro";

/**
 * Completa el stock de las variantes de un producto de CHINA con el de
 * fábrica, preguntando a `/product/stock/queryByVid` (10 puntos por
 * variante, medido 9 sep). Solo pregunta cuando hace falta (ver el puro):
 * en EE. UU. nunca, y en China solo si `variant/query` dijo cero en todas.
 *
 * Si CJ no contesta una, esa variante se queda en cero: nunca se inventa
 * stock. Lo que se enseña como disponible salió de CJ.
 */
export async function completarStockDeFabrica<
  V extends { vid?: string; inventoryNum?: unknown },
>(variantes: V[], almacen: "US" | "CN"): Promise<V[]> {
  if (!haceFaltaMirarLaFabrica(variantes, almacen)) return variantes;

  const porVid = new Map<string, number>();
  for (const v of variantes.slice(0, MAX_VARIANTES_A_MIRAR)) {
    if (!v.vid) continue;
    const r = await llamarCjConRitmo<unknown>(
      `/product/stock/queryByVid?vid=${encodeURIComponent(v.vid)}`,
    );
    if (!r.ok) continue;
    const filas = (Array.isArray(r.datos) ? r.datos : []) as FilaDeStock[];
    porVid.set(v.vid, stockTotalEn(filas, almacen));
  }
  return mezclarStockDeFabrica(variantes, porVid);
}
