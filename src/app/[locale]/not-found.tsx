import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function NoEncontrado() {
  const t = await getTranslations();

  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-carga-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t("noEncontrado.titulo")}</h1>
      <p className="mt-2 text-tinta-suave">{t("noEncontrado.texto")}</p>
      <Link href="/" className="boton-principal mt-8">
        {t("comun.volverInicio")}
      </Link>
    </section>
  );
}
