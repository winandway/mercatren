"use client";

import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { Campo } from "@/components/ui/campo";
import { adjuntarFacturaDeCompra } from "@/lib/facturas/acciones";

/**
 * El comercio sube su factura contra una orden de compra.
 *
 * ARRANCA CERRADO Y SE ABRE AL TOCARLO. Con el formulario desplegado en cada
 * fila, una lista de treinta órdenes se vuelve ilegible. Y no es lo que se
 * hace de continuo: se sube una vez por orden y no se vuelve.
 *
 * EL AVISO DE ERROR SALE DEL SERVIDOR, no se adivina aquí. Los motivos por los
 * que esto puede fallar —la orden ya tiene factura, el archivo no es un PDF ni
 * una imagen, pesa demasiado— los sabe el servidor, que es el que decide.
 */
export function AdjuntarFactura({ ordenId }: { ordenId: string }) {
  const t = useTranslations("panel.ordenesCompra");
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, pendiente] = useActionState(
    adjuntarFacturaDeCompra,
    null,
  );

  if (estado?.ok) {
    /* Al guardar, la fila se vuelve a pintar desde el servidor con la factura
       ya puesta. Este mensaje es el puente hasta que eso llegue. */
    return (
      <p className="text-xs font-medium text-emerald-700">✓ {t("enviar")}</p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        {t("adjuntar")}
      </button>
    );
  }

  return (
    <form action={accion} className="space-y-2.5">
      <input type="hidden" name="ordenId" value={ordenId} />

      <Campo
        tipo="alfanumerico"
        nombre="numero"
        etiqueta={t("numeroFactura")}
        requerido
      />

      <label className="block text-xs font-medium">
        <span className="mb-1 block">{t("archivo")}</span>
        <input
          type="file"
          name="archivo"
          required
          accept="application/pdf,image/*"
          className="block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-riel-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
      </label>

      {estado && !estado.ok ? (
        <p role="alert" className="text-xs text-red-700">
          {estado.mensaje}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente}
        className="boton-principal w-full py-1.5 text-xs disabled:opacity-60"
      >
        {pendiente ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
            {t("enviando")}
          </>
        ) : (
          t("enviar")
        )}
      </button>
    </form>
  );
}
