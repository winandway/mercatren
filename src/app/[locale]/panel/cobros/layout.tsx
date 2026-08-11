import { getTranslations } from "next-intl/server";

import { PestanasCobros } from "@/components/panel/cobros/pestanas";

/**
 * COBROS: una sola sección para todo el dinero que entra.
 *
 * ══ POR QUÉ SE JUNTARON ══
 *
 * El menú tenía «Pagos Zelle» y nada más. La tarjeta —el método con el que
 * entró la primera venta real— no aparecía en ninguna parte: para revisar un
 * cobro había que abrir el pedido, uno por uno, o irse al panel de Stripe.
 *
 * Estaba organizado por MECANISMO y a medias. Aquí se organiza por trabajo:
 * el trabajo es «revisar los cobros», y las pestañas son de dónde vino cada
 * uno. Así, el día que entre un método nuevo, entra como pestaña y no como
 * otra sección suelta en el menú.
 */
export default async function DisenoCobros({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("panel.cobros");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      <PestanasCobros />

      {children}
    </div>
  );
}
