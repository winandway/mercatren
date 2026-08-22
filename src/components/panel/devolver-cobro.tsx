"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { devolverCobro } from "@/lib/cobros/devolver";

/**
 * DEVOLVERLE EL DINERO A QUIEN PAGÓ UN COBRO.
 *
 * ══ VA DENTRO DE UN DESPLEGABLE, NO A LA VISTA ══
 *
 * Devolver es una acción que mueve dinero en sentido contrario y que no tiene
 * marcha atrás. Un botón rojo suelto al lado de cada cobro pagado es fácil de
 * tocar sin querer en un celular. Un paso más —abrir, escribir el motivo,
 * confirmar— es lo que separa «quise» de «se me fue el dedo».
 *
 * ══ EL MOTIVO ES OBLIGATORIO ══
 *
 * Una devolución sin explicación es un movimiento que nadie puede justificar
 * tres meses después, y la conciliación bancaria es exactamente lo que este
 * sistema existe para proteger.
 *
 * ══ SOLO TARJETA, Y SE DICE ══
 *
 * Un Zelle no se puede devolver desde aquí: el dinero está en una cuenta de
 * banco y volver a mandarlo es una transferencia nueva hecha por una persona.
 * El servidor lo rechaza con ese motivo, y el mensaje sale entero.
 */
export function DevolverCobro({
  cobroId,
  montoTexto,
}: {
  cobroId: string;
  montoTexto: string;
}) {
  const t = useTranslations("panel.devolverCobro");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(devolverCobro, null);

  /**
   * AL DEVOLVER BIEN, EL FORMULARIO SE CIERRA — Y SE AJUSTA DURANTE EL
   * RENDERIZADO, NO EN UN EFECTO.
   *
   * Un `setState` dentro de un efecto dispara un segundo renderizado en
   * cascada y se ve como un parpadeo; el lint lo rechaza con razón. Es la
   * misma regla que ya sigue el buscador del panel. Se guarda qué resultado
   * ya se atendió para cerrar una sola vez por devolución — sin esa guarda,
   * el formulario no se podría volver a abrir tras una devolución parcial.
   */
  const [okAtendido, setOkAtendido] = useState<unknown>(null);
  if (estado?.ok && estado !== okAtendido) {
    setOkAtendido(estado);
    setAbierto(false);
  }

  useEffect(() => {
    if (estado?.ok) router.refresh();
  }, [estado, router]);

  if (!abierto) {
    return (
      <div className="mt-3 border-t border-borde/60 pt-3">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-tinta-suave hover:text-red-800"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {t("boton")}
        </button>
        {estado?.ok ? (
          <p
            role="status"
            className="mt-1.5 text-xs font-medium text-precio-600"
          >
            {estado.mensaje}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={accion}
      className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs"
    >
      <input type="hidden" name="cobroId" value={cobroId} />
      <p className="font-semibold text-red-900">
        {t("titulo", { monto: montoTexto })}
      </p>
      <p className="mt-1 text-red-800">{t("aviso")}</p>

      <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_1fr]">
        <label className="block">
          <span className="text-red-900">{t("cuanto")}</span>
          <span className="relative mt-1 block">
            <span
              className="absolute top-1/2 left-2 -translate-y-1/2 text-tinta-suave"
              aria-hidden
            >
              $
            </span>
            <input
              name="monto"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t("todo")}
              className="h-8 w-full rounded-lg border border-borde bg-white py-2 pr-2 pl-5 text-base tabular-nums sm:text-xs"
            />
          </span>
        </label>
        <label className="block">
          <span className="text-red-900">{t("motivo")}</span>
          <input
            name="motivo"
            type="text"
            required
            minLength={4}
            maxLength={200}
            placeholder={t("motivoEjemplo")}
            className="mt-1 h-8 w-full rounded-lg border border-borde bg-white px-2 text-base sm:text-xs"
          />
        </label>
      </div>

      {estado && !estado.ok ? (
        <p role="status" className="mt-2 font-medium text-red-900">
          {estado.mensaje}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("confirmar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg border border-borde bg-white px-3 py-1.5 font-semibold"
        >
          {t("cancelar")}
        </button>
      </div>
    </form>
  );
}
