"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { CAMPOS, type TipoCampo } from "@/lib/validacion/campos";
import { cn } from "@/lib/utils";

/**
 * LA CASILLA DE TEXTO DE TODO EL SITIO.
 *
 * Se le dice de qué TIPO es el dato —un teléfono, un nombre, una ciudad— y ella
 * saca sola todo lo demás de `src/lib/validacion/campos.ts`:
 *
 * - el **teclado correcto** en el celular (numérico para un teléfono, con la
 *   arroba para un correo);
 * - el **filtro mientras se escribe**, que va quitando lo que no corresponde
 *   —un nombre no admite números, un teléfono no admite letras—;
 * - el **tope de largo**;
 * - y el **aviso** cuando la persona sale de la casilla con algo mal.
 *
 * **EL AVISO SALE AL SALIR DE LA CASILLA, no en cada tecla.** Poner "correo
 * inválido" en rojo cuando alguien apenas escribió la primera letra es
 * regañarlo por no haber terminado todavía. Se avisa cuando ya terminó, que es
 * cuando el dato de verdad está mal.
 *
 * LO IMPORTANTE: esto es COMODIDAD, no seguridad. Cualquiera puede saltárselo
 * y hablarle directo al servidor. La barrera de verdad es el mismo esquema
 * corriendo del otro lado antes de guardar nada.
 */
export function Campo({
  tipo,
  nombre,
  etiqueta,
  marcador,
  ayuda,
  valor,
  valorInicial,
  onChange,
  requerido = false,
  area = false,
  filas = 3,
  className,
  autoComplete,
}: {
  tipo: TipoCampo;
  nombre: string;
  etiqueta: string;
  marcador?: string;
  ayuda?: string;
  /** Con `valor` + `onChange` la maneja el formulario; sin ellos, se maneja sola. */
  valor?: string;
  /**
   * Lo que ya estaba guardado, para un formulario que EDITA algo (el título de
   * un video, por ejemplo). No es lo mismo que `valor`: aquí la casilla sigue
   * manejándose sola y viajando con el FormData; esto solo dice con qué
   * arranca. Sin esto, editar obligaba a reescribirlo todo desde cero.
   */
  valorInicial?: string;
  onChange?: (valor: string) => void;
  requerido?: boolean;
  area?: boolean;
  filas?: number;
  className?: string;
  /**
   * Para APAGAR el autocompletado donde estorba.
   *
   * Cada tipo trae el suyo, que es lo correcto casi siempre: el navegador
   * rellena el teléfono, el correo y la dirección y le ahorra trabajo a la
   * persona. Pero en un formulario que se firma **bajo pena de perjurio** eso
   * se vuelve peligroso: el navegador metió «ESTADOSUNIDOS» en el campo del
   * número fiscal del W-8BEN-E, y nadie lo miró antes de firmar.
   *
   * Se pasa suelto y no se cambia la regla del tipo: `identificacionFiscal` se
   * usa también en «Mi tienda», donde autocompletar sí ayuda.
   */
  autoComplete?: string;
}) {
  const t = useTranslations("formularios.errores");
  const id = useId();
  const regla = CAMPOS[tipo];

  /* Funciona de las dos formas: en los formularios que llevan su propio estado
     manda `valor`, y en los que se envían con FormData la casilla se apaña
     sola. Sin esto habría que reescribir cada formulario del sitio para
     cambiarle la casilla. */
  const [propio, setPropio] = useState(valorInicial ?? "");
  const controlado = valor !== undefined;
  const actual = controlado ? valor : propio;

  const [error, setError] = useState<string | null>(null);

  function alEscribir(entrada: string) {
    // El filtro quita lo que no corresponde: un nombre no se queda con el "123".
    const limpio = regla.filtrar(entrada);

    if (controlado) onChange?.(limpio);
    else setPropio(limpio);

    // Si ya había un aviso y la persona está corrigiendo, se quita en cuanto
    // el dato queda bien: no se deja el rojo puesto mientras teclea.
    if (error && regla.esquema.safeParse(limpio).success) setError(null);
  }

  function alSalir() {
    // Una casilla opcional vacía no es un error: es una respuesta.
    if (!actual) {
      setError(null);
      return;
    }

    const revisado = regla.esquema.safeParse(actual);
    if (revisado.success) {
      setError(null);
      /* Se guarda lo que devolvió el esquema, no lo que se escribió: ahí es
         donde el correo baja a minúsculas, la identificación fiscal sube a
         mayúsculas y al sitio web se le pone el https://. Que la persona lo
         VEA arreglado en pantalla evita la duda de "¿lo guardó como lo puse?". */
      if (revisado.data !== actual) {
        if (controlado) onChange?.(revisado.data);
        else setPropio(revisado.data);
      }
      return;
    }

    const clave = revisado.error.issues[0]?.message ?? "invalido";
    // Si el mensaje no está traducido, se muestra el genérico antes que un
    // texto en clave que no significa nada para quien lo lee.
    setError(t.has(clave) ? t(clave) : t("invalido"));
  }

  const estilo = cn(
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none",
    error
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
      : "border-borde focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30",
    className,
  );

  const comunes = {
    id,
    name: nombre,
    required: requerido,
    maxLength: regla.atributos.maxLength,
    placeholder: marcador,
    value: actual,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      alEscribir(e.target.value),
    onBlur: alSalir,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error
      ? `${id}-error`
      : ayuda
        ? `${id}-ayuda`
        : undefined,
    className: estilo,
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium">
        {etiqueta}
      </label>

      {area ? (
        <textarea {...comunes} rows={filas} />
      ) : (
        <input
          {...comunes}
          type={regla.atributos.type ?? "text"}
          inputMode={regla.atributos.inputMode}
          autoComplete={autoComplete ?? regla.atributos.autoComplete}
        />
      )}

      {error ? (
        /* `role="alert"` para que el lector de pantalla lo anuncie: si no, quien
           no ve el borde rojo no se entera de que hay algo mal. */
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs text-red-600"
        >
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="mt-1 text-xs text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
