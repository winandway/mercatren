"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { intentoParaCobro } from "@/lib/cobros/acciones";

/**
 * PAGAR UN COBRO QUE PIDIÓ UN COMERCIO DESDE SU SISTEMA.
 *
 * ══ POR QUÉ NO ES EL MISMO COMPONENTE DEL PEDIDO ══
 *
 * El del pedido exige sesión y trabaja contra un número de pedido nuestro.
 * Aquí lo que autoriza es el secreto del enlace, y quien paga puede no tener
 * cuenta ni querer tenerla: muchas veces es el hijo o el socio en Estados
 * Unidos a quien le reenviaron el correo.
 *
 * Lo que sí es idéntico es lo importante: **el número de la tarjeta nunca pasa
 * por nuestro servidor.** Va del navegador a Stripe directamente, con el
 * Payment Element. Nosotros solo abrimos el intento con el monto que dice la
 * base.
 */
export function PagarCobro({
  enlace,
  montoTexto,
}: {
  enlace: string;
  montoTexto: string;
}) {
  const t = useTranslations("cobro");
  const idioma = useLocale();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fallo, setFallo] = useState<"sin_configurar" | "otro" | null>(null);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    let vivo = true;
    void intentoParaCobro(enlace).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setStripePromise(loadStripe(r.clavePublica));
        setClientSecret(r.clientSecret);
      } else {
        setFallo(r.motivo === "sin_configurar" ? "sin_configurar" : "otro");
      }
    });
    return () => {
      vivo = false;
    };
  }, [enlace]);

  if (fallo) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t(fallo === "sin_configurar" ? "sinConfigurar" : "noSePudoAbrir")}
      </p>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <p className="flex items-center justify-center gap-2 py-6 text-sm text-tinta-suave">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("preparando")}
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: idioma === "en" ? "en" : "es",
        appearance: { theme: "stripe" },
      }}
    >
      <Formulario enlace={enlace} montoTexto={montoTexto} />
    </Elements>
  );
}

function Formulario({
  enlace,
  montoTexto,
}: {
  enlace: string;
  montoTexto: string;
}) {
  const t = useTranslations("cobro");
  const idioma = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (evento) => {
        evento.preventDefault();
        if (!stripe || !elements) return;

        setPagando(true);
        setError(null);

        const r = await stripe.confirmPayment({
          elements,
          confirmParams: {
            // De vuelta a este mismo enlace: al recargar se ve «pagado».
            return_url: `${window.location.origin}/${idioma}/cobro/${enlace}`,
          },
        });

        /* Solo se llega aquí si NO hubo redirección: algo falló con la
           tarjeta. Se devuelve el control para que pueda probar con otra. */
        setPagando(false);
        setError(r.error?.message ?? t("noSePudo"));
      }}
      className="space-y-4"
    >
      <PaymentElement />

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || pagando}
        className="boton-principal w-full gap-2 disabled:opacity-60"
      >
        {pagando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CreditCard className="h-4 w-4" aria-hidden />
        )}
        {pagando ? t("pagando") : t("pagar", { monto: montoTexto })}
      </button>

      <p className="text-center text-xs text-tinta-suave">{t("seguridad")}</p>
    </form>
  );
}
