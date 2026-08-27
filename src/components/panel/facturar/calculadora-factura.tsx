"use client";

import { Calculator, Check, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  cuadrarFactura,
  type ProductoParaCuadrar,
} from "@/lib/facturar/cuadrar";
import {
  cuantoCobrarPara,
  loQueCuestaLaTarjeta,
  repartoDelCobro,
  type MetodoDeCobro,
} from "@/lib/cobros/reparto";
import { BuscadorDeComercio } from "@/components/panel/facturar/buscador-de-comercio";
import { CobrarLoCuadrado } from "@/components/panel/facturar/cobrar-lo-cuadrado";
import { formatearPrecio, type Idioma } from "@/lib/dinero";

/**
 * LA CALCULADORA DE FACTURA (26 ago 2026).
 *
 * Un comercio vende tubo a $199.05 y tiene que cobrar $7,475.00 exactos.
 * 7475 / 199.05 = 37,55 unidades: no da entero, y se puso a probar a mano —
 * catorce tubos, veinte tubos— desde el celular. Esto lo resuelve de un
 * vistazo.
 *
 * ══ LO QUE HACE QUE SEA ÚTIL Y NO OTRO FORMULARIO ══
 *
 * 1. **Se elige qué productos entran.** Una factura es de tubos O de láminas
 *    de zinc, no de todo el catálogo mezclado.
 * 2. **Las dos cifras SIEMPRE a la vista.** De ahí venía la confusión: el
 *    comercio decía «$7,475 con el 3% dentro» y «$2,775 menos el 3%», que son
 *    cosas distintas. Aquí se ven las dos y no hay que adivinar.
 * 3. **Se dice si cuadró EXACTO o cuánto falta.** Un «casi» sin número no
 *    sirve para nada cuando lo que está en juego es una factura.
 */
export function CalculadoraFactura({
  zelleLimites,
  productos,
  idioma,
  comisionPuntosBase,
  tiendaId,
  comercios = [],
  comercioElegido,
  referenciaSugerida,
}: {
  productos: ProductoParaCuadrar[];
  idioma: Idioma;
  comisionPuntosBase: number;
  /** De qué comercio es. Lo necesita el cobro: espera el id, no el slug. */
  tiendaId: string | null;
  /** Los comercios entre los que puede elegir el equipo. Vacío para un vendedor. */
  comercios?: { id: string; slug: string; nombre: string }[];
  comercioElegido?: string;
  /** El siguiente número de la numeración del comercio, ya calculado. */
  referenciaSugerida?: string;
  /**
   * EL MÍNIMO Y EL TOPE DE ZELLE, leídos con las mismas funciones del enlace.
   *
   * Sin esto la calculadora prometía «transferencia y Zelle» para cualquier
   * monto — y con $7.475 era falso: por encima del tope el enlace no ofrece
   * Zelle. Prometer un método que no va a salir es la queja exacta del dueño.
   */
  zelleLimites: { minimoCentavos: number; maximoCentavos: number };
}) {
  const t = useTranslations("panel.calculadora");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [monto, setMonto] = useState("");
  const [modo, setModo] = useState<"paga" | "recibe">("paga");
  /**
   * ══ POR DÓNDE VA A PAGAR, Y POR QUÉ CAMBIA TODO ══
   *
   * Lo vio el dueño: con tarjeta, Stripe se lleva 2,9% + $0.30 ADEMÁS del 3%
   * de Mercatren. En una factura de $7.475 son más de doscientos dólares de
   * diferencia para el comercio. Calcular sin decir por dónde entra el dinero
   * es dar un número que no se va a cumplir.
   */
  const [metodo, setMetodo] = useState<MetodoDeCobro>("transferencia");
  /**
   * ══ CUANDO LO CUADRADO NO ES LO ESCRITO, EL COMERCIO ELIGE (27 ago 2026) ══
   *
   * Pasó de verdad: escribió $2,274, marcó dos tubos, y con esos precios no
   * existe combinación entera que dé exacto — lo más cercano era $2,299.32.
   * La pantalla decidió SOLA cobrar lo cuadrado, y el botón decía «Cobrar
   * $2,299.32» sin que nadie hubiera pedido cobrar de más. En una pantalla de
   * dinero, cambiar el monto sin preguntar es un fallo aunque la cuenta esté
   * bien hecha.
   *
   * Con cuadre EXACTO no hay nada que elegir y no se pregunta.
   */
  const [cobrarQue, setCobrarQue] = useState<"escrito" | "cuadrado">("escrito");

  const objetivoCentavos = useMemo(() => {
    const limpio = monto.replace(/[^0-9.,]/g, "").replace(",", ".");
    const n = Number.parseFloat(limpio);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const enCentavos = Math.round(n * 100);
    /* «Quiero recibir X limpios» se convierte a «hay que cobrar Y». */
    return modo === "recibe"
      ? cuantoCobrarPara(enCentavos, metodo)
      : enCentavos;
  }, [monto, modo, metodo]);

  const seleccion = useMemo(
    () => productos.filter((p) => elegidos.has(p.id)),
    [productos, elegidos],
  );

  const cuadre = useMemo(
    () =>
      seleccion.length > 0 && objetivoCentavos > 0
        ? cuadrarFactura(seleccion, objetivoCentavos)
        : null,
    [seleccion, objetivoCentavos],
  );

  const cifras = cuadre ? repartoDelCobro(cuadre.totalCentavos, metodo) : null;

  return (
    <div className="space-y-6">
      {/* ══ POR QUÉ COMERCIO SE CUADRA (solo el equipo lo ve) ══
          Sin esto había que escribir `?comercio=` en la dirección, y quien no
          lo sabía se quedaba con la pantalla vacía. */}
      {comercios.length > 0 ? (
        <BuscadorDeComercio
          comercios={comercios}
          elegido={comercios.find((c) => c.slug === comercioElegido) ?? null}
        />
      ) : null}

      <p className="flex items-start gap-2 text-sm leading-relaxed text-tinta-suave">
        <Calculator
          className="mt-0.5 h-4 w-4 shrink-0 text-carga-600"
          aria-hidden
        />
        {t("entradilla")}
      </p>

      {/* 1. El monto */}
      <div className="rounded-xl border border-borde bg-white p-4 sm:p-5">
        <p className="text-sm font-bold text-riel-900">{t("paso1")}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["paga", "recibe"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                modo === m
                  ? "bg-riel-900 text-white"
                  : "border border-borde text-tinta-suave hover:bg-slate-50"
              }`}
            >
              {t(`modo.${m}`)}
            </button>
          ))}
        </div>

        <label className="mt-3 block">
          <span className="text-sm text-tinta-suave">
            {t(`etiqueta.${modo}`)}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-tinta-suave">$</span>
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="w-40 rounded-lg border border-slate-300 px-3 py-2.5 text-lg font-bold tabular-nums outline-none focus:border-carga-500"
            />
          </div>
        </label>

        {modo === "recibe" && objetivoCentavos > 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">
            {t("hayQueCobrar", {
              monto: formatearPrecio(objetivoCentavos, idioma),
            })}
          </p>
        ) : null}

        {/* ══ POR DÓNDE VA A PAGAR ══
            Sin esto el número no se cumple: con tarjeta, Stripe se lleva
            2,9% + $0.30 además del margen de Mercatren. */}
        <div className="mt-4 border-t border-borde pt-4">
          <p className="text-sm font-medium">{t("porDondePaga")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["transferencia", "tarjeta"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetodo(m)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  metodo === m
                    ? "bg-carga-500 text-white"
                    : "border border-borde text-tinta-suave hover:bg-slate-50"
                }`}
              >
                {t(`metodo.${m}`)}
              </button>
            ))}
          </div>
          {/* ══ QUÉ VA A PASAR CON EL ENLACE, DICHO SIN LETRA CHICA ══

              El dueño eligió «Transferencia o Zelle», generó el enlace y le
              salió tarjeta: no había forma de saber que ese botón decidía los
              métodos del cobro. Sus palabras: «no pones claras las cosas».
              Ahora lo dice, en su propia caja y con el color del método. */}
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed ${
              metodo === "tarjeta"
                ? "bg-amber-50 text-amber-900"
                : "bg-precio-50 text-precio-800"
            }`}
          >
            <span className="font-bold">{t("elEnlaceOfrecera")}</span>{" "}
            {/* ══ SE DICE LO QUE EL ENLACE VA A OFRECER DE VERDAD ══

                Para «transferencia» eso depende del MONTO: Zelle solo sale
                entre el mínimo y el tope del banco. Decía «transferencia y
                Zelle» a secas, y con $7.475 era mentira — el cliente abría el
                enlace y Zelle no estaba. El comercio tiene que saberlo AL
                GENERAR, no por el reclamo de su cliente. */}
            {metodo === "tarjeta"
              ? t("ofrecera.tarjeta")
              : objetivoCentavos > zelleLimites.maximoCentavos
                ? t("ofrecera.transferenciaSinZelle", {
                    tope: formatearPrecio(zelleLimites.maximoCentavos, idioma),
                  }) +
                  " " +
                  /* ══ LA SALIDA, NO SOLO EL LÍMITE ══
                     Decir «Zelle no sale» y callarse deja al comercio sin
                     camino. La salida ya existe: las PARTES. Cada parte es su
                     propio enlace y evalúa Zelle por SU monto — dividida en
                     suficientes partes, Zelle sale en cada una. Se le dice
                     cuántas hacen falta, calculado, no «divídela en varias». */
                  t("ofrecera.sugerenciaPartes", {
                    n: Math.ceil(
                      objetivoCentavos / zelleLimites.maximoCentavos,
                    ),
                    parte: formatearPrecio(
                      Math.ceil(
                        objetivoCentavos /
                          Math.ceil(
                            objetivoCentavos / zelleLimites.maximoCentavos,
                          ),
                      ),
                      idioma,
                    ),
                  })
                : objetivoCentavos > 0 &&
                    objetivoCentavos < zelleLimites.minimoCentavos
                  ? t("ofrecera.transferenciaZelleBajo", {
                      minimo: formatearPrecio(
                        zelleLimites.minimoCentavos,
                        idioma,
                      ),
                    })
                  : t("ofrecera.transferencia")}
            {objetivoCentavos > 0 && metodo === "tarjeta"
              ? " " +
                t("avisoTarjeta", {
                  monto: formatearPrecio(
                    loQueCuestaLaTarjeta(objetivoCentavos),
                    idioma,
                  ),
                })
              : null}
          </p>
        </div>
      </div>

      {/* 2. Los productos que entran en la factura */}
      <div className="rounded-xl border border-borde bg-white p-4 sm:p-5">
        <p className="text-sm font-bold text-riel-900">{t("paso2")}</p>
        <p className="mt-1 text-sm text-tinta-suave">{t("paso2Ayuda")}</p>

        {productos.length === 0 ? (
          <p className="mt-3 text-sm text-tinta-suave">{t("sinProductos")}</p>
        ) : (
          <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
            {productos.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={elegidos.has(p.id)}
                    onChange={(e) => {
                      const copia = new Set(elegidos);
                      if (e.target.checked) copia.add(p.id);
                      else copia.delete(p.id);
                      setElegidos(copia);
                    }}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {p.titulo}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatearPrecio(p.precioCentavos, idioma)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. El resultado */}
      {cuadre && cifras ? (
        <div
          className={`rounded-xl border p-4 sm:p-5 ${
            cuadre.exacto
              ? "border-precio-300 bg-precio-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <p
            className={`flex items-center gap-2 text-sm font-bold ${
              cuadre.exacto ? "text-precio-800" : "text-amber-900"
            }`}
          >
            {cuadre.exacto ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <CircleAlert className="h-4 w-4" aria-hidden />
            )}
            {cuadre.exacto
              ? t("cuadroExacto")
              : t("noCuadra", {
                  diferencia: formatearPrecio(
                    Math.abs(cuadre.diferenciaCentavos),
                    idioma,
                  ),
                  senal:
                    cuadre.diferenciaCentavos > 0 ? t("sobra") : t("falta"),
                })}
          </p>

          <table className="mt-4 w-full text-sm">
            <tbody>
              {cuadre.lineas.map((l) => (
                <tr key={l.id} className="border-b border-black/5">
                  <td className="py-2 pr-2">
                    <span className="font-bold tabular-nums">{l.cantidad}</span>
                    <span className="text-tinta-suave"> × </span>
                    <span className="tabular-nums">
                      {formatearPrecio(l.precioCentavos, idioma)}
                    </span>
                    <span className="block text-xs text-tinta-suave">
                      {l.titulo}
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {formatearPrecio(l.subtotalCentavos, idioma)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* LAS DOS CIFRAS, siempre las dos: es donde estaba la confusión. */}
          <dl className="mt-4 space-y-1.5 border-t border-black/10 pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">{t("pagaElCliente")}</dt>
              <dd className="text-lg font-bold tabular-nums">
                {formatearPrecio(cifras.pagaElCliente, idioma)}
              </dd>
            </div>
            {cifras.procesador > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-tinta-suave">{t("procesador")}</dt>
                <dd className="tabular-nums">
                  −{formatearPrecio(cifras.procesador, idioma)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">
                {t("margen", { pct: comisionPuntosBase / 100 })}
              </dt>
              <dd className="tabular-nums">
                −{formatearPrecio(cifras.margen, idioma)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold">{t("recibeElComercio")}</dt>
              <dd className="text-precio-700 text-lg font-bold tabular-nums">
                {formatearPrecio(cifras.recibeElComercio, idioma)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {/**
       * ══ EL COBRO NO DEPENDE DE CUADRAR PRODUCTOS (26 ago 2026) ══
       *
       * Estaba dentro del resultado, así que sin productos seleccionados
       * —o sin productos a secas, como le pasa a una cuenta del equipo— la
       * pantalla se quedaba en el monto escrito y **no había forma de
       * cobrar**. El dueño se topó con eso con la factura delante.
       *
       * El desglose por producto es opcional: lo que siempre hace falta es
       * el monto. Si además cuadró productos, se cobra ese total; si no, el
       * monto que escribió.
       */}
      {/* Sin comercio elegido no se puede cobrar, y se dice AQUÍ: dejarle
          llenar correo y factura para rechazarlo al final es hacerle escribir
          para nada. */}
      {objetivoCentavos > 0 && !tiendaId && comercios.length > 0 ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {t("eligeComercioPrimero")}
        </p>
      ) : null}

      {objetivoCentavos > 0 && (tiendaId || comercios.length === 0)
        ? (() => {
            const difieren =
              cuadre !== null && cuadre.totalCentavos !== objetivoCentavos;
            const aCobrar = !cuadre
              ? objetivoCentavos
              : difieren && cobrarQue === "escrito"
                ? objetivoCentavos
                : cuadre.totalCentavos;
            return (
              <>
                {difieren ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-900">
                      {t("cualMontoTitulo")}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-900">
                      {t("cualMontoAyuda")}
                    </p>
                    <div
                      className="mt-2 flex flex-wrap gap-2"
                      role="radiogroup"
                    >
                      {[
                        {
                          clave: "escrito" as const,
                          titulo: formatearPrecio(objetivoCentavos, idioma),
                          detalle: t("montoEscrito"),
                        },
                        {
                          clave: "cuadrado" as const,
                          titulo: formatearPrecio(cuadre.totalCentavos, idioma),
                          detalle: t("montoCuadrado"),
                        },
                      ].map((o) => (
                        <button
                          key={o.clave}
                          type="button"
                          role="radio"
                          aria-checked={cobrarQue === o.clave}
                          onClick={() => setCobrarQue(o.clave)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm ${
                            cobrarQue === o.clave
                              ? "border-carga-500 bg-white font-bold ring-2 ring-carga-500/30"
                              : "border-amber-300 bg-white/60"
                          }`}
                        >
                          <span className="block tabular-nums">{o.titulo}</span>
                          <span className="block text-xs font-normal text-tinta-suave">
                            {o.detalle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <CobrarLoCuadrado
                  /* La llave reinicia el formulario si cambia el monto: sin
                     ella, el botón seguiría diciendo la cifra anterior. */
                  key={aCobrar}
                  totalCentavos={aCobrar}
                  montoTexto={formatearPrecio(aCobrar, idioma)}
                  metodo={metodo}
                  tiendaId={tiendaId}
                  referenciaSugerida={referenciaSugerida}
                />
              </>
            );
          })()
        : null}
    </div>
  );
}
