"use client";

import {
  AlertTriangle,
  Check,
  Loader2,
  Play,
  ShoppingCart,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

import {
  comprarDeVerdadACj,
  probarCompraDeCj,
  type UltimaCompraDePrueba,
} from "@/lib/cj/probar-compra";
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
export function ProbarCompra({
  ultima,
}: {
  /** La última compra de prueba, para saber qué pasó sin abrir CJ. */
  ultima: UltimaCompraDePrueba | null;
}) {
  const [enlace, setEnlace] = useState("");
  /* La dirección de Mercatren LLC en Novi, por defecto: es la del registro y
     la de devoluciones, y es donde se puede comprobar qué llega en la caja. */
  const [nombre, setNombre] = useState("Mercatren LLC");
  const [direccion, setDireccion] = useState("30080 Montmorency Drive");
  const [ciudad, setCiudad] = useState("Novi");
  const [estado, setEstado] = useState("MI");
  const [zip, setZip] = useState("48377");
  const [telefono, setTelefono] = useState("");
  const [pasos, setPasos] = useState<PasoDiagnostico[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [corriendo, iniciar] = useTransition();

  return (
    <div className="space-y-4">
      {ultima ? (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            ultima.estado === "pagado"
              ? "border-precio-600/30 bg-emerald-50"
              : ultima.estado === "fallo"
                ? "border-red-200 bg-red-50"
                : "border-amber-300 bg-amber-50",
          )}
        >
          <p className="font-bold">Última compra de prueba: {ultima.numero}</p>
          <p className="mt-1">
            {ultima.producto} ·{" "}
            <strong>{ultima.estado.replace(/_/g, " ")}</strong> ·{" "}
            {new Date(ultima.enMs).toLocaleString()} · {ultima.quien}
          </p>
          <p className="mt-1 text-tinta-suave">{ultima.detalle}</p>
        </div>
      ) : null}

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

        <p className="mt-4 text-sm font-semibold">Dónde se entregaría</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["Quien recibe", nombre, setNombre, "Nombre"],
              ["Dirección", direccion, setDireccion, "Calle y número"],
              ["Ciudad", ciudad, setCiudad, "Ciudad"],
              ["Estado", estado, setEstado, "MI"],
              ["Código postal", zip, setZip, "48377"],
              ["Teléfono (opcional)", telefono, setTelefono, "+1 …"],
            ] as const
          ).map(([etiqueta, valor, poner, ejemplo]) => (
            <label key={etiqueta} className="block text-xs font-semibold">
              {etiqueta}
              <input
                type="text"
                value={valor}
                onChange={(e) => poner(e.target.value)}
                placeholder={ejemplo}
                className="mt-1 h-10 w-full rounded-lg border border-borde px-3 text-sm font-normal"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
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
            className="inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-4 py-2.5 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
          >
            {corriendo ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            Solo mirar (no compra)
          </button>

          {/* EL BOTÓN QUE PIDIÓ EL DUEÑO: compra de verdad, del saldo de CJ,
              sin pasar por la tarjeta. Es dinero real y CJ lo despacha, así
              que pide confirmación diciendo las dos cosas. */}
          <button
            type="button"
            disabled={corriendo || !enlace.trim()}
            onClick={() =>
              iniciar(async () => {
                if (
                  !window.confirm(
                    "Esto crea un pedido REAL en CJ, lo paga de tu saldo y CJ lo va a despachar a la dirección de arriba. No pasa por Stripe.\n\n¿Comprar de verdad?",
                  )
                )
                  return;
                setPasos([]);
                setAviso(null);
                const r = await comprarDeVerdadACj({
                  enlace,
                  direccion: {
                    nombre,
                    direccion,
                    ciudad,
                    estado,
                    codigoPostal: zip,
                    telefono,
                  },
                });
                setPasos(r.pasos);
                setAviso(r.mensaje);
                setOk(r.ok);
              })
            }
            className="boton-principal gap-2"
          >
            {corriendo ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ShoppingCart className="h-4 w-4" aria-hidden />
            )}
            Comprar de verdad a CJ (paga del saldo)
          </button>
        </div>
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
