"use client";

import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { BotonAgregarRapido } from "@/components/catalogo/boton-agregar-rapido";
import { PrecioTienda } from "@/components/catalogo/precio-tienda";
import { Link } from "@/i18n/navigation";
import type { ProductoLista } from "@/lib/catalogo/consultas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/** Cuando quedan pocas unidades se avisa, para que el cliente no se quede sin. */
const POCAS_UNIDADES = 5;

/**
 * El producto como se ve en una lista.
 *
 * La foto manda: ocupa casi toda la tarjeta, sobre fondo blanco y sin marco,
 * que es como se ven las tiendas de verdad. Lo demas acompana.
 *
 * VA EN EL NAVEGADOR ("use client") aunque no tenga ni un boton. La razon es
 * la parrilla que carga sola al bajar: esa si es de cliente, y una tarjeta de
 * servidor no puede vivir dentro. Como aqui lo unico que hacia falta del
 * servidor eran cuatro etiquetas traducidas, se leen con `useTranslations` y
 * la tarjeta sirve igual en los dos lados.
 */
export function TarjetaProducto({
  producto,
  idioma,
}: {
  producto: ProductoLista;
  idioma: Idioma;
}) {
  const t = useTranslations("catalogo.producto");

  // Si el comercio no tiene traduccion, se muestra el espanol. No se inventa.
  const titulo =
    idioma === "en"
      ? (producto.tituloEn ?? producto.tituloEs)
      : producto.tituloEs;

  const agotado = producto.controlaExistencias && producto.existencias <= 0;
  const pocas =
    producto.controlaExistencias &&
    producto.existencias > 0 &&
    producto.existencias <= POCAS_UNIDADES;

  const ahorro =
    producto.precioAntesCentavos &&
    producto.precioAntesCentavos > producto.precioCentavos
      ? producto.precioAntesCentavos - producto.precioCentavos
      : null;

  const descuento = ahorro
    ? Math.round((ahorro / producto.precioAntesCentavos!) * 100)
    : null;

  return (
    <Link
      href={`/producto/${producto.slug}`}
      /* Menos relleno en el celular: con tres por hilera cada tarjeta mide
         unos 110px, y 12px de aire por lado se comen la foto. */
      className="group flex h-full flex-col rounded-xl bg-white p-1.5 transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(16,38,58,0.12)] sm:p-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        {producto.imagenUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={producto.imagenUrl}
            alt={producto.imagenAlt ?? titulo}
            loading="lazy"
            className={cn(
              "h-full w-full object-contain transition-transform duration-300 group-hover:scale-105",
              agotado && "opacity-40",
            )}
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-50 text-tinta-suave">
            <ImageOff className="h-7 w-7" aria-hidden />
            <span className="text-xs">{t("sinFoto")}</span>
          </span>
        )}

        {descuento ? (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{descuento}%
          </span>
        ) : null}

        {agotado ? (
          <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-riel-900/90 py-1 text-center text-[11px] font-semibold text-white">
            {t("sinExistencias")}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-1 flex-col">
        {producto.marca ? (
          <p className="truncate text-[11px] font-medium tracking-wide text-tinta-suave uppercase">
            {producto.marca}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-sm leading-snug group-hover:text-carga-600">
          {titulo}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
          <PrecioTienda
            centavos={producto.precioCentavos}
            idioma={idioma}
            moneda={producto.moneda}
          />
          {producto.unidad ? (
            <span className="text-xs text-tinta-suave">
              {t("porUnidad", { unidad: producto.unidad })}
            </span>
          ) : null}
        </div>

        {producto.precioAntesCentavos ? (
          <p className="text-xs text-tinta-suave tabular-nums line-through">
            {formatearPrecio(producto.precioAntesCentavos, idioma)}
          </p>
        ) : null}

        {pocas ? (
          <p className="mt-1 text-xs font-semibold text-carga-600">
            {t("ultimasUnidades")}
          </p>
        ) : null}

        <p className="mt-auto truncate pt-2 text-xs text-tinta-suave">
          {producto.tiendaNombre}
        </p>

        {/* Agregar sin abrir el producto: en ferretería se llevan diez cosas
            chiquitas, y abrir-agregar-volver diez veces cansa a cualquiera. */}
        <div className="mt-2">
          <BotonAgregarRapido
            agotado={agotado}
            linea={{
              productoId: producto.id,
              slug: producto.slug,
              titulo,
              precioCentavos: producto.precioCentavos,
              moneda: producto.moneda,
              imagenUrl: producto.imagenUrl,
              tiendaNombre: producto.tiendaNombre,
              tiendaSlug: producto.tiendaSlug,
              unidad: producto.unidad,
              maximo: producto.controlaExistencias
                ? producto.existencias
                : null,
            }}
          />
        </div>
      </div>
    </Link>
  );
}
