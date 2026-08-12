"use client";

import { Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { Campo } from "@/components/ui/campo";
import { guardarPoliticaDeEnvio } from "@/lib/envios/acciones";
import {
  MODOS_ENVIO,
  porcentajeVisible,
  type ModoEnvio,
} from "@/lib/envios/politica";
import { cn } from "@/lib/utils";

/**
 * DÓNDE EL COMERCIO DICE SI DESPACHA.
 *
 * ══ LAS CUATRO OPCIONES SON TARJETAS, NO UN MENÚ ══
 *
 * Es la decisión que más le cambia las ventas y la toma una vez. Un desplegable
 * la esconde detrás de un clic y la deja en el primer valor de la lista — que
 * además sería "sin definir", justo lo que queremos que deje de estar.
 *
 * ══ «SIN DEFINIR» ESTÁ EN LA LISTA A PROPÓSITO ══
 *
 * Podría quitarse para forzar una respuesta, pero entonces un comercio que
 * entró a cambiar otra cosa se llevaría por delante una decisión que no tomó.
 * Se deja visible y con su explicación de que así no aparece en su ficha.
 *
 * El porcentaje solo se pide cuando hace falta: preguntarlo siempre confunde a
 * quien ya dijo que no cobra por enviar.
 */
export function FormularioEnvio({
  tiendaId,
  inicial,
}: {
  tiendaId: string;
  inicial: {
    modo: ModoEnvio;
    porcentajePuntosBase: number;
    coberturaEs: string | null;
    coberturaEn: string | null;
    plazoEs: string | null;
    plazoEn: string | null;
  };
}) {
  const t = useTranslations("panel.envio");
  const [modo, setModo] = useState<ModoEnvio>(inicial.modo);
  /* Las casillas se manejan aquí para poder arrancar con lo ya guardado: el
     componente Campo se maneja solo cuando no recibe valor, y entonces nace
     vacío y el comercio tendría que reescribir lo suyo cada vez. */
  const [porcentaje, setPorcentaje] = useState(
    inicial.porcentajePuntosBase > 0
      ? porcentajeVisible(inicial.porcentajePuntosBase)
      : "",
  );
  const [coberturaEs, setCoberturaEs] = useState(inicial.coberturaEs ?? "");
  const [coberturaEn, setCoberturaEn] = useState(inicial.coberturaEn ?? "");
  const [plazoEs, setPlazoEs] = useState(inicial.plazoEs ?? "");
  const [plazoEn, setPlazoEn] = useState(inicial.plazoEn ?? "");
  const [estado, accion, pendiente] = useActionState(
    guardarPoliticaDeEnvio,
    null,
  );

  /* Guardado de verdad: recién ahora se tira el borrador. Uno que sobrevive al
     guardado reaparece la próxima vez con datos viejos encima de los buenos. */
  useEffect(() => {
    if (estado?.ok) olvidarBorrador(`envios:${tiendaId}`);
  }, [estado?.ok, tiendaId]);

  const despacha = modo === "porcentaje" || modo === "incluido";

  return (
    <section className="rounded-xl border border-borde bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Truck className="h-5 w-5" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 mb-4 text-sm text-tinta-suave">{t("entradilla")}</p>

      <FormularioPersistente
        llave={`envios:${tiendaId}`}
        action={accion}
        className="space-y-4"
      >
        <input type="hidden" name="tiendaId" value={tiendaId} />
        <input type="hidden" name="modo" value={modo} />

        <div className="grid gap-2 sm:grid-cols-2">
          {MODOS_ENVIO.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              aria-pressed={modo === m}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                modo === m
                  ? "border-riel-900 bg-riel-900/5"
                  : "border-borde hover:bg-neutral-50",
              )}
            >
              <span className="block text-sm font-bold">
                {t(`modo.${m}.titulo`)}
              </span>
              <span className="mt-0.5 block text-xs text-tinta-suave">
                {t(`modo.${m}.texto`)}
              </span>
            </button>
          ))}
        </div>

        {modo === "porcentaje" ? (
          <div className="rounded-xl bg-neutral-50 p-4">
            <Campo
              tipo="soloNumeros"
              nombre="porcentaje"
              etiqueta={t("porcentaje")}
              ayuda={t("porcentajeAyuda")}
              valor={porcentaje}
              onChange={setPorcentaje}
              requerido
            />
          </div>
        ) : null}

        {despacha ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo
              tipo="textoCorto"
              nombre="coberturaEs"
              etiqueta={t("cobertura")}
              marcador={t("coberturaMarcador")}
              valor={coberturaEs}
              onChange={setCoberturaEs}
            />
            <Campo
              tipo="textoCorto"
              nombre="coberturaEn"
              etiqueta={t("coberturaEn")}
              marcador="Nationwide"
              valor={coberturaEn}
              onChange={setCoberturaEn}
            />
            <Campo
              tipo="textoCorto"
              nombre="plazoEs"
              etiqueta={t("plazo")}
              marcador={t("plazoMarcador")}
              valor={plazoEs}
              onChange={setPlazoEs}
            />
            <Campo
              tipo="textoCorto"
              nombre="plazoEn"
              etiqueta={t("plazoEn")}
              marcador="2 to 4 business days"
              valor={plazoEn}
              onChange={setPlazoEn}
            />
          </div>
        ) : null}

        {estado && !estado.ok ? (
          <p role="alert" className="text-sm text-red-700">
            {estado.mensaje}
          </p>
        ) : null}
        {estado?.ok ? (
          <p className="text-sm font-medium text-emerald-700">
            ✓ {t("guardado")}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pendiente}
          className="boton-principal disabled:opacity-60"
        >
          {pendiente ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t("guardando")}
            </>
          ) : (
            t("guardar")
          )}
        </button>
      </FormularioPersistente>
    </section>
  );
}
