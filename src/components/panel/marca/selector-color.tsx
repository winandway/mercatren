"use client";

import { Check, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { guardarColorDeBanner } from "@/lib/marca/acciones";
import { colorDeBannerDesdeLogo } from "@/lib/marca/color-de-imagen";
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
  logoUrl,
  inicial,
}: {
  tiendaId: string;
  nombre: string;
  logoUrl: string | null;
  inicial: string | null;
}) {
  const t = useTranslations("panel.colorBanner");
  const [elegido, setElegido] = useState<string | null>(inicial);
  const [pendiente, iniciar] = useTransition();

  const actual = colorDeBanner(elegido, nombre);
  const yaMiroElLogo = useRef(false);

  /**
   * EL COLOR SALE DEL LOGO, y esto es lo que arregla el problema de fondo.
   *
   * Antes el color se derivaba del NOMBRE, y era arbitrario: a una ferretería
   * con logo azul y rojo le tocó marrón. Un color que pelea con la marca del
   * comercio es peor que no tener color propio.
   *
   * Se mira EN EL NAVEGADOR, sobre un lienzo: no hace falta procesar imágenes
   * en el servidor ni instalar nada. El logo ya está descargado porque se está
   * viendo en la página.
   *
   * Corre solo UNA VEZ y solo si el comercio nunca eligió: quien ya escogió su
   * color no puede perderlo porque entró a otra cosa.
   */
  useEffect(() => {
    if (!logoUrl || elegido || yaMiroElLogo.current) return;
    yaMiroElLogo.current = true;

    const imagen = new Image();
    imagen.crossOrigin = "anonymous";
    imagen.onload = () => {
      try {
        const lado = 96; // suficiente para el color; más sería gastar de balde
        const lienzo = document.createElement("canvas");
        lienzo.width = lado;
        lienzo.height = lado;
        const pincel = lienzo.getContext("2d", { willReadFrequently: true });
        if (!pincel) return;

        pincel.drawImage(imagen, 0, 0, lado, lado);
        const datos = pincel.getImageData(0, 0, lado, lado).data;
        const delLogo = colorDeBannerDesdeLogo(datos);
        if (delLogo) elegir(delLogo.id);
      } catch {
        /* Un logo servido desde otro dominio sin permiso ensucia el lienzo y
           leerlo lanza. No pasa nada: se queda con el color derivado del
           nombre, que es lo que había antes. */
      }
    };
    imagen.src = logoUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl]);

  /** Vuelve a mirar el logo cuando el comercio lo pide a mano. */
  function tomarDelLogo() {
    if (!logoUrl) return;
    yaMiroElLogo.current = false;
    const imagen = new Image();
    imagen.crossOrigin = "anonymous";
    imagen.onload = () => {
      try {
        const lado = 96;
        const lienzo = document.createElement("canvas");
        lienzo.width = lado;
        lienzo.height = lado;
        const pincel = lienzo.getContext("2d", { willReadFrequently: true });
        if (!pincel) return;
        pincel.drawImage(imagen, 0, 0, lado, lado);
        const delLogo = colorDeBannerDesdeLogo(
          pincel.getImageData(0, 0, lado, lado).data,
        );
        if (delLogo) elegir(delLogo.id);
      } catch {
        /* Igual que arriba: si el lienzo no se puede leer, no pasa nada. */
      }
    };
    imagen.src = logoUrl;
  }

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

      {logoUrl ? (
        <button
          type="button"
          onClick={() => tomarDelLogo()}
          disabled={pendiente}
          className="mt-2 text-xs font-semibold text-carga-600 underline underline-offset-2 disabled:opacity-60"
        >
          {t("desdeLogo")}
        </button>
      ) : null}
    </section>
  );
}
