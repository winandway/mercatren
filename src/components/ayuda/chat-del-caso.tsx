"use client";

import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Campo } from "@/components/ui/campo";
import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { RUTA_UPLOAD } from "@/lib/rutas";
import { MAX_ADJUNTOS, revisarAdjuntos } from "@/lib/soporte/adjuntos";
import { BotonCamara } from "@/components/comun/boton-camara";

type Motivo =
  | "datos"
  | "noExiste"
  | "base"
  | "demasiados"
  | "tipo"
  | "grande"
  | "vacio"
  | "esperar"
  | "sinConexion";

/** Una captura elegida y su miniatura local (`blob:`). */
type Captura = { archivo: File; vista: string };

function soltar(lista: Captura[]) {
  for (const c of lista) URL.revokeObjectURL(c.vista);
}

/**
 * La casilla para seguir escribiendo en un caso, con hasta 3 capturas
 * (1 nov 2026). Lo escrito se guarda como borrador y SOLO se borra cuando el
 * mensaje quedó guardado; si falla, el texto y las capturas elegidas se
 * quedan en pantalla con el motivo (regla global de los formularios). Va por
 * `/upload/ayuda/<codigo>`: tres capturas de 10 MB no caben en una acción del
 * servidor.
 */
export function ChatDelCaso({ codigo }: { codigo: string }) {
  const t = useTranslations("ayuda.caso");
  const router = useRouter();
  const llave = `ayuda-caso-${codigo}`;
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<Motivo | null>(null);
  const [capturas, setCapturas] = useState<Captura[]>([]);
  /* La casilla guarda su propio valor: `reset()` no la vacía. Tras un envío
     bueno se vuelve a montar, ya sin borrador, y queda en blanco. */
  const [vuelta, setVuelta] = useState(0);
  const selector = useRef<HTMLInputElement>(null);

  /* Las miniaturas: cada captura lleva su dirección local desde que se elige,
     y se suelta al quitarla, al enviarla o al salir de la página. */
  const actuales = useRef<Captura[]>([]);
  useEffect(() => {
    actuales.current = capturas;
  }, [capturas]);
  useEffect(() => () => soltar(actuales.current), []);

  function elegir(lista: FileList | null) {
    if (!lista) return;
    const nuevas = Array.from(lista);
    const problema = revisarAdjuntos([
      ...capturas.map((c) => c.archivo),
      ...nuevas,
    ]);
    if (problema) {
      setFallo(problema);
      return;
    }
    setFallo(null);
    setCapturas([
      ...capturas,
      ...nuevas.map((archivo) => ({
        archivo,
        vista: URL.createObjectURL(archivo),
      })),
    ]);
  }

  function quitar(i: number) {
    soltar(capturas.slice(i, i + 1));
    setCapturas(capturas.filter((_, j) => j !== i));
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const texto = String(new FormData(form).get("texto") ?? "").trim();
    if (!texto && capturas.length === 0) {
      setFallo("datos");
      return;
    }
    const datos = new FormData();
    datos.set("texto", texto);
    for (const c of capturas)
      datos.append("adjuntos", c.archivo, c.archivo.name);
    setEnviando(true);
    setFallo(null);
    let r: { ok: true } | { ok: false; motivo: Motivo };
    try {
      const respuesta = await fetch(`${RUTA_UPLOAD}/ayuda/${codigo}`, {
        method: "POST",
        body: datos,
      });
      r = (await respuesta.json().catch(() => ({
        ok: false,
        motivo: "base",
      }))) as typeof r;
    } catch {
      r = { ok: false, motivo: "sinConexion" };
    }
    setEnviando(false);
    if (r.ok) {
      olvidarBorrador(llave);
      form.reset();
      setCapturas([]);
      soltar(capturas);
      setVuelta((v) => v + 1);
      router.refresh();
    } else {
      setFallo(r.motivo);
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
      />

      {capturas.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("capturas")}>
          {capturas.map((c, i) => (
            <li
              key={c.vista}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- una vista local (blob:), no una imagen del sitio */}
              <img
                src={c.vista}
                alt={c.archivo.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={t("quitarCaptura", { nombre: c.archivo.name })}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-tinta shadow"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {fallo ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {t(`errores.${fallo}`, { maximo: MAX_ADJUNTOS })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
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
        <button
          type="button"
          onClick={() => selector.current?.click()}
          disabled={capturas.length >= MAX_ADJUNTOS}
          className="boton-secundario gap-2"
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          {t("adjuntar")}
        </button>
        <input
          ref={selector}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            elegir(e.target.files);
            e.target.value = "";
          }}
        />
        <BotonCamara />
        <span className="text-xs text-tinta-suave">
          {t("adjuntarAyuda", { maximo: MAX_ADJUNTOS })}
        </span>
      </div>
    </FormularioPersistente>
  );
}
