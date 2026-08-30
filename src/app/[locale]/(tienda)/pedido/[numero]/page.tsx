import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CheckCircle2, Clock, FileText, Store, Truck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FichaDePago } from "@/components/pago/ficha-de-pago";
import { PagoTarjeta } from "@/components/pago/pago-tarjeta";
import { FormularioComprobante } from "@/components/pago/formulario-comprobante";
import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora } from "@/lib/fechas";
import { tieneFactura } from "@/lib/facturas/consultas";
import { conciliarPedido } from "@/lib/stripe/conciliar";
import { obtenerPedidoPropio } from "@/lib/pedidos/acciones";
import { PasosCompra } from "@/components/pedido/pasos-compra";
import { Devolver } from "@/components/pedido/devolver";
import { devolucionDelPedido } from "@/lib/devoluciones/acciones";
import {
  avisoDelPedido,
  estaPagado,
  pasoActual,
  type EstadoDePedido,
  type MetodoDePago,
} from "@/lib/pedidos/pasos";
import { cn } from "@/lib/utils";
import { destinoDeEnvio } from "@/lib/cj/destino-fiscal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}): Promise<Metadata> {
  const { locale, numero } = await params;
  const t = await getTranslations({ locale, namespace: "pedido" });
  return {
    title: t("titulo", { numero }),
    robots: { index: false, follow: false },
  };
}

/**
 * El pedido recien hecho, con las instrucciones para pagarlo.
 *
 * Solo lo ve su dueno: la consulta filtra por el cliente de la sesion.
 */
export default async function PaginaPedido({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}) {
  const { locale, numero } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("pedido");
  const te = await getTranslations("envio");
  const tf = await getTranslations("factura");
  /**
   * EL RESPALDO DEL COBRO CON TARJETA.
   *
   * Antes de dibujar nada: si este pedido es de tarjeta y sigue sin pagar, se
   * le pregunta a Stripe. Si el dinero ya entró y el aviso no llegó, se
   * acredita aquí mismo y el comprador ve su pedido pagado en vez de un
   * «esperando el pago» que no se iba a mover nunca.
   *
   * Va ANTES de leer el pedido, para que lo que se lea ya esté al día. Nunca
   * falla hacia afuera: si Stripe no responde, la página se dibuja igual.
   */
  await conciliarPedido(numero);

  const datos = await obtenerPedidoPropio(numero);

  if (!datos) notFound();

  const { pedido, renglones, pago } = datos;

  /* Con Zelle, una captura subida y sin validar NO es «falta el pago»: el pago
     puede estar hecho y lo que falta es que alguien lo mire. */
  /* La devolución del pedido, si la hay. Va aquí y no dentro del componente
     porque la comprobación de quién puede ver la dirección es del SERVIDOR. */
  const devolucion = await devolucionDelPedido(pedido.id);

  const aviso = avisoDelPedido(
    pedido.estado as EstadoDePedido,
    pedido.metodoPago as MetodoDePago,
    pago?.estado === "pendiente",
  );
  const hayFactura = await tieneFactura(pedido.id);
  const direccion = pedido.direccionEntrega as {
    nombre?: string;
    pais?: string;
    ciudad?: string;
    direccion?: string;
    referencia?: string | null;
  } | null;

  // Los datos de la cuenta que recibe salen de las variables del entorno:
  // en el codigo no hay ningun numero de cuenta escrito.
  const { env } = getCloudflareContext();
  const datosDePago = {
    beneficiario: env.PAGO_BENEFICIARIO ?? null,
    banco: env.PAGO_BANCO ?? null,
    cuenta: env.PAGO_CUENTA ?? null,
    rutaAch: env.PAGO_RUTA_ACH ?? null,
    rutaWire: env.PAGO_RUTA_WIRE ?? null,
    zelleCorreo: env.ZELLE_CORREO_RECEPTOR ?? null,
    zelleNombre: env.ZELLE_NOMBRE_RECEPTOR ?? null,
    soporteTelefono: env.PAGO_SOPORTE_TELEFONO ?? null,
    soporteCorreo: env.PAGO_SOPORTE_CORREO ?? null,
  };

  const pasos = t.raw("pasosZelle") as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* EN QUÉ PASO VA. Antes no se decía en ninguna parte: se pagaba y la
          pantalla quedaba igual, así que nadie sabía si había terminado. */}
      <PasosCompra
        actual={pasoActual(pedido.estado as EstadoDePedido)}
        terminado={estaPagado(pedido.estado as EstadoDePedido)}
      />

      {/**
       * EL AVISO DE ARRIBA, SEGÚN DÓNDE ESTÉ EL PEDIDO DE VERDAD.
       *
       * Estaba escrito fijo: decía «ahora falta el pago» aunque el pago ya
       * hubiera entrado. El dueño pagó $7.95 con tarjeta, Stripe lo confirmó,
       * y la pantalla le siguió pidiendo que pagara. Quien lee eso paga otra
       * vez o llama al banco — las dos cuestan dinero.
       */}
      <div
        className={cn(
          "mt-4 rounded-xl border p-5",
          aviso.tono === "verde" && "border-emerald-200 bg-emerald-50",
          aviso.tono === "ambar" && "border-amber-300 bg-amber-50",
          aviso.tono === "gris" && "border-borde bg-slate-50",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-lg font-bold",
            aviso.tono === "verde" && "text-emerald-900",
            aviso.tono === "ambar" && "text-amber-900",
          )}
        >
          {aviso.tono === "verde" ? (
            <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden />
          ) : (
            <Clock className="h-6 w-6 shrink-0" aria-hidden />
          )}
          {t(`avisos.${aviso.clave}`)}
        </p>
        <p
          className={cn(
            "mt-1 text-sm",
            aviso.tono === "verde" && "text-emerald-800",
            aviso.tono === "ambar" && "text-amber-800",
            aviso.tono === "gris" && "text-tinta-suave",
          )}
        >
          {t(`avisos.${aviso.clave}Texto`)}
        </p>
      </div>

      <header className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("titulo", { numero: pedido.numero })}
        </h1>
        {/* La etiqueta gris chiquita se queda SOLO para los estados que no son
            el pago: «enviado», «entregado». Que ya está pagado lo dice el
            aviso grande de arriba, que es donde se mira. */}
        {estaPagado(pedido.estado as EstadoDePedido) &&
        pedido.estado !== "pagado" ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
            {t(`estado.${pedido.estado}`)}
          </span>
        ) : null}
      </header>
      <p className="mt-1 text-xs text-tinta-suave">
        {fechaHora(pedido.creadoEn, idioma)}
      </p>

      {/* La factura existe solo cuando el pago está confirmado. Se pregunta en
          vez de suponerlo por el estado: si algún día la emisión falla, el
          enlace no puede llevar a un 404. */}
      {hayFactura ? (
        <Link
          href={`/factura/${pedido.numero}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline"
        >
          <FileText className="h-4 w-4" aria-hidden />
          {tf("verFactura")}
        </Link>
      ) : null}

      {/* Que se compro */}
      <section className="mt-6 rounded-xl border border-borde">
        <h2 className="border-b border-borde px-4 py-3 text-sm font-bold">
          {t("articulos")}
        </h2>
        <ul className="divide-y divide-borde">
          {renglones.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 px-4 py-3">
              <span className="min-w-0 text-sm">
                <span className="line-clamp-2">{r.titulo}</span>
                <span className="text-xs text-tinta-suave">
                  {r.cantidad} ×{" "}
                  {formatearPrecio(
                    r.precioUnitarioCentavos,
                    idioma,
                    pedido.moneda,
                  )}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatearPrecio(r.subtotalCentavos, idioma, pedido.moneda)}
              </span>
            </li>
          ))}
        </ul>
        {/* EL ENVÍO, EN SU PROPIO RENGLÓN (8 ago 2026).

            Sin esto el comprador veía un total más alto que la suma de los
            productos y no sabía por qué. Un cobro que no se explica es un
            reclamo. Solo se dibuja si de verdad hubo envío. */}
        {pedido.envioCentavos > 0 ? (
          <p className="flex justify-between border-t border-borde px-4 py-2 text-sm">
            <span className="text-tinta-suave">{te("lineaEnvio")}</span>
            <span className="tabular-nums">
              {formatearPrecio(pedido.envioCentavos, idioma, pedido.moneda)}
            </span>
          </p>
        ) : null}

        <p className="flex justify-between border-t border-borde px-4 py-3 text-base font-bold">
          <span>{t("total")}</span>
          <span className="tabular-nums">
            {formatearPrecio(pedido.totalCentavos, idioma, pedido.moneda)}
          </span>
        </p>
      </section>

      {/* CÓMO LO VA A RECIBIR. Es lo que más pregunta quien acaba de pagar, y
          hasta hoy no se lo decía ninguna pantalla. */}
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
        {/* ══ EL DESTINO DECIDE, NO EL COSTO (30 ago 2026) ══ Fuera de
            Venezuela SIEMPRE se despacha — y el envío va DENTRO del precio,
            así que «envioCentavos > 0» le decía «lo retiras en el local» a
            una compra de EE. UU. con la dirección de entrega debajo. La
            MT-000011 lo destapó. */}
        {pedido.envioCentavos > 0 ||
        destinoDeEnvio(pedido.paisDestino) !== null ? (
          <>
            <Truck
              className="mt-0.5 h-4 w-4 shrink-0 text-tinta-suave"
              aria-hidden
            />
            <span>{te("enPedidoEnvio")}</span>
          </>
        ) : (
          <>
            <Store
              className="mt-0.5 h-4 w-4 shrink-0 text-tinta-suave"
              aria-hidden
            />
            <span>{te("enPedidoRetiro")}</span>
          </>
        )}
      </p>

      {/* A donde va */}
      {direccion ? (
        <section className="mt-4 rounded-xl border border-borde p-4">
          <h2 className="text-sm font-bold">{t("entrega")}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {direccion.nombre}
            <br />
            {direccion.direccion}
            <br />
            {direccion.ciudad}, {direccion.pais}
            {direccion.referencia ? (
              <>
                <br />
                {direccion.referencia}
              </>
            ) : null}
            {pedido.telefonoContacto ? (
              <>
                <br />
                {pedido.telefonoContacto}
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      {/* Como pagar con TARJETA: el formulario embebido de Stripe. */}
      {pedido.estado === "pendiente_pago" && pedido.metodoPago === "stripe" ? (
        <section className="mt-6 rounded-xl border border-borde bg-white p-5">
          <h2 className="text-lg font-bold">{t("tarjeta.titulo")}</h2>
          <p className="mt-1 mb-4 text-sm text-tinta-suave">
            {t("tarjeta.texto")}
          </p>
          <PagoTarjeta numero={pedido.numero} />
        </section>
      ) : null}

      {/* Como pagar por Zelle */}
      {pedido.estado === "pendiente_pago" && pedido.metodoPago !== "stripe" ? (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-bold">{t("comoPagar")}</h2>
            <ol className="mt-3 space-y-2">
              {pasos.map((paso, indice) => (
                <li key={paso} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xs font-bold text-white">
                    {indice + 1}
                  </span>
                  <span>{paso}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5">
            <FichaDePago
              datos={datosDePago}
              monto={formatearPrecio(
                pedido.totalCentavos,
                idioma,
                pedido.moneda,
              )}
              numeroPedido={pedido.numero}
            />
          </div>

          <div className="mt-5">
            {pago && pago.estado === "pendiente" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  {t("subida.estado.pendiente")}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  {t("subida.estado.pendienteTexto")}
                </p>
                {pago.subidoEn ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    {t("subida.estado.subidoEl")}{" "}
                    {fechaHora(pago.subidoEn, idioma)}
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                {pago && pago.estado === "rechazado" ? (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <span className="font-semibold">
                      {t("subida.estado.rechazado")}:
                    </span>{" "}
                    {pago.motivoRechazo}
                  </p>
                ) : null}
                <FormularioComprobante numero={pedido.numero} />
              </>
            )}
          </div>
        </>
      ) : null}

      {/* Devolver. Solo tiene sentido con el pedido ya pagado: antes de eso lo
          que toca es cancelar, y ofrecer las dos cosas a la vez confunde. */}
      {estaPagado(pedido.estado) ? (
        <div className="mt-6">
          <Devolver pedidoId={pedido.id} yaHay={devolucion} />
        </div>
      ) : null}

      <div className="mt-6">
        <Link
          href="/catalogo"
          className="text-sm font-medium text-tinta-suave hover:text-riel-900"
        >
          ← {t("verPedidos")}
        </Link>
      </div>
    </div>
  );
}
