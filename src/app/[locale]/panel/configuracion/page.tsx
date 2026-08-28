import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  Calculator,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  ImageIcon,
  Landmark,
  Languages,
  Mail,
  PackageSearch,
  RefreshCw,
  Settings,
  TriangleAlert,
  Wallet,
  Wand2,
  X,
} from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

import { IdiomaDelPanel } from "@/components/panel/idioma-del-panel";
import { Exportar } from "@/components/panel/exportar";
import { ProbarCorreo } from "@/components/panel/probar-correo";
import { ProbarCj } from "@/components/panel/probar-cj";
import { ProbarMercury } from "@/components/panel/probar-mercury";
import { SaludCatalogos } from "@/components/panel/salud-catalogos";
import { ZelleCobros } from "@/components/panel/zelle-cobros";
import { AplicarAjuste } from "@/components/panel/aplicar-ajuste";
import { CalculadoraPrecio } from "@/components/panel/calculadora-precio";
import { ProbarTraductor } from "@/components/panel/probar-traductor";
import { TraerDescripciones } from "@/components/panel/traer-descripciones";
import { RecalcularPrecios } from "@/components/panel/recalcular-precios";
import { TraducirCatalogo } from "@/components/panel/traducir-catalogo";
import { TraerFotos } from "@/components/panel/traer-fotos";
import { contarFotosPendientes } from "@/lib/catalogo/traer-fotos";
import {
  contarSinDescripcion,
  estadoDelTraductor,
  motivosDeFallo,
} from "@/lib/traduccion/acciones";
import { contarSinEnvio } from "@/lib/destino/recalcular-us";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { auditarPrecios } from "@/lib/productos/auditoria";
import { saludDeLosComercios } from "@/lib/socios/salud";
import { estadoTransferencia } from "@/lib/cobros/transferencia-admin";
import { resumenF129 } from "@/lib/impuestos/f129";
import { estadoDeTasasAutomaticas } from "@/lib/mercado/tasas";
import { TasasDelDolar } from "@/components/panel/tasas-del-dolar";
import { SOCIEDAD } from "@/lib/sociedad";
import { estadoZelleCobros } from "@/lib/cobros/zelle-admin";
import { REQUISITOS, revisarCobroPorEnlace } from "@/lib/cobros/listo";
import { ZELLE_MINIMO_CENTAVOS } from "@/lib/dinero";
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
  const tt = await getTranslations("panel.traduccion");
  const td = await getTranslations("panel.descripciones");
  const tPrecios = await getTranslations("panel.preciosUs");
  const tx = await getTranslations("panel.asiento");
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
  const traductor = await estadoDelTraductor();
  const sinDescripcion = await contarSinDescripcion();
  const motivosDescripcion = await motivosDeFallo();
  const sinEnvio = await contarSinEnvio();

  /* Si el sistema de un comercio deja de mandar sus cambios, sus productos se
     quedan congelados y aquí no se veía NADA. Esta es la pantalla que faltaba. */
  const catalogos = await saludDeLosComercios().catch(() => []);

  // Zelle en los enlaces de cobro: solo se dibuja para el rol soporte.
  const zelleCobros = await estadoZelleCobros().catch(() => null);
  /* En su propio catch: un fallo leyendo el entorno no puede tumbar la pantalla
     entera de Configuración. */
  const transferencia = await estadoTransferencia().catch(() => null);
  /* La tasa automática de cada país: DolarApi + los ajustes del dueño. */
  const tasasCrudas = await estadoDeTasasAutomaticas().catch(() => null);
  const tasas = tasasCrudas
    ? (["CL", "CO"] as const).map((pais) => {
        const r = tasasCrudas[pais];
        return {
          pais,
          centesimas: r?.centesimas ?? null,
          apiCentesimas: r?.apiCentesimas ?? null,
          ajustePb: r?.ajustePb ?? 0,
          ajusteFijoCentesimas: r?.ajusteFijoCentesimas ?? 0,
          origen: r?.origen ?? null,
          leidaEn: r?.leidaEn ? r.leidaEn.toISOString() : null,
        };
      })
    : null;
  const f129 = await resumenF129().catch(() => null);

  const { env } = getCloudflareContext();
  const puesta = (clave: string) =>
    Boolean((env as unknown as Record<string, string | undefined>)[clave]);

  const faltantes = VARIABLES_DE_PAGO.filter((v) => !puesta(v));

  /* ¿Se puede cobrar por enlace HOY? Lo que decide una prueba con un comercio
     real. Se pasan solo los NOMBRES de las variables que existen: esta
     pantalla jamás toca sus valores. */
  const listoCobro = revisarCobroPorEnlace(
    new Set(REQUISITOS.map((r) => r.clave).filter(puesta)),
  );

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

      {/* ══ ¿SE PUEDE COBRAR POR ENLACE? ══
          Va lo primero porque es lo que se mira antes de una prueba con un
          comercio de verdad. Si falta algo, falla delante del pagador con la
          tarjeta en la mano — no al configurarlo. */}
      <section
        className={cn(
          "rounded-xl border p-5",
          listoCobro.puedeCobrar
            ? listoCobro.avisos.length > 0
              ? "border-amber-300 bg-amber-50/50"
              : "border-emerald-300 bg-emerald-50/50"
            : "border-red-300 bg-red-50/60",
        )}
      >
        <h2 className="flex items-center gap-2 font-bold">
          <CreditCard className="h-4 w-4 text-carga-500" aria-hidden />
          {t("cobroEnlace.titulo")}
        </h2>
        <p className="mt-1 text-sm font-semibold">
          {listoCobro.puedeCobrar
            ? t("cobroEnlace.listo")
            : t("cobroEnlace.noListo")}
        </p>

        {listoCobro.bloqueantes.length + listoCobro.avisos.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">
            {t("cobroEnlace.todoPuesto")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...listoCobro.bloqueantes, ...listoCobro.avisos].map((r) => (
              <li
                key={r.clave}
                className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-borde"
              >
                <X
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    r.bloquea ? "text-red-600" : "text-amber-600",
                  )}
                  aria-hidden
                />
                <span>
                  <code className="font-mono text-xs font-bold">{r.clave}</code>
                  <span className="block text-tinta-suave">{r.siFalta}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      {/**
       * CJ DROPSHIPPING: el proveedor del catálogo de Estados Unidos.
       *
       * Se comprueba con un botón por el mismo motivo que el banco y el correo:
       * la llave se pega en el panel de la plataforma, donde guardar siempre
       * «funciona», y lo que falla es la primera llamada de verdad. Sin este
       * botón, esa primera llamada sería la sincronización del catálogo de
       * madrugada, sin nadie mirando.
       */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <PackageSearch className="h-4 w-4 text-carga-500" aria-hidden />
          CJ Dropshipping
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          Surte el catálogo de Estados Unidos. Comprueba que la llave
          (CJ_API_KEY) sirve y que se puede leer su catálogo.
        </p>
        <ProbarCj />
      </section>

      {/**
       * EL F129 DE CHILE: lo cobrado de IVA por trimestre.
       *
       * Se declara dentro de los 20 días del cierre del trimestre, en USD.
       * Este es el papel de trabajo: el total en pesos por trimestre, con la
       * conversión como referencia — el número final lo cierra el contador
       * con el tipo de cambio que corresponda. Sin ventas no se declara nada,
       * y eso también se ve aquí.
       */}
      {f129 !== null ? (
        <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <Landmark className="h-4 w-4 text-carga-500" aria-hidden />
            {t("f129.titulo")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
            {t("f129.texto")}
          </p>
          {f129.length === 0 ? (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              {t("f129.sinVentas")}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-xs text-tinta-suave">
                    <th className="py-2 pr-3">{t("f129.trimestre")}</th>
                    <th className="py-2 pr-3">{t("f129.pedidos")}</th>
                    <th className="py-2 pr-3">{t("f129.ventasNetas")}</th>
                    <th className="py-2">{t("f129.iva")}</th>
                  </tr>
                </thead>
                <tbody>
                  {f129.map((tr) => (
                    <tr key={tr.clave} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-bold">{tr.clave}</td>
                      <td className="py-2 pr-3 tabular-nums">{tr.pedidos}</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {tr.ventasNetasClp.toLocaleString("es-CL")} CLP
                      </td>
                      <td className="py-2 font-bold tabular-nums">
                        {tr.ivaClp.toLocaleString("es-CL")} CLP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/**
       * LA TASA DEL DÓLAR DE CADA PAÍS.
       *
       * Es lo que convierte el costo en dólares de CJ al precio en pesos de
       * mercatren.cl y .com.co. Sin tasa cargada, el catálogo de ese país no
       * puede fijar precios — y una vieja los fija con un dólar que ya no
       * existe, por eso la fecha va al lado.
       */}
      {tasas ? (
        <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <Landmark className="h-4 w-4 text-carga-500" aria-hidden />
            {t("tasasTitulo")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
            {t("tasasTexto")}
          </p>
          <div className="mt-4">
            <TasasDelDolar tasas={tasas} />
          </div>
        </section>
      ) : null}

      {/**
       * LOS CATÁLOGOS DE LOS COMERCIOS.
       *
       * Va aquí arriba y no al final: es lo que contesta «¿por qué la
       * ferretería tiene lijas que aquí no salen?» sin llamar a nadie.
       */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <RefreshCw className="h-4 w-4 text-carga-500" aria-hidden />
          {t("saludCatalogos.titulo")}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("saludCatalogos.texto")}
        </p>
        <SaludCatalogos filas={catalogos} />
      </section>

      {/**
       * ¿ESTÁ LISTA LA TRANSFERENCIA ACH?
       *
       * La transferencia solo se ofrece si están las CUATRO variables, y si
       * falta una desaparece del enlace sin decirlo en ninguna parte. Aquí se
       * ve de un vistazo, sin enseñar ni un dígito de la cuenta.
       */}
      {transferencia ? (
        <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <Landmark className="h-4 w-4 text-carga-500" aria-hidden />
            {t("transferenciaAch.titulo")}
          </h2>
          <p
            className={`mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${
              transferencia.lista
                ? "bg-emerald-50 text-emerald-900"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {transferencia.lista
              ? t("transferenciaAch.lista")
              : t("transferenciaAch.faltan")}
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
              <dt className="font-mono text-xs text-tinta-suave">
                PAGO_BENEFICIARIO
              </dt>
              <dd
                className={
                  transferencia.titularCoincide
                    ? ""
                    : "font-bold text-amber-800"
                }
              >
                {transferencia.beneficiario ?? t("transferenciaAch.sinCargar")}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
              <dt className="font-mono text-xs text-tinta-suave">PAGO_BANCO</dt>
              <dd>{transferencia.banco ?? t("transferenciaAch.sinCargar")}</dd>
            </div>
            {/* De estas dos NUNCA sale el valor: con los últimos dígitos y el
                banco, alguien con la mitad del dato tiene más de lo que debe. */}
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
              <dt className="font-mono text-xs text-tinta-suave">
                PAGO_CUENTA
              </dt>
              <dd>
                {transferencia.cuentaCargada
                  ? t("transferenciaAch.cargada")
                  : t("transferenciaAch.sinCargar")}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="font-mono text-xs text-tinta-suave">
                PAGO_RUTA_ACH
              </dt>
              <dd>
                {transferencia.rutaAchCargada
                  ? t("transferenciaAch.cargada")
                  : t("transferenciaAch.sinCargar")}
              </dd>
            </div>
          </dl>

          {!transferencia.titularCoincide && transferencia.beneficiario ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {t("transferenciaAch.titularDistinto", {
                sociedad: SOCIEDAD.nombre,
              })}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-tinta-suave">
            {t("transferenciaAch.ayuda")}
          </p>
        </section>
      ) : null}

      {zelleCobros ? (
        <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <Landmark className="h-4 w-4 text-carga-500" aria-hidden />
            {t("zelleCobros.titulo")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
            {t("zelleCobros.texto")}
          </p>
          <div className="mt-4">
            <ZelleCobros
              minimoGlobalCentavos={zelleCobros.minimoGlobalCentavos}
              maximoGlobalCentavos={zelleCobros.maximoGlobalCentavos}
              respaldoCentavos={ZELLE_MINIMO_CENTAVOS}
              tiendas={zelleCobros.tiendas}
            />
          </div>
        </section>
      ) : null}

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
          <h3 className="text-sm font-bold">{tPrecios("titulo")}</h3>
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
                        {formatearPrecio(d.baseCentavos, idioma, "USD")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatearPrecio(d.publicadoCentavos, idioma, "USD")}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {formatearPrecio(d.deberiaCentavos, idioma, "USD")}
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

      {/* El catalogo de EE. UU. entra en ingles porque CJ no publica español. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Languages className="h-4 w-4 text-carga-500" aria-hidden />
          {tt("titulo")}
        </h2>
        <p className="text-riel-600 mt-1 text-sm">{tt("explicacion")}</p>
        <div className="mt-3">
          <TraducirCatalogo
            pendientes={traductor.sinTraducir}
            configurado={traductor.configurado}
          />
          {/* Antes de escribir en el catalogo publicado, ver que sale. */}
          <ProbarTraductor />
        </div>
      </section>

      {/* Los 1.071 entraron sin descripcion: CJ no la da en su buscador. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <FileText className="h-4 w-4 text-carga-500" aria-hidden />
          {td("titulo")}
        </h2>
        <p className="text-riel-600 mt-1 text-sm">{td("explicacion")}</p>
        <div className="mt-3">
          <TraerDescripciones
            pendientes={sinDescripcion}
            configurado={traductor.configurado}
            motivos={motivosDescripcion}
          />
        </div>
      </section>

      {/* El asiento del mes para llevarlo a Xero a mano. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Calculator className="h-4 w-4 text-carga-500" aria-hidden />
          {tx("titulo")}
        </h2>
        <p className="text-riel-600 mt-1 text-sm">{tx("explicacion")}</p>
        <div className="mt-3">
          <Exportar que="asiento" />
        </div>
      </section>

      {/* Los que se publicaron con el envio en cero: cada venta deja menos. */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <DollarSign className="h-4 w-4 text-carga-500" aria-hidden />
          {tp("titulo")}
        </h2>
        <p className="text-riel-600 mt-1 text-sm">{tPrecios("explicacion")}</p>
        <div className="mt-3">
          <RecalcularPrecios pendientes={sinEnvio} />
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
