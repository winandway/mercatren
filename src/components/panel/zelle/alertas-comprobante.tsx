"use client";

import { ShieldAlert, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import type { Alerta } from "@/lib/zelle/alertas";
import { cn } from "@/lib/utils";

/**
 * LO QUE HAY QUE MIRAR DOS VECES ANTES DE APROBAR.
 *
 * Zelle no manda un cobro: manda una FOTO, y una foto se guarda, se reenvía y
 * se vuelve a subir. Hasta hoy el validador aprobaba sin que la pantalla le
 * dijera una sola cosa.
 *
 * ══ POR QUÉ HAY DOS TONOS Y NO UNO ══
 *
 * Si todo se pintara de rojo, el rojo dejaría de significar algo en la tercera
 * pantalla. Lo que BLOQUEA de verdad —un cobro que ya se acreditó— va aparte y
 * dice que el botón no va a funcionar; lo demás es contexto para decidir.
 *
 * El bloqueo real está en el servidor (`aprobarPago`). Esto es para que la
 * persona lo sepa ANTES de intentarlo, no para impedirlo: un aviso dibujado se
 * lo salta cualquiera.
 */
export function AlertasDelComprobante({ alertas }: { alertas: Alerta[] }) {
  const t = useTranslations("panel.zelle.alertas");
  const idioma = useLocale() as Idioma;

  if (alertas.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5">
      {alertas.map((a) => {
        const bloquea = a.gravedad === "bloquea";
        const Icono = bloquea ? ShieldAlert : TriangleAlert;

        /* Los montos viajan en centavos, como todo el dinero del proyecto.
           Se dan formato aquí, que es donde se sabe el idioma. */
        const datos = Object.fromEntries(
          Object.entries(a.datos ?? {}).map(([clave, valor]) =>
            typeof valor === "number" && clave.startsWith("del")
              ? [clave, formatearPrecio(valor, idioma)]
              : [clave, valor],
          ),
        );

        return (
          <li
            key={a.clave}
            className={cn(
              "flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs ring-1 ring-inset",
              bloquea
                ? "bg-red-50 font-semibold text-red-800 ring-red-200"
                : "bg-amber-50 text-amber-900 ring-amber-200",
            )}
          >
            <Icono className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {t(a.clave, datos)}
              {bloquea ? (
                <span className="mt-0.5 block font-normal">
                  {t("noSePuedeAprobar")}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
