"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Campo } from "@/components/ui/campo";
import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { enviarAyuda, type ResultadoAyuda } from "@/lib/soporte/bandeja";

const LLAVE = "ayuda-contacto";

/**
 * El formulario de ayuda (1 nov 2026): el mensaje va a la bandeja de
 * soporte (`lib/soporte/bandeja.ts`). Lo escrito se guarda mientras se
 * escribe y SOLO se borra cuando la bandeja confirma; si falla, se queda en
 * pantalla con el motivo y el correo de contacto como otra vía.
 */
export function FormularioAyuda() {
  const t = useTranslations("ayuda.formulario");
  const idioma = useLocale();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAyuda | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const datos = new FormData(form);
    const texto = (clave: string) => String(datos.get(clave) ?? "");
    setEnviando(true);
    setResultado(null);
    const r = await enviarAyuda(
      {
        nombre: texto("nombre"),
        email: texto("email"),
        asunto: texto("asunto"),
        mensaje: texto("mensaje"),
        sitio_web: texto("sitio_web"),
      },
      idioma,
    );
    setEnviando(false);
    setResultado(r);
    // Solo con la confirmación en la mano se borra lo escrito.
    if (r.ok) {
      olvidarBorrador(LLAVE);
      form.reset();
    }
  }

  if (resultado?.ok) {
    return (
      <div
        className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900"
        role="status"
      >
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          {t("enviadoTitulo")}
        </p>
        <p className="mt-1 text-sm">{t("enviadoTexto")}</p>
      </div>
    );
  }

  return (
    <FormularioPersistente
      llave={LLAVE}
      onSubmit={enviar}
      className="space-y-4"
      noValidate={false}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          tipo="nombrePersona"
          nombre="nombre"
          etiqueta={t("nombre")}
          requerido
        />
        <Campo tipo="correo" nombre="email" etiqueta={t("correo")} requerido />
      </div>
      <Campo
        tipo="textoCorto"
        nombre="asunto"
        etiqueta={t("asunto")}
        requerido
      />
      <Campo
        tipo="textoLargo"
        nombre="mensaje"
        etiqueta={t("mensaje")}
        area
        filas={5}
        requerido
      />

      {/* La trampa para robots: fuera de la vista y del teclado. Una persona
          la deja vacía; un robot que llena todo, no. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="sitio_web">Website</label>
        <input
          id="sitio_web"
          name="sitio_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {resultado && !resultado.ok ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {t(`errores.${resultado.motivo}`, { correo: CORREO_CONTACTO })}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="boton-principal gap-2"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        {enviando ? t("enviando") : t("enviar")}
      </button>
      <p className="text-xs text-tinta-suave">
        {t("otraVia", { correo: CORREO_CONTACTO })}
      </p>
    </FormularioPersistente>
  );
}
