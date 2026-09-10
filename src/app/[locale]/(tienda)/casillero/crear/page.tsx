import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioCasillero } from "@/components/casillero/formulario-casillero";
import { Link, redirect } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "casillero" });
  /* Esta pantalla es de la cuenta, no de Google. */
  return { title: t("crear"), robots: { index: false, follow: false } };
}

/**
 * Crear el casillero. Exige sesión: el casillero cuelga de la cuenta que ya
 * existe en Mercatren, porque quien compra en el catálogo y quien recibe
 * paquetes son la misma persona y dos contraseñas son una de más.
 */
export default async function PaginaCrearCasillero({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("casillero");

  const usuario = await obtenerUsuario();
  if (!usuario) redirect({ href: "/entrar?volver=/casillero/crear", locale });

  /* Uno por persona: si ya lo tiene, se le enseña el suyo en vez de dejarle
     crear un segundo código que después nadie sabe cuál usó. */
  const yaTiene = usuario ? await casilleroDe(usuario.id) : null;
  if (yaTiene) redirect({ href: "/casillero/mi-casillero", locale });

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("crear")}</h1>
      <p className="mt-2 text-sm text-tinta-suave">{t("crearBajada")}</p>

      <div className="mt-6 rounded-xl border border-borde bg-white p-5">
        <FormularioCasillero
          textos={{
            nombreLegal: t("campoNombre"),
            nombreAyuda: t("campoNombreAyuda"),
            telefono: t("campoTelefono"),
            telefonoAyuda: t("campoTelefonoAyuda"),
            pais: t("campoPais"),
            terminos: t("campoTerminos"),
            crear: t("crear"),
            enviando: t("creando"),
            errorNombre: t("errorNombre"),
            errorTelefono: t("errorTelefono"),
            errorTerminos: t("errorTerminos"),
            errorSesion: t("errorSesion"),
            errorFallo: t("errorFallo"),
          }}
        />
      </div>

      <p className="mt-4 text-center text-sm">
        <Link href="/casillero" className="text-carga-600 hover:underline">
          {t("volver")}
        </Link>
      </p>
    </main>
  );
}
