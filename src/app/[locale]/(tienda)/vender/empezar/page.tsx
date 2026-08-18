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

type Textos = (clave: string) => string;

/** En qué espacio de textos vive el vocabulario de cada plaza. */
const LLAVE: Record<string, string> = { CL: "chile", CO: "colombia" };

/**
 * LO QUE CADA PAÍS LLAMA DISTINTO EN EL FORMULARIO DE ALTA.
 *
 * Una tabla y no un `if` por país: con quince plazas, el `if` se convierte en
 * quince ramas que nadie se acuerda de tocar al agregar la dieciseisava. Lo
 * que no esté aquí usa los textos de siempre.
 */
const VOCABULARIO: Record<
  string,
  {
    etiquetas: (t: Textos) => Record<string, string>;
    ayudas: (t: Textos) => Record<string, string>;
    valores: (t: Textos) => Record<string, string>;
  }
> = {
  CL: {
    /* En Chile la unidad de una dirección es la COMUNA, no la ciudad. */
    etiquetas: (t) => ({ ciudad: t("chile.ciudad") }),
    ayudas: (t) => ({
      ciudad: t("chile.ciudadAyuda"),
      direccion: t("chile.direccionAyuda"),
      telefono: t("chile.telefonoAyuda"),
    }),
    valores: (t) => ({ paisOrigen: t("chile.paisAyuda") }),
  },
  CO: {
    /* En Colombia sí se dice «Ciudad», así que la etiqueta no cambia: solo
       los ejemplos, que son los que hacen que se entienda de un vistazo. */
    etiquetas: () => ({}),
    ayudas: (t) => ({
      ciudad: t("colombia.ciudadAyuda"),
      direccion: t("colombia.direccionAyuda"),
      telefono: t("colombia.telefonoAyuda"),
    }),
    valores: (t) => ({ paisOrigen: t("colombia.paisAyuda") }),
  },
};

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
        {/* «Se cobra en Estados Unidos» es verdad en mercatren.com y falsa en
            las demás plazas, que venden en su propia moneda. Lo que sí es
            cierto en todas: la venta se factura a nombre de su empresa. */}
        {VOCABULARIO[mercado.codigo]
          ? t(`${LLAVE[mercado.codigo]}.porQueLosDatos`)
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
          /* El vocabulario propio de cada plaza. El mercado principal va sin
             nada y usa sus textos de siempre — mercatren.com no se toca.
             «Comuna» es de Chile; en Colombia se dice «Ciudad», que ya es la
             etiqueta por defecto, así que ahí solo cambian las ayudas. */
          VOCABULARIO[mercado.codigo]
            ? {
                etiquetas: VOCABULARIO[mercado.codigo]!.etiquetas(t),
                ayudas: VOCABULARIO[mercado.codigo]!.ayudas(t),
                valores: VOCABULARIO[mercado.codigo]!.valores(t),
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
