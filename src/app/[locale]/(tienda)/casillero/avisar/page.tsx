import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioPrealerta } from "@/components/casillero/formulario-prealerta";
import { Link, redirect } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";
import { misPrealertas } from "@/lib/casillero/prealerta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "casillero" });
  return {
    title: t("prealertaBoton"),
    robots: { index: false, follow: false },
  };
}

export default async function PaginaAvisar({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("casillero");

  const usuario = await obtenerUsuario();
  if (!usuario) redirect({ href: "/entrar?volver=/casillero/avisar", locale });
  const casillero = usuario ? await casilleroDe(usuario.id) : null;
  if (!casillero) redirect({ href: "/casillero/crear", locale });

  const abiertas = await misPrealertas(casillero!.id);

  const textos: Record<string, string> = {
    descripcion: t("preDescripcion"),
    descripcionPlaceholder: t("preDescripcionPlaceholder"),
    comercio: t("preComercio"),
    cantidad: t("preCantidad"),
    tracking: t("preTracking"),
    trackingAyuda: t("preTrackingAyuda"),
    valor: t("preValor"),
    valorAyuda: t("preValorAyuda"),
    enviar: t("preEnviar"),
    enviando: t("preEnviando"),
    listo: t("preListo"),
    error_descripcion: t("preErrorDescripcion"),
    error_valor: t("preErrorValor"),
    error_tracking: t("preErrorTracking"),
    error_sesion: t("errorSesion"),
    "error_sin-casillero": t("preErrorSinCasillero"),
    error_fallo: t("errorFallo"),
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">
        {t("prealertaBoton")}
      </h1>
      <p className="mt-2 text-sm text-tinta-suave">{t("prealertaBajada")}</p>

      <div className="mt-6 rounded-xl border border-borde bg-white p-5">
        <FormularioPrealerta textos={textos} />
      </div>

      {abiertas.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-bold">{t("preEsperando")}</h2>
          <ul className="mt-3 space-y-2">
            {abiertas.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-borde bg-white p-3 text-sm"
              >
                <p className="font-semibold">{p.descripcion}</p>
                <p className="mt-0.5 text-tinta-suave">
                  {[p.comercio, p.tracking].filter(Boolean).join(" · ") || "—"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-6 text-center text-sm">
        <Link
          href="/casillero/mi-casillero"
          className="text-carga-600 hover:underline"
        >
          {t("volver")}
        </Link>
      </p>
    </main>
  );
}
