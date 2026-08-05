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

import { crearIntentoDePago } from "@/lib/stripe/acciones";

/**
 * El pago con tarjeta, embebido en la página del pedido.
 *
 * El formulario de la tarjeta es de Stripe de punta a punta (Payment
 * Element): el número de tarjeta NUNCA pasa por nuestro servidor — viaja del
 * navegador a Stripe directamente. Nosotros solo creamos el intento con el
 * monto que dice la base y esperamos el aviso firmado del webhook.
 *
 * LA PANTALLA NO ACREDITA NADA. Al confirmar, Stripe redirige de vuelta a la
 * página del pedido; la acreditación la hace el webhook, que es el único al
 * que se le cree. Si el cliente vuelve antes de que el aviso llegue, ve
 * "procesando" y la página se lo confirma al recargar.
 */
export function PagoTarjeta({ numero }: { numero: string }) {
  const t = useTranslations("pedido.tarjeta");
  const idioma = useLocale();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sinConfigurar, setSinConfigurar] = useState(false);
  const [error, setError] = useState(false);
  // La promesa de Stripe vive en estado: se crea una vez, cuando llega la
  // clave publicable, y el render la lee sin tocar refs.
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    let vivo = true;
    void crearIntentoDePago(numero).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setStripePromise(loadStripe(r.clavePublica));
        setClientSecret(r.clientSecret);
      } else if (r.sinConfigurar) {
        setSinConfigurar(true);
      } else {
        setError(true);
      }
    });
    return () => {
      vivo = false;
    };
  }, [numero]);

  if (sinConfigurar) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("sinConfigurar")}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {t("noSePudo")}
      </p>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-tinta-suave">
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
        appearance: {
          variables: {
            colorPrimary: "#FF6B1A",
            colorText: "#10263A",
            borderRadius: "8px",
          },
        },
      }}
    >
      <FormularioTarjeta numero={numero} />
    </Elements>
  );
}

function FormularioTarjeta({ numero }: { numero: string }) {
  const t = useTranslations("pedido.tarjeta");
  const idioma = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [pagando, setPagando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  async function pagar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!stripe || !elements) return;

    setPagando(true);
    setFallo(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // De vuelta a esta misma página: el webhook acredita y aquí se ve.
        return_url: `${window.location.origin}/${idioma}/pedido/${numero}`,
      },
    });

    // Solo se llega aquí si NO hubo redirección: algo falló en la tarjeta.
    setPagando(false);
    setFallo(error?.message ?? t("noSePudo"));
  }

  return (
    <form onSubmit={pagar} className="space-y-4">
      <PaymentElement />

      {fallo ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {fallo}
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
        {pagando ? t("pagando") : t("pagar")}
      </button>

      <p className="text-center text-xs text-tinta-suave">{t("seguridad")}</p>
    </form>
  );
}
