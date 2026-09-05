"use client";

import { AlertTriangle, Check, Loader2, Play, X } from "lucide-react";
import { useState, useTransition } from "react";

import { probarCompraDeCj } from "@/lib/cj/probar-compra";
import type { PasoDiagnostico } from "@/lib/cj/diagnostico";
import { cn } from "@/lib/utils";

/**
 * PROBAR UNA COMPRA PEGANDO EL ENLACE (5 sep 2026).
 *
 * Lo pidió el dueño tras la tercera compra fallida: «no puedo estar probando
 * en Stripe cada rato… un campo donde meto un link y un botón, y ahí vemos
 * qué está pasando».
 *
 * LO QUE LA HACE ÚTIL es que enseña **la respuesta cruda de CJ**, no un
 * resumen. Las tres compras murieron por un campo que el código tiraba sin
 * mirar; una pantalla que solo dijera «ok / falló» repetiría el problema.
 */
export function ProbarCompra() {
  const [enlace, setEnlace] = useState("");
  const [estado, setEstado] = useState("");
  const [zip, setZip] = useState("");
  const [pasos, setPasos] = useState<PasoDiagnostico[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [corriendo, iniciar] = useTransition();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-borde bg-white p-4">
        <label className="block text-sm font-semibold" htmlFor="enlace">
          Enlace del producto
        </label>
        <p className="mt-1 text-xs text-tinta-suave">
          Pega la dirección de cualquier producto del catálogo. No cobra nada,
          no crea ninguna venta: le pregunta a CJ y te enseña lo que contesta.
        </p>
        <input
          id="enlace"
          type="text"
          value={enlace}
          onChange={(e) => setEnlace(e.target.value)}
          placeholder="https://mercatren.com/es/producto/…"
          className="mt-2 h-11 w-full rounded-lg border border-borde px-3 text-sm"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold" htmlFor="estado">
              Estado de entrega (opcional)
            </label>
            <input
              id="estado"
              type="text"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              placeholder="MI"
              className="mt-1 h-10 w-full rounded-lg border border-borde px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold" htmlFor="zip">
              Código postal (opcional)
            </label>
            <input
              id="zip"
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="48377"
              className="mt-1 h-10 w-full rounded-lg border border-borde px-3 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={corriendo || !enlace.trim()}
          onClick={() =>
            iniciar(async () => {
              setPasos([]);
              setAviso(null);
              const r = await probarCompraDeCj({
                enlace,
                estado: estado.trim() || undefined,
                codigoPostal: zip.trim() || undefined,
              });
              setPasos(r.pasos);
              setAviso(r.mensaje);
              setOk(r.ok);
            })
          }
          className="boton-principal mt-4 gap-2"
        >
          {corriendo ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          Probar esta compra
        </button>
      </div>

      {aviso ? (
        <p
          role="status"
          className={cn(
            "rounded-lg border p-3 text-sm",
            ok
              ? "border-precio-600/30 bg-emerald-50 text-precio-600"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {aviso}
        </p>
      ) : null}

      {pasos.map((p) => (
        <div
          key={p.numero}
          className={cn(
            "rounded-xl border p-4",
            p.estado === "fallo"
              ? "border-red-200 bg-red-50"
              : p.estado === "aviso"
                ? "border-amber-300 bg-amber-50"
                : "border-borde bg-white",
          )}
        >
          <h3 className="flex items-center gap-2 text-sm font-bold">
            {p.estado === "ok" ? (
              <Check className="h-4 w-4 text-precio-600" aria-hidden />
            ) : p.estado === "fallo" ? (
              <X className="h-4 w-4 text-red-700" aria-hidden />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden />
            )}
            {p.numero}. {p.titulo}
          </h3>
          <p className="mt-1 text-sm">{p.resumen}</p>

          {/* LA RESPUESTA ENTERA DE CJ, y por eso esto sirve: el fallo de las
              tres compras vivía en un campo que el código no leía. Va plegada
              para que no tape el resumen, que es lo que se mira primero. */}
          {p.crudo !== undefined ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-carga-600">
                Ver lo que contestó CJ, entero
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(p.crudo, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ))}
    </div>
  );
}
