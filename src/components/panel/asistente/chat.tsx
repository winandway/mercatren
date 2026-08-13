"use client";

import {
  AlertTriangle,
  Bot,
  Loader2,
  RotateCcw,
  Send,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { RUTA_ASISTENTE } from "@/lib/rutas";
import {
  esperaConfirmacion,
  type RespuestaAgente,
} from "@/lib/asistente/sesion";
import { cn } from "@/lib/utils";

/**
 * EL CHAT CON EL AGENTE OPERATIVO.
 *
 * ══ NUNCA VE EL TOKEN ══
 *
 * Esto habla solo con `/datos/asistente`, una ruta de este mismo sitio. El
 * token del agente lo pega el servidor y no llega aquí ni en un error: quien
 * abra la consola del navegador no encuentra nada con qué hablarle al agente
 * por su cuenta.
 *
 * ══ LAS CONFIRMACIONES SE ESCRIBEN, NO SE PULSAN ══
 *
 * Cuando el agente se detiene por una confirmación es porque va a hacer algo
 * que no se deshace. Su propio texto dice qué hay que responder: a veces «sí»
 * y, si la acción es grave, el nombre exacto de lo que se va a tocar.
 *
 * Aquí **no hay ningún botón que mande esa respuesta**. Ponerlo convertiría la
 * barrera en un clic de más, que es justo lo que la barrera existe para
 * impedir. Lo único que se hace es marcar el mensaje para que se note que está
 * esperando, y dejar que la persona escriba.
 */

type Turno =
  | { de: "persona"; texto: string }
  | { de: "agente"; texto: string; datos?: RespuestaAgente }
  | { de: "fallo"; texto: string };

export function ChatAsistente() {
  const t = useTranslations("panel.asistente");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finDeLaLista = useRef<HTMLDivElement>(null);

  /* Al llegar un turno nuevo la conversación baja sola: si no, la respuesta
     aparece fuera de la pantalla y parece que no pasó nada. */
  useEffect(() => {
    finDeLaLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [turnos]);

  const ultimo = turnos[turnos.length - 1];
  const pendiente =
    ultimo?.de === "agente" && ultimo.datos
      ? esperaConfirmacion(ultimo.datos)
      : false;

  async function enviar() {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;

    setTurnos((v) => [...v, { de: "persona", texto: mensaje }]);
    setTexto("");
    setEnviando(true);

    try {
      const r = await fetch(RUTA_ASISTENTE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });

      const cuerpo = (await r.json().catch(() => ({}))) as RespuestaAgente & {
        motivo?: string;
        detalle?: string;
        esperaSegundos?: number;
      };

      if (!r.ok) {
        /* El motivo se traduce aquí y no se enseña el del servidor: sale en el
           idioma de quien mira, y de paso nada de lo que conteste el agente
           llega crudo a la pantalla. */
        const clave = cuerpo.motivo ?? "sin_respuesta";
        const texto =
          clave === "demasiadas_peticiones" && cuerpo.esperaSegundos
            ? t("errores.demasiadas_peticiones", {
                minutos: Math.ceil(cuerpo.esperaSegundos / 60),
              })
            : t(`errores.${clave}` as never);

        setTurnos((v) => [
          ...v,
          {
            de: "fallo",
            /* El detalle solo cuando el agente lo manda: en un 503 explica qué
               le falta configurar, y es lo único que permite arreglarlo. */
            texto: cuerpo.detalle ? `${texto} — ${cuerpo.detalle}` : texto,
          },
        ]);
        return;
      }

      setTurnos((v) => [
        ...v,
        { de: "agente", texto: cuerpo.respuesta, datos: cuerpo },
      ]);
    } catch {
      setTurnos((v) => [
        ...v,
        { de: "fallo", texto: t("errores.sin_respuesta") },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  async function reiniciar() {
    setEnviando(true);
    try {
      await fetch(RUTA_ASISTENTE, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reiniciar: true }),
      });
      setTurnos([]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-xl border border-borde bg-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-borde px-4 py-3">
        <Bot className="h-4 w-4 shrink-0 text-carga-500" aria-hidden />
        <h2 className="font-bold">{t("titulo")}</h2>
        <button
          type="button"
          onClick={reiniciar}
          disabled={enviando || turnos.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-borde px-2.5 py-1 text-xs font-semibold hover:border-carga-500 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {t("reiniciar")}
        </button>
      </header>

      <div className="max-h-[60vh] min-h-[16rem] space-y-3 overflow-y-auto p-4">
        {turnos.length === 0 ? (
          <p className="py-10 text-center text-sm text-tinta-suave">
            {t("vacio")}
          </p>
        ) : null}

        {turnos.map((turno, i) => (
          <Burbuja key={i} turno={turno} />
        ))}

        {enviando ? (
          <p className="flex items-center gap-2 text-sm text-tinta-suave">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("pensando")}
          </p>
        ) : null}

        <div ref={finDeLaLista} />
      </div>

      {/* ESPERANDO UNA CONFIRMACIÓN. Se avisa y se dice que hay que
          ESCRIBIRLA. Ni un botón que la mande por ella. */}
      {pendiente ? (
        <p className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("esperandoConfirmacion")}
        </p>
      ) : null}

      <form
        className="flex items-end gap-2 border-t border-borde p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            /* Enter manda, Mayús+Enter hace un salto de línea: es lo que
               espera cualquiera que haya usado un chat. */
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder={pendiente ? t("marcadorConfirmar") : t("marcador")}
          className="min-w-0 flex-1 resize-y rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          aria-label={t("enviar")}
          className="boton-principal shrink-0 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}

function Burbuja({ turno }: { turno: Turno }) {
  const t = useTranslations("panel.asistente");
  const mia = turno.de === "persona";

  return (
    <div className={cn("flex gap-2", mia && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          mia ? "bg-riel-900 text-white" : "bg-slate-100 text-tinta-suave",
        )}
      >
        {mia ? (
          <User className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Bot className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>

      <div
        className={cn(
          "max-w-[85%] min-w-0 rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
          turno.de === "fallo"
            ? "bg-red-50 text-red-800"
            : mia
              ? "bg-riel-900 text-white"
              : "bg-slate-50",
        )}
      >
        {turno.texto}

        {/* Qué consultó para contestar. Ayuda a saber si miró donde debía. */}
        {turno.de === "agente" && turno.datos?.tools_usadas?.length ? (
          <p className="mt-1.5 flex flex-wrap gap-1 border-t border-black/5 pt-1.5">
            {turno.datos.tools_usadas.map((x, i) => (
              <span
                key={`${x.nombre}-${i}`}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[12px] font-medium",
                  x.ok
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-red-100 text-red-900",
                )}
              >
                {x.nombre}
                {x.ok ? "" : ` · ${t("toolFallo")}`}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
