import { eq } from "drizzle-orm";
import { ArrowLeft, Store } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BuscadorDeComercio } from "@/components/panel/facturar/buscador-de-comercio";
import { FormularioProducto } from "@/components/panel/formulario-producto";
import { Link } from "@/i18n/navigation";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { listarMisProductos } from "@/lib/productos/consultas";
import { listarComercios } from "@/lib/zelle/consultas";

export const dynamic = "force-dynamic";

/**
 * Alta de un producto nuevo del comercio.
 *
 * ══ PRIMERO LA TIENDA, DESPUÉS LA FICHA (5 sep 2026) ══
 *
 * Un comercio tiene una sola tienda y no hay nada que elegir. El equipo
 * puede cargar productos para cualquiera, y hasta hoy esta pantalla le
 * dibujaba la ficha entera SIN saber para cuál: se llenaba todo —título,
 * descripción en dos idiomas, precio, fotos— y al guardar el servidor
 * contestaba «no se sabe a qué tienda va este producto». Diez minutos de
 * trabajo tirados, y desde su silla, «se borró todo».
 *
 * Ahora, si no hay tienda, no hay ficha: se elige primero (el mismo buscador
 * de la calculadora), y la ficha sale diciendo para quién es.
 */
export default async function PaginaProductoNuevo({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("panel.producto");
  const { comercio } = await searchParams;

  // Solo para saber a que tienda pertenece; no se listan productos.
  const { tiendaId } = await listarMisProductos({ comercio, pagina: 1 });

  const cabecera = (
    <div>
      <Link
        href="/panel/productos"
        className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("volver")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        {t("tituloNuevo")}
      </h1>
    </div>
  );

  if (!tiendaId) {
    /* El equipo sin tienda elegida. A un vendedor no le pasa: su alcance ya
       trae la suya. `listarComercios` respeta el país que el panel mira. */
    const comercios = (await listarComercios().catch(() => [])).map((c) => ({
      id: c.id,
      slug: c.slug,
      nombre: c.nombre,
    }));
    return (
      <div className="space-y-6">
        {cabecera}
        <div className="max-w-xl space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <Store className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{t("eligeTiendaPrimero")}</span>
          </p>
          <BuscadorDeComercio
            comercios={comercios}
            elegido={null}
            titulo={t("paraQueComercio")}
          />
        </div>
      </div>
    );
  }

  /* De dónde sale la mercancía: decide si se pide ciudad de retiro
     (Venezuela) o se dice que se despacha (EE. UU., Chile, Colombia). */
  const [tienda] = await getDb()
    .select({ nombre: tiendas.nombre, paisOrigen: tiendas.paisOrigen })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  return (
    <div className="space-y-6">
      {cabecera}
      {tienda ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-riel-900 px-3 py-1.5 text-sm font-semibold text-white">
          <Store className="h-3.5 w-3.5" aria-hidden />
          {t("paraTienda", { tienda: tienda.nombre })}
        </p>
      ) : null}
      <FormularioProducto tiendaId={tiendaId} paisOrigen={tienda?.paisOrigen} />
    </div>
  );
}
