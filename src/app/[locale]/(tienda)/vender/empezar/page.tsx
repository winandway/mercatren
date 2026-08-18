import { Store } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioComercio } from "@/components/cuenta/formulario-comercio";
import { mercadoActual } from "@/lib/mercado/actual";
import {
  documentoDelMercado,
  tieneDocumentoPropio,
} from "@/lib/mercado/identificacion";
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
  const mercado = await mercadoActual();
  const documento = documentoDelMercado(mercado);
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
        {/* «Se cobra en Estados Unidos» es verdad en mercatren.com y falsa
            en Chile, que vende en pesos chilenos. Lo que sí es cierto en los
            dos: la venta se factura a nombre de su empresa. */}
        {mercado.codigo === "CL"
          ? t("chile.porQueLosDatos")
          : t("porQueLosDatos")}
      </p>

      <FormularioComercio
        documento={{
          /* El nombre del documento sale traducido: «RUT» es igual en los dos
             idiomas, pero «Identificación fiscal» no. */
          nombre: tieneDocumentoPropio(mercado)
            ? documento.nombre
            : t("campos.identificacionFiscal"),
          ejemplo: documento.ejemplo,
        }}
        local={
          /* Solo Chile tiene vocabulario propio hoy. En el resto va sin nada
             y el formulario usa sus textos de siempre. */
          mercado.codigo === "CL"
            ? {
                etiquetas: { ciudad: t("chile.ciudad") },
                ayudas: {
                  ciudad: t("chile.ciudadAyuda"),
                  direccion: t("chile.direccionAyuda"),
                  telefono: t("chile.telefonoAyuda"),
                },
                valores: { paisOrigen: t("chile.paisAyuda") },
              }
            : undefined
        }
      />

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
