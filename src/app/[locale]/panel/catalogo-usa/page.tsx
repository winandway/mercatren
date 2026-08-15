import { Flag } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { BuscadorCj } from "@/components/panel/cj/buscador";
import { esEquipoInterno } from "@/lib/autorizacion";
import { buscarEnCj } from "@/lib/cj/catalogo";
import { cjConfigurado } from "@/lib/cj/cliente";

export const dynamic = "force-dynamic";

/**
 * EL CATÁLOGO DE ESTADOS UNIDOS: elegir qué se vende.
 *
 * Aquí se busca en CJ y se eligen los productos. La decisión se toma viendo
 * **lo que de verdad queda** —después de CJ, el envío y Stripe—, que es algo
 * que el panel de CJ no puede enseñar porque no conoce nuestras tarifas.
 *
 * Solo el equipo interno: es el catálogo propio de Mercatren LLC, no el de un
 * comercio.
 */
export default async function PaginaCatalogoUsa({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await esEquipoInterno())) redirect(`/${locale}/panel`);

  const t = await getTranslations("panel.catalogoUsa");

  /* La búsqueda corre en el servidor: la llave de CJ no puede viajar al
     navegador ni dentro de una respuesta. */
  async function buscar(filtros: { texto?: string; pagina?: number }) {
    "use server";
    if (!(await esEquipoInterno())) {
      const te = await getTranslations("panel.catalogoUsa");
      return { ok: false as const, motivo: te("soloEquipo") };
    }
    return buscarEnCj(filtros);
  }

  const configurado = cjConfigurado();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Flag className="h-5 w-5 text-carga-500" aria-hidden />
          {t("titulo")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">{t("texto")}</p>
      </header>

      {configurado ? (
        <BuscadorCj buscar={buscar} />
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("sinLlave")}
        </p>
      )}
    </div>
  );
}
