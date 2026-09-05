"use client";

import {
  AlertTriangle,
  Check,
  CreditCard,
  Loader2,
  Play,
  ShoppingCart,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import type {
  PasoDiagnostico,
  UltimaCompraDePrueba,
} from "@/lib/cj/diagnostico-puro";
import {
  comprarDeVerdadACj,
  pagarUltimaPruebaPendiente,
  probarCompraDeCj,
} from "@/lib/cj/probar-compra";
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
 *
 * LA DIRECCIÓN SE ESCRIBE CADA VEZ, no viene puesta: la dirección de la
 * empresa y el nombre de la sociedad viven cada uno en UN solo sitio del
 * código, y hay candados que se ponen rojos si se escriben a mano — se
 * pusieron. Los ejemplos de las casillas describen el campo, nunca un dato.
 */
export function ProbarCompra({
  ultima,
}: {
  ultima: UltimaCompraDePrueba | null;
}) {
  const t = useTranslations("panel.probarCompra");
  const [enlace, setEnlace] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [zip, setZip] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pasos, setPasos] = useState<PasoDiagnostico[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [corriendo, iniciar] = useTransition();

  const campos = [
    { clave: "nombre", valor: nombre, poner: setNombre, ejemplo: t("nombre") },
    {
      clave: "direccion",
      valor: direccion,
      poner: setDireccion,
      ejemplo: t("direccionEjemplo"),
    },
    { clave: "ciudad", valor: ciudad, poner: setCiudad, ejemplo: t("ciudad") },
    {
      clave: "estado",
      valor: estado,
      poner: setEstado,
      ejemplo: t("estadoEjemplo"),
    },
    {
      clave: "codigoPostal",
      valor: zip,
      poner: setZip,
      ejemplo: t("codigoPostal"),
    },
    { clave: "telefono", valor: telefono, poner: setTelefono, ejemplo: "+1 …" },
  ] as const;

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
          <p className="font-bold">
            {t("ultimaTitulo", { numero: ultima.numero })}
          </p>
          <p className="mt-1">
            {ultima.producto} · <strong>{t(`estados.${ultima.estado}`)}</strong>{" "}
            · {new Date(ultima.enMs).toLocaleString()} · {ultima.quien}
          </p>
          <p className="mt-1 text-tinta-suave">{ultima.detalle}</p>
          {/* Si quedó creada sin pagar, el pedido sigue vivo en CJ esperando
              su dinero. Volver a «Comprar» crearía OTRO: esto retoma ese. */}
          {ultima.estado === "creado_sin_pagar" ? (
            <button
              type="button"
              disabled={corriendo}
              onClick={() =>
                iniciar(async () => {
                  if (
                    !window.confirm(
                      t("pagarPendienteConfirmar", { numero: ultima.numero }),
                    )
                  )
                    return;
                  setPasos([]);
                  setAviso(null);
                  const r = await pagarUltimaPruebaPendiente();
                  setPasos(r.pasos);
                  setAviso(r.mensaje);
                  setOk(r.ok);
                })
              }
              className="boton-principal mt-3 gap-2"
            >
              {corriendo ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CreditCard className="h-4 w-4" aria-hidden />
              )}
              {t("pagarPendiente", { numero: ultima.numero })}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-borde bg-white p-4">
        <label className="block text-sm font-semibold" htmlFor="enlace">
          {t("enlace")}
        </label>
        <p className="mt-1 text-xs text-tinta-suave">{t("enlaceAyuda")}</p>
        <input
          id="enlace"
          type="text"
          value={enlace}
          onChange={(e) => setEnlace(e.target.value)}
          placeholder={t("enlaceEjemplo")}
          className="mt-2 h-11 w-full rounded-lg border border-borde px-3 text-sm"
        />

        <p className="mt-4 text-sm font-semibold">{t("direccionTitulo")}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {campos.map((c) => (
            <label key={c.clave} className="block text-xs font-semibold">
              {t(c.clave)}
              <input
                type="text"
                value={c.valor}
                onChange={(e) => c.poner(e.target.value)}
                placeholder={c.ejemplo}
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
            {t("soloMirar")}
          </button>

          {/* EL BOTÓN QUE PIDIÓ EL DUEÑO: compra de verdad, del saldo de CJ,
              sin pasar por la tarjeta. Es dinero real y CJ lo despacha, así
              que pide confirmación diciendo las dos cosas. */}
          <button
            type="button"
            disabled={corriendo || !enlace.trim()}
            onClick={() =>
              iniciar(async () => {
                if (!window.confirm(t("comprarConfirmar"))) return;
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
            {t("comprar")}
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
                {t("verCrudo")}
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
