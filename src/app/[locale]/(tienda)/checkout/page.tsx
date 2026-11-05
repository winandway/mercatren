import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioCheckout } from "@/components/carrito/formulario-checkout";
import { obtenerUsuario } from "@/lib/autorizacion";
import { mercadoActual } from "@/lib/mercado/actual";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("titulo"), robots: { index: false, follow: false } };
}

export default async function PaginaCheckout({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  // Para comprar hace falta cuenta: el pago hay que poder acreditarlo a
  // alguien, y el cliente tiene que poder seguir su pedido despues.
  const usuario = await obtenerUsuario();
  /* En España el botón tiene que decir sin dudas que se paga (ley de
     consumidores, art. 98.2): «Confirmar pedido» no lo dice. */
  const botonConPago = (await mercadoActual()).codigo === "ES";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("titulo")}</h1>
      <FormularioCheckout
        haySesion={Boolean(usuario)}
        botonConPago={botonConPago}
      />
    </div>
  );
}
