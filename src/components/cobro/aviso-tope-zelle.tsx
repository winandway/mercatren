"use client";

import { HelpCircle, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * «ESTE MONTO NO SE PUEDE PAGAR POR ZELLE», DICHO ANTES DE INTENTARLO.
 *
 * ══ EL CASO QUE LO PIDIÓ (27 ago 2026) ══
 *
 * Un cobro de $2.774,04 se ofreció por Zelle. Quien pagaba entró, escribió el
 * monto y su banco se lo cortó en la pantalla del envío: «El límite de hoy para
 * este destinatario es de $1,000.00». Mandó los $500 que le dejaban, la factura
 * quedó a medias, y hubo que corregir el pago a mano.
 *
 * ══ POR QUÉ SE EXPLICA Y NO SE ESCONDE ══
 *
 * Quitar Zelle sin decir nada deja a alguien preguntándose por qué a él no se
 * lo ofrecen y a otro sí. Y el motivo **no es nuestro**: es el límite que le
 * pone SU banco a un destinatario nuevo. Decirlo con esas palabras convierte un
 * «no puedo» en un «ah, entonces uso la transferencia», que es la vía que sí
 * funciona para un monto así — y que además no cuesta comisión.
 *
 * ══ EL DETALLE VA DETRÁS DE UN SIGNO DE INTERROGACIÓN ══
 *
 * Lo pidió el dueño. La línea de arriba la lee todo el mundo; el porqué solo lo
 * quiere quien pregunta. Es un `<details>` del navegador: abre sin una línea de
 * JavaScript y lo lee un lector de pantalla.
 */
export function AvisoTopeZelle({
  topeTexto,
  hayTransferencia,
  urlDocumentacion,
}: {
  /** El tope ya formateado, p. ej. «$1,000.00». */
  topeTexto: string;
  /** ¿Se le está ofreciendo la transferencia como alternativa? */
  hayTransferencia: boolean;
  urlDocumentacion: string;
}) {
  const t = useTranslations("cobro.topeZelle");
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="flex items-start gap-2 text-sm font-bold text-amber-900">
        <Landmark className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{t("titulo", { tope: topeTexto })}</span>
        <button
          type="button"
          onClick={() => setAbierto((x) => !x)}
          aria-expanded={abierto}
          aria-label={t("porQue")}
          className="ml-auto shrink-0 rounded-full p-0.5 text-amber-700 hover:bg-amber-200"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
      </p>

      {hayTransferencia ? (
        <p className="mt-1.5 text-sm text-amber-900">{t("usaTransferencia")}</p>
      ) : (
        <p className="mt-1.5 text-sm text-amber-900">{t("usaTarjeta")}</p>
      )}

      {abierto ? (
        <div className="mt-3 space-y-2 border-t border-amber-300 pt-3 text-xs leading-relaxed text-amber-900">
          <p>{t("explicacion")}</p>
          {/* LO QUE DICE EL BANCO, ENTRECOMILLADO Y TAL CUAL.
              No es nuestra política: es la pantalla que ve quien paga. */}
          <blockquote className="border-l-2 border-amber-400 pl-3 italic">
            {t("loQueDiceElBanco")}
          </blockquote>
          <p>{t("esTemporal")}</p>
          <a
            href={urlDocumentacion}
            className="inline-block font-semibold underline"
          >
            {t("leerMas")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
