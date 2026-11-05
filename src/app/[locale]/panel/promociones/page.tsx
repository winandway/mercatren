import { and, asc, eq } from "drizzle-orm";
import { Megaphone } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EstadoPromocion } from "@/components/panel/ganar/estado-promocion";
import { FormularioPromocion } from "@/components/panel/ganar/formulario-promocion";
import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { productos } from "@/lib/db/schema";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { promocionesDeTienda } from "@/lib/ganar/promociones";

export const dynamic = "force-dynamic";

/**
 * PROMOCIONAR DESDE EL PANEL (5 nov 2026, Fase 4): lo mismo que en la app.
 * Un producto publicado y su presupuesto del día; la lista de promociones con
 * lo de hoy y los últimos 30 días. NADA SE COBRA TODAVÍA.
 */
export default async function PaginaPromociones({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const t = await getTranslations("panel.ganar");
  const dinero = (c: number) => formatearPrecio(c, idioma, "USD");

  const alcance = await obtenerAlcance();
  if (alcance.tipo !== "tienda") {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("promoTitulo")}
        </h1>
        <p className="text-sm text-tinta-suave">{t("soloComercio")}</p>
      </div>
    );
  }

  const [promos, publicados] = await Promise.all([
    promocionesDeTienda(alcance.tiendaId),
    getDb()
      .select({
        id: productos.id,
        tituloEs: productos.tituloEs,
        tituloEn: productos.tituloEn,
      })
      .from(productos)
      .where(
        and(
          eq(productos.tiendaId, alcance.tiendaId),
          eq(productos.estado, "publicado"),
        ),
      )
      .orderBy(asc(productos.tituloEs))
      .limit(300),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Megaphone className="h-6 w-6 text-carga-500" aria-hidden />
          {t("promoTitulo")}
        </h1>
        <p className="mt-2 text-sm text-tinta-suave">{t("promoExplica")}</p>
        <div className="mt-4">
          <FormularioPromocion
            llave={`promocionar:${alcance.tiendaId}`}
            productos={publicados.map((p) => ({
              id: p.id,
              titulo:
                idioma === "en" && p.tituloEn?.trim() ? p.tituloEn : p.tituloEs,
            }))}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold">{t("promoLista")}</h2>
        {promos.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">{t("promoNinguna")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {promos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.titulo}</p>
                  <p className="text-xs text-tinta-suave">
                    <span
                      className={
                        p.estado === "activa"
                          ? "font-semibold text-emerald-700"
                          : "font-semibold"
                      }
                    >
                      {t(
                        p.estado === "activa" ? "promoActiva" : "promoPausada",
                      )}
                    </span>
                    {" · "}
                    {t("promoPresupuestoDia", {
                      monto: dinero(p.presupuestoCentavos),
                    })}
                  </p>
                  <p className="text-xs text-tinta-suave">
                    {t("promoHoy", {
                      clics: p.hoy.clics,
                      gasto: dinero(p.hoy.gastoCentavos),
                    })}
                    {" · "}
                    {t("promo30", {
                      clics: p.ultimos30.clics,
                      gasto: dinero(p.ultimos30.gastoCentavos),
                    })}
                  </p>
                </div>
                <EstadoPromocion id={p.id} estado={p.estado} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
