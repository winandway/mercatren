import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BotonImprimir } from "@/components/facturas/boton-imprimir";
import { Logo } from "@/components/marca/logo";
import { CORREO_EQUIPO } from "@/lib/correo/direcciones";
import { Link } from "@/i18n/navigation";
import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { facturaDePedido } from "@/lib/facturas/consultas";
import { fechaLarga } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}): Promise<Metadata> {
  const { locale, numero } = await params;
  const t = await getTranslations({ locale, namespace: "factura" });
  return {
    title: t("titulo", { numero }),
    // Una factura lleva el nombre y la dirección de una persona. Ni Google
    // ni nadie la indexa.
    robots: { index: false, follow: false },
  };
}

/**
 * LA FACTURA DE VENTA, COMO LA VE EL COMPRADOR.
 *
 * ══ POR QUÉ ES UNA PÁGINA Y NO UN PDF GENERADO EN EL SERVIDOR ══
 *
 * Armar un PDF de verdad exige un navegador dentro del servidor, y esto corre
 * en el borde, donde no lo hay. La salida sería un servicio aparte, más caro y
 * más frágil, para conseguir lo mismo que ya hace el botón de imprimir de
 * cualquier navegador: "Guardar como PDF".
 *
 * Así que la página ESTÁ HECHA PARA IMPRIMIRSE. En pantalla se ve como el
 * resto del sitio; al imprimir desaparecen encabezado, pie y botones, y queda
 * el documento solo. Es lo que se descarga y lo que se reenvía.
 *
 * ══ QUIÉN LA VE ══
 *
 * Solo el comprador de ese pedido y el equipo. Si no le corresponde, la
 * consulta devuelve nada y esto contesta **404** — no "no puedes", que le
 * confirmaría a un desconocido que ese pedido existe.
 */
export default async function PaginaFactura({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}) {
  const { locale, numero } = await params;
  setRequestLocale(locale);

  const idioma = locale as Idioma;
  const t = await getTranslations("factura");

  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) notFound();

  const factura = await facturaDePedido(
    numero,
    usuario.id,
    await esEquipoInterno(),
  );
  if (!factura) notFound();

  const precio = (centavos: number) =>
    formatearPrecio(centavos, idioma, factura.moneda);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Todo lo de aquí desaparece al imprimir: sobra en el papel. */}
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/pedido/${factura.pedidoNumero}`}
          className="text-sm font-medium text-tinta-suave hover:underline"
        >
          ← {t("volver")}
        </Link>
        <BotonImprimir etiqueta={t("descargar")} />
      </div>

      {/* `hoja-factura` es lo que las reglas de impresión de globals.css usan
          para esconder encabezado y pie: lo que se guarda es el documento. */}
      <article className="hoja-factura rounded-xl border border-borde bg-white p-8 print:border-0 print:p-0">
        {/**
         * LA CABECERA CON LA MARCA (18 ago 2026).
         *
         * Antes era texto negro sobre blanco: parecía un recibo de máquina,
         * no el documento de una empresa. Y a un comprador que gastó dinero
         * la factura es lo único que le queda en la mano — si esa hoja no
         * inspira confianza, la compra tampoco.
         *
         * Va en el azul de la casa con el logo encima, y **se imprime tal
         * cual**: `print-color-adjust: exact` obliga al navegador a poner el
         * fondo, que por defecto lo quita para ahorrar tinta y dejaría el
         * logo blanco sobre blanco.
         */}
        <header className="-m-8 mb-0 bg-riel-900 px-8 py-6 text-white [print-color-adjust:exact] print:m-0 print:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Logo variante="horizontalOscuro" className="h-8" />
              <p className="mt-4 text-xs font-bold tracking-widest uppercase opacity-70">
                {t("documento")}
              </p>
              <p className="mt-0.5 text-2xl font-bold">{factura.numero}</p>
              <p className="mt-1 text-sm opacity-80">
                {fechaLarga(factura.emitidaEn, idioma)}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">{factura.emisorNombre}</p>
              {factura.emisorIdentificacion ? (
                <p className="opacity-80">{factura.emisorIdentificacion}</p>
              ) : null}
              {factura.emisorDireccion ? (
                <p className="max-w-[16rem] opacity-80">
                  {factura.emisorDireccion}
                </p>
              ) : null}
              {/* EL CORREO QUE RECIBE DE VERDAD. Sin él, quien tiene una duda
                  con su factura no sabe a dónde escribir — y termina
                  llamando al banco, que es el primer paso de un contracargo. */}
              <p className="mt-2 opacity-80">{CORREO_EQUIPO}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-widest text-tinta-suave uppercase">
              {t("para")}
            </p>
            <p className="mt-1 font-medium">{factura.receptorNombre}</p>
            {factura.receptorCorreo ? (
              <p className="text-sm text-tinta-suave">
                {factura.receptorCorreo}
              </p>
            ) : null}
            {factura.receptorDireccion ? (
              <p className="text-sm text-tinta-suave">
                {factura.receptorDireccion}
              </p>
            ) : null}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold tracking-widest text-tinta-suave uppercase">
              {t("pedido")}
            </p>
            <p className="mt-1 font-medium">{factura.pedidoNumero}</p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-borde text-left">
              <th className="py-2 font-semibold">{t("concepto")}</th>
              <th className="py-2 text-right font-semibold">{t("cantidad")}</th>
              <th className="py-2 text-right font-semibold">{t("unitario")}</th>
              <th className="py-2 text-right font-semibold">{t("importe")}</th>
            </tr>
          </thead>
          <tbody>
            {factura.lineas.map((l, i) => (
              <tr key={i} className="border-b border-borde/60">
                <td className="py-2.5 pr-3">{l.descripcion}</td>
                <td className="py-2.5 text-right tabular-nums">{l.cantidad}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {precio(l.precioUnitarioCentavos)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {precio(l.subtotalCentavos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-4 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-tinta-suave">{t("subtotal")}</dt>
              <dd className="tabular-nums">
                {precio(factura.subtotalCentavos)}
              </dd>
            </div>
            {/* El impuesto solo aparece si lo hay: un renglón en cero en cada
                factura solo genera la pregunta de por qué está ahí. */}
            {factura.impuestosCentavos > 0 ? (
              <div className="flex justify-between">
                <dt className="text-tinta-suave">{t("impuestos")}</dt>
                <dd className="tabular-nums">
                  {precio(factura.impuestosCentavos)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-borde pt-2 text-base font-bold">
              <dt>{t("total")}</dt>
              <dd className="tabular-nums">{precio(factura.totalCentavos)}</dd>
            </div>
          </dl>
        </section>

        <p className="mt-8 border-t border-borde pt-4 text-xs text-tinta-suave">
          {t("pie", { sociedad: factura.emisorNombre })}
        </p>
      </article>
    </div>
  );
}
