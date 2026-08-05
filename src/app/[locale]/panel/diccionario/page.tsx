import { ArrowRight, BookOpen, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { cuantasEntradas, DICCIONARIO } from "@/contenido/diccionario";
import type { Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/**
 * EL DICCIONARIO: cómo se habla de Mercatren.
 *
 * Lo pidió el dueño el 5 ago 2026, después de la reestructuración legal, para
 * estudiarlo. No es un manual de estilo: es la lista de palabras que describen
 * una figura jurídica distinta de la nuestra —una agencia que mueve dinero
 * ajeno— y que son la razón por la que los bancos cierran cuentas.
 *
 * Vive en el panel y no en el sitio público a propósito. Es material de
 * trabajo del equipo: enseña los errores que cometimos, y eso no se publica.
 *
 * Crece con los resbalones reales. Cada vez que alguien usa una palabra de la
 * columna roja, se agrega su entrada en `src/contenido/diccionario.ts`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel.diccionario");
  return { title: t("titulo") };
}

export default async function PaginaDiccionario({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  // Material interno del equipo: no lo ven los proveedores. Enseña los
  // errores que cometimos, y eso no se comparte con un cliente.
  await exigirEquipoInterno();

  const t = await getTranslations("panel.diccionario");

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-carga-600 uppercase">
          <BookOpen className="h-4 w-4" aria-hidden />
          {t("etiqueta")}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("titulo")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">
          {t("entradilla")}
        </p>
      </header>

      {/* POR QUÉ EXISTE. Sin esto el diccionario parece una manía de estilo, y
          quien lo lea así no lo va a respetar cuando esté apurado. */}
      <section className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
        <p className="flex items-start gap-2 font-semibold">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("porQueTitulo")}
        </p>
        <p className="mt-1 pl-6 leading-relaxed">{t("porQueTexto")}</p>
      </section>

      <p className="mt-6 text-xs text-tinta-suave">
        {t("cuantas", { n: cuantasEntradas() })}
      </p>

      <div className="mt-4 space-y-10">
        {DICCIONARIO.map((grupo) => (
          <section key={grupo.id} id={grupo.id}>
            <h2 className="text-lg font-bold">{grupo.titulo[idioma]}</h2>
            <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
              {grupo.entradilla[idioma]}
            </p>

            <ul className="mt-4 space-y-3">
              {grupo.entradas.map((entrada) => (
                <li
                  key={entrada.id}
                  id={entrada.id}
                  className="overflow-hidden rounded-xl border border-borde bg-white"
                >
                  {/* LA PAREJA, UNA ENCIMA DE OTRA. En dos columnas el ojo
                      compara; apiladas se leen como una corrección, que es lo
                      que son. */}
                  <div className="grid sm:grid-cols-2">
                    <p className="flex items-start gap-2 border-b border-borde bg-red-50/60 px-4 py-3 text-sm text-red-900 sm:border-r sm:border-b-0">
                      <span className="mt-0.5 shrink-0 font-bold" aria-hidden>
                        ✕
                      </span>
                      <span>
                        <span className="block text-[11px] font-semibold tracking-wide uppercase opacity-70">
                          {t("noSeDice")}
                        </span>
                        {entrada.mal[idioma]}
                      </span>
                    </p>

                    <p className="flex items-start gap-2 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                      <span className="mt-0.5 shrink-0 font-bold" aria-hidden>
                        ✓
                      </span>
                      <span>
                        <span className="block text-[11px] font-semibold tracking-wide uppercase opacity-70">
                          {t("seDice")}
                        </span>
                        <span className="font-semibold">
                          {entrada.bien[idioma]}
                        </span>
                      </span>
                    </p>
                  </div>

                  {/* EL PORQUÉ ES LO QUE SE APRENDE. Una lista de reemplazos
                      se memoriza y se olvida; el motivo se entiende una vez y
                      ya se aplica a palabras que no están en la lista. */}
                  <div className="flex items-start gap-2 border-t border-borde px-4 py-3">
                    <ArrowRight
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tinta-suave"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-tinta-suave">
                      <span
                        className={cn(
                          "mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                          entrada.nivel === "critico"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-tinta-suave",
                        )}
                      >
                        {t(
                          entrada.nivel === "critico"
                            ? "nivelCritico"
                            : "nivelCuidado",
                        )}
                      </span>
                      {entrada.porQue[idioma]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-tinta-suave">
        {t("comoCrece")}
      </p>
    </div>
  );
}
