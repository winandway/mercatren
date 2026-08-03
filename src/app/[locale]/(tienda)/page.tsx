import { PackageCheck, Plane, ShieldCheck, ShoppingBag } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

const ICONOS = [ShoppingBag, PackageCheck, Plane];
const PASOS = ["uno", "dos", "tres"] as const;

export default async function PaginaInicio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("inicio");

  return (
    <>
      <section className="bg-riel-800 text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-16 sm:py-24">
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            {t("tituloHero")}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            {t("subtituloHero")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalogo" className="boton-principal">
              {t("verCatalogo")}
            </Link>
            <Link
              href="/vender"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("abrirTienda")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-14">
        <h2 className="text-2xl font-bold">{t("comoFunciona")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PASOS.map((paso, indice) => {
            const Icono = ICONOS[indice];
            return (
              <article
                key={paso}
                className="rounded-xl border border-borde p-6 transition-shadow hover:shadow-md"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-carga-500/15 text-riel-800">
                  <Icono className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold">
                  {t(`pasos.${paso}Titulo`)}
                </h3>
                <p className="mt-2 text-sm text-tinta-suave">
                  {t(`pasos.${paso}Texto`)}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/como-funciona"
            className="inline-flex items-center gap-2 rounded-lg border border-riel-800 px-4 py-2 text-sm font-semibold text-riel-900 transition-colors hover:bg-riel-900 hover:text-white"
          >
            {t("verDetalle")}
          </Link>
          <Link
            href="/transparencia"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-tinta-suave transition-colors hover:text-riel-900"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t("paraBancos")}
          </Link>
        </div>

        <p className="mt-10 rounded-lg bg-carga-500/10 px-4 py-3 text-sm text-riel-800">
          {t("enConstruccion")}
        </p>
      </section>
    </>
  );
}
