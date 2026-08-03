import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioProducto } from "@/components/panel/formulario-producto";
import { Link } from "@/i18n/navigation";
import { listarMisProductos } from "@/lib/productos/consultas";

export const dynamic = "force-dynamic";

/** Alta de un producto nuevo del comercio. */
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

  return (
    <div className="space-y-6">
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

      <FormularioProducto tiendaId={tiendaId ?? undefined} />
    </div>
  );
}
