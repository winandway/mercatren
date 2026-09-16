import "server-only";

import { getDb } from "@/lib/db";
import { tarifasCasillero } from "@/lib/db/schema";

/**
 * El guardado de una tarifa, compartido por el formulario del panel y por
 * la puerta de pruebas (`/datos/probar-compra`, acción `tarifa`). Vive
 * `server-only`: quien decide quién puede llamarlo es cada entrada.
 */
export type FilaTarifa = {
  pais: string;
  tarifaLibraCentavos: number;
  minimoLb: number;
  minimoCobroCentavos: number;
  despachoCentavos: number;
  seguroPuntosBase: number;
  seguroDesdeCentavos: number;
  divisorVolumetrico: number;
  diasAlmacenajeGratis: number;
  almacenajeDiaCentavos: number;
  impuestoIncluido: boolean;
  activa: boolean;
  nota: string | null;
};

export async function guardarTarifaFila(
  fila: FilaTarifa,
  actualizadoPor: string | null,
): Promise<void> {
  const completa = { ...fila, actualizadoEn: new Date(), actualizadoPor };
  await getDb()
    .insert(tarifasCasillero)
    .values(completa)
    .onConflictDoUpdate({ target: tarifasCasillero.pais, set: completa });
}
