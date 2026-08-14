"use client";

import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { emitirTokenDeComercio } from "@/lib/socios/emitir";
import { cn } from "@/lib/utils";

/**
 * EL TOKEN CON EL QUE EL COMERCIO COBRA DESDE SU PROPIO SISTEMA.
 *
 * Con él, su cajera hace la factura de siempre, toca un botón en SU software, y
 * a su cliente le sale solo el correo con el enlace de pago de Mercatren.
 *
 * ══ SE ENSEÑA UNA SOLA VEZ, Y SE AVISA ANTES ══
 *
 * En la base solo queda el SHA-256. Cerrada esta pantalla, el token no se
 * recupera: se emite otro y el anterior deja de servir en ese momento. Por eso
 * el aviso va ARRIBA del botón y no en un cartel después de pulsarlo — quien lo
 * lee después ya cerró la única ventana que tenía.
 *
 * ══ NO SE MANDA POR CORREO NI SE GUARDA EN NINGÚN ARCHIVO ══
 *
 * Es la llave para cobrar a nombre del comercio. Va del portapapeles al panel
 * de su servidor y de ahí a ningún otro lado.
 */
export function TokenIntegracion({
  tiendaId,
  nombre,
}: {
  tiendaId: string;
  nombre: string;
}) {
  const t = useTranslations("panel.comercios.token");
  const [emitiendo, iniciar] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [copiado, setCopiado] = useState(false);

  function emitir() {
    /* La confirmación es del navegador a propósito: es una sola pregunta y no
       merece una pantalla propia. Lo que importa es que se pregunte, porque
       emitir de nuevo deja al comercio sin cobrar hasta que cargue el nuevo. */
    if (!window.confirm(t("confirmar", { comercio: nombre }))) return;

    iniciar(async () => {
      setAviso(null);
      setToken(null);
      setCopiado(false);

      const datos = new FormData();
      datos.set("tiendaId", tiendaId);

      try {
        const r = await emitirTokenDeComercio(datos);
        setAviso({ ok: r.ok, texto: r.mensaje });
        if (r.ok) setToken(r.token);
      } catch (fallo) {
        console.error("[socios] no se pudo emitir el token:", fallo);
        setAviso({ ok: false, texto: String(fallo) });
      }
    });
  }

  async function copiar() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopiado(true);
    } catch {
      /* Sin permiso del portapapeles se puede seleccionar a mano: el token
         está a la vista, no escondido detrás del botón. */
      setCopiado(false);
    }
  }

  return (
    <div className="mt-3 border-t border-borde pt-3">
      <button
        type="button"
        onClick={emitir}
        disabled={emitiendo}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        {emitiendo ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="h-3.5 w-3.5" aria-hidden />
        )}
        {t("boton")}
      </button>

      {aviso ? (
        <p
          role="status"
          className={cn(
            "mt-2 rounded-lg px-2.5 py-2 text-xs",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      {token ? (
        <div className="mt-2 rounded-lg bg-amber-50 p-2.5">
          <p className="text-xs font-semibold text-amber-900">{t("unaVez")}</p>
          <code className="mt-1.5 block rounded bg-white px-2 py-1.5 font-mono text-[11px] break-all text-tinta">
            {token}
          </code>
          <button
            type="button"
            onClick={copiar}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-riel-800"
          >
            {copiado ? (
              <Check className="h-3 w-3" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
            {copiado ? t("copiado") : t("copiar")}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-900">
            {t("dondeVa")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
