import { redirect } from "@/i18n/navigation";

/**
 * La dirección vieja de «Pagos Zelle».
 *
 * Zelle pasó a ser una pestaña dentro de Cobros, junto con la tarjeta y los
 * enlaces de cobro. Esta dirección se queda redirigiendo porque estuvo meses
 * en el menú: hay marcadores guardados y enlaces pasados por chat, y llevarlos
 * a un 404 es hacerle perder el tiempo a quien ya sabía dónde estaba.
 */
export default async function PaginaPagosZelleVieja({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/panel/cobros/zelle", locale });
}
