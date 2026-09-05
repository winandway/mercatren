import { FlaskConical } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProbarCompra } from "@/components/panel/cj/probar-compra";
import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { leerUltimaCompraDePrueba } from "@/lib/cj/probar-compra";

/**
 * PROBAR UNA COMPRA AL PROVEEDOR (5 sep 2026).
 *
 * Tres compras de prueba, tres fallos, y cada una costó un cobro real en
 * Stripe para descubrir que el circuito moría del lado del proveedor. Esta
 * pantalla repite ese tramo las veces que haga falta, sin cobrar — y con el
 * segundo botón, compra de verdad a CJ pagando del saldo.
 */
export const dynamic = "force-dynamic";

export default async function PaginaProbarCompra({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  /* Le habla al proveedor y gasta puntos de CJ: solo soporte de verdad, nunca
     con el disfraz de «ver su panel». */
  if (!(await esSoporteDeVerdad())) notFound();
  const t = await getTranslations("panel.probarCompra");
  const ultima = await leerUltimaCompraDePrueba();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FlaskConical className="h-6 w-6 text-carga-500" aria-hidden />
          {t("titulo")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      <ProbarCompra ultima={ultima} />
    </div>
  );
}
