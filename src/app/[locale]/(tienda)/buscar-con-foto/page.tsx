import { getTranslations, setRequestLocale } from "next-intl/server";

import { BuscadorPorFoto } from "@/components/catalogo/buscador-por-foto";
import { busquedaPorImagenDisponible } from "@/lib/busqueda-imagen/mirar";

/**
 * LA BÚSQUEDA POR FOTO (30 ago 2026). Pedido del dueño: subes la foto de lo
 * que buscas, la IA la mira y te lleva a los resultados del catálogo — y si
 * no hay nada, dejas tu correo y el equipo lo sigue buscando.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "buscarConFoto" });
  return { title: t("titulo"), description: t("texto") };
}

export default async function PaginaBuscarConFoto({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("buscarConFoto");
  /* Sin la llave del ojo, la página lo dice en vez de dibujar un botón que
     siempre falla — la misma regla del traductor. */
  const disponible = busquedaPorImagenDisponible();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("titulo")}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("texto")}</p>
      <div className="mt-6">
        <BuscadorPorFoto disponible={disponible} />
      </div>
    </div>
  );
}
