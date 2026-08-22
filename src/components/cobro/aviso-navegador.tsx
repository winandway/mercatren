"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * «ÁBRELO EN TU NAVEGADOR PARA PAGAR CON TU BANCO».
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * Cuando el enlace se abre desde WhatsApp, la página va dentro de un navegador
 * de mentira que trae la propia app. Ahí **el pago con la cuenta del banco
 * desaparece**: identificarse con el banco obliga a abrir una ventana suya, y
 * eso un navegador metido dentro de una app no lo puede hacer.
 *
 * Sin este aviso, quien paga ve una lista de métodos más corta y no sabe que le
 * falta uno. El comercio tampoco: desde su lado la página se ve completa.
 *
 * ══ NO SE PUEDE ABRIR SOLO, ASÍ QUE SE COPIA ══
 *
 * Ninguna página puede sacarse a sí misma de un webview — lo decide la app. Lo
 * único que sirve de verdad es dejar el enlace copiado de un toque, para
 * pegarlo en Chrome o Safari.
 *
 * ══ Y NO TAPA LA TARJETA ══
 *
 * La tarjeta funciona perfectamente aquí dentro. Esto es un aviso, no un muro:
 * quien iba a pagar con tarjeta sigue a un toque de hacerlo.
 */
export function AvisoNavegador({
  url,
  app,
}: {
  url: string;
  app: string | null;
}) {
  const t = useTranslations("cobro");
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
      <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {app ? t("appTitulo", { app }) : t("appTituloGenerico")}
      </p>
      <p className="mt-1 text-xs leading-snug text-amber-900">
        {t("appDetalle")}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2 py-2 font-mono text-xs">
          {url}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              /* Sin permiso de portapapeles no se puede copiar por código. No
                 se deja al usuario sin salida: la dirección está a la vista y
                 se puede seleccionar a mano. */
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-2.5 py-2 text-xs font-semibold text-amber-900"
        >
          {copiado ? (
            <>
              <Check className="h-3.5 w-3.5 text-precio-600" aria-hidden />
              {t("appCopiado")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {t("appCopiar")}
            </>
          )}
        </button>
      </div>

      {/* La tarjeta SÍ funciona aquí dentro: se dice, o el aviso se lee como
          «no puedes pagar» y la persona cierra la página. */}
      <p className="mt-2 text-xs text-amber-800">{t("appTarjetaSirve")}</p>
    </div>
  );
}
