import { ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CerrarPedido } from "@/components/panel/cerrar-pedido";
import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { obtenerPedidoDelPanel } from "@/lib/pedidos/consultas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * La ficha de un pedido: a dónde va y cómo se cierra.
 *
 * Antes el panel enseñaba el pedido pero no la dirección, así que el comercio
 * tenía que llamar al cliente para preguntarle a dónde mandarlo — teniéndolo
 * guardado desde el día de la compra. Y no había forma de decir "ya lo
 * entregué": el pedido se quedaba en "pagado" para siempre.
 *
 * El orden de la pantalla es el orden del trabajo: primero a dónde va, luego
 * qué lleva, y al final el botón que lo cierra.
 */

const TONO: Record<string, string> = {
  pendiente_pago: "bg-amber-100 text-amber-900",
  pagado: "bg-emerald-100 text-emerald-900",
  preparando: "bg-blue-100 text-blue-900",
  enviado: "bg-blue-100 text-blue-900",
  entregado: "bg-emerald-100 text-emerald-900",
  cancelado: "bg-slate-200 text-slate-700",
  reembolsado: "bg-slate-200 text-slate-700",
};

/** La dirección, en el orden en que se escribe un sobre. */
const ORDEN_DIRECCION = [
  "nombre",
  "linea1",
  "linea2",
  "ciudad",
  "estado",
  "codigoPostal",
  "pais",
];

export default async function PaginaPedidoDelPanel({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}) {
  const { locale, numero } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const pedido = await obtenerPedidoDelPanel(numero);
  // Un comercio que no vendió nada en este pedido recibe 404, no un "no
  // puedes": así ni siquiera se le confirma que el pedido existe.
  if (!pedido) notFound();

  const t = await getTranslations("panel.pedido");
  const tp = await getTranslations("pedido");

  const dinero = (centavos: number) =>
    formatearPrecio(centavos, idioma, pedido.moneda);

  const direccion = pedido.entrega.direccion;
  const lineas = direccion
    ? ORDEN_DIRECCION.map((c) => direccion[c]).filter(Boolean)
    : [];

  const sinPagar = pedido.estado === "pendiente_pago";
  const cerrado =
    pedido.estado === "entregado" ||
    pedido.estado === "cancelado" ||
    pedido.estado === "reembolsado";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/panel/ordenes"
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("volver")}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            {pedido.numero}
          </h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              TONO[pedido.estado],
            )}
          >
            {tp(`estado.${pedido.estado}`)}
          </span>
          <span className="text-sm text-tinta-suave">
            {fechaCorta(pedido.creadoEn, idioma)}
          </span>
        </div>
      </div>

      {/* A DÓNDE VA. Lo primero, porque es lo que hace falta para trabajar. */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold">
          <MapPin className="h-4 w-4 text-carga-500" aria-hidden />
          {t("entrega")}
        </h2>

        {lineas.length > 0 ? (
          <address className="mt-3 text-sm not-italic">
            {lineas.map((linea, i) => (
              <span key={i} className="block">
                {linea}
              </span>
            ))}
          </address>
        ) : (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("sinDireccion")}
          </p>
        )}

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-tinta-suave">
              <User className="h-3.5 w-3.5" aria-hidden />
              {t("cliente")}
            </dt>
            <dd className="mt-0.5 text-sm">
              {pedido.cliente.nombre}
              <a
                href={`mailto:${pedido.cliente.correo}`}
                className="block truncate text-carga-600 hover:underline"
              >
                {pedido.cliente.correo}
              </a>
            </dd>
          </div>

          {pedido.entrega.telefono ? (
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-tinta-suave">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {t("telefono")}
              </dt>
              <dd className="mt-0.5 text-sm">
                <a
                  href={`tel:${pedido.entrega.telefono}`}
                  className="text-carga-600 hover:underline"
                >
                  {pedido.entrega.telefono}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        {pedido.entrega.notas ? (
          <div className="mt-4">
            <p className="text-xs text-tinta-suave">{t("notas")}</p>
            <p className="mt-0.5 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              {pedido.entrega.notas}
            </p>
          </div>
        ) : null}
      </section>

      {/* QUÉ LLEVA. */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 font-bold">
          {t("loQueLleva")}
        </h2>

        <ul className="divide-y divide-slate-100">
          {pedido.renglones.map((r) => (
            <li key={r.id} className="flex gap-4 px-5 py-3">
              <span className="w-8 shrink-0 text-sm text-tinta-suave tabular-nums">
                {r.cantidad}×
              </span>
              <span className="min-w-0 flex-1 text-sm">{r.titulo}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {dinero(r.subtotalCentavos)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-sm font-medium">
            {pedido.soloDeEsteComercio ? t("totalTuParte") : t("total")}
          </span>
          <span className="text-lg font-bold tabular-nums">
            {dinero(pedido.totalCentavos)}
          </span>
        </div>

        {pedido.soloDeEsteComercio ? (
          <p className="border-t border-slate-100 px-5 py-2 text-xs text-tinta-suave">
            {t("tuParte")}
          </p>
        ) : null}
      </section>

      {/* CERRARLO. */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {sinPagar ? (
          <p className="text-sm text-tinta-suave">{t("sinPagar")}</p>
        ) : cerrado ? (
          <p className="text-sm text-tinta-suave">{t("yaCerrado")}</p>
        ) : (
          <CerrarPedido numero={pedido.numero} estado={pedido.estado} />
        )}
      </section>
    </div>
  );
}
