import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListaBloqueados } from "@/components/moderacion/lista-bloqueados";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { listarBloqueados } from "@/lib/moderacion/para-la-app";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderacion");
  return { title: t("bloqueadosTitulo"), robots: { index: false } };
}

/**
 * «Vendedores bloqueados» en la web (8 nov 2026, dictamen de Google Play):
 * la misma lista que la app enseña en Cuenta, con «Desbloquear».
 */
export default async function PaginaBloqueados({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderacion");
  const usuario = await obtenerUsuario().catch(() => null);

  if (!usuario) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">{t("bloqueadosTitulo")}</h1>
        <p className="mt-3 text-tinta-suave">{t("errores.sesion")}</p>
        <Link
          href="/entrar?destino=/cuenta/bloqueados"
          className="boton-principal mt-6 inline-block"
        >
          {t("entrar")}
        </Link>
      </div>
    );
  }

  const lista = await listarBloqueados(usuario.id);
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/cuenta"
        className="text-sm text-tinta-suave hover:text-tinta"
      >
        ← {t("volverCuenta")}
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold">{t("bloqueadosTitulo")}</h1>
      <p className="mt-2 text-tinta-suave">{t("bloqueadosTexto")}</p>
      <ListaBloqueados inicial={lista} />
    </div>
  );
}
