"use client";

import { Loader2, MoreVertical, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { useRouter } from "@/i18n/navigation";
import { devolverPago } from "@/lib/stripe/devolver";
import { cn } from "@/lib/utils";

/**
 * DEVOLVERLE EL DINERO AL COMPRADOR.
 *
 * ══ VA DENTRO DEL MENÚ DE TRES PUNTOS ══
 *
 * Regla del proyecto para toda acción que no se puede deshacer, y aquí con más
 * razón que en ninguna otra: un botón «Devolver» a la vista en la ficha de un
 * pedido es exactamente lo que se toca sin querer con el pulgar mientras se
 * mira otra cosa. Devolver dinero no tiene marcha atrás.
 *
 * Y además pide el motivo por escrito: no es papeleo, es lo que se lee dentro
 * de tres meses cuando nadie se acuerde de por qué se devolvió esa venta.
 */
export function DevolverPago({ numero }: { numero: string }) {
  const t = useTranslations("panel.devolucion");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [procesando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const llave = `devolucion:${numero}`;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-1 rounded-lg border border-borde px-2.5 py-1.5 text-sm font-semibold hover:border-carga-500"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {abierto ? (
        <section className="mt-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <h3 className="flex items-center gap-2 font-bold text-red-900">
            <Undo2 className="h-4 w-4" aria-hidden />
            {t("titulo")}
          </h3>
          <p className="mt-1 text-sm text-red-900">{t("texto")}</p>

          <FormularioPersistente
            llave={llave}
            className="mt-4 space-y-3"
            action={(datos) =>
              iniciar(async () => {
                setAviso(null);
                datos.set("numero", numero);

                let r;
                try {
                  r = await devolverPago(datos);
                } catch (fallo) {
                  console.error("[devolucion] no se pudo:", fallo);
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
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-white text-red-800",
                )}
              >
                {aviso.texto}
              </p>
            ) : null}

            <label className="block max-w-xs">
              <span className="text-sm font-semibold">{t("monto")}</span>
              <input
                name="monto"
                inputMode="decimal"
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm"
              />
              <span className="mt-1 block text-xs text-red-900/80">
                {t("montoAyuda")}
              </span>
            </label>

            <label className="block max-w-2xl">
              <span className="text-sm font-semibold">{t("motivo")}</span>
              <textarea
                name="motivo"
                rows={2}
                required
                placeholder={t("motivoMarcador")}
                className="mt-1 w-full resize-y rounded-lg border border-red-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            {/* Lo que hay que saber ANTES de pulsar, no después. */}
            <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-900">
              {t("aviso")}
            </p>

            <button
              type="submit"
              disabled={procesando}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {procesando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {procesando ? t("procesando") : t("boton")}
            </button>
          </FormularioPersistente>
        </section>
      ) : null}
    </div>
  );
}
