import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  Calculator,
  Check,
  ImageIcon,
  Landmark,
  Languages,
  Mail,
  Settings,
  TriangleAlert,
  Wallet,
  Wand2,
} from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { IdiomaDelPanel } from "@/components/panel/idioma-del-panel";
import { ProbarCorreo } from "@/components/panel/probar-correo";
import { ProbarMercury } from "@/components/panel/probar-mercury";
import { AplicarAjuste } from "@/components/panel/aplicar-ajuste";
import { CalculadoraPrecio } from "@/components/panel/calculadora-precio";
import { TraerFotos } from "@/components/panel/traer-fotos";
import { contarFotosPendientes } from "@/lib/catalogo/traer-fotos";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { auditarPrecios } from "@/lib/productos/auditoria";
import { CORREO_CONTACTO, CORREO_REMITENTE } from "@/lib/correo/direcciones";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Las variables que hacen falta para cobrar.
 *
 * OJO: aqui se muestra SI ESTAN, nunca su valor. Un numero de cuenta junto a
 * su ruta ACH es justo lo que hace falta para intentar un cobro no
 * autorizado, y esta pantalla la abre gente del equipo desde cualquier sitio.
 */
const VARIABLES_DE_PAGO = [
  "PAGO_BENEFICIARIO",
  "PAGO_BANCO",
  "PAGO_CUENTA",
  "PAGO_RUTA_ACH",
  "PAGO_RUTA_WIRE",
  "ZELLE_CORREO_RECEPTOR",
  "PAGO_SOPORTE_TELEFONO",
] as const;

/** Lo que esta construido pero todavia no tiene servicio detras. */
const PENDIENTES = [
  { clave: "CLOUDFLARE_EMAIL_TOKEN", que: "correo" },
  { clave: "STRIPE_SECRET_KEY", que: "tarjeta" },
] as const;

/**
 * Configuracion: el estado real del servicio, para el equipo.
 *
 * No es una pantalla de ajustes editables: es donde se comprueba de un
 * vistazo que la operacion esta bien montada y que no falta ninguna variable
 * para poder cobrar.
 */
export default async function PaginaConfiguracion({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("panel.configuracion");
  const tf = await getTranslations("panel.fotos");
  const ta = await getTranslations("panel.configuracion.ajuste");
  const tp = await getTranslations("panel.configuracion.auditoriaPrecios");
  const tc = await getTranslations("panel.configuracion.calculadora");
  const idioma = (await getLocale()) as Idioma;

  // La auditoría de precios: de solo lectura, para responder "¿está todo
  // bien?" con datos y no con la palabra de nadie.
  const auditoria = await auditarPrecios().catch(() => ({
    revisados: 0,
    correctos: 0,
    sinBase: 0,
    aPerdida: 0,
    totalDesalineados: 0,
    desalineados: [],
  }));
  const fotosPendientes = await contarFotosPendientes();

  const { env } = getCloudflareContext();
  const puesta = (clave: string) =>
    Boolean((env as unknown as Record<string, string | undefined>)[clave]);

  const faltantes = VARIABLES_DE_PAGO.filter((v) => !puesta(v));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="h-6 w-6 text-carga-500" aria-hidden />
          {t("titulo")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      {/* El idioma, lo primero: es lo que se cambia con prisa. */}
      <section className="rounded-xl border border-carga-500/30 bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Languages className="h-4 w-4 text-carga-500" aria-hidden />
          {t("idioma.titulo")}
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("idioma.texto")}</p>
        <IdiomaDelPanel />
      </section>

      {/* Como opera el servicio. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("operacion.titulo")}</h2>
        <dl className="mt-4 divide-y divide-borde text-sm">
          {[
            /* El "3 % sobre el valor del pedido" que había aquí era un texto
               suelto del modelo viejo: no salía de ningún cálculo y hacía
               creer que ese era todo nuestro ingreso. Lo reemplaza la
               calculadora de abajo, que desglosa de verdad. */
            ["moneda", "monedaValor"],
            ["cobro", "cobroValor"],
            ["retencion", "retencionValor"],
          ].map(([etiqueta, valor]) => (
            <div
              key={etiqueta}
              className="flex flex-wrap justify-between gap-2 py-2.5"
            >
              <dt className="text-tinta-suave">{t(`operacion.${etiqueta}`)}</dt>
              <dd className="font-semibold">{t(`operacion.${valor}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Las dos direcciones de correo. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Mail className="h-4 w-4 text-carga-500" aria-hidden />
          {t("correos.titulo")}
        </h2>
        <dl className="mt-4 divide-y divide-borde text-sm">
          <div className="flex flex-wrap justify-between gap-2 py-2.5">
            <dt className="text-tinta-suave">{t("correos.recibe")}</dt>
            <dd className="font-mono font-semibold">{CORREO_CONTACTO}</dd>
          </div>
          <div className="py-2.5">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-tinta-suave">{t("correos.envia")}</dt>
              <dd className="font-mono font-semibold">{CORREO_REMITENTE}</dd>
            </div>
            <p className="mt-1 text-xs text-tinta-suave">
              {t("correos.enviaAyuda")}
            </p>
          </div>
        </dl>

        <div className="mt-4 border-t border-borde pt-4">
          <h3 className="text-sm font-semibold">{t("correos.pruebaTitulo")}</h3>
          <p className="mt-1 text-sm text-tinta-suave">
            {t("correos.pruebaTexto")}
          </p>
          <ProbarCorreo />
        </div>
      </section>

      {/* EL BANCO. Se comprueba con un botón por la misma razón que el correo:
          vive fuera del navegador, y la alternativa a probarlo aquí es que la
          primera llamada de verdad sea el retiro de un comercio. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Landmark className="h-4 w-4 text-carga-500" aria-hidden />
          {t("mercury.titulo")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("mercury.texto")}
        </p>
        <ProbarMercury />
      </section>

      {/* Las variables de cobro: solo si estan, nunca su valor. */}
      <section
        className={cn(
          "rounded-xl border p-4 sm:p-6",
          faltantes.length > 0
            ? "border-amber-300 bg-amber-50/50"
            : "border-borde bg-white",
        )}
      >
        <h2 className="flex items-center gap-2 font-bold">
          <Wallet className="h-4 w-4 text-carga-500" aria-hidden />
          {t("variables.titulo")}
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("variables.texto")}</p>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {VARIABLES_DE_PAGO.map((clave) => {
            const ok = puesta(clave);
            return (
              <li
                key={clave}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-borde"
              >
                {ok ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-precio-600"
                    aria-hidden
                  />
                ) : (
                  <TriangleAlert
                    className="h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                )}
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {clave}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    ok ? "text-precio-600" : "text-amber-700",
                  )}
                >
                  {ok ? t("variables.configurada") : t("variables.falta")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* LA CALCULADORA DEL PRECIO. Sustituye al "3 %" suelto que estaba
          arriba: aquí se ve de dónde sale cada centavo. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Calculator className="h-4 w-4 text-carga-500" aria-hidden />
          {tc("titulo")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">{tc("texto")}</p>
        <div className="mt-4">
          <CalculadoraPrecio />
        </div>
      </section>

      {/* El ajuste por procesamiento, para el catálogo de antes. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Wand2 className="h-4 w-4 text-carga-500" aria-hidden />
          {ta("titulo")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">{ta("texto")}</p>
        <div className="mt-3">
          <AplicarAjuste />
        </div>

        {/* LA AUDITORÍA. Después de que un precio se inflara solo, "está todo
            bien" no puede ser la palabra de nadie: se abre y se comprueba. */}
        <div className="mt-6 border-t border-borde pt-5">
          <h3 className="text-sm font-bold">{tp("titulo")}</h3>
          <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
            {tp("texto")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900">
              {tp("correctos", { n: auditoria.correctos })}
            </span>
            {auditoria.totalDesalineados > 0 ? (
              <span className="rounded-lg bg-amber-50 px-3 py-1.5 font-semibold text-amber-900">
                {tp("desalineados", { n: auditoria.totalDesalineados })}
              </span>
            ) : null}
            {auditoria.aPerdida > 0 ? (
              <span className="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-900">
                {tp("aPerdida", { n: auditoria.aPerdida })}
              </span>
            ) : null}
          </div>

          {auditoria.totalDesalineados === 0 ? (
            <p className="mt-3 text-sm font-semibold text-emerald-800">
              {tp("todoBien", { n: auditoria.revisados })}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-xs tracking-wide text-tinta-suave uppercase">
                    <th className="py-2 pr-3 font-semibold">
                      {tp("columnas.producto")}
                    </th>
                    <th className="py-2 pr-3 text-right font-semibold">
                      {tp("columnas.base")}
                    </th>
                    <th className="py-2 pr-3 text-right font-semibold">
                      {tp("columnas.publicado")}
                    </th>
                    <th className="py-2 text-right font-semibold">
                      {tp("columnas.deberia")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.desalineados.map((d) => (
                    <tr key={d.id} className="border-b border-borde/60">
                      <td className="py-2 pr-3">
                        <span className="line-clamp-1">{d.titulo}</span>
                        {d.aPerdida ? (
                          <span className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-800 uppercase">
                            {tp("marcaPerdida")}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatearPrecio(d.baseCentavos, idioma)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatearPrecio(d.publicadoCentavos, idioma)}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {formatearPrecio(d.deberiaCentavos, idioma)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Las fotos que todavia dependen del servidor de origen. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <ImageIcon className="h-4 w-4 text-carga-500" aria-hidden />
          {tf("titulo")}
        </h2>
        <div className="mt-3">
          <TraerFotos pendientes={fotosPendientes} />
        </div>
      </section>

      {/* Lo construido que espera su servicio. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("pendientes.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("pendientes.texto")}</p>

        <ul className="mt-4 space-y-2">
          {PENDIENTES.map((p) => {
            const ok = puesta(p.clave);
            return (
              <li
                key={p.clave}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-borde"
              >
                {ok ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-precio-600"
                    aria-hidden
                  />
                ) : (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-slate-300"
                    aria-hidden
                  />
                )}
                <span className="flex-1">{t(`pendientes.${p.que}`)}</span>
                <span className="font-mono text-xs text-tinta-suave">
                  {p.clave}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    ok ? "text-precio-600" : "text-tinta-suave",
                  )}
                >
                  {ok ? t("variables.configurada") : t("variables.falta")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
