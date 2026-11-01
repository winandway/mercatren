import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChatDelCaso } from "@/components/ayuda/chat-del-caso";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * EL CHAT DE UN CASO DE AYUDA (1 nov 2026). La dirección lleva la llave
 * secreta del caso: es la única puerta, tenga o no cuenta quien escribió.
 * Nunca se indexa.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PaginaCaso({
  params,
}: {
  params: Promise<{ locale: string; codigo: string }>;
}) {
  const { locale, codigo } = await params;
  setRequestLocale(locale);
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(codigo)) notFound();

  const { casoPorCodigo } = await import("@/lib/soporte/casos-consultas");
  const caso = await casoPorCodigo(codigo);
  if (!caso) notFound();
  const t = await getTranslations("ayuda.caso");
  const hora = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/ayuda" className="text-sm text-tinta-suave hover:text-tinta">
        ← {t("volver")}
      </Link>
      <header className="mt-3">
        <p className="font-mono text-xs text-tinta-suave">
          {t("numero")} #{caso.numero}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {caso.asunto}
        </h1>
        <p className="mt-1 text-sm">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              caso.estado === "respondido"
                ? "bg-emerald-100 text-emerald-900"
                : caso.estado === "cerrado"
                  ? "bg-slate-100 text-tinta-suave"
                  : "bg-amber-100 text-amber-900",
            )}
          >
            {t(`estados.${caso.estado}`)}
          </span>
        </p>
      </header>

      <ol className="mt-6 space-y-3">
        {caso.mensajes.map((m, i) => (
          <li
            key={i}
            className={cn(
              "flex",
              m.autor === "cliente" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm",
                m.autor === "cliente"
                  ? "rounded-br-sm bg-riel-900 text-white"
                  : "rounded-bl-sm border border-slate-200 bg-white",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-xs font-semibold",
                  m.autor === "cliente" ? "text-white/70" : "text-carga-700",
                )}
              >
                {m.autor === "cliente" ? t("tu") : t("soporte")} ·{" "}
                {hora.format(m.creadoEn)}
              </p>
              {m.texto}
              {m.adjuntos.length > 0 ? (
                <span className="mt-2 flex flex-wrap gap-2">
                  {m.adjuntos.map((a, j) => (
                    <a
                      key={j}
                      href={enEsteDominio(a.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-20 w-20 overflow-hidden rounded-lg border border-white/20 bg-white/10"
                      title={a.nombre}
                    >
                      {a.tipo === "image/heic" || a.tipo === "image/heif" ? (
                        <span className="flex h-full items-center justify-center px-1 text-center text-[11px] break-all">
                          {a.nombre}
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- privada y firmada: no pasa por el optimizador
                        <img
                          src={enEsteDominio(a.url)}
                          alt={a.nombre}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </a>
                  ))}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <ChatDelCaso codigo={codigo} />
    </div>
  );
}

/**
 * El enlace firmado sale con el dominio principal (así lo pide el gerente de
 * correo), pero el chat también se abre desde .cl, .com.co, .com.ve o en
 * local: aquí se usa solo la ruta y la firma, que valen en cualquier dominio
 * porque los cuatro sirven el mismo sitio.
 */
function enEsteDominio(url: string): string {
  const u = new URL(url);
  return `${u.pathname}${u.search}`;
}
