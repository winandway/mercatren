"use client";

import { CreditCard, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PagarCobro } from "@/components/cobro/pagar-cobro";
import { PagarConZelle } from "@/components/cobro/pagar-con-zelle";
import { cn } from "@/lib/utils";

/**
 * EL SELECTOR DE MÉTODO DEL ENLACE DE COBRO.
 *
 * Solo existe cuando hay DOS métodos: si a la tienda no le dieron Zelle —o el
 * monto no llega al mínimo, o falta el receptor— la página va directo a la
 * tarjeta, sin un selector de una sola opción, que es un mueble.
 *
 * La tarjeta va primero y preseleccionada: se confirma sola, sin trabajo de
 * validación. Zelle queda a un toque, con su tiempo dicho de frente — quien
 * elige sabiendo que lo confirma una persona no escribe a la hora preguntando
 * por qué su factura sigue sin pagar.
 */
export function MetodosDeCobro({
  enlace,
  montoTexto,
  zelle,
}: {
  enlace: string;
  montoTexto: string;
  zelle: {
    receptor: string;
    concepto: string;
    nombreReceptor: string | null;
  } | null;
}) {
  const t = useTranslations("cobro");
  const [metodo, setMetodo] = useState<"tarjeta" | "zelle">("tarjeta");

  if (!zelle) {
    return <PagarCobro enlace={enlace} montoTexto={montoTexto} />;
  }

  return (
    <div>
      <p className="text-sm font-semibold">{t("metodoTitulo")}</p>

      <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
        {[
          {
            clave: "tarjeta" as const,
            titulo: t("metodoTarjeta"),
            detalle: t("metodoTarjetaDetalle"),
            Icono: CreditCard,
          },
          {
            clave: "zelle" as const,
            titulo: t("metodoZelle"),
            detalle: t("metodoZelleDetalle"),
            Icono: Landmark,
          },
        ].map(({ clave, titulo, detalle, Icono }) => (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={metodo === clave}
            onClick={() => setMetodo(clave)}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              metodo === clave
                ? "border-carga-500 bg-carga-500/5 ring-2 ring-carga-500/30"
                : "border-borde hover:border-carga-500/50",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Icono className="h-4 w-4 text-carga-500" aria-hidden />
              {titulo}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-tinta-suave">
              {detalle}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {metodo === "tarjeta" ? (
          <PagarCobro enlace={enlace} montoTexto={montoTexto} />
        ) : (
          <PagarConZelle
            enlace={enlace}
            receptor={zelle.receptor}
            nombreReceptor={zelle.nombreReceptor}
            concepto={zelle.concepto}
            montoTexto={montoTexto}
          />
        )}
      </div>
    </div>
  );
}
