"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { comprobarElCobro } from "@/lib/stripe/conciliar";

/**
 * «Comprobar el cobro»: preguntarle a Stripe si ese pedido ya se pagó.
 *
 * ══ PARA QUÉ SIRVE DE VERDAD ══
 *
 * Cuando el aviso de Stripe no llega, el pedido se queda en «esperando el
 * pago» aunque el dinero haya entrado. El comprador lo destraba solo con abrir
 * su pedido, pero quien primero se entera suele ser el equipo —porque el
 * cliente escribe— y necesita poder resolverlo sin pedirle a nadie que entre a
 * ninguna pantalla.
 *
 * Solo aparece cuando hay algo que comprobar: un pedido pagado o de Zelle no
 * enseña este botón, porque pulsarlo no haría nada y solo generaría dudas.
 */
export function ComprobarCobro({ numero }: { numero: string }) {
  const t = useTranslations("panel.pedido");
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={trabajando}
        onClick={async () => {
          setTrabajando(true);
          setAviso(null);

          /* En su propio try: si la acción reventara, el botón tiene que
             quedar usable otra vez y no dejar la ficha colgada girando. */
          try {
            const r = await comprobarElCobro(numero);
            setAviso(r.mensaje);
            if (r.ok) router.refresh();
          } catch (fallo) {
            console.error("[cobro] no se pudo comprobar:", fallo);
            setAviso(t("noSePudoComprobar"));
          } finally {
            setTrabajando(false);
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-semibold transition-colors hover:border-carga-500 disabled:opacity-60"
      >
        {trabajando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden />
        )}
        {t("comprobarCobro")}
      </button>

      {aviso ? (
        <p role="status" className="mt-2 text-xs text-tinta-suave">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
