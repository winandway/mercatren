"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Campo } from "@/components/ui/campo";
import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { escribirEnCaso } from "@/lib/soporte/acciones-ayuda";

/**
 * La casilla para seguir escribiendo en un caso. Guarda el borrador y lo
 * borra SOLO cuando el mensaje quedó guardado; si falla, se queda en pantalla
 * con el motivo (regla global de los formularios).
 */
export function ChatDelCaso({ codigo }: { codigo: string }) {
  const t = useTranslations("ayuda.caso");
  const router = useRouter();
  const llave = `ayuda-caso-${codigo}`;
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  /* La casilla guarda su propio valor: `reset()` no la vacía. Tras un envío
     bueno se vuelve a montar, ya sin borrador, y queda en blanco. */
  const [vuelta, setVuelta] = useState(0);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const texto = String(new FormData(form).get("texto") ?? "");
    setEnviando(true);
    setFallo(null);
    const r = await escribirEnCaso(codigo, { texto });
    setEnviando(false);
    if (r.ok) {
      olvidarBorrador(llave);
      form.reset();
      setVuelta((v) => v + 1);
      router.refresh();
    } else {
      setFallo(t(`errores.${r.motivo}`));
    }
  }

  return (
    <FormularioPersistente
      key={vuelta}
      llave={llave}
      onSubmit={enviar}
      className="mt-6 space-y-3"
    >
      <Campo
        tipo="textoLargo"
        nombre="texto"
        etiqueta={t("escribir")}
        area
        filas={4}
        requerido
      />
      {fallo ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {fallo}
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
    </FormularioPersistente>
  );
}
