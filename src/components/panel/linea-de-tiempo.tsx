import { History } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { fechaCorta } from "@/lib/fechas";
import type { HitoVista } from "@/lib/pedidos/hitos";

/**
 * LO QUE LE FUE PASANDO AL PEDIDO, Y QUIÉN LO HIZO.
 *
 * ══ POR QUÉ NO BASTA CON EL ESTADO ══
 *
 * `pedidos.estado` dice dónde está hoy. Cuando un comprador reclama que nunca
 * recibió su compra —y con un contracargo de por medio eso deja de ser
 * hipotético— «Entregado» a secas no defiende a nadie. «Marcado como entregado
 * por Fulano el 12 de agosto» sí.
 *
 * Lo que hace el sistema solo (un cobro que se confirma) sale sin autor, y así
 * debe ser: poner un nombre ahí sería atribuirle a una persona algo que no
 * hizo.
 */
export async function LineaDeTiempo({
  hitos,
  idioma,
}: {
  hitos: HitoVista[];
  idioma: string;
}) {
  const t = await getTranslations("panel.hitos");
  const tp = await getTranslations("pedido");

  // Sin historial no se dibuja: un bloque vacío se lee como un fallo.
  if (hitos.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold">
        <History className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>

      <ol className="mt-3 space-y-2.5">
        {hitos.map((h) => (
          <li key={h.id} className="flex gap-3 text-sm">
            <span
              aria-hidden
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-carga-500"
            />
            <div className="min-w-0">
              <p className="font-medium">
                {tp.has(`estado.${h.hito}`) ? tp(`estado.${h.hito}`) : h.hito}
              </p>
              <p className="text-xs text-tinta-suave">
                {h.fecha ? fechaCorta(h.fecha, idioma) : ""}
                {h.porNombre ? ` · ${t("por", { quien: h.porNombre })}` : ""}
                {!h.porNombre ? ` · ${t("porElSistema")}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
