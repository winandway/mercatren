import { Radio } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { resumenDeTrafico } from "@/lib/trafico/consultas";

/**
 * EL TRÁFICO DEL SITIO (30 ago 2026). Pedido del dueño: solo PERSONAS —
 * cero robots —, de qué país llegan, qué páginas miran, cuánto se quedan,
 * cuántos hay EN VIVO, y el historial por día. Sin cookies y sin datos
 * personales: el patrón de las herramientas serias, hecho en casa.
 */
function Tarjeta({
  titulo,
  valor,
  pie,
}: {
  titulo: string;
  valor: string;
  pie?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-tinta-suave">{titulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {pie ? <p className="text-xs text-tinta-suave">{pie}</p> : null}
    </div>
  );
}

export default async function PaginaTrafico({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await exigirEquipoInterno();
  const t = await getTranslations("panel.trafico");
  const r = await resumenDeTrafico();
  const minutos = Math.floor(r.duracionMediaSegundos / 60);
  const segundos = r.duracionMediaSegundos % 60;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">{t("titulo")}</h1>
        <p className="text-sm text-tinta-suave">{t("texto")}</p>
      </header>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <Radio className="h-5 w-5 animate-pulse text-emerald-600" aria-hidden />
        <p className="text-sm font-semibold text-emerald-900">
          {t("enVivo", { n: r.enVivo })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta
          titulo={t("hoy")}
          valor={String(r.hoy.visitantes)}
          pie={t("paginasVistas", { n: r.hoy.visitas })}
        />
        <Tarjeta
          titulo={t("semana")}
          valor={String(r.semana.visitantes)}
          pie={t("paginasVistas", { n: r.semana.visitas })}
        />
        <Tarjeta
          titulo={t("mes")}
          valor={String(r.mes.visitantes)}
          pie={t("paginasVistas", { n: r.mes.visitas })}
        />
        <Tarjeta
          titulo={t("duracion")}
          valor={`${minutos}:${String(segundos).padStart(2, "0")}`}
          pie={t("duracionPie")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">
            {t("porPais")}
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {r.porPais.length === 0 ? (
              <li className="px-4 py-3 text-tinta-suave">{t("sinDatos")}</li>
            ) : (
              r.porPais.map((p) => (
                <li key={p.pais} className="flex justify-between px-4 py-2">
                  <span className="font-medium">{p.pais}</span>
                  <span className="text-tinta-suave tabular-nums">
                    {t("visitantesY", {
                      visitantes: p.visitantes,
                      visitas: p.visitas,
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">
            {t("paginasTop")}
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {r.porRuta.length === 0 ? (
              <li className="px-4 py-3 text-tinta-suave">{t("sinDatos")}</li>
            ) : (
              r.porRuta.map((p) => (
                <li
                  key={p.ruta}
                  className="flex justify-between gap-3 px-4 py-2"
                >
                  <span className="min-w-0 truncate font-mono text-xs">
                    {p.ruta}
                  </span>
                  <span className="shrink-0 text-tinta-suave tabular-nums">
                    {p.visitas}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">
            {t("porDia")}
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {r.porDia.map((d) => (
              <li key={d.dia} className="flex justify-between px-4 py-2">
                <span className="tabular-nums">{d.dia}</span>
                <span className="text-tinta-suave tabular-nums">
                  {t("visitantesY", {
                    visitantes: d.visitantes,
                    visitas: d.visitas,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">
            {t("referidos")}
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {r.referidos.length === 0 ? (
              <li className="px-4 py-3 text-tinta-suave">{t("sinDatos")}</li>
            ) : (
              r.referidos.map((f) => (
                <li key={f.referido} className="flex justify-between px-4 py-2">
                  <span className="min-w-0 truncate">{f.referido}</span>
                  <span className="shrink-0 text-tinta-suave tabular-nums">
                    {f.visitas}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
