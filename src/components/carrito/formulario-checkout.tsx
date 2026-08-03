"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, useTransition } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { sumarCarrito, useCarrito } from "@/lib/carrito/store";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { crearPedido } from "@/lib/pedidos/acciones";
import { cn } from "@/lib/utils";

const METODOS = [
  { valor: "zelle", disponible: true },
  { valor: "tarjeta", disponible: false },
  { valor: "billetera", disponible: false },
] as const;

/**
 * Cierre de la compra: a donde va y como se paga.
 *
 * Los precios que se muestran son de referencia. El pedido se arma en el
 * servidor, que vuelve a leer precios y existencias de la base.
 */
export function FormularioCheckout({ haySesion }: { haySesion: boolean }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("carrito");
  const idioma = useLocale() as Idioma;
  const router = useRouter();

  const { lineas, vaciar } = useCarrito();
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<string>("zelle");

  const enElNavegador = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!enElNavegador) return null;

  if (!haySesion) {
    return (
      <div className="rounded-xl border border-borde p-6 text-center">
        <p className="text-sm">{t("necesitaCuenta")}</p>
        <Link href="/entrar?destino=/checkout" className="boton-principal mt-4">
          {t("entrar")}
        </Link>
      </div>
    );
  }

  if (lineas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-borde px-6 py-12 text-center">
        <p className="text-sm text-tinta-suave">{tc("vacio")}</p>
        <Link href="/catalogo" className="boton-principal mt-4">
          {tc("verCatalogo")}
        </Link>
      </div>
    );
  }

  const total = sumarCarrito(lineas);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const datos = new FormData(evento.currentTarget);
    const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

    iniciarTransicion(async () => {
      const resultado = await crearPedido({
        entrega: {
          nombre: texto("nombre"),
          telefono: texto("telefono"),
          pais: texto("pais"),
          ciudad: texto("ciudad"),
          direccion: texto("direccion"),
          referencia: texto("referencia") || undefined,
          notas: texto("notas") || undefined,
        },
        metodoPago: metodo as "zelle",
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
        })),
      });

      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }

      // El pedido ya vive en el servidor: el carrito del navegador sobra.
      vaciar();
      router.push(`/pedido/${resultado.numero}`);
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-xl border border-borde p-5">
          <h2 className="text-lg font-bold">{t("entrega.titulo")}</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo
              nombre="nombre"
              etiqueta={t("entrega.nombre")}
              marcador={t("entrega.nombrePlaceholder")}
              requerido
            />
            <Campo
              nombre="telefono"
              etiqueta={t("entrega.telefono")}
              marcador={t("entrega.telefonoPlaceholder")}
              requerido
              tipo="tel"
            />
            <Campo
              nombre="pais"
              etiqueta={t("entrega.pais")}
              marcador={t("entrega.paisPlaceholder")}
              requerido
            />
            <Campo
              nombre="ciudad"
              etiqueta={t("entrega.ciudad")}
              marcador={t("entrega.ciudadPlaceholder")}
              requerido
            />
            <div className="sm:col-span-2">
              <Campo
                nombre="direccion"
                etiqueta={t("entrega.direccion")}
                marcador={t("entrega.direccionPlaceholder")}
                requerido
              />
            </div>
            <div className="sm:col-span-2">
              <Campo
                nombre="referencia"
                etiqueta={`${t("entrega.referencia")} · ${t("entrega.opcional")}`}
                marcador={t("entrega.referenciaPlaceholder")}
              />
            </div>
            <div className="sm:col-span-2">
              <Campo
                nombre="notas"
                etiqueta={`${t("entrega.notas")} · ${t("entrega.opcional")}`}
                marcador={t("entrega.notasPlaceholder")}
                area
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-borde p-5">
          <h2 className="text-lg font-bold">{t("pago.titulo")}</h2>

          <ul className="mt-4 space-y-2">
            {METODOS.map((m) => (
              <li key={m.valor}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    metodo === m.valor
                      ? "border-carga-500 bg-carga-500/5"
                      : "border-borde hover:border-riel-700",
                    !m.disponible && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={m.valor}
                    checked={metodo === m.valor}
                    disabled={!m.disponible}
                    onChange={() => setMetodo(m.valor)}
                    className="mt-1 accent-carga-500"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {t(`pago.${m.valor}`)}
                      {!m.disponible ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-tinta-suave">
                          {t("pago.proximamente")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-tinta-suave">
                      {t(`pago.${m.valor}Texto`)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-borde p-4 lg:sticky lg:top-28">
        <h2 className="text-sm font-bold">{t("resumen")}</h2>

        <ul className="mt-3 space-y-2 text-xs">
          {lineas.map((l) => (
            <li key={l.productoId} className="flex justify-between gap-2">
              <span className="line-clamp-1 text-tinta-suave">
                {l.cantidad} × {l.titulo}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatearPrecio(l.precioCentavos * l.cantidad, idioma)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 flex justify-between border-t border-borde pt-3 text-base font-bold">
          <span>{tc("total")}</span>
          <span className="tabular-nums">{formatearPrecio(total, idioma)}</span>
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pendiente}
          className="boton-principal mt-4 w-full disabled:opacity-60"
        >
          {pendiente ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t("procesando")}
            </>
          ) : (
            t("confirmar")
          )}
        </button>
      </aside>
    </form>
  );
}

function Campo({
  nombre,
  etiqueta,
  marcador,
  requerido = false,
  tipo = "text",
  area = false,
}: {
  nombre: string;
  etiqueta: string;
  marcador: string;
  requerido?: boolean;
  tipo?: string;
  area?: boolean;
}) {
  const estilo =
    "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

  return (
    <label className="block">
      <span className="text-xs font-medium">{etiqueta}</span>
      {area ? (
        <textarea
          name={nombre}
          rows={2}
          placeholder={marcador}
          className={estilo}
        />
      ) : (
        <input
          name={nombre}
          type={tipo}
          required={requerido}
          placeholder={marcador}
          className={estilo}
        />
      )}
    </label>
  );
}
