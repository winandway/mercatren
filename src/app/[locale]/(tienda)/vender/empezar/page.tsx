import { Store } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioComercio } from "@/components/cuenta/formulario-comercio";
import { Link, redirect } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "comercio" });
  // Pantalla de alta: no aporta nada en un buscador.
  return { title: t("titulo"), robots: { index: false, follow: false } };
}

/**
 * Alta de un comercio.
 *
 * Es el segundo paso del camino de quien quiere vender: primero crea su
 * cuenta (la misma que usa cualquier comprador) y aquí cuenta de su empresa.
 * Se pide DESPUÉS de tener cuenta, no antes, porque un formulario largo en la
 * primera pantalla espanta a cualquiera — es lo que hace Amazon: te registras
 * y lo de vender se añade encima.
 */
export default async function PaginaEmpezarAVender({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("comercio");
  const usuario = await obtenerUsuario().catch(() => null);

  // Sin cuenta no hay nada que registrar: primero la cuenta, y se vuelve aquí.
  if (!usuario) {
    redirect({ href: "/registro?destino=/vender/empezar", locale });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-carga-500/15 text-carga-600">
        <Store className="h-6 w-6" aria-hidden />
      </span>

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("titulo")}
      </h1>
      <p className="mt-2 text-tinta-suave">{t("entradilla")}</p>

      <p className="mt-4 rounded-lg border border-borde bg-slate-50 px-4 py-3 text-sm text-tinta-suave">
        {t("porQueLosDatos")}
      </p>

      <FormularioComercio />

      <p className="mt-6 text-center text-sm text-tinta-suave">
        {t("soloQuieroComprar")}{" "}
        <Link
          href="/catalogo"
          className="font-semibold text-carga-600 hover:underline"
        >
          {t("irAlCatalogo")}
        </Link>
      </p>
    </div>
  );
}
