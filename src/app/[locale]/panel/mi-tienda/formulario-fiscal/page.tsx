import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { obtenerAlcance } from "@/lib/autorizacion";
import { fechaCorta, fechaHora } from "@/lib/fechas";
import { situacionFiscal } from "@/lib/fiscal/acciones";
import { nombreDePais } from "@/lib/fiscal/paises";
import { DECLARACION_EN } from "@/lib/fiscal/w8bene";
import type { Idioma } from "@/lib/dinero";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * EL DOCUMENTO: EL W-8BEN-E LLENO Y FIRMADO.
 *
 * ══ POR QUÉ ES UNA PÁGINA Y NO UN PDF GENERADO EN EL SERVIDOR ══
 *
 * Porque el navegador ya sabe hacer PDF, y hacerlo aquí significaría meter una
 * biblioteca de PDF entera dentro de un worker que corre en el borde — con su
 * peso, su mantenimiento y su forma propia de romperse. Con `Ctrl+P` o
 * «Compartir → Imprimir» en el teléfono sale el mismo documento, y sale igual
 * en cualquier aparato.
 *
 * ══ ESTO ES UN FORMULARIO SUSTITUTO, Y ESTÁ PERMITIDO ══
 *
 * El IRS acepta formularios sustitutos del W-8BEN-E siempre que contengan la
 * misma información y la misma declaración jurada. Por eso el texto de la
 * declaración va **en inglés y palabra por palabra**: es lo que lo hace
 * equivalente al oficial. La traducción al español está arriba, para que quien
 * firmó entienda qué firmó.
 *
 * ══ SOLO LO VE SU DUEÑO ══
 *
 * Lleva la identificación fiscal de una empresa y el nombre de quien firmó. Un
 * comercio que pida el de otro recibe 404, no un «no puedes»: así ni siquiera
 * se le confirma que exista.
 */
export default async function PaginaDocumentoFiscal({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const alcance = await obtenerAlcance();
  if (!alcance || alcance.tipo !== "tienda") notFound();

  const situacion = await situacionFiscal(alcance.tiendaId);
  const d = situacion.datos;
  if (!d) notFound();

  const t = await getTranslations("panel.fiscal");
  /* Los textos del DOCUMENTO en inglés, sin importar el idioma de la pantalla:
     lo va a leer una autoridad estadounidense o un banco. */
  const tEn = await getTranslations({
    locale: "en",
    namespace: "panel.fiscal",
  });
  const idioma = locale as Idioma;

  const fila = (etiqueta: string, valor: string) => (
    <div className="flex gap-3 border-b border-slate-200 py-2">
      <dt className="w-1/2 shrink-0 text-xs tracking-wide text-slate-500 uppercase">
        {etiqueta}
      </dt>
      <dd className="font-medium">{valor || "—"}</dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 print:p-0">
      <header className="border-b-2 border-slate-800 pb-3">
        <p className="text-xs tracking-widest text-slate-500 uppercase">
          Form W-8BEN-E · Substitute
        </p>
        <h1 className="mt-1 text-xl font-bold">
          Certificate of Status of Beneficial Owner for United States Tax
          Withholding and Reporting (Entities)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("titulo")} — {SITIO.nombre}
        </p>
      </header>

      <section className="mt-5">
        <h2 className="text-sm font-bold tracking-wide uppercase">
          Part I · Identification of Beneficial Owner
        </h2>
        <dl className="mt-2 text-sm">
          {fila("1 · Name of organization", d.nombreLegal)}
          {/**
           * EL PAÍS CON SU NOMBRE, NO CON EL CÓDIGO.
           *
           * El campo del IRS pide «Country of incorporation or organization» en
           * texto. Un documento que dice «VE» obliga a quien lo lee —un banco,
           * un contador— a saberse la tabla ISO de memoria.
           */}
          {fila(
            "2 · Country of incorporation",
            nombreDePais(d.paisConstitucion) ?? d.paisConstitucion,
          )}
          {/**
           * EL TIPO DE ENTIDAD VA EN INGLÉS, aunque la pantalla esté en
           * español. Este es un documento en inglés para una autoridad
           * estadounidense: «Compañía anónima» dentro de un formulario del IRS
           * no lo entiende quien tiene que leerlo.
           */}
          {fila(
            "4 · Chapter 3 Status (entity type)",
            tEn(`tipos.${d.tipoEntidad}` as never),
          )}
          {fila("6 · Permanent residence address", d.direccion)}
          {fila("6 · City", d.ciudad)}
          {fila("6 · State / province", d.region ?? "")}
          {fila("6 · Postal code", d.codigoPostal ?? "")}
          {fila("9b · Foreign TIN", d.identificacionFiscal ?? "")}
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold tracking-wide uppercase">
          Part XXX · Certification
        </h2>
        {/* EN INGLÉS Y PALABRA POR PALABRA: es lo que hace que este documento
            equivalga al oficial. */}
        <p className="mt-2 text-xs leading-relaxed text-slate-700">
          {DECLARACION_EN}
        </p>
        {/* Y la traducción de lo que de verdad se le enseñó al firmar, para
            que quien firmó pueda demostrar qué aceptó. */}
        <p className="mt-2 border-l-2 border-slate-300 pl-3 text-xs leading-relaxed text-slate-500 italic">
          {d.declaracion}
        </p>
      </section>

      <section className="mt-6 border-t border-slate-300 pt-3">
        <dl className="text-sm">
          {fila("Signature of authorized person", d.firmanteNombre)}
          {fila("Capacity in which acting", d.firmanteCargo)}
          {fila("Date signed", fechaHora(d.firmadoEn, idioma) ?? "")}
          {fila("Valid through", fechaCorta(d.venceEn, idioma) ?? "")}
        </dl>
        {/* LO QUE HACE VÁLIDA LA FIRMA, ESCRITO EN EL PROPIO DOCUMENTO.
            El IRS pide que se pueda demostrar que se firmó electrónicamente:
            que lo diga el papel mismo es la forma más simple de demostrarlo. */}
        <p className="mt-3 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          This form was signed electronically on{" "}
          {fechaHora(d.firmadoEn, idioma)} through {SITIO.url}. The signer
          accepted the certification shown above.
        </p>
      </section>

      <p className="mt-6 text-center text-xs text-slate-400 print:hidden">
        {t("noSeManda")}
      </p>
    </div>
  );
}
