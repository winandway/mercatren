import { Check, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "comoFunciona" });
  return { title: t("titulo"), description: t("entradilla") };
}

type Paso = { titulo: string; texto: string };
type Metodo = { nombre: string; costo: string; texto: string };

/**
 * El modelo de negocio explicado para el publico: clientes que compran,
 * familiares que pagan desde Estados Unidos y comercios que quieren vender.
 */
export default async function PaginaComoFunciona({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("comoFunciona");

  const puntosQueEs = t.raw("queEs.puntos") as string[];
  const pasos = t.raw("pasos.lista") as Paso[];
  const queNoEs = t.raw("queNoEs.puntos") as string[];
  const metodos = t.raw("pagos.metodos") as Metodo[];

  return (
    <>
      <section className="bg-riel-800 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {t("titulo")}
          </h1>
          <p className="mt-4 text-base text-white/80 sm:text-lg">
            {t("entradilla")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-14 px-4 py-14">
        {/* Que es */}
        <section>
          <h2 className="text-2xl font-bold">{t("queEs.titulo")}</h2>
          <p className="mt-3 text-tinta-suave">{t("queEs.texto")}</p>
          <ul className="mt-5 space-y-2">
            {puntosQueEs.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-precio-600"
                  aria-hidden
                />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Paso a paso */}
        <section>
          <h2 className="text-2xl font-bold">{t("pasos.titulo")}</h2>
          <ol className="mt-6 space-y-4">
            {pasos.map((paso, indice) => (
              <li
                key={paso.titulo}
                className="flex gap-4 rounded-xl border border-borde p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carga-500 text-sm font-bold text-riel-950">
                  {indice + 1}
                </span>
                <div>
                  <h3 className="font-bold">{paso.titulo}</h3>
                  <p className="mt-1 text-sm text-tinta-suave">{paso.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Que NO es */}
        <section className="rounded-xl bg-slate-50 p-6">
          <h2 className="text-2xl font-bold">{t("queNoEs.titulo")}</h2>
          <ul className="mt-4 space-y-2">
            {queNoEs.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm">
                <X
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                  aria-hidden
                />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Formas de pago */}
        <section>
          <h2 className="text-2xl font-bold">{t("pagos.titulo")}</h2>
          <p className="mt-3 text-tinta-suave">{t("pagos.texto")}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {metodos.map((m) => (
              <article
                key={m.nombre}
                className="rounded-xl border border-borde p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <h3 className="font-bold">{m.nombre}</h3>
                  <span className="shrink-0 rounded-full bg-carga-500/15 px-2 py-0.5 text-sm font-bold whitespace-nowrap text-riel-800">
                    {m.costo}
                  </span>
                </div>
                <p className="mt-2 text-sm text-tinta-suave">{m.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Para comercios */}
        <section className="rounded-xl bg-riel-900 p-6 text-white sm:p-8">
          <h2 className="text-2xl font-bold">{t("paraComercios.titulo")}</h2>
          <p className="mt-3 text-white/80">{t("paraComercios.texto")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vender" className="boton-principal">
              {t("paraComercios.boton")}
            </Link>
            <Link
              href="/transparencia"
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("verTransparencia")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
