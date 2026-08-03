import { ImageOff, Package, Plus, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccionesProducto } from "@/components/panel/acciones-producto";
import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { contarPorEstado, listarMisProductos } from "@/lib/productos/consultas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONO_ESTADO: Record<string, string> = {
  publicado: "bg-emerald-100 text-emerald-900",
  borrador: "bg-slate-200 text-slate-700",
  agotado: "bg-amber-100 text-amber-900",
};

/**
 * "Mis productos": la mesa de trabajo del comercio.
 *
 * A diferencia del catalogo publico, aqui SI se ven los borradores y los
 * agotados. Cada fila lleva su accion mas usada a la vista (publicar o
 * retirar) porque eso es lo que se hace veinte veces al dia; lo demas va en
 * el menu de tres puntos.
 */
export default async function PaginaMisProductos({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; estado?: string; comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.misProductos");
  const filtros = await searchParams;

  const estado = ["publicado", "borrador", "agotado"].includes(
    filtros.estado ?? "",
  )
    ? (filtros.estado as "publicado" | "borrador" | "agotado")
    : undefined;

  const [datos, conteo] = await Promise.all([
    listarMisProductos({
      busqueda: filtros.q,
      estado,
      comercio: filtros.comercio,
    }),
    contarPorEstado(filtros.comercio),
  ]);

  if (!datos.tiendaId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("sinTienda")}
        </p>
      </div>
    );
  }

  const pestanas = [
    { clave: undefined, texto: t("estados.todos"), n: conteo.total },
    { clave: "publicado", texto: t("estados.publicado"), n: conteo.publicado },
    { clave: "borrador", texto: t("estados.borrador"), n: conteo.borrador },
    { clave: "agotado", texto: t("estados.agotado"), n: conteo.agotado },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
            {t("subtitulo")}
          </p>
        </div>
        <Link href="/panel/productos/nuevo" className="boton-principal gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          {t("nuevo")}
        </Link>
      </header>

      {/* Buscador y pestanas. En celular el buscador va arriba y solo. */}
      <div className="space-y-3">
        <form className="flex gap-2">
          {estado ? <input type="hidden" name="estado" value={estado} /> : null}
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={filtros.q ?? ""}
              placeholder={t("buscar")}
              className="w-full rounded-lg border border-borde bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
            />
          </div>
        </form>

        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {pestanas.map((p) => {
            const activa = (p.clave ?? undefined) === estado;
            const destino = new URLSearchParams();
            if (p.clave) destino.set("estado", p.clave);
            if (filtros.q) destino.set("q", filtros.q);
            if (filtros.comercio) destino.set("comercio", filtros.comercio);

            return (
              <Link
                key={p.texto}
                href={`/panel/productos${destino.size ? `?${destino}` : ""}`}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  activa
                    ? "bg-riel-900 text-white"
                    : "bg-white text-tinta-suave ring-1 ring-borde hover:ring-carga-500",
                )}
              >
                {p.texto} <span className="tabular-nums opacity-70">{p.n}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {datos.productos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-tinta-suave" aria-hidden />
          <p className="mt-4 text-sm text-tinta-suave">
            {conteo.total === 0 ? t("vacio") : t("sinResultados")}
          </p>
          {conteo.total === 0 ? (
            <Link
              href="/panel/productos/nuevo"
              className="boton-principal mt-5 gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("vacioBoton")}
            </Link>
          ) : null}
        </div>
      ) : (
        /* Una lista de tarjetas, no una tabla: en el telefono una tabla de
           cinco columnas no se puede leer sin hacer zoom. */
        <ul className="space-y-2">
          {datos.productos.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-borde bg-white p-3"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                {p.imagenUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.imagenUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageOff className="h-5 w-5 text-tinta-suave" aria-hidden />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm leading-snug font-medium">
                  {p.tituloEs}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-suave">
                  <span className="font-semibold text-tinta tabular-nums">
                    {formatearPrecio(p.precioCentavos, idioma)}
                  </span>
                  <span className="tabular-nums">
                    {p.controlaExistencias
                      ? `${p.existencias}${p.unidad ? ` ${p.unidad}` : ""}`
                      : t("sinControl")}
                  </span>
                  {p.sku ? <span className="truncate">{p.sku}</span> : null}
                </p>
              </div>

              <span
                className={cn(
                  "hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline",
                  TONO_ESTADO[p.estado],
                )}
              >
                {t(`estados.${p.estado}`)}
              </span>

              <AccionesProducto
                id={p.id}
                slug={p.slug}
                estado={p.estado}
                textos={{
                  acciones: t("acciones"),
                  editar: t("editar"),
                  publicar: t("publicar"),
                  despublicar: t("despublicar"),
                  verEnTienda: t("verEnTienda"),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
