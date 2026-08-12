"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  borradorUtil,
  campoGuardable,
  escribirBorrador,
  leerBorrador,
  llaveDeBorrador,
} from "@/lib/formularios/borrador";

/**
 * UN `<form>` QUE NO PIERDE LO ESCRITO.
 *
 * Se usa igual que un `<form>` normal — se le cambia la etiqueta y se le pone
 * una `llave` — y a partir de ahí lo que la persona escribe queda guardado en su
 * navegador según lo escribe. Si la pestaña se muere, si el teléfono mata el
 * navegador al abrir el carrete, si toca «atrás» o si el servidor falla, al
 * volver está todo donde lo dejó.
 *
 * El porqué largo está en `src/lib/formularios/borrador.ts`.
 *
 * ══ SE LEE DEL DOM, NO DE `FormData` ══
 *
 * `FormData` no distingue una contraseña de un texto y **omite las casillas de
 * marcar sin marcar**, así que al restituir no se sabría si estaba desmarcada o
 * si el borrador es viejo y no la tenía. Leyendo las casillas de verdad se sabe
 * el tipo (para descartar contraseñas y archivos) y el estado exacto de cada
 * una.
 *
 * ══ SE LIMPIA A MANO, DESDE FUERA ══
 *
 * Quien sabe si el guardado salió bien es el formulario, no esto: la acción
 * puede devolver `{ok:false}` sin lanzar nada. Por eso el padre llama a
 * `olvidarBorrador(llave)` en su rama de éxito. Borrarlo aquí al enviar sería
 * borrarlo justo cuando el servidor lo rechazó — que es cuando más falta hace.
 */

/** Borra el borrador de un formulario. Se llama al guardar bien. */
export function olvidarBorrador(llave: string) {
  try {
    window.localStorage.removeItem(llaveDeBorrador(llave));
  } catch {
    /* Modo privado o almacenamiento lleno. No poder borrar no es motivo para
       tumbar un guardado que salió bien. */
  }
}

type Props = React.ComponentProps<"form"> & {
  /** Identifica ESTE formulario. Dos formularios distintos, dos llaves. */
  llave: string;
};

export function FormularioPersistente({
  llave,
  children,
  ref: refDeFuera,
  ...resto
}: Props) {
  const t = useTranslations("formularios");
  const formulario = useRef<HTMLFormElement>(null);
  const [recuperado, setRecuperado] = useState(false);
  const guardadoPendiente = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Las casillas que se pueden guardar, con su nombre y su valor. */
  const leerCampos = useCallback((): Record<string, string> => {
    const form = formulario.current;
    if (!form) return {};

    const campos: Record<string, string> = {};

    for (const campo of Array.from(form.elements)) {
      if (!(
        campo instanceof HTMLInputElement ||
        campo instanceof HTMLTextAreaElement ||
        campo instanceof HTMLSelectElement
      )) {
        continue;
      }

      const tipo = campo instanceof HTMLInputElement ? campo.type : "text";
      if (
        !campoGuardable({
          nombre: campo.name,
          tipo,
          autoCompletado: campo.autocomplete,
        })
      ) {
        continue;
      }

      if (campo instanceof HTMLInputElement && tipo === "checkbox") {
        campos[campo.name] = campo.checked ? "on" : "";
        continue;
      }

      if (campo instanceof HTMLInputElement && tipo === "radio") {
        /* Solo el elegido: guardar los tres dejaría el último ganando siempre. */
        if (campo.checked) campos[campo.name] = campo.value;
        continue;
      }

      campos[campo.name] = campo.value;
    }

    return campos;
  }, []);

  /**
   * RESTITUIR AL ABRIR.
   *
   * ══ VA EN UN EFECTO, Y ESO NO ES UN DETALLE ══
   *
   * La primera versión lo hacía en el callback del `ref`. En el servidor de
   * desarrollo funcionaba y **en la compilación de producción no restituía
   * nada**: ahí la página no se dibuja de cero, se HIDRATA sobre el HTML que
   * mandó el servidor, y en ese momento React todavía está montando el árbol.
   * Lo que se escriba en las casillas entonces lo pisa el propio React al
   * terminar.
   *
   * Un efecto corre cuando el montaje ya acabó y el formulario está quieto, que
   * es justo cuando se puede tocar. Se descubrió probándolo contra una
   * compilación de producción de verdad; en `npm run dev` el fallo no aparece.
   *
   * El aviso de «lo recuperamos» se enciende en un microtask, fuera del cuerpo
   * del efecto: primero quedan las casillas puestas, después se avisa.
   */
  const yaSeIntento = useRef<string | null>(null);

  const restituir = useCallback(
    (form: HTMLFormElement) => {
      if (yaSeIntento.current === llave) return;
      yaSeIntento.current = llave;

      let borrador;
      try {
        borrador = leerBorrador(
          window.localStorage.getItem(llaveDeBorrador(llave)),
        );
      } catch {
        return;
      }

      if (!borradorUtil(borrador, Date.now())) return;

      let algoCambio = false;

      for (const campo of Array.from(form.elements)) {
        if (!(
          campo instanceof HTMLInputElement ||
          campo instanceof HTMLTextAreaElement ||
          campo instanceof HTMLSelectElement
        )) {
          continue;
        }

        const guardado = borrador.campos[campo.name];
        if (guardado === undefined) continue;

        const tipo = campo instanceof HTMLInputElement ? campo.type : "text";
        if (
          !campoGuardable({
            nombre: campo.name,
            tipo,
            autoCompletado: campo.autocomplete,
          })
        ) {
          continue;
        }

        if (campo instanceof HTMLInputElement && tipo === "checkbox") {
          const marcar = guardado === "on";
          if (campo.checked !== marcar) {
            campo.checked = marcar;
            algoCambio = true;
          }
          continue;
        }

        if (campo instanceof HTMLInputElement && tipo === "radio") {
          const marcar = campo.value === guardado;
          if (campo.checked !== marcar) {
            campo.checked = marcar;
            algoCambio = true;
          }
          continue;
        }

        if (campo.value !== guardado) {
          campo.value = guardado;
          algoCambio = true;
          /* Los formularios que reaccionan a lo escrito (el de retiros cambia de
             casillas según el país) no se enteran de un cambio hecho a mano. */
          campo.dispatchEvent(new Event("input", { bubbles: true }));
          campo.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      if (algoCambio) queueMicrotask(() => setRecuperado(true));
    },
    [llave],
  );

  useEffect(() => {
    const form = formulario.current;
    if (form) restituir(form);
  }, [restituir]);

  /* ── Guardar según se escribe ───────────────────────────────────────── */
  useEffect(() => {
    const form = formulario.current;
    if (!form) return;

    function apuntar() {
      if (guardadoPendiente.current) clearTimeout(guardadoPendiente.current);

      /* Medio segundo: guardar en cada tecla escribe cien veces por párrafo y
         se nota en un teléfono modesto. */
      guardadoPendiente.current = setTimeout(() => {
        try {
          window.localStorage.setItem(
            llaveDeBorrador(llave),
            escribirBorrador(leerCampos(), Date.now()),
          );
        } catch {
          /* Modo privado, o el almacén lleno. Que no se pueda guardar el
             borrador jamás puede impedir escribir en el formulario. */
        }
      }, 500);
    }

    form.addEventListener("input", apuntar);
    form.addEventListener("change", apuntar);

    return () => {
      form.removeEventListener("input", apuntar);
      form.removeEventListener("change", apuntar);
      if (guardadoPendiente.current) clearTimeout(guardadoPendiente.current);
    };
  }, [llave, leerCampos]);

  /* El formulario que envuelve puede necesitar su propia referencia (el de alta
     de comercio la usa para limpiarse). Se atienden las dos: la de fuera y la
     nuestra, que es la que lee y restituye las casillas. */
  const ponerRef = useCallback(
    (nodo: HTMLFormElement | null) => {
      formulario.current = nodo;
      if (typeof refDeFuera === "function") refDeFuera(nodo);
      else if (refDeFuera) refDeFuera.current = nodo;
    },
    [refDeFuera],
  );

  return (
    <form ref={ponerRef} {...resto}>
      {/* Se le dice que se recuperó, y se le deja descartarlo. Restituir en
          silencio hace creer que el sistema «se inventó» unos datos. */}
      {recuperado ? (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t("borradorRecuperado")}</span>
          <button
            type="button"
            className="ml-auto font-semibold underline underline-offset-2"
            onClick={() => {
              olvidarBorrador(llave);
              setRecuperado(false);
              formulario.current?.reset();
            }}
          >
            {t("descartarBorrador")}
          </button>
        </p>
      ) : null}

      {children}
    </form>
  );
}
