"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { FormularioPersistente } from "@/components/ui/formulario-persistente";
import {
  pedirDevolucion,
  type DevolucionDelPedido,
} from "@/lib/devoluciones/acciones";
import {
  esMotivoValido,
  exigeFotos,
  MAXIMO_FOTOS,
  MOTIVOS,
} from "@/lib/devoluciones/reglas";
import { cn } from "@/lib/utils";

/**
 * DEVOLVER UN PEDIDO.
 *
 * ══ LA DIRECCIÓN NO ESTÁ EN ESTE ARCHIVO ══
 *
 * Y no es un descuido: es la regla. Llega del servidor **después** de abrir el
 * trámite. Si estuviera aquí —aunque fuera escondida detrás de un `if`—
 * cualquiera la leería en el código de la página, y todo esto existe
 * precisamente porque **esa dirección va a cambiar**.
 *
 * ══ POR QUÉ VA PLEGADO ══
 *
 * Un botón de «devolver» grande en la página de un pedido que acaba de llegar
 * bien es una invitación que nadie pidió. Va cerrado, discreto, y se abre
 * cuando de verdad hay un problema.
 */
export function Devolver({
  pedidoId,
  yaHay,
}: {
  pedidoId: string;
  /** La devolución que ya existe, si la hay. */
  yaHay: DevolucionDelPedido | null;
}) {
  const t = useTranslations("pedido.devolver");
  const [motivo, setMotivo] = useState<string>("");
  const [enviando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ direccion: string | null } | null>(null);

  /* Ya la pidió antes: se enseña dónde va, sin formulario. */
  if (yaHay) {
    return (
      <Abierta
        estado={yaHay.estado}
        direccion={yaHay.direccionEntregada}
        motivoRechazo={yaHay.motivoRechazo}
      />
    );
  }

  if (hecho) return <Abierta estado="solicitada" direccion={hecho.direccion} />;

  const pideFotos = esMotivoValido(motivo) && exigeFotos(motivo);

  return (
    <details className="rounded-xl border border-borde bg-white">
      <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-semibold">
        <PackageOpen className="h-4 w-4 text-tinta-suave" aria-hidden />
        {t("abrir")}
      </summary>

      <FormularioPersistente
        llave={`devolucion-${pedidoId}`}
        className="space-y-4 border-t border-borde p-4"
        action={(datos: FormData) =>
          iniciar(async () => {
            setError(null);
            const r = await pedirDevolucion(datos);
            if (r.ok) setHecho({ direccion: r.direccion });
            else setError(r.mensaje);
          })
        }
      >
        <input type="hidden" name="pedidoId" value={pedidoId} />

        <fieldset>
          <legend className="text-sm font-semibold">{t("porQue")}</legend>
          <div className="mt-2 space-y-1.5">
            {MOTIVOS.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="motivo"
                  value={m}
                  required
                  checked={motivo === m}
                  onChange={() => setMotivo(m)}
                  className="h-4 w-4"
                />
                {t(`motivos.${m}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="font-semibold">{t("cuentanos")}</span>
          <textarea
            name="comentario"
            rows={3}
            maxLength={1000}
            placeholder={t("cuentanosPista")}
            className="mt-1 w-full rounded-lg border border-borde p-2 text-sm"
          />
        </label>

        {/* Las fotos solo cuando el motivo las necesita: de algo que no llegó
            no hay foto que sacar, y pedirla ahí es una pared donde no hay nada
            que comprobar. */}
        {pideFotos ? (
          <label className="block text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              <Camera className="h-4 w-4" aria-hidden />
              {t("fotos", { maximo: MAXIMO_FOTOS })}
            </span>
            <input
              type="file"
              name="fotos"
              multiple
              /* Lista abierta, NUNCA cerrada: el HEIC es el formato por defecto
                 del iPhone, y con una lista de tipos el carrete se le ve en
                 gris a media clientela. */
              accept="image/*"
              required
              className="mt-1 w-full text-sm"
            />
            <span className="mt-1 block text-xs text-tinta-suave">
              {t("fotosPista")}
            </span>
          </label>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {/* El motivo llega como clave para que salga en el idioma de quien
                mira; si es un texto del servidor, se enseña tal cual. */}
            {error.startsWith("no.") || error === "faltanFotos"
              ? t(`errores.${error.replace("no.", "")}`)
              : error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enviando}
          className="boton-principal w-full gap-2 disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {enviando ? t("enviando") : t("enviar")}
        </button>

        <p className="text-xs text-tinta-suave">{t("despues")}</p>
      </FormularioPersistente>
    </details>
  );
}

/**
 * EL TRÁMITE YA ABIERTO, CON LA DIRECCIÓN.
 *
 * Es el único sitio de todo el sitio donde esa dirección se ve, y solo la ve
 * quien tiene este pedido y ya pidió devolverlo.
 */
function Abierta({
  estado,
  direccion,
  motivoRechazo,
}: {
  estado: string;
  direccion: string | null;
  motivoRechazo?: string | null;
}) {
  const t = useTranslations("pedido.devolver");

  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        estado === "rechazada"
          ? "border-red-200 bg-red-50"
          : "border-emerald-200 bg-emerald-50",
      )}
    >
      <h2 className="flex items-center gap-2 font-bold">
        <CheckCircle2 className="h-5 w-5 text-precio-600" aria-hidden />
        {t(`estados.${estado}`)}
      </h2>

      {motivoRechazo ? (
        <p className="mt-2 text-sm text-red-800">{motivoRechazo}</p>
      ) : null}

      {direccion ? (
        <div className="mt-3">
          <p className="text-sm font-semibold">{t("mandaloA")}</p>
          {/* Copiable de un toque: quien va a la oficina de correos escribe
              esto a mano en una etiqueta, y un dígito mal en el código postal
              es un paquete que no llega. */}
          {/* El identificador es para la prueba de punta a punta: comprueba que
              este bloque NO existe hasta que el trámite está abierto. */}
          <pre
            data-testid="direccion-devolucion"
            className="mt-1 rounded-lg border border-borde bg-white p-3 text-sm whitespace-pre-wrap select-all"
          >
            {direccion}
          </pre>
          <p className="mt-2 text-xs text-tinta-suave">{t("direccionAviso")}</p>
        </div>
      ) : estado !== "rechazada" ? (
        /* Sin dirección configurada NO se inventa ninguna: se dice que va por
           correo. Una caja mandada a un sitio equivocado no vuelve. */
        <p className="mt-2 text-sm">{t("direccionPorCorreo")}</p>
      ) : null}
    </section>
  );
}
