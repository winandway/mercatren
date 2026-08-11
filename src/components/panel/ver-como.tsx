"use client";

import { Eye, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  dejarDeVerComoComercio,
  verComoComercio,
} from "@/lib/soporte/acciones";

/**
 * «VER COMO ESTE COMERCIO»: el selector y la franja.
 *
 * ══ POR QUÉ LA FRANJA ES PERMANENTE Y GRANDE ══
 *
 * Porque lo peligroso de este modo no es entrar: es **olvidar que estás
 * dentro**. Quien mira una billetera con $24.283 y cree que es la suya toma
 * decisiones sobre datos que no son los que piensa. La franja no se puede
 * cerrar ni minimizar: se sale del modo o se queda ahí.
 *
 * ══ Y POR QUÉ NO PARECE UN AVISO BONITO ══
 *
 * A propósito. Un recuadro suave se vuelve invisible en diez minutos. Este
 * tiene que estorbar un poco.
 */
export function FranjaVerComo({ nombre }: { nombre: string }) {
  const t = useTranslations("panel.verComo");
  const [saliendo, setSaliendo] = useState(false);

  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        {t("estasViendo", { comercio: nombre })}
        <span className="hidden font-normal sm:inline">· {t("soloVer")}</span>
      </span>

      <button
        type="button"
        disabled={saliendo}
        onClick={async () => {
          setSaliendo(true);
          await dejarDeVerComoComercio();
          /* Carga completa, no navegación de cliente: el menú lateral y los
             números de arriba se arman en el servidor, y con una navegación
             suave se quedarían enseñando lo del comercio. */
          window.location.reload();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1 text-xs font-bold text-amber-50 disabled:opacity-60"
      >
        {saliendo ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <X className="h-3.5 w-3.5" aria-hidden />
        )}
        {t("salir")}
      </button>
    </div>
  );
}

/** El selector, en la lista de comercios del panel. */
export function BotonVerComo({
  tiendaId,
  nombre,
}: {
  tiendaId: string;
  nombre: string;
}) {
  const t = useTranslations("panel.verComo");
  const [entrando, setEntrando] = useState(false);

  return (
    <button
      type="button"
      disabled={entrando}
      onClick={async () => {
        setEntrando(true);
        const r = await verComoComercio(tiendaId);
        if (r.ok) {
          window.location.href = "/es/panel";
          return;
        }
        setEntrando(false);
      }}
      title={t("entrarAyuda", { comercio: nombre })}
      className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-carga-500 disabled:opacity-60"
    >
      {entrando ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Eye className="h-3.5 w-3.5" aria-hidden />
      )}
      {t("entrar")}
    </button>
  );
}
