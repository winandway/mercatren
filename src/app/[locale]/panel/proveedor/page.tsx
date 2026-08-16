import { Check, Truck } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { PedidosProveedor } from "@/components/panel/pedidos-proveedor";
import {
  listarComprasAlProveedor,
  ventasSinComprar,
} from "@/lib/cj/proveedor-acciones";
import { formatearPrecio, type Idioma } from "@/lib/dinero";

/**
 * PEDIDOS AL PROVEEDOR.
 *
 * La pantalla donde se cierra el círculo de una venta de Estados Unidos: el
 * pedido se crea solo en el proveedor con la dirección del comprador, y aquí
 * queda un botón para pagarlo con tarjeta — sin cargar billetera y sin esperar
 * los tres días de la transferencia.
 *
 * Es dinámica siempre: los enlaces de pago y lo pendiente cambian con cada
 * venta, y una versión guardada enseñaría una cola que ya no es.
 */
export const dynamic = "force-dynamic";

export default async function PaginaProveedor({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("panel.proveedor");
  const idioma = (await getLocale()) as Idioma;

  const [sinComprar, compras] = await Promise.all([
    ventasSinComprar(),
    listarComprasAlProveedor(),
  ]);

  const reglas = t.raw("reglas") as string[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Truck className="h-6 w-6 text-carga-500" aria-hidden />
          {t("titulo")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <PedidosProveedor
          /* El dinero se formatea AQUÍ, en el servidor y con el idioma de quien
             mira: formatear en dos sitios distintos es como se acaban viendo
             dos cifras distintas del mismo monto. */
          sinComprar={sinComprar.map((v) => ({
            id: v.id,
            numero: v.numero,
            montoTexto: formatearPrecio(v.totalCentavos, idioma),
          }))}
          compras={compras.map((c) => ({
            ...c,
            costoTexto:
              c.costoCentavos !== null
                ? formatearPrecio(c.costoCentavos, idioma)
                : null,
          }))}
        />
      </section>

      {/* Qué hace y qué no: sin esto, el botón de pagar parece un fallo de
          automatización en vez de la consecuencia de que el proveedor no
          pueda cobrar una tarjeta guardada. */}
      <section className="rounded-xl border border-borde bg-slate-50 p-4 sm:p-6">
        <h2 className="text-xs font-bold tracking-wide text-tinta-suave uppercase">
          {t("comoFunciona")}
        </h2>
        <ul className="mt-2 space-y-1.5">
          {reglas.map((regla) => (
            <li key={regla} className="flex gap-2 text-sm leading-snug">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-precio-600"
                aria-hidden
              />
              {regla}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
