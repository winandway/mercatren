"use client";

import {
  AlertTriangle,
  Check,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState, useTransition } from "react";

import { ElegirVariantes } from "@/components/panel/elegir-variantes";
import {
  archivarFacturaDelProveedor,
  comprobarEnProveedor,
  cerrarCompraComoPrueba,
  cerrarVentaSinCompra,
  descartarCompra,
  pagarConSaldoDesdePanel,
  marcarCompraPagada,
  type CompraAlProveedor,
} from "@/lib/cj/proveedor-acciones";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * LA LISTA DE PEDIDOS EN EL PANEL DE CJ.
 *
 * ══ ESTA DIRECCIÓN ESTÁ COMPROBADA, NO ADIVINADA (18 ago 2026) ══
 *
 * La primera versión decía `app.cjdropshipping.com/dashboard/order/list`, que
 * me inventé. **Redirige a una ruta que no existe y CJ contesta con su 404**,
 * que además se va solo a su portada a los cuatro segundos. El dueño la abrió
 * dos veces, en dos navegadores, creyendo que era cosa de su sesión.
 *
 * Comprobado con peticiones de verdad: esta devuelve **200**, la inventada
 * devolvía **302** hacia el 404, y una ruta falsa a propósito también daba 302.
 * Si CJ vuelve a cambiar su panel, esto es una línea — pero se cambia
 * comprobando, no a ojo.
 */
const PEDIDOS_EN_CJ =
  "https://www.cjdropshipping.com/mine/dropshipping/orderList?orderType=6";

/**
 * LA COLA DE COMPRAS AL PROVEEDOR.
 *
 * Arriba las ventas que todavía no se le pidieron a nadie —cada una es un
 * comprador esperando una caja que no existe— y debajo lo ya pedido, con su
 * botón de pagar.
 *
 * El botón de pagar es un enlace de verdad a la pasarela del proveedor y abre
 * en pestaña nueva: se paga allá y se vuelve aquí a marcarlo. Marcar y pagar
 * son dos actos separados a propósito — el pago ocurre fuera de este sistema y
 * fingir que lo sabemos sería inventar un dato.
 */
export function PedidosProveedor({
  sinComprar,
  compras,
}: {
  /* Los montos llegan YA FORMATEADOS, no como centavos con una función que
     los pinte: una función no cruza la frontera del servidor al navegador, y
     formatear en dos sitios distintos es como se acaban viendo dos cifras
     distintas del mismo dinero. */
  sinComprar: Array<{
    id: string;
    numero: string;
    /* Al lado del botón de cerrar: sin esto no se distingue una prueba
       nuestra de la venta de un cliente que sí espera su caja. */
    correoComprador: string | null;
    montoTexto: string;
  }>;
  compras: Array<CompraAlProveedor & { costoTexto: string | null }>;
}) {
  const t = useTranslations("panel.proveedor");

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold">{t("sinComprar")}</h2>
        {sinComprar.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">
            {t("sinComprarVacio")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sinComprar.map((v) => (
              <FilaSinComprar key={v.id} venta={v} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-bold">{t("cola")}</h2>
        {compras.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">{t("colaVacia")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {compras.map((c) => (
              <FilaCompra key={c.id} compra={c} monto={c.costoTexto} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilaSinComprar({
  venta,
}: {
  venta: {
    id: string;
    numero: string;
    correoComprador: string | null;
    montoTexto: string;
  };
}) {
  const t = useTranslations("panel.proveedor");
  const router = useRouter();
  const [aviso, setAviso] = useState<string | null>(null);
  const [cerrando, iniciar] = useTransition();

  return (
    <li className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-bold">{venta.numero}</span>
        <span className="text-sm text-tinta-suave">{venta.montoTexto}</span>

        {/* NO compra al primer clic: abre la lista de tallas y colores. El
            dueño pulsó «crear el pedido» y la talla le apareció después, con el
            pedido ya creado en CJ y sin forma de cambiarla. */}
        <span className="ml-auto">
          <ElegirVariantes pedidoId={venta.id} etiqueta={t("comprar")} />
        </span>
      </div>

      {/**
       * CERRAR UNA VENTA QUE FUE UNA PRUEBA (4 sep 2026).
       *
       * Esta cola es la que dispara la alerta ROJA de «venta pagada sin pedido
       * al proveedor», cada seis horas, por correo. Una prueba del equipo no
       * tiene a quién comprarle nada y se quedaba aquí para siempre.
       *
       * NO toca el pedido ni el cobro: solo saca la venta de esta cola. Y el
       * correo del comprador va al lado, porque cerrar la de un cliente de
       * verdad sería dejarlo esperando una caja que nadie va a pedir.
       */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-amber-300/60 pt-2">
        <span className="text-xs text-amber-900">
          {t("comprador")}{" "}
          <span className="font-semibold">
            {venta.correoComprador ?? t("compradorDesconocido")}
          </span>
        </span>
        <button
          type="button"
          disabled={cerrando}
          onClick={() =>
            iniciar(async () => {
              if (!window.confirm(t("cerrarVentaConfirmar"))) return;
              const r = await cerrarVentaSinCompra(venta.id);
              setAviso(r.mensaje);
              router.refresh();
            })
          }
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:border-amber-600 disabled:opacity-60"
        >
          {cerrando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {t("cerrarPrueba")}
        </button>
      </div>

      {aviso ? (
        <p role="status" className="mt-2 text-sm font-medium text-precio-600">
          {aviso}
        </p>
      ) : null}
    </li>
  );
}

function FilaCompra({
  compra,
  monto,
}: {
  compra: CompraAlProveedor & { costoTexto: string | null };
  monto: string | null;
}) {
  const t = useTranslations("panel.proveedor");
  const router = useRouter();
  const [aviso, setAviso] = useState<string | null>(null);
  const [marcando, iniciar] = useTransition();

  const porPagar = compra.estado === "por_pagar";
  const conError = compra.estado === "con_error";

  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-2.5",
        conError
          ? "border-red-200 bg-red-50"
          : porPagar
            ? "border-carga-500/40 bg-white"
            : "border-borde bg-white",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-bold">{compra.numero}</span>

        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            conError
              ? "bg-red-100 text-red-800"
              : porPagar
                ? "text-carga-700 bg-carga-500/15"
                : "bg-emerald-50 text-precio-600",
          )}
        >
          {t(`estados.${compra.estado}`)}
        </span>

        <span className="text-sm text-tinta-suave">
          {monto ? `${t("costo")} ${monto}` : t("sinCosto")}
        </span>

        {compra.externoNumero ? (
          <span className="text-xs text-tinta-suave">
            {t("suPedido")} {compra.externoNumero}
          </span>
        ) : null}

        {compra.guia ? (
          <span className="text-xs font-semibold">
            {t("guia")} {compra.guia}
          </span>
        ) : null}

        {porPagar && compra.urlPago ? (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            {/* Enlace de verdad a la pasarela del proveedor, en pestaña nueva:
                se paga allá y se vuelve aquí a dejar la constancia. */}
            <a
              href={compra.urlPago}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-principal gap-2 text-sm"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {t("pagar")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>

            <button
              type="button"
              disabled={marcando}
              onClick={() =>
                iniciar(async () => {
                  const r = await marcarCompraPagada(compra.id);
                  setAviso(r.mensaje);
                  router.refresh();
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
            >
              {marcando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {t("yaPague")}
            </button>
          </span>
        ) : null}
      </div>

      {conError && compra.ultimoError ? (
        <p className="mt-2 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {/* El motivo del proveedor, entero: un «no se pudo» obliga a
              adivinar entre el transporte, el SKU y la dirección. */}
          {compra.ultimoError}
        </p>
      ) : null}

      {/**
       * REINTENTAR, QUE ES LO QUE FALTABA.
       *
       * Una compra con error no tenía ningún botón, y a la vez desaparecía de
       * «ventas esperando» porque su fila ya existía. El pedido quedaba en un
       * callejón sin salida: el comprador había pagado y no había forma de
       * volver a intentarlo sin meter mano en la base.
       */}
      {conError ? (
        <div className="mt-2">
          <ElegirVariantes
            pedidoId={compra.pedidoId}
            etiqueta={t("reintentar")}
          />
        </div>
      ) : null}

      {/**
       * «POR PAGAR» PERO SIN ENLACE: EL OTRO CALLEJÓN SIN SALIDA (18 ago 2026).
       *
       * Con `createOrderV3` el pedido se creaba bien y CJ **no devolvía el
       * enlace de pago**. La fila quedaba en «Por pagar», con el aviso de que no
       * hubo enlace, y **sin un solo botón**: ni pagar, ni reintentar, porque
       * reintentar solo salía con error. El dueño se quedó mirando una pantalla
       * que no le dejaba hacer nada, con el comprador ya cobrado.
       *
       * El fondo se arregló pasando a `createOrderV2`, que sí lo devuelve. Esto
       * es la salida para las filas que quedaron atrapadas antes: se vuelve a
       * pedir —ahora por V2— o se abre el panel de CJ a pagarlo a mano.
       */}
      {porPagar && !compra.urlPago ? (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t("sinEnlace")}
          </p>
          <div className="mt-2 flex flex-wrap items-start gap-2">
            {/* ══ PAGAR CON EL SALDO, EN UN CLIC (1 sep 2026) ══
                Confirma el pedido en CJ si hace falta y lo cobra del saldo.
                Es lo que antes decía «ábrelo en su panel y págalo ahí». */}
            <button
              type="button"
              disabled={marcando}
              onClick={() =>
                iniciar(async () => {
                  const r = await pagarConSaldoDesdePanel(compra.id);
                  setAviso(r.mensaje);
                  router.refresh();
                })
              }
              className="boton-principal gap-2 text-sm"
            >
              {marcando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Wallet className="h-4 w-4" aria-hidden />
              )}
              {t("pagarConSaldo")}
            </button>
            {/**
             * AQUÍ NO VA UN «VOLVER A INTENTARLO», Y ES A PROPÓSITO.
             *
             * Volver a crear NO recupera el enlace: **crea un SEGUNDO pedido en
             * CJ**, y dos pedidos del mismo producto es pagar dos veces. Y
             * comprobado en su documentación, `cjPayUrl` **solo llega al crear**
             * — ningún endpoint de consulta lo devuelve.
             *
             * Así que se paga en su panel, y desde aquí se pregunta cómo va:
             * eso sí trae el costo real, el envío y la guía.
             */}
            <button
              type="button"
              disabled={marcando}
              onClick={() =>
                iniciar(async () => {
                  const r = await comprobarEnProveedor(compra.id);
                  setAviso(r.mensaje);
                  router.refresh();
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
            >
              {marcando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              {t("comprobar")}
            </button>
            {/**
             * DESCARTAR, PARA PODER VOLVER A PEDIRLO CON OTRA TALLA.
             *
             * Cuando CJ rechaza el pago por «Insufficient inventory» no hay
             * arreglo posible sobre ese pedido: la talla no está en su almacén.
             * Esto marca NUESTRA fila como fallida para poder pedirlo de nuevo
             * —ahora solo con tallas que sí tienen existencia allá—.
             *
             * Avisa antes, porque no borra nada en CJ: si el pedido sigue vivo
             * allá y aquí se vuelve a pedir, quedan DOS.
             */}
            <button
              type="button"
              disabled={marcando}
              onClick={() =>
                iniciar(async () => {
                  if (!window.confirm(t("descartarConfirmar"))) return;
                  const r = await descartarCompra(compra.id);
                  setAviso(r.mensaje);
                  router.refresh();
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-800 hover:border-red-500 disabled:opacity-60"
            >
              {t("descartar")}
            </button>

            <a
              href={PEDIDOS_EN_CJ}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold hover:border-carga-500"
            >
              {t("abrirPanelCj")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      ) : null}

      {/**
       * CERRAR: FUE UNA PRUEBA (4 sep 2026).
       *
       * Lo pidió el dueño, harto de que el vigilante le mande el mismo correo
       * cada seis horas por compras que son pruebas SUYAS, pagadas con su
       * propia tarjeta: «no nos interesa devolver el dinero… queremos que
       * quede ya cerrado».
       *
       * «Descartar» no servía: deja la compra en `con_error`, y ese estado
       * TAMBIÉN alerta. El único que el vigilante calla es `cerrado`.
       *
       * VA FUERA DEL RECUADRO DE «SIN ENLACE», que era donde primero lo puse:
       * ahí solo se veía en una de las tres situaciones que alertan. Aquí sale
       * en las tres —por pagar con enlace, por pagar sin él, y con error—, que
       * son exactamente las que mandan el correo.
       *
       * Y EL CORREO DEL COMPRADOR VA AL LADO DEL BOTÓN, no en otra pantalla:
       * una prueba del equipo se cierra sin más; la de un cliente de verdad lo
       * dejaría pagando algo que nunca llega.
       */}
      {porPagar || conError ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-borde/60 pt-2">
          <span className="text-xs text-tinta-suave">
            {t("comprador")}{" "}
            <span className="font-semibold">
              {compra.correoComprador ?? t("compradorDesconocido")}
            </span>
          </span>
          <button
            type="button"
            disabled={marcando}
            onClick={() =>
              iniciar(async () => {
                if (!window.confirm(t("cerrarPruebaConfirmar"))) return;
                const r = await cerrarCompraComoPrueba(compra.id);
                setAviso(r.mensaje);
                router.refresh();
              })
            }
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-3 py-1.5 text-xs font-semibold text-tinta-suave hover:border-carga-500 disabled:opacity-60"
          >
            {marcando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            {t("cerrarPrueba")}
          </button>
        </div>
      ) : null}

      {/**
       * QUÉ SE PIDIÓ EXACTAMENTE, ANTES DE PAGAR.
       *
       * Cuando un producto de CJ tiene tallas o colores, el comprador nunca
       * eligió —nuestra ficha lo publica como una sola cosa— así que la eligió
       * el sistema. Aquí se ve, y por eso el pago sigue siendo un botón que
       * pulsa una persona: es la única oportunidad de cancelar si el color no
       * era ese.
       */}
      {compra.renglones.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-borde/60 pt-2">
          {compra.renglones.map((r) => (
            <li key={r.id} className="text-xs">
              <span className="text-tinta-suave">
                {r.cantidad} × {r.titulo ?? "—"}
              </span>
              {r.varianteNombre ? (
                <span
                  className={cn(
                    "ml-1.5 rounded px-1.5 py-0.5 font-semibold",
                    r.varianteAutomatica
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-100",
                  )}
                >
                  {r.varianteNombre}
                </span>
              ) : null}
              {r.varianteAutomatica ? (
                <span className="ml-1.5 text-amber-800">
                  {t("varianteAutomatica", { total: r.variantesTotales ?? 0 })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/**
       * LA FACTURA DEL PROVEEDOR, QUE ES LO QUE RESPALDA EL COSTO.
       *
       * En una venta de Estados Unidos vende Mercatren LLC, así que no hay
       * orden de compra a ningún comercio: nadie se factura a sí mismo. El
       * único papel detrás de ese costo es este.
       *
       * Se pide solo cuando la compra ya está pagada: antes no existe.
       */}
      {compra.estado === "pagado" ? (
        <FacturaDelProveedor compra={compra} />
      ) : null}

      {aviso ? (
        <p role="status" className="mt-2 text-sm font-medium text-precio-600">
          {aviso}
        </p>
      ) : null}
    </li>
  );
}

/** Subir o mirar la factura de quien nos vendió la mercancía. */
function FacturaDelProveedor({ compra }: { compra: CompraAlProveedor }) {
  const t = useTranslations("panel.proveedor");
  const router = useRouter();
  const [estado, accion, subiendo] = useActionState(
    archivarFacturaDelProveedor,
    null,
  );

  useEffect(() => {
    if (estado?.ok) router.refresh();
  }, [estado?.ok, router]);

  if (compra.factura) {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-2 border-t border-borde/60 pt-2 text-xs">
        <FileText className="h-3.5 w-3.5 text-precio-600" aria-hidden />
        <span className="font-semibold text-precio-600">
          {t("facturaArchivada")}
        </span>
        {compra.factura.numero ? (
          <span className="font-mono text-tinta-suave">
            {compra.factura.numero}
          </span>
        ) : null}
        <a
          href={`/media/${compra.factura.clave}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          {t("verFactura")}
        </a>
      </p>
    );
  }

  return (
    <form
      action={accion}
      className="mt-2 border-t border-borde/60 pt-2 text-xs"
    >
      <input type="hidden" name="compraId" value={compra.id} />
      <p className="text-tinta-suave">{t("facturaFalta")}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="numero"
          /* El número es opcional: no todos los proveedores lo dan, y exigirlo
             dejaría la factura sin archivar por un campo que no existe. */
          placeholder={t("facturaNumero")}
          className="h-8 rounded-lg border border-borde px-2"
        />
        <input
          type="file"
          name="archivo"
          accept="image/*,application/pdf"
          required
          className="text-xs"
        />
        <button
          type="submit"
          disabled={subiendo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-2.5 py-1.5 font-semibold hover:border-carga-500 disabled:opacity-60"
        >
          {subiendo ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {t("archivarFactura")}
        </button>
      </div>
      {estado && !estado.ok ? (
        <p role="status" className="mt-1.5 text-red-800">
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  );
}
