import { ImageOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import type { ProductoLista } from "@/lib/catalogo/consultas";
import { cn } from "@/lib/utils";

/** Cuando quedan pocas unidades se avisa, para que el cliente no se quede sin. */
const POCAS_UNIDADES = 5;

export async function TarjetaProducto({
  producto,
  idioma,
}: {
  producto: ProductoLista;
  idioma: Idioma;
}) {
  const t = await getTranslations("catalogo.producto");

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

  return (
    <Link
      href={`/producto/${producto.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-borde bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {producto.imagenUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={producto.imagenUrl}
            alt={producto.imagenAlt ?? titulo}
            loading="lazy"
            className={cn(
              "h-full w-full object-contain transition-transform duration-300 group-hover:scale-105",
              agotado && "opacity-50",
            )}
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-tinta-suave">
            <ImageOff className="h-8 w-8" aria-hidden />
            <span className="text-xs">{t("sinFoto")}</span>
          </span>
        )}

        {ahorro ? (
          <span className="absolute top-2 left-2 rounded-full bg-carga-500 px-2 py-0.5 text-[11px] font-bold text-riel-950">
            {t("ahorras", { monto: formatearPrecio(ahorro, idioma) })}
          </span>
        ) : null}

        {agotado ? (
          <span className="absolute inset-x-0 bottom-0 bg-riel-900/90 py-1.5 text-center text-xs font-semibold text-white">
            {t("sinExistencias")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {producto.marca ? (
          <p className="text-[11px] tracking-wide text-tinta-suave uppercase">
            {producto.marca}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-carga-600">
          {titulo}
        </h3>

        <div className="mt-2">
          <p className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums">
              {formatearPrecio(
                producto.precioCentavos,
                idioma,
                producto.moneda,
              )}
            </span>
            {producto.unidad ? (
              <span className="text-xs text-tinta-suave">
                {t("porUnidad", { unidad: producto.unidad })}
              </span>
            ) : null}
          </p>
          {producto.precioAntesCentavos ? (
            <p className="text-xs text-tinta-suave tabular-nums line-through">
              {formatearPrecio(producto.precioAntesCentavos, idioma)}
            </p>
          ) : null}
        </div>

        {pocas ? (
          <p className="mt-1 text-xs font-semibold text-carga-600">
            {t("ultimasUnidades")}
          </p>
        ) : null}

        <p className="mt-auto pt-2 text-xs text-tinta-suave">
          {t("vendidoPor")}{" "}
          <span className="font-medium">{producto.tiendaNombre}</span>
        </p>
      </div>
    </Link>
  );
}
