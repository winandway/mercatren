import "server-only";

/**
 * AVISA QUE EL PANEL PIDIÓ UN MODELO DE IA QUE NO ESTÁ APROBADO (7 oct 2026).
 *
 * Se llama desde el traductor y desde la búsqueda por foto, que corren cada
 * minuto o con cada visitante. Por eso avisa UNA sola vez por arranque del
 * servidor: anotar en la base en cada llamada convertiría el aviso de una
 * factura sorpresa en otra factura (lecturas y escrituras de D1).
 *
 * Nunca lanza ni frena la llamada: el modelo ya quedó en el aprobado.
 */
let yaAvisado = false;

export function avisarModeloRechazado(pedido: string): void {
  if (yaAvisado) return;
  yaAvisado = true;
  console.error(
    `[ia] el panel pide el modelo «${pedido}», que no está aprobado: se usa el de siempre.`,
  );
  void import("@/lib/errores/registro")
    .then(({ registrarError }) =>
      registrarError(
        "ia/modelo-no-aprobado",
        new Error(`TRADUCCION_MODELO pide «${pedido}», que no está aprobado`),
        "Se ignoró y se usa el modelo por defecto. Ver lib/ia/modelo-permitido.ts.",
      ),
    )
    .catch(() => {
      /* Si ni el registro se puede escribir, queda el console. */
    });
}
