"use client";

import {
  AlertTriangle,
  Bot,
  ImagePlus,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { comprimirImagen } from "@/lib/imagenes/comprimir";
import { RUTA_ASISTENTE } from "@/lib/rutas";
import {
  esperaConfirmacion,
  type RespuestaAgente,
} from "@/lib/asistente/sesion";
import { cn } from "@/lib/utils";

/**
 * EL ASISTENTE, COMO BURBUJA QUE ACOMPAÑA A TODO EL PANEL.
 *
 * ══ POR QUÉ NO ES UNA SECCIÓN DEL MENÚ ══
 *
 * Lo era, y le quitaba el sitio al tablero, que es lo primero que hay que ver
 * al entrar. Palabras del dueño: *«no podemos quitarle la vida al tablero»*. Y
 * además una pregunta al asistente casi nunca nace en su propia pantalla: nace
 * mirando un pedido, un retiro o un comercio. Obligar a irse a otra sección
 * para preguntar es perder justo el contexto que motivó la pregunta.
 *
 * Ahora vive encima de todo el panel: se abre donde estés, y al cerrarlo
 * vuelves a lo que estabas mirando sin haber navegado a ningún lado.
 *
 * ══ LAS CONFIRMACIONES SE ESCRIBEN, NO SE PULSAN ══
 *
 * Cuando el agente se detiene por una confirmación va a hacer algo que no se
 * deshace, y su texto dice qué hay que responder — a veces «sí», y si es grave,
 * el nombre exacto de lo que se va a tocar. **Aquí no hay ningún botón que
 * mande esa respuesta.** Ponerlo convertiría la barrera en un clic de más, que
 * es justo lo que existe para impedir.
 *
 * ══ NUNCA VE EL TOKEN ══
 *
 * Habla solo con `/datos/asistente`, de este mismo sitio. El token lo pega el
 * servidor y no llega aquí ni dentro de un error.
 */

type Turno =
  | { de: "persona"; texto: string; imagen?: string }
  | { de: "agente"; texto: string; datos?: RespuestaAgente }
  | { de: "fallo"; texto: string };

/**
 * Lo que el navegador ofrece para dictar. No está en todos, y sus tipos no
 * vienen en la biblioteca estándar: se declara lo poco que se usa en vez de
 * arrastrar una dependencia entera por cuatro campos.
 */
type ResultadoDictado = {
  isFinal: boolean;
  0?: { transcript: string };
};

type EventoDictado = {
  resultIndex: number;
  results: { length: number } & Record<number, ResultadoDictado | undefined>;
};

type Dictado = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: EventoDictado) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function BurbujaAsistente({ idioma }: { idioma: string }) {
  const t = useTranslations("panel.asistente");

  const [abierto, setAbierto] = useState(false);
  const [grande, setGrande] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [dictando, setDictando] = useState(false);
  const [puedeDictar, setPuedeDictar] = useState(false);

  const finDeLaLista = useRef<HTMLDivElement>(null);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const dictado = useRef<Dictado | null>(null);
  const cajaDeTexto = useRef<HTMLTextAreaElement>(null);

  /* La conversación baja sola: si no, la respuesta aparece fuera de la vista y
     parece que no pasó nada. */
  useEffect(() => {
    if (abierto) finDeLaLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [turnos, abierto]);

  /**
   * EL DICTADO SE PREPARA AL MONTAR, Y SI EL NAVEGADOR NO PUEDE, NO SE DIBUJA.
   *
   * Un botón de micrófono que no hace nada al tocarlo es peor que no tenerlo:
   * quien lo pulsa cree que está grabando y habla para nada. Safari en iPhone y
   * Chrome lo traen; Firefox todavía no.
   */
  useEffect(() => {
    const Motor =
      (window as unknown as { SpeechRecognition?: new () => Dictado })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => Dictado })
        .webkitSpeechRecognition;

    if (!Motor) return;

    const motor = new Motor();
    motor.lang = idioma === "en" ? "en-US" : "es-419";
    /* Se queda escuchando hasta que se toca otra vez el botón: dictar un
       párrafo entero con pausas es lo normal, y cortarse en cada silencio
       obliga a volver a pulsar cinco veces. */
    motor.continuous = true;
    motor.interimResults = false;

    motor.onresult = (evento) => {
      let nuevo = "";
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const r = evento.results[i];
        if (r?.isFinal) nuevo += r[0]?.transcript ?? "";
      }
      if (!nuevo) return;
      /* Se AÑADE a lo que ya había: se puede escribir un poco, dictar el
         resto, y seguir escribiendo. */
      setTexto((v) => (v ? `${v} ${nuevo.trim()}` : nuevo.trim()));
    };

    motor.onerror = () => setDictando(false);
    motor.onend = () => setDictando(false);

    dictado.current = motor;
    /* Fuera del cuerpo del efecto, como en el resto del panel: primero queda
       el motor listo, después se dibuja el botón. */
    queueMicrotask(() => setPuedeDictar(true));

    return () => {
      motor.onresult = null;
      motor.onerror = null;
      motor.onend = null;
      motor.abort();
    };
  }, [idioma]);

  function alternarDictado() {
    const motor = dictado.current;
    if (!motor) return;

    if (dictando) {
      motor.stop();
      setDictando(false);
      return;
    }

    try {
      motor.start();
      setDictando(true);
      cajaDeTexto.current?.focus();
    } catch {
      /* Ya estaba escuchando, o el permiso del micrófono está denegado. */
      setDictando(false);
    }
  }

  const ultimo = turnos[turnos.length - 1];
  const pendiente =
    ultimo?.de === "agente" && ultimo.datos
      ? esperaConfirmacion(ultimo.datos)
      : false;

  function traducirFallo(cuerpo: {
    motivo?: string;
    detalle?: string;
    esperaSegundos?: number;
  }) {
    const clave = cuerpo.motivo ?? "sin_respuesta";
    const base =
      clave === "demasiadas_peticiones" && cuerpo.esperaSegundos
        ? t("errores.demasiadas_peticiones", {
            minutos: Math.ceil(cuerpo.esperaSegundos / 60),
          })
        : t(`errores.${clave}` as never);
    /* El detalle solo cuando el agente lo manda: en un 503 explica qué le
       falta configurar, y es lo único que permite arreglarlo. */
    return cuerpo.detalle ? `${base} — ${cuerpo.detalle}` : base;
  }

  async function enviar(mensaje: string, imagen?: string) {
    if (!mensaje.trim() || enviando) return;

    setTurnos((v) => [...v, { de: "persona", texto: mensaje, imagen }]);
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

      setTurnos((v) => [
        ...v,
        r.ok
          ? { de: "agente", texto: cuerpo.respuesta, datos: cuerpo }
          : { de: "fallo", texto: traducirFallo(cuerpo) },
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

  /**
   * UNA IMAGEN: se guarda en nuestro almacenamiento y al agente le viaja su
   * dirección dentro del mensaje, porque su API recibe texto.
   *
   * Se encoge en el navegador antes de subirla, igual que las fotos de los
   * productos: una captura de un teléfono son varios megas, y con la conexión
   * de Venezuela eso es medio minuto de espera mirando una rueda.
   */
  async function mandarImagen(archivo: File) {
    setSubiendo(true);
    try {
      let aSubir = archivo;
      try {
        const { archivo: encogida } = await comprimirImagen(archivo);
        aSubir = encogida;
      } catch {
        /* Si no se pudo, va la original: subir lento es mejor que no subir. */
      }

      const datos = new FormData();
      datos.set("imagen", aSubir);

      const r = await fetch(`${RUTA_ASISTENTE}/imagen`, {
        method: "POST",
        body: datos,
      });
      const cuerpo = (await r.json().catch(() => ({}))) as {
        url?: string;
        motivo?: string;
      };

      if (!r.ok || !cuerpo.url) {
        setTurnos((v) => [
          ...v,
          { de: "fallo", texto: cuerpo.motivo ?? t("errores.sin_respuesta") },
        ]);
        return;
      }

      /* Lo que la persona haya escrito acompaña a la imagen: casi siempre la
         pregunta es «¿qué ves aquí?» y sin ella el agente no sabe qué mirar. */
      const acompaña = texto.trim();
      await enviar(
        acompaña
          ? `${acompaña}\n\n${t("imagenAdjunta")}: ${cuerpo.url}`
          : `${t("imagenAdjunta")}: ${cuerpo.url}`,
        cuerpo.url,
      );
    } finally {
      setSubiendo(false);
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

  /* ── El botón, cuando está cerrado ────────────────────────────────────── */
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={t("abrir")}
        title={t("titulo")}
        /**
         * ══ UN CÍRCULO, NO UNA PASTILLA CON EL NOMBRE ══
         *
         * Era una pastilla de más de 200 px de ancho con el texto «Asistente de
         * operación», flotando fija sobre la esquina de abajo a la derecha — que
         * es exactamente donde vive la columna de acciones de todos los
         * listados del panel. Tapaba el menú de tres puntos de la última fila y
         * **no dejaba pulsarlo**: no era que se viera mal, era que no
         * funcionaba.
         *
         * El nombre no aporta nada ahí: quien administra el panel aprende en un
         * día qué hace ese botón, y al pasar el ratón se lee igual. Lo que sí
         * costaba era el ancho. Con el círculo tapa una cuarta parte, y el
         * hueco que reserva el layout al final se encarga del resto.
         */
        className="fixed right-4 bottom-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-riel-900 text-white shadow-lg transition-transform hover:scale-105 hover:bg-riel-800 sm:right-6 sm:bottom-6"
      >
        <Sparkles className="h-5 w-5 text-carga-400" aria-hidden />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-riel-800 bg-white shadow-2xl",
        grande
          ? /* En grande ocupa la pantalla con un margen, para leer un listado
               largo sin que la burbuja lo estruje. */
            "inset-3 sm:inset-8"
          : "inset-x-3 bottom-3 max-h-[75vh] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[26rem]",
      )}
    >
      <header className="flex shrink-0 items-center gap-2 bg-riel-900 px-3 py-2.5 text-white">
        <Sparkles className="h-4 w-4 shrink-0 text-carga-400" aria-hidden />
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold">
          {t("titulo")}
        </h2>

        <BotonDeBarra
          onClick={reiniciar}
          disabled={enviando || turnos.length === 0}
          etiqueta={t("reiniciar")}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </BotonDeBarra>

        <BotonDeBarra
          onClick={() => setGrande((v) => !v)}
          etiqueta={grande ? t("achicar") : t("agrandar")}
        >
          {grande ? (
            <Minimize2 className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden />
          )}
        </BotonDeBarra>

        <BotonDeBarra onClick={() => setAbierto(false)} etiqueta={t("cerrar")}>
          <X className="h-4 w-4" aria-hidden />
        </BotonDeBarra>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {turnos.length === 0 ? (
          <div className="py-8 text-center">
            <Bot className="mx-auto h-8 w-8 text-tinta-suave/40" aria-hidden />
            <p className="mt-2 text-sm text-tinta-suave">{t("vacio")}</p>
          </div>
        ) : null}

        {turnos.map((turno, i) => (
          <Burbuja key={i} turno={turno} />
        ))}

        {enviando || subiendo ? (
          <p className="flex items-center gap-2 text-sm text-tinta-suave">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {subiendo ? t("subiendoImagen") : t("pensando")}
          </p>
        ) : null}

        <div ref={finDeLaLista} />
      </div>

      {pendiente ? (
        <p className="mx-3 mb-2 flex shrink-0 items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("esperandoConfirmacion")}
        </p>
      ) : null}

      <form
        className="shrink-0 border-t border-borde p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
      >
        <textarea
          ref={cajaDeTexto}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar(texto);
            }
          }}
          rows={grande ? 3 : 2}
          maxLength={4000}
          placeholder={pendiente ? t("marcadorConfirmar") : t("marcador")}
          className="w-full resize-none rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500"
        />

        <div className="mt-2 flex items-center gap-1.5">
          <BotonDeCaja
            onClick={() => entradaFoto.current?.click()}
            disabled={subiendo || enviando}
            etiqueta={t("mandarImagen")}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
          </BotonDeCaja>

          {/* Solo si el navegador sabe dictar: un micrófono que no graba hace
              que alguien hable para nada. */}
          {puedeDictar ? (
            <BotonDeCaja
              onClick={alternarDictado}
              etiqueta={dictando ? t("dejarDeDictar") : t("dictar")}
              encendido={dictando}
            >
              <Mic className="h-4 w-4" aria-hidden />
            </BotonDeCaja>
          ) : null}

          {dictando ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
              {t("escuchando")}
            </span>
          ) : null}

          <button
            type="submit"
            disabled={enviando || subiendo || !texto.trim()}
            aria-label={t("enviar")}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-carga-500 text-riel-950 transition-colors hover:bg-carga-600 disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <input
          ref={entradaFoto}
          type="file"
          /* `image/*` y no una lista cerrada: la lista deja fuera el HEIC del
             iPhone y el carrete se ve en gris sin decir por qué. */
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (archivo) void mandarImagen(archivo);
          }}
        />
      </form>
    </div>
  );
}

function BotonDeBarra({
  onClick,
  disabled,
  etiqueta,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function BotonDeCaja({
  onClick,
  disabled,
  etiqueta,
  encendido,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  etiqueta: string;
  encendido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={encendido}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40",
        encendido
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-borde text-tinta-suave hover:border-carga-500 hover:text-tinta",
      )}
    >
      {children}
    </button>
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
        {/* La imagen que se mandó, para saber de cuál se está hablando. */}
        {turno.de === "persona" && turno.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={turno.imagen}
            alt=""
            className="mb-1.5 max-h-40 w-full rounded-lg object-contain"
          />
        ) : null}

        {turno.texto}

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
