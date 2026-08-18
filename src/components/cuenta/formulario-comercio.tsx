"use client";

import { Loader2, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { solicitarComercio } from "@/lib/tiendas/acciones";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Alta de un comercio: los datos de su empresa.
 *
 * TODO ES OBLIGATORIO menos la web y la descripción. No se admite una cuenta a
 * medias: una tienda sin razón social ni identificación fiscal obliga después
 * a llamar al comercio para pedirle lo que falta, y mientras tanto ocupa sitio
 * como si existiera.
 *
 * SE GUARDA SOLO EN EL NAVEGADOR. Esto se llena casi siempre desde el
 * teléfono, y ahí pasa de todo: entra una llamada, se cierra la pestaña, se
 * va la señal. Perder ocho campos escritos a mano es la forma más segura de
 * que alguien no vuelva. Lo escrito se guarda en cuanto se teclea y sigue
 * aquí al regresar, aunque haya cerrado el navegador.
 *
 * Se borra al enviarlo: a partir de ahí la verdad está en la base, no en el
 * navegador de quien lo llenó.
 */

const BORRADOR = "mercatren-alta-comercio";

/** Lo que se pide, en el orden en que tiene sentido preguntarlo. */
const CAMPOS = [
  { nombre: "nombre", tipo: "text", obligatorio: true, auto: "organization" },
  { nombre: "razonSocial", tipo: "text", obligatorio: true },
  { nombre: "identificacionFiscal", tipo: "text", obligatorio: true },
  {
    nombre: "paisOrigen",
    tipo: "text",
    obligatorio: true,
    auto: "country-name",
  },
  { nombre: "ciudad", tipo: "text", obligatorio: true, auto: "address-level2" },
  {
    nombre: "direccion",
    tipo: "text",
    obligatorio: true,
    auto: "street-address",
  },
  { nombre: "telefono", tipo: "tel", obligatorio: true, auto: "tel" },
  { nombre: "correoContacto", tipo: "email", obligatorio: true, auto: "email" },
  { nombre: "sitioWeb", tipo: "url", obligatorio: false, auto: "url" },
] as const;

/**
 * EL DOCUMENTO DE LA EMPRESA CAMBIA CON EL PAÍS.
 *
 * En mercatren.cl la casilla se llama «RUT» y su ejemplo es un RUT; en el
 * resto sigue siendo «Identificación fiscal» con el ejemplo de siempre. Llega
 * ya resuelto desde el servidor —este componente es del navegador y no puede
 * leer el dominio— y por eso viaja como texto, no como función: una función no
 * cruza esa frontera.
 */
export function FormularioComercio({
  documento,
  local,
}: {
  documento: { nombre: string; ejemplo: string };
  /**
   * Lo que ese país llama distinto. Llega RESUELTO y TRADUCIDO del servidor,
   * que es el único que sabe por qué dominio entró la persona.
   *
   * Vacío en el mercado principal: mercatren.com no cambia ni una etiqueta.
   */
  local?: {
    etiquetas?: Partial<Record<string, string>>;
    ayudas?: Partial<Record<string, string>>;
    valores?: Partial<Record<string, string>>;
  };
}) {
  const t = useTranslations("comercio");
  const idioma = useLocale();
  const [estado, accion, enviando] = useActionState(solicitarComercio, null);
  const formulario = useRef<HTMLFormElement>(null);

  // Se recupera lo que había escrito antes de irse.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(BORRADOR);
      if (guardado && formulario.current) {
        const datos = JSON.parse(guardado) as Record<string, string>;
        for (const [campo, valor] of Object.entries(datos)) {
          const el = formulario.current.elements.namedItem(campo);
          if (
            el instanceof HTMLInputElement ||
            el instanceof HTMLTextAreaElement
          ) {
            el.value = valor;
          }
        }
      }
    } catch {
      // Un borrador ilegible no puede impedir que se llene el formulario.
    }
  }, []);

  function guardar() {
    if (!formulario.current) return;
    try {
      const datos = new FormData(formulario.current);
      localStorage.setItem(
        BORRADOR,
        JSON.stringify(Object.fromEntries(datos) as Record<string, string>),
      );
    } catch {
      // Sin sitio para guardar, se sigue igual: es una ayuda, no un requisito.
    }
  }

  // Enviado y aceptado: el borrador ya no sirve y no debe quedar rondando.
  useEffect(() => {
    if (estado?.ok) {
      olvidarBorrador("registro-comercio");
      try {
        localStorage.removeItem(BORRADOR);
      } catch {
        /* da igual */
      }
      window.location.assign(`/${idioma}/panel`);
    }
  }, [estado?.ok, idioma]);

  if (estado?.ok) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-900">
        {estado.mensaje}
      </p>
    );
  }

  return (
    <FormularioPersistente
      llave="registro-comercio"
      ref={formulario}
      action={accion}
      onInput={guardar}
      className="mt-6 space-y-4"
    >
      {/* Una columna en el celular, dos cuando cabe. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <div
            key={campo.nombre}
            className={campo.nombre === "direccion" ? "sm:col-span-2" : ""}
          >
            <label htmlFor={campo.nombre} className="block text-sm font-medium">
              {campo.nombre === "identificacionFiscal"
                ? documento.nombre
                : (local?.etiquetas?.[campo.nombre] ??
                  t(`campos.${campo.nombre}`))}
              {campo.obligatorio ? null : (
                <span className="text-tinta-suave"> · {t("opcional")}</span>
              )}
            </label>
            <input
              id={campo.nombre}
              name={campo.nombre}
              type={campo.tipo}
              required={campo.obligatorio}
              autoComplete={"auto" in campo ? campo.auto : undefined}
              placeholder={
                campo.nombre === "identificacionFiscal"
                  ? documento.ejemplo
                  : (local?.ayudas?.[campo.nombre] ??
                    t(`ayudas.${campo.nombre}`))
              }
              /* El país viene puesto en los dominios de un solo país: quien
                 entra por mercatren.cl entrega en Chile. Se deja editable
                 —un comercio puede despachar desde otro sitio— pero no se le
                 hace escribirlo, que es donde se acaban guardando «chile»,
                 «CHILE» y «Chile » como si fueran tres países. */
              defaultValue={local?.valores?.[campo.nombre]}
              // 16px como mínimo: por debajo, el iPhone hace zoom al tocar.
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="descripcionEs" className="block text-sm font-medium">
          {t("campos.descripcionEs")}
          <span className="text-tinta-suave"> · {t("opcional")}</span>
        </label>
        <textarea
          id="descripcionEs"
          name="descripcionEs"
          rows={3}
          maxLength={600}
          placeholder={t("ayudas.descripcionEs")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
        />
      </div>

      {/* LA FIRMA DEL ACUERDO. Sin premarcar, con el texto a un clic, y el
          servidor la vuelve a exigir: la casilla del navegador se puede
          manipular; la comprobación del servidor no. */}
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="aceptaTerminos"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-carga-500"
        />
        <span className="text-tinta-suave">
          {t.rich("aceptoTerminosComercio", {
            terminos: (texto) => (
              <Link
                href="/terminos"
                target="_blank"
                className="font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
              >
                {texto}
              </Link>
            ),
          })}
        </span>
      </label>

      {estado && !estado.ok ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className={cn("boton-principal w-full gap-2", enviando && "opacity-60")}
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Store className="h-4 w-4" aria-hidden />
        )}
        {enviando ? t("enviando") : t("enviar")}
      </button>

      <p className="text-center text-xs text-tinta-suave">
        {t("seGuardaSolo")}
      </p>
    </FormularioPersistente>
  );
}
