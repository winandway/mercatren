import { eq } from "drizzle-orm";
import { ExternalLink, RefreshCw } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioMiTienda } from "@/components/panel/formulario-mi-tienda";
import { FormularioEnvio } from "@/components/panel/envios/formulario-envio";
import { SelectorColor } from "@/components/panel/marca/selector-color";
import { SincronizarCatalogo } from "@/components/panel/sincronizar-catalogo";
import { Link } from "@/i18n/navigation";
import { obtenerAlcance } from "@/lib/autorizacion";
import { saludDeSincronizacion } from "@/lib/catalogo/salud-sincronizacion";
import { getDb } from "@/lib/db";
import { fuentesCatalogo, tiendas } from "@/lib/db/schema";
import type { Idioma } from "@/lib/dinero";
import { fechaHora } from "@/lib/fechas";
import { politicaDeEnvio } from "@/lib/envios/consultas";
import { colorGuardado } from "@/lib/marca/acciones";
import { RUTA_MEDIA } from "@/lib/rutas";

export const dynamic = "force-dynamic";

/**
 * "Mi tienda": donde el comercio se administra a si mismo.
 *
 * Un vendedor edita la SUYA, siempre: la tienda sale del alcance de la sesion,
 * nunca de la direccion. El equipo de Mercatren puede abrir la de un comercio
 * concreto con ?comercio=slug.
 */
export default async function PaginaMiTienda({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("panel.miTienda");
  const ts = await getTranslations("panel.sincronizacion");
  const alcance = await obtenerAlcance();
  const { comercio } = await searchParams;

  const db = getDb();
  const [tienda] =
    alcance.tipo === "tienda"
      ? await db
          .select()
          .from(tiendas)
          .where(eq(tiendas.id, alcance.tiendaId))
          .limit(1)
      : comercio
        ? await db
            .select()
            .from(tiendas)
            .where(eq(tiendas.slug, comercio))
            .limit(1)
        : await db.select().from(tiendas).limit(1);

  if (!tienda) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("sinTienda")}
        </p>
      </div>
    );
  }

  // Como despacha. Un comercio sin fila devuelve "sin definir", que no es lo
  // mismo que "no envia": es que todavia no lo dijo.
  const envio = await politicaDeEnvio(tienda.id);
  // Null si nunca eligió: el selector le enseña el que se le derivó del nombre.
  const color = await colorGuardado(tienda.id);

  // La fuente de catalogo del comercio, si tiene una.
  const [fuente] = await db
    .select()
    .from(fuentesCatalogo)
    .where(eq(fuentesCatalogo.tiendaId, tienda.id))
    .limit(1);

  const enBucket = (clave: string | null) =>
    clave ? `${RUTA_MEDIA}/${clave}` : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
            {t("subtitulo")}
          </p>
        </div>

        <Link
          href={`/tienda/${tienda.slug}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-borde bg-white px-3 py-2 text-xs font-semibold transition-colors hover:border-carga-500"
        >
          {t("verTienda")}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      {/* Si el comercio trae su catalogo de otro sistema, aqui lo conecta. */}
      {fuente ? (
        <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <RefreshCw className="h-4 w-4 text-carga-500" aria-hidden />
            {ts("titulo")}
          </h2>
          <div className="mt-3">
            <SincronizarCatalogo
              fuenteId={fuente.id}
              url={fuente.url}
              ultima={
                fuente.ultimaSincronizacion
                  ? fechaHora(fuente.ultimaSincronizacion, locale as Idioma)
                  : null
              }
              ultimoResultado={fuente.ultimoResultado}
              /* La salud se calcula EN EL SERVIDOR: el reloj del navegador de
                 quien mira puede estar corrido y daría una alarma falsa. */
              salud={saludDeSincronizacion(
                fuente.ultimaSincronizacion,
                new Date(),
                {
                  tieneDireccion: Boolean(fuente.url?.trim()),
                },
              )}
            />
          </div>
        </section>
      ) : null}

      <FormularioMiTienda
        tienda={{
          id: tienda.id,
          nombre: tienda.nombre,
          descripcionEs: tienda.descripcionEs,
          descripcionEn: tienda.descripcionEn,
          logoUrl: enBucket(tienda.logoClave),
          portadaUrl: enBucket(tienda.portadaClave),
          razonSocial: tienda.razonSocial,
          identificacionFiscal: tienda.identificacionFiscal,
          correoContacto: tienda.correoContacto,
          telefono: tienda.telefono,
          direccion: tienda.direccion,
          ciudad: tienda.ciudad,
          sitioWeb: tienda.sitioWeb,
          horario: tienda.horario,
        }}
      />

      {/* Cómo despacha. Va después de la ficha porque lo primero es quién es
          el comercio; pero antes de nada en la página pública, porque es lo
          que el comprador necesita para decidir. */}
      <FormularioEnvio tiendaId={tienda.id} inicial={envio} />

      <SelectorColor
        tiendaId={tienda.id}
        nombre={tienda.nombre}
        logoUrl={enBucket(tienda.logoClave)}
        inicial={color}
      />
    </div>
  );
}
