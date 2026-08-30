import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioProducto } from "@/components/panel/formulario-producto";
import { PreguntasDelProducto } from "@/components/panel/preguntas-producto";
import { preguntasDelPanel } from "@/lib/preguntas/panel";
import { VariantesYMedidas } from "@/components/panel/variantes-producto";
import { medidasDe, variantesDe } from "@/lib/productos/variantes";
import { Link } from "@/i18n/navigation";
import { obtenerMiProducto } from "@/lib/productos/consultas";

export const dynamic = "force-dynamic";

/**
 * Edicion de un producto del comercio.
 *
 * Si el producto no es de su tienda, obtenerMiProducto devuelve null y aqui
 * sale un 404: al comercio ajeno ni siquiera se le confirma que exista.
 */
export default async function PaginaEditarProducto({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("panel.producto");
  const datos = await obtenerMiProducto(id);
  if (!datos) notFound();

  // Las variantes y las medidas viven en sus propias tablas: un producto sin
  // ellas se edita igual que siempre.
  const [variantes, medidas] = await Promise.all([
    variantesDe(datos.producto.id),
    medidasDe(datos.producto.id),
  ]);

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
          {t("tituloEditar")}
        </h1>
      </div>

      <FormularioProducto producto={datos.producto} imagenes={datos.imagenes} />

      {/* Va DESPUES del formulario y aparte: son dos cosas distintas y se
          guardan por separado. Meterlas en el mismo envio obligaria a guardar
          el producto entero para corregir una coma de una respuesta. */}
      <div className="mt-6">
        <PreguntasDelProducto
          productoId={datos.producto.id}
          preguntas={await preguntasDelPanel(datos.producto.id)}
        />
      </div>

      {/* TALLAS, COLORES Y MEDIDAS. Van fuera del formulario principal y se
          guardan por su cuenta: son opcionales, y obligar a rellenarlas para
          poder guardar el título de un tubo de PVC sería absurdo. */}
      <VariantesYMedidas
        productoId={datos.producto.id}
        moneda={datos.producto.moneda ?? "USD"}
        variantes={variantes}
        medidas={medidas}
      />
    </div>
  );
}
