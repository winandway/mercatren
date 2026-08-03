import { Building2, FileText, ListChecks, Lock, Route } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "transparencia" });
  return { title: t("titulo"), description: t("entradilla") };
}

/**
 * Pagina pensada para bancos, procesadores de pago y socios: explica la
 * operacion tal como es, sin adornos.
 *
 * OJO AL EQUIPO: aqui se describe COMO funciona la operacion, no se afirma su
 * calificacion regulatoria. Cualquier afirmacion de ese tipo la decide el
 * abogado del proyecto, no esta pagina.
 */
export default async function PaginaTransparencia({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("transparencia");

  const flujo = t.raw("flujo.pasos") as string[];
  const limites = t.raw("limites.puntos") as string[];
  const controles = t.raw("controles.puntos") as string[];
  const registros = t.raw("registros.puntos") as string[];

  return (
    <>
      <section className="bg-riel-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {t("quienes.lanzamiento")}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {t("titulo")}
          </h1>
          <p className="mt-4 text-base text-white/80 sm:text-lg">
            {t("entradilla")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-14">
        <Bloque Icono={Building2} titulo={t("quienes.titulo")}>
          <p className="text-tinta-suave">{t("quienes.texto")}</p>
        </Bloque>

        <Bloque Icono={Route} titulo={t("flujo.titulo")}>
          <p className="text-tinta-suave">{t("flujo.texto")}</p>
          <ol className="mt-4 space-y-3">
            {flujo.map((paso, indice) => (
              <li key={paso} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xs font-bold text-white">
                  {indice + 1}
                </span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>
        </Bloque>

        <Bloque Icono={ListChecks} titulo={t("limites.titulo")}>
          <Lista puntos={limites} tono="rojo" />
        </Bloque>

        <Bloque Icono={ListChecks} titulo={t("controles.titulo")}>
          <Lista puntos={controles} tono="verde" />
        </Bloque>

        <Bloque Icono={FileText} titulo={t("registros.titulo")}>
          <Lista puntos={registros} tono="neutro" />
        </Bloque>

        <Bloque Icono={FileText} titulo={t("comisiones.titulo")}>
          <p className="text-tinta-suave">{t("comisiones.texto")}</p>
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-tinta-suave">
            {t("comisiones.nota")}
          </p>
        </Bloque>

        <section className="rounded-xl bg-riel-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold">{t("contacto.titulo")}</h2>
          <p className="mt-2 text-white/80">{t("contacto.texto")}</p>
          {/* El buzon real y funcional. Ver src/lib/correo/direcciones.ts */}
          <a
            href={`mailto:${CORREO_CONTACTO}`}
            className="boton-principal mt-5"
          >
            {t("contacto.boton")} · {CORREO_CONTACTO}
          </a>
        </section>

        <p className="border-t border-borde pt-6 text-xs text-tinta-suave">
          {t("avisoLegal")}
        </p>
      </div>
    </>
  );
}

function Bloque({
  Icono,
  titulo,
  children,
}: {
  Icono: typeof Building2;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-carga-500/15 text-riel-800">
          <Icono className="h-4 w-4" aria-hidden />
        </span>
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Lista({
  puntos,
  tono,
}: {
  puntos: string[];
  tono: "rojo" | "verde" | "neutro";
}) {
  const color =
    tono === "rojo"
      ? "bg-red-500"
      : tono === "verde"
        ? "bg-precio-600"
        : "bg-riel-700";

  return (
    <ul className="space-y-2">
      {puntos.map((p) => (
        <li key={p} className="flex gap-2.5 text-sm">
          <span
            aria-hidden
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`}
          />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}
