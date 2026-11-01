import { MessagesSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** La lista de casos de ayuda de quien entró, en su cuenta (1 nov 2026). */
export async function CasosDeAyuda({ usuarioId }: { usuarioId: string }) {
  const { casosDelUsuario } = await import("@/lib/soporte/casos-consultas");
  const casos = await casosDelUsuario(usuarioId).catch(() => []);
  if (casos.length === 0) return null;
  const t = await getTranslations("ayuda.caso");

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <MessagesSquare className="h-4 w-4 text-carga-600" aria-hidden />
        {t("misCasos")}
      </h2>
      <ul className="mt-3 divide-y divide-borde text-sm">
        {casos.map((c) => (
          <li key={c.id}>
            <Link
              href={`/ayuda/caso/${c.codigo}`}
              className="hover:text-carga-700 flex items-center justify-between gap-3 py-2.5"
            >
              <span className="min-w-0 truncate">
                <span className="font-mono text-xs text-tinta-suave">
                  #{c.numero}
                </span>{" "}
                {c.asunto}
              </span>
              <span className="shrink-0 text-xs font-semibold">
                {t(`estados.${c.estado}`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
