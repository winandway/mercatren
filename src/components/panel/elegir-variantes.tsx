"use client";

import { AlertTriangle, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  comprarPedidoAlProveedor,
  variantesDeLaVenta,
} from "@/lib/cj/proveedor-acciones";
import type { VariantesDeUnaVenta } from "@/lib/cj/pedidos";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * ELEGIR LA TALLA Y EL COLOR **ANTES** DE CREAR EL PEDIDO.
 *
 * ══ POR QUÉ EXISTE (18 ago 2026) ══
 *
 * El dueño estaba siguiendo el tutorial, pulsó «crear el pedido», y la talla
 * elegida le apareció **después**, con el pedido ya creado en CJ y sin forma de
 * cambiarla. Sus palabras: _«no sé qué voy a cambiar, si ya le di a enviar»_.
 *
 * Tenía razón y el orden estaba mal. Una decisión que se enseña después de
 * tomarla no está enseñada: está avisada. Y avisar de algo que ya no se puede
 * tocar solo sirve para enfadar.
 *
 * Ahora el botón NO compra: abre la lista. Se elige, y ahí se compra.
 *
 * ══ POR QUÉ NO SE PIDEN LAS VARIANTES AL CARGAR LA PÁGINA ══
 *
 * Sería una llamada a CJ por cada venta esperando, cada vez que alguien abre el
 * panel. Con la cola llena eso son decenas de llamadas para pintar una pantalla
 * que casi siempre solo se mira. Se piden cuando de verdad se va a comprar.
 */
export function ElegirVariantes({
  pedidoId,
  etiqueta,
}: {
  pedidoId: string;
  /** El texto del botón. Cambia entre «comprar» y «volver a intentarlo». */
  etiqueta: string;
}) {
  const t = useTranslations("panel.proveedor");
  const router = useRouter();

  const [lista, setLista] = useState<VariantesDeUnaVenta[] | null>(null);
  const [elegidas, setElegidas] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [cargando, pedirLista] = useTransition();
  const [comprando, comprar] = useTransition();

  /* Solo hay algo que preguntar cuando un producto tiene MÁS DE UNA variante.
     Con una sola no hay decisión, y meter un paso extra para confirmar lo
     obvio es lo que hace que la gente deje de leer las pantallas. */
  const hayQueElegir = lista?.some((r) => r.opciones.length > 1) ?? false;

  function comprarAhora(conElegidas: Record<string, string>) {
    comprar(async () => {
      const r = await comprarPedidoAlProveedor(pedidoId, conElegidas);
      setAviso({ ok: r.ok, texto: r.mensaje });
      if (r.ok) setLista(null);
      router.refresh();
    });
  }

  if (lista === null) {
    return (
      <>
        <button
          type="button"
          disabled={cargando}
          onClick={() =>
            pedirLista(async () => {
              setAviso(null);
              const v = await variantesDeLaVenta(pedidoId);
              setLista(v);

              /* Sin nada que elegir se compra de una: no se le pone una
                 pantalla intermedia a quien no tiene que decidir nada. */
              if (!v.some((r) => r.opciones.length > 1)) comprarAhora({});
            })
          }
          className="boton-principal gap-2 text-sm disabled:opacity-60"
        >
          {cargando || comprando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          )}
          {cargando
            ? t("mirandoVariantes")
            : comprando
              ? t("creando")
              : etiqueta}
        </button>
        {aviso ? <Aviso aviso={aviso} /> : null}
      </>
    );
  }

  if (!hayQueElegir) {
    return (
      <>
        <span className="inline-flex items-center gap-2 text-sm text-tinta-suave">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("creando")}
        </span>
        {aviso ? <Aviso aviso={aviso} /> : null}
      </>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-bold text-amber-900">{t("eligeVariante")}</p>
      <p className="mt-0.5 text-xs text-amber-800">{t("eligeVarianteTexto")}</p>

      {lista.map((r) => (
        <div key={r.productoId} className="mt-3">
          <label
            htmlFor={`v-${r.productoId}`}
            className="block text-xs font-semibold"
          >
            {r.cantidad} × {r.titulo ?? "—"}
          </label>
          <select
            id={`v-${r.productoId}`}
            value={elegidas[r.productoId] ?? r.opciones[0]?.vid ?? ""}
            onChange={(e) =>
              setElegidas((antes) => ({
                ...antes,
                [r.productoId]: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-borde bg-white px-2 py-2 text-sm"
          >
            {r.opciones.map((o, i) => (
              <option key={o.vid} value={o.vid}>
                {o.nombre}
                {o.precioCentavos !== null
                  ? ` · $${(o.precioCentavos / 100).toFixed(2)}`
                  : ""}
                {/* La primera es la que saldría sola. Decirlo evita que alguien
                    crea que el orden es el de la tienda de CJ. */}
                {i === 0 ? ` ${t("laMasBarata")}` : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={comprando}
          onClick={() => comprarAhora(elegidas)}
          className="boton-principal gap-2 text-sm disabled:opacity-60"
        >
          {comprando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          )}
          {comprando ? t("creando") : t("confirmarYComprar")}
        </button>

        <button
          type="button"
          disabled={comprando}
          onClick={() => setLista(null)}
          className="rounded-lg border border-borde px-3 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
        >
          {t("cancelar")}
        </button>
      </div>

      {aviso ? <Aviso aviso={aviso} /> : null}
    </div>
  );
}

function Aviso({ aviso }: { aviso: { ok: boolean; texto: string } }) {
  return (
    <p
      role="status"
      className={cn(
        "mt-2 flex items-start gap-2 text-sm font-medium",
        aviso.ok ? "text-precio-600" : "text-red-700",
      )}
    >
      {aviso.ok ? null : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      )}
      {aviso.texto}
    </p>
  );
}
