import { CircleCheck, LogIn, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BorrarCuenta } from "@/components/cuenta/borrar-cuenta";
import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import {
  BORRAR_CUENTA_EN,
  BORRAR_CUENTA_ES,
} from "@/contenido/paginas/borrar-cuenta";
import { Link } from "@/i18n/navigation";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { estadoParaBorrar } from "@/lib/cuenta/borrar-acciones";
import { rutaCanonica, SITIO } from "@/lib/sitio";

/**
 * ══ BORRAR LA CUENTA (27 oct 2026) ══
 *
 * La página que Google Play exige en la ficha de toda app con cuentas: dice
 * cómo borrarla y qué pasa con los datos, y deja hacerlo aquí mismo. Es la
 * misma dentro de la app de Android y en la web.
 *
 * Depende de la sesión, así que se arma por petición.
 */
export const dynamic = "force-dynamic";

const RUTA = "/delete-account";

function contenido(locale: string) {
  return locale === "en" ? BORRAR_CUENTA_EN : BORRAR_CUENTA_ES;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pagina = contenido(locale);
  return {
    title: pagina.titulo,
    description: pagina.entradilla,
    alternates: rutaCanonica(RUTA, locale),
    openGraph: {
      type: "website",
      title: `${pagina.titulo} · ${SITIO.nombre}`,
      description: pagina.entradilla,
      url: `${SITIO.url}/${locale}${RUTA}`,
      siteName: SITIO.nombre,
    },
  };
}

export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ listo?: string }>;
}) {
  const { locale } = await params;
  const { listo } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("borrarCuenta");

  let bloque: ReactNode;

  if (listo === "1") {
    bloque = (
      <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-5 sm:p-6">
        <p className="flex items-center gap-2 font-bold text-emerald-800">
          <CircleCheck className="h-5 w-5" aria-hidden />
          {t("listo.titulo")}
        </p>
        <p className="mt-2 text-sm text-tinta">{t("listo.texto")}</p>
      </div>
    );
  } else {
    const estado = await estadoParaBorrar().catch(() => ({
      sesion: false as const,
    }));
    if (!estado.sesion) {
      bloque = (
        <div className="rounded-2xl border border-borde bg-slate-50 p-5 sm:p-6">
          <p className="flex items-center gap-2 font-bold">
            <LogIn className="h-5 w-5 text-carga-500" aria-hidden />
            {t("sinSesion.titulo")}
          </p>
          <p className="mt-2 text-sm text-tinta-suave">
            {t("sinSesion.texto")}
          </p>
          <Link
            href={`/entrar?destino=${encodeURIComponent(RUTA)}`}
            className="boton-principal mt-4"
          >
            {t("sinSesion.boton")}
          </Link>
        </div>
      );
    } else if (estado.puede) {
      bloque = <BorrarCuenta correo={estado.correo} />;
    } else {
      bloque = (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
          <p className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            {t("noSePuede.titulo")}
          </p>
          <p className="mt-2 text-sm text-tinta">
            {t(`errores.${estado.motivo}`, { correo: CORREO_CONTACTO })}
          </p>
        </div>
      );
    }
  }

  return <PaginaDeContenido pagina={contenido(locale)} antes={bloque} />;
}
