"use client";

import { CheckCircle2, Loader2, TriangleAlert, Webhook } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Campo } from "@/components/ui/campo";
import {
  guardarAvisoDePagos,
  probarAvisoDePagos,
} from "@/lib/cobros/aviso-acciones";
import { cn } from "@/lib/utils";

/**
 * «AVÍSAME CUANDO ENTRE UN PAGO»: la dirección del sistema del comercio.
 *
 * El comercio hace su factura en su sistema, crea el cobro por enlace y quiere
 * enterarse solo cuando el cliente paga, sin estar preguntando cada minuto.
 *
 * ══ TRES COSAS QUE SE VEN AQUÍ ══
 *
 * 1. **El secreto de la firma se enseña una vez, al crearlo.** Es lo que su
 *    programador necesita para comprobar que el aviso viene de nosotros y no
 *    de cualquiera que adivinó su dirección.
 * 2. **El botón de probar manda un aviso de mentira ahí mismo**, y dice qué
 *    contestó. Sin eso, el comercio se entera de que su dirección está mal el
 *    día que pierde un pago.
 * 3. **El último error queda a la vista.** Un aviso que falla en silencio es
 *    peor que no tenerlo: el comercio cree que su sistema está al día.
 */
export function AvisoDePagos({
  url,
  activo,
  tieneSecreto,
  ultimoOk,
  ultimoError,
}: {
  url: string | null;
  activo: boolean;
  tieneSecreto: boolean;
  ultimoOk: string | null;
  ultimoError: string | null;
}) {
  const t = useTranslations("panel.avisoPagos");
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [secreto, setSecreto] = useState<string | null>(null);

  return (
    <form
      action={async (datos) => {
        setGuardando(true);
        setAviso(null);
        const r = await guardarAvisoDePagos(datos);
        setGuardando(false);
        setAviso({ ok: r.ok, texto: r.mensaje });
        if (r.ok && r.secreto) setSecreto(r.secreto);
      }}
      className="space-y-4"
    >
      <p className="flex items-start gap-2 text-sm leading-relaxed text-tinta-suave">
        <Webhook
          className="mt-0.5 h-4 w-4 shrink-0 text-carga-600"
          aria-hidden
        />
        {t("entradilla")}
      </p>

      <Campo
        tipo="sitioWeb"
        nombre="url"
        etiqueta={t("url")}
        ayuda={t("urlAyuda")}
        valorInicial={url ?? ""}
      />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={activo}
          className="h-4 w-4"
        />
        {t("activo")}
      </label>

      {secreto ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{t("secretoTitulo")}</p>
          <p className="mt-1">{t("secretoTexto")}</p>
          <code className="mt-2 block rounded bg-white px-3 py-2 font-mono text-xs break-all">
            {secreto}
          </code>
        </div>
      ) : tieneSecreto ? (
        <p className="text-xs text-tinta-suave">{t("secretoGuardado")}</p>
      ) : null}

      {aviso ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="boton-principal gap-2 disabled:opacity-50"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {t("guardar")}
        </button>
        {url ? (
          <button
            type="button"
            disabled={probando}
            onClick={async () => {
              setProbando(true);
              setAviso(null);
              const r = await probarAvisoDePagos();
              setProbando(false);
              setAviso({ ok: r.ok, texto: r.mensaje });
            }}
            className="rounded-lg border border-borde px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            {probando ? t("probando") : t("probar")}
          </button>
        ) : null}
      </div>

      {ultimoOk ? (
        <p className="flex items-center gap-1.5 text-xs text-precio-600">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {t("ultimoOk", { cuando: ultimoOk })}
        </p>
      ) : null}
      {ultimoError ? (
        <p className="flex items-start gap-1.5 text-xs text-red-700">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("ultimoError", { motivo: ultimoError })}
        </p>
      ) : null}
    </form>
  );
}
