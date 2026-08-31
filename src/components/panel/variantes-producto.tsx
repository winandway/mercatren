"use client";

import { Loader2, Plus, Ruler, Save, Shapes, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { guardarMedidas, guardarVariantes } from "@/lib/productos/acciones";
import type { MedidasVista, VarianteVista } from "@/lib/productos/variantes";
import { divisorDe } from "@/lib/mercado/moneda";

/**
 * TALLAS, COLORES Y MEDIDAS, en el formulario del comercio.
 *
 * Son dos bloques distintos a propósito, porque son dos cosas distintas y
 * mezclarlas es el error clásico:
 *
 *   · Las VARIANTES se eligen y cambian lo que se compra. Cada fila es una
 *     unidad de venta con su precio y su stock: talla M azul y talla M roja
 *     son dos cosas en el depósito.
 *   · Las MEDIDAS se consultan, no se eligen. Un peso no crea otro producto.
 *
 * Van fuera del formulario principal y se guardan por su cuenta: son
 * opcionales, y obligar a rellenarlas para poder guardar el título de un tubo
 * de PVC —que no tiene talla— sería absurdo.
 *
 * EL COMERCIO ESCRIBE SU PRECIO, como en el producto padre. El ajuste por
 * procesador y margen se lo suma el sistema al publicar; si lo sumara él,
 * el cliente lo pagaría dos veces.
 */
export function VariantesYMedidas({
  productoId,
  variantes,
  medidas,
  moneda = "USD",
}: {
  productoId: string;
  variantes: VarianteVista[];
  medidas: MedidasVista | null;
  /** La moneda del producto: pesos enteros en CL/CO, dólares en el resto. */
  moneda?: string;
}) {
  return (
    <div className="space-y-6">
      <BloqueVariantes
        productoId={productoId}
        iniciales={variantes}
        moneda={moneda}
      />
      <BloqueMedidas productoId={productoId} iniciales={medidas} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type Fila = {
  talla: string;
  color: string;
  colorHex: string;
  precio: string;
  stock: string;
  sku: string;
};

function deVariante(v: VarianteVista, moneda: string): Fila {
  return {
    talla: v.talla ?? "",
    color: v.color ?? "",
    colorHex: v.colorHex ?? "",
    // Se enseña SU precio, no el publicado: es lo que él escribió.
    precio: v.precioBaseCentavos
      ? (v.precioBaseCentavos / divisorDe(moneda)).toFixed(
          divisorDe(moneda) === 1 ? 0 : 2,
        )
      : "",
    stock: String(v.existencias ?? 0),
    sku: v.sku ?? "",
  };
}

const FILA_VACIA: Fila = {
  talla: "",
  color: "",
  colorHex: "",
  precio: "",
  stock: "0",
  sku: "",
};

function BloqueVariantes({
  productoId,
  iniciales,
  moneda,
}: {
  productoId: string;
  iniciales: VarianteVista[];
  moneda: string;
}) {
  const t = useTranslations("panel.variantes");
  const [filas, setFilas] = useState<Fila[]>(
    iniciales.length > 0 ? iniciales.map((v) => deVariante(v, moneda)) : [],
  );
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  function cambiar(i: number, campo: keyof Fila, valor: string) {
    setFilas((antes) =>
      antes.map((f, j) => (i === j ? { ...f, [campo]: valor } : f)),
    );
  }

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    const datos = new FormData();
    datos.set("productoId", productoId);
    for (const f of filas) {
      datos.append("varianteTalla", f.talla);
      datos.append("varianteColor", f.color);
      datos.append("varianteColorHex", f.colorHex);
      datos.append("variantePrecio", f.precio);
      datos.append("varianteStock", f.stock);
      datos.append("varianteSku", f.sku);
    }
    /* El try/finally es el arreglo del SPINNER DE LA MUERTE (31 ago 2026):
       si el servidor lanzaba —un corte de red, un despliegue en medio— el
       botón se quedaba girando para siempre y sin mensaje. Un comercio con
       un cliente delante estuvo así una tarde entera. */
    try {
      const r = await guardarVariantes(datos);
      setAviso(r.mensaje);
    } catch {
      setAviso(t("noSePudoGuardar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <Shapes className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{t("texto")}</p>

      {filas.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-tinta-suave">
          {t("sinVariantes")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-tinta-suave uppercase">
                <th className="pr-2 pb-2 font-semibold">{t("col.talla")}</th>
                <th className="pr-2 pb-2 font-semibold">{t("col.color")}</th>
                <th className="pr-2 pb-2 font-semibold">{t("col.muestra")}</th>
                <th className="pr-2 pb-2 font-semibold">{t("col.precio")}</th>
                <th className="pr-2 pb-2 font-semibold">{t("col.stock")}</th>
                <th className="pr-2 pb-2 font-semibold">{t("col.sku")}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2">
                    <input
                      value={f.talla}
                      onChange={(e) => cambiar(i, "talla", e.target.value)}
                      placeholder={t("ph.talla")}
                      className="w-20 rounded-lg border border-borde px-2 py-1.5 outline-none focus:border-carga-500"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      value={f.color}
                      onChange={(e) => cambiar(i, "color", e.target.value)}
                      placeholder={t("ph.color")}
                      className="w-28 rounded-lg border border-borde px-2 py-1.5 outline-none focus:border-carga-500"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    {/* La muestra de color es opcional: sin ella el selector
                        enseña el nombre, que ya sirve. */}
                    <input
                      type="color"
                      value={f.colorHex || "#ffffff"}
                      onChange={(e) => cambiar(i, "colorHex", e.target.value)}
                      aria-label={t("col.muestra")}
                      className="h-8 w-10 cursor-pointer rounded border border-borde"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      value={f.precio}
                      onChange={(e) => cambiar(i, "precio", e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-24 rounded-lg border border-borde px-2 py-1.5 tabular-nums outline-none focus:border-carga-500"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      value={f.stock}
                      onChange={(e) => cambiar(i, "stock", e.target.value)}
                      inputMode="decimal"
                      className="w-20 rounded-lg border border-borde px-2 py-1.5 tabular-nums outline-none focus:border-carga-500"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      value={f.sku}
                      onChange={(e) => cambiar(i, "sku", e.target.value)}
                      className="w-24 rounded-lg border border-borde px-2 py-1.5 outline-none focus:border-carga-500"
                    />
                  </td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFilas((antes) => antes.filter((_, j) => j !== i))
                      }
                      aria-label={t("quitar")}
                      className="rounded-lg p-1.5 text-tinta-suave transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-tinta-suave">{t("ayudaPrecio")}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilas((antes) => [...antes, { ...FILA_VACIA }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("agregar")}
        </button>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="boton-principal gap-2 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {t("guardar")}
        </button>

        {aviso ? (
          <span className="text-precio-700 text-sm font-medium">{aviso}</span>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function BloqueMedidas({
  productoId,
  iniciales,
}: {
  productoId: string;
  iniciales: MedidasVista | null;
}) {
  const t = useTranslations("panel.medidas");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  /* Se guarda en gramos y milímetros, pero se escribe en kilos y centímetros:
     nadie mide un tubo en milímetros de cabeza. */
  const enKg = (g: number | null) => (g === null ? "" : String(g / 1000));
  const enCm = (mm: number | null) => (mm === null ? "" : String(mm / 10));

  async function guardar(datos: FormData) {
    setGuardando(true);
    setAviso(null);
    datos.set("productoId", productoId);
    try {
      const r = await guardarMedidas(datos);
      /* Guardado de verdad: recién ahora se tira el borrador. */
      if (r.ok) olvidarBorrador(`medidas:${productoId}`);
      setAviso(r.mensaje);
    } catch {
      setAviso(t("noSePudoGuardar"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <Ruler className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{t("texto")}</p>

      <FormularioPersistente
        llave={`medidas:${productoId}`}
        action={guardar}
        className="mt-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["pesoKg", t("peso"), enKg(iniciales?.pesoGramos ?? null)],
              ["largoCm", t("largo"), enCm(iniciales?.largoMm ?? null)],
              ["anchoCm", t("ancho"), enCm(iniciales?.anchoMm ?? null)],
              ["altoCm", t("alto"), enCm(iniciales?.altoMm ?? null)],
            ] as const
          ).map(([nombre, etiqueta, valor]) => (
            <label key={nombre} className="block">
              <span className="text-sm font-medium">{etiqueta}</span>
              <input
                name={nombre}
                defaultValue={valor}
                inputMode="decimal"
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-borde px-3 py-2 tabular-nums outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
              />
            </label>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">{t("materialEs")}</span>
            <input
              name="materialEs"
              defaultValue={iniciales?.materialEs ?? ""}
              className="mt-1 w-full rounded-lg border border-borde px-3 py-2 outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{t("materialEn")}</span>
            <input
              name="materialEn"
              defaultValue={iniciales?.materialEn ?? ""}
              className="mt-1 w-full rounded-lg border border-borde px-3 py-2 outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="boton-principal gap-2 disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {t("guardar")}
          </button>
          {aviso ? (
            <span className="text-precio-700 text-sm font-medium">{aviso}</span>
          ) : null}
        </div>
      </FormularioPersistente>
    </section>
  );
}
