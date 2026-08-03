import { PackageCheck, Plane, ShoppingBag } from "lucide-react";
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

        <p className="mt-10 rounded-lg bg-carga-500/10 px-4 py-3 text-sm text-riel-800">
          {t("enConstruccion")}
        </p>
      </section>
    </>
  );
}
