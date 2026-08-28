import { PackageCheck, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { destinoDeLaTienda, PLAZO } from "@/lib/destino/reglas";

/**
 * LA FRANJA DE ENTREGA DE CHILE Y COLOMBIA.
 *
 * ══ POR QUÉ NO ES EL BLOQUE DE EE. UU. ══
 *
 * Aquel lleva el mapa del almacén y los 50 estados: es de su país. Este dice
 * lo que un chileno o un colombiano necesita antes de comprar — que se entrega
 * a domicilio en TODO su país, que el precio que ve es el final (en Chile, con
 * el IVA dentro), y el plazo honesto de un envío internacional. Sin esta
 * franja, la ficha no decía cómo llega el producto, que es la primera pregunta
 * de cualquiera.
 *
 * El plazo sale de `PLAZO`, la misma tabla del resto del sitio: prometer aquí
 * un número distinto al del checkout es contradecirse en la misma compra.
 */
export async function EntregaDespacho({
  paisOrigen,
}: {
  paisOrigen: string | null | undefined;
}) {
  const destino = destinoDeLaTienda(paisOrigen);
  if (destino !== "CL" && destino !== "CO") return null;

  const t = await getTranslations("catalogo.producto.despacho");
  const plazo = PLAZO[destino];

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
      <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
        <Truck className="h-4.5 w-4.5 shrink-0" aria-hidden />
        {t(`titulo${destino}`)}
      </p>
      <p className="mt-1.5 text-sm text-emerald-900/90">
        {t(`texto${destino}`)}
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs text-emerald-900/80">
        <PackageCheck className="h-4 w-4 shrink-0" aria-hidden />
        {t("plazo", { minimo: plazo.minimo, maximo: plazo.maximo })}
      </p>
    </div>
  );
}
