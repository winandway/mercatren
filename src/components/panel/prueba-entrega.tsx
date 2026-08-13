"use client";

import { FileCheck2, Loader2, Paperclip, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { useRouter } from "@/i18n/navigation";
import { TIPOS_PRUEBA } from "@/lib/db/schema";
import { fechaCorta } from "@/lib/fechas";
import {
  borrarPruebaDeEntrega,
  guardarPruebaDeEntrega,
} from "@/lib/pedidos/prueba-entrega";
import { cn } from "@/lib/utils";

/**
 * LO QUE DEFIENDE UNA VENTA CUANDO LLEGA UN CONTRACARGO.
 *
 * Un cobro con tarjeta se revierte hasta 120 días después. Cuando llega, el
 * banco pregunta una sola cosa: demuéstrame que el comprador recibió la
 * mercancía. Marcar «entregado» dice que alguien pulsó un botón; la guía del
 * transportista, la foto en la puerta o la firma dicen que llegó.
 *
 * El menú de quitar solo aparece para el equipo interno: un comercio que
 * pudiera borrar la prueba que él mismo subió dejaría el expediente a su gusto
 * justo cuando llega la disputa.
 */

export type Prueba = {
  id: string;
  tipo: string;
  referencia: string | null;
  clave: string | null;
  nota: string | null;
  subidoPorNombre: string | null;
  creadoEn: Date | null;
};

export function PruebaDeEntrega({
  numero,
  pruebas,
  idioma,
  esEquipo,
}: {
  numero: string;
  pruebas: Prueba[];
  idioma: string;
  esEquipo: boolean;
}) {
  const t = useTranslations("panel.pruebaEntrega");
  const router = useRouter();
  const [guardando, iniciar] = useTransition();
  const [tipo, setTipo] = useState<string>("guia");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const llave = `prueba-entrega:${numero}`;
  const pideReferencia = tipo === "guia";

  return (
    <section className="rounded-xl border border-borde bg-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <FileCheck2 className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{t("texto")}</p>

      {pruebas.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {pruebas.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm"
            >
              <span className="rounded-full bg-riel-900 px-2 py-0.5 text-[12px] font-bold text-white">
                {t(`tipos.${p.tipo}` as never)}
              </span>

              <div className="min-w-0 flex-1">
                {p.referencia ? (
                  <p className="font-mono font-semibold break-all">
                    {p.referencia}
                  </p>
                ) : null}
                {p.nota ? <p className="text-tinta">{p.nota}</p> : null}
                {p.clave ? (
                  <a
                    href={`/media/${p.clave}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-carga-600 hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" aria-hidden />
                    {t("verArchivo")}
                  </a>
                ) : null}
                <p className="mt-0.5 text-xs text-tinta-suave">
                  {p.subidoPorNombre
                    ? t("aportadaPor", { quien: p.subidoPorNombre })
                    : null}
                  {p.creadoEn ? ` · ${fechaCorta(p.creadoEn, idioma)}` : null}
                </p>
              </div>

              {esEquipo ? (
                <button
                  type="button"
                  aria-label={t("quitar")}
                  onClick={() =>
                    iniciar(async () => {
                      await borrarPruebaDeEntrega(p.id);
                      router.refresh();
                    })
                  }
                  className="shrink-0 rounded-lg border border-borde px-2 py-1 text-tinta-suave hover:border-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-tinta-suave">
          {t("sinPruebas")}
        </p>
      )}

      <FormularioPersistente
        llave={llave}
        className="mt-5 space-y-3 border-t border-borde pt-4"
        action={(datos) =>
          iniciar(async () => {
            setAviso(null);
            datos.set("numero", numero);

            let r;
            try {
              r = await guardarPruebaDeEntrega(datos);
            } catch (fallo) {
              /* Nada de lo que pase aquí puede llevarse por delante lo
                 escrito: la misma regla que en el resto del panel. */
              console.error("[prueba] no se pudo guardar:", fallo);
              setAviso({ ok: false, texto: String(fallo) });
              return;
            }

            setAviso({ ok: r.ok, texto: r.mensaje });
            if (r.ok) {
              olvidarBorrador(llave);
              router.refresh();
            }
          })
        }
      >
        {aviso ? (
          <p
            role="status"
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              aviso.ok
                ? "bg-emerald-50 text-emerald-900"
                : "bg-red-50 text-red-800",
            )}
          >
            {aviso.texto}
          </p>
        ) : null}

        <label className="block max-w-xs">
          <span className="text-sm font-semibold">{t("tipo")}</span>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm"
          >
            {TIPOS_PRUEBA.map((x) => (
              <option key={x} value={x}>
                {t(`tipos.${x}` as never)}
              </option>
            ))}
          </select>
        </label>

        {pideReferencia ? (
          <label className="block max-w-md">
            <span className="text-sm font-semibold">{t("referencia")}</span>
            <input
              name="referencia"
              placeholder={t("referenciaMarcador")}
              className="mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm"
            />
          </label>
        ) : null}

        <label className="block max-w-2xl">
          <span className="text-sm font-semibold">{t("nota")}</span>
          <textarea
            name="nota"
            rows={2}
            placeholder={t("notaMarcador")}
            className="mt-1 w-full resize-y rounded-lg border border-borde px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block max-w-md">
          <span className="text-sm font-semibold">{t("archivo")}</span>
          <input
            type="file"
            name="archivo"
            accept="image/*"
            className="mt-1 w-full text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="boton-principal gap-2 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {guardando ? t("guardando") : t("guardar")}
        </button>
      </FormularioPersistente>
    </section>
  );
}
