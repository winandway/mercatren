"use client";

import { Check, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { guardarColorDeBanner } from "@/lib/marca/acciones";
import { colorDeBanner, COLORES_BANNER } from "@/lib/marca/colores";
import { cn } from "@/lib/utils";

/**
 * EL COMERCIO ELIGE EL COLOR DE SU BANNER.
 *
 * ══ SE VE ANTES DE GUARDAR ══
 *
 * La vista previa de arriba cambia en cuanto toca un color. Sin eso tendría
 * que guardar, ir a su tienda, mirar, volver y repetir — y con ocho colores
 * eso son ocho viajes. Aquí lo ve y decide.
 *
 * ══ SE GUARDA AL TOCAR, SIN BOTÓN ══
 *
 * Es una decisión de un clic y reversible en otro clic. Un botón "guardar"
 * agrega un paso a algo que no lo necesita, y deja la puerta a que alguien
 * elija su color, se vaya, y no se guarde nada.
 */
export function SelectorColor({
  tiendaId,
  nombre,
  inicial,
}: {
  tiendaId: string;
  nombre: string;
  inicial: string | null;
}) {
  const t = useTranslations("panel.colorBanner");
  const [elegido, setElegido] = useState<string | null>(inicial);
  const [pendiente, iniciar] = useTransition();

  const actual = colorDeBanner(elegido, nombre);

  function elegir(id: string) {
    setElegido(id);
    iniciar(async () => {
      await guardarColorDeBanner(tiendaId, id);
    });
  }

  return (
    <section className="rounded-xl border border-borde bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Palette className="h-5 w-5" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 mb-4 text-sm text-tinta-suave">{t("entradilla")}</p>

      {/* La vista previa: el mismo banner que va a ver su comprador. */}
      <div
        className="rounded-xl px-5 py-6 transition-colors"
        style={{ backgroundColor: actual.hex }}
      >
        <p className="text-xl font-bold text-white">{nombre}</p>
        <p className="mt-1 text-xs text-white/60">{t("ejemplo")}</p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {COLORES_BANNER.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => elegir(color.id)}
            disabled={pendiente}
            aria-pressed={actual.id === color.id}
            aria-label={t(`colores.${color.id}`)}
            title={t(`colores.${color.id}`)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg transition-transform",
              actual.id === color.id
                ? "ring-2 ring-riel-900 ring-offset-2"
                : "hover:scale-105",
            )}
            style={{ backgroundColor: color.hex }}
          >
            {actual.id === color.id ? (
              <Check className="h-5 w-5 text-white" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-tinta-suave">
        {elegido ? t("guardadoSolo") : t("automatico")}
      </p>
    </section>
  );
}
