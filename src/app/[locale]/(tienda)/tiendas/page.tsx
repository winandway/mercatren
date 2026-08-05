import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  DirectorioTiendas,
  type TiendaDirectorio,
} from "@/components/catalogo/directorio-tiendas";
import {
  direccionImagen,
  listarComerciosDestacados,
} from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";
import { rutaCanonica } from "@/lib/sitio";

/**
 * TODAS LAS TIENDAS, en un solo lugar.
 *
 * Antes el perfil de un vendedor solo se alcanzaba sabiéndose la dirección de
 * memoria — el dueño lo encontró a la primera: "¿cómo busca un cliente el
 * perfil de un usuario?". No había cómo. Esta página lista todos los
 * comercios activos con su logo, su ciudad y cuántos productos tienen, con un
 * buscador arriba.
 *
 * TODOS SALEN IGUALES, sin privilegios: ordenados por cuántos productos
 * tienen, que es un dato y no un favoritismo. Aquí no hay tienda de la casa.
 */
export const dynamic = "force-dynamic";

const RUTA = "/tiendas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tiendasDirectorio" });
  return {
    title: t("titulo"),
    description: t("entradilla"),
    alternates: rutaCanonica(RUTA, locale),
  };
}

export default async function PaginaTiendas({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("tiendasDirectorio");

  // Si la base no responde, la página sale vacía pero sale: el directorio
  // nunca puede tumbar la navegación.
  const comercios = await listarComerciosDestacados().catch(() => []);

  const tiendas: TiendaDirectorio[] = comercios.map((c) => ({
    slug: c.slug,
    nombre: c.nombre,
    descripcion:
      (idioma === "en"
        ? (c.descripcionEn ?? c.descripcionEs)
        : c.descripcionEs) ?? null,
    ciudad: c.ciudad ?? null,
    logoUrl: c.logoClave
      ? direccionImagen({ url: null, clave: c.logoClave })
      : null,
    cuantos: c.cuantos,
  }));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("titulo")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          {t("entradilla")}
        </p>
      </header>

      <DirectorioTiendas tiendas={tiendas} />
    </div>
  );
}
