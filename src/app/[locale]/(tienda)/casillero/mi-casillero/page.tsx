import { MapPin, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CopiarLinea } from "@/components/casillero/copiar-linea";
import { LogoBestway } from "@/components/casillero/logo-bestway";
import { Link, redirect } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import {
  BODEGA_MIAMI,
  enlaceDeMapa,
  lineasDeEtiqueta,
} from "@/lib/casillero/bodega";
import { casilleroDe } from "@/lib/casillero/crear";
import type { Idioma } from "@/lib/dinero";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "casillero" });
  /* NUNCA a Google: aquí está la dirección completa, que es lo único que no
     se publica. Ver `bodega.ts`. */
  return { title: t("miTitulo"), robots: { index: false, follow: false } };
}

/**
 * ══ LA ÚNICA PANTALLA CON LA DIRECCIÓN COMPLETA ══
 *
 * Detrás de la sesión y con `noindex`. La dirección sin el código no sirve
 * —una caja con la calle correcta y sin código es un huérfano—, así que
 * aquí van juntos, línea por línea y con su botón de copiar cada uno.
 */
export default async function PaginaMiCasillero({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const t = await getTranslations("casillero");

  const usuario = await obtenerUsuario();
  if (!usuario)
    redirect({ href: "/entrar?volver=/casillero/mi-casillero", locale });

  const casillero = usuario ? await casilleroDe(usuario.id) : null;
  if (!casillero) redirect({ href: "/casillero/crear", locale });

  const lineas = lineasDeEtiqueta(
    casillero!.nombreLegal,
    casillero!.codigo,
    idioma,
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("miTitulo")}
          </h1>
          <p className="mt-1 text-sm text-tinta-suave">{t("miBajada")}</p>
        </div>
        <p className="rounded-lg bg-riel-950 px-4 py-2 font-mono text-lg font-bold text-white">
          {casillero!.codigo}
        </p>
      </div>

      {/* SIN VERIFICAR PUEDE RECIBIR, PERO NO DESPACHAR. Recibir nunca se
          bloquea; despachar sí, porque los casilleros son el vehículo
          clásico del reenvío de mercancía comprada con tarjeta robada y el
          intermediario responde. */}
      {!casillero!.verificado ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-carga-500/40 bg-carga-500/10 p-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t("sinVerificar")}</span>
        </p>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div>
          <h2 className="font-bold">{t("tuDireccion")}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {t("tuDireccionAyuda")}
          </p>
          <div className="mt-4 space-y-2">
            {lineas.map((l) => (
              <CopiarLinea
                key={l.campo}
                campo={l.campo}
                valor={l.valor}
                nota={l.nota}
                copiar={t("copiar")}
                copiado={t("copiado")}
              />
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-borde bg-slate-50 p-3">
            <p className="text-sm font-bold">{t("avisoNoCompartir")}</p>
            <p className="mt-1 text-sm text-tinta-suave">
              {t("avisoNoCompartirTexto")}
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-borde bg-white p-5 text-center">
          <LogoBestway clase="mx-auto h-auto w-40" />
          <p className="mt-3 text-xs text-tinta-suave">{t("bodegaBajada")}</p>
          <a
            href={enlaceDeMapa()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-carga-600 hover:underline"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {t("verMapa")}
          </a>
          <p className="mt-2 text-xs text-tinta-suave">
            {BODEGA_MIAMI.ciudad}, Florida
          </p>
        </aside>
      </section>

      <section className="mt-8 rounded-xl border border-borde bg-white p-5">
        <h2 className="font-bold">{t("prealertaTitulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("prealertaBajada")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/casillero/avisar" className="boton-principal">
            {t("prealertaBoton")}
          </Link>
          <Link href="/casillero/mis-paquetes" className="boton-secundario">
            {t("paquetesTitulo")}
          </Link>
        </div>
      </section>
    </main>
  );
}
