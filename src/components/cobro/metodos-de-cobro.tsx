"use client";

import {
  Building2,
  CreditCard,
  Landmark,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PagarCobro } from "@/components/cobro/pagar-cobro";
import { PagarConTransferencia } from "@/components/cobro/pagar-con-transferencia";
import type { DatosDeTransferencia } from "@/lib/cobros/transferencia";
import { PagarConWire } from "@/components/cobro/pagar-con-wire";
import { PagarConZelle } from "@/components/cobro/pagar-con-zelle";
import type { DatosDeWire } from "@/lib/cobros/wire";
import { cn } from "@/lib/utils";

/**
 * EL SELECTOR DE MÉTODO DEL ENLACE DE COBRO.
 *
 * Solo existe cuando hay DOS métodos: si a la tienda no le dieron Zelle —o el
 * monto no llega al mínimo, o falta el receptor— la página va directo a la
 * tarjeta, sin un selector de una sola opción, que es un mueble.
 *
 * La tarjeta va primero y preseleccionada: se confirma sola, sin trabajo de
 * validación. Zelle queda a un toque, con su tiempo dicho de frente — quien
 * elige sabiendo que lo confirma una persona no escribe a la hora preguntando
 * por qué su factura sigue sin pagar.
 */
export function MetodosDeCobro({
  enlace,
  montoTexto,
  zelle,
  transferencia,
  transferenciaAlterna,
  wire,
  aceptaTarjeta,
}: {
  enlace: string;
  montoTexto: string;
  zelle: {
    receptor: string;
    concepto: string;
    nombreReceptor: string | null;
  } | null;
  /**
   * TRANSFERENCIA ACH DIRECTA A LA CUENTA DE MERCATREN LLC.
   *
   * Lo pidió el dueño por una razón de dinero: una factura de siete mil
   * dólares con tarjeta deja **más de $200 en comisiones del procesador**;
   * por ACH directo, cero. Va con sus datos ya resueltos —de las variables
   * del entorno— o `null` si no están cargados: el código no inventa ni un
   * número de cuenta.
   */
  transferencia: {
    datos: DatosDeTransferencia;
    concepto: string;
  } | null;
  /**
   * LA SEGUNDA CUENTA QUE RECIBE ACH.
   *
   * Mercatren tiene dos bancos vivos y ofrecer los dos le da salida a quien
   * paga cuando su banco le pone problemas con uno — no es raro con un
   * destinatario nuevo. Se elige DENTRO de la transferencia y no como un
   * método aparte: para quien paga es la misma operación, solo cambia a
   * dónde. Un cuarto botón en el selector le haría creer que son cosas
   * distintas.
   */
  transferenciaAlterna?: {
    datos: DatosDeTransferencia;
    concepto: string;
  } | null;
  /**
   * PAGAR POR CABLE (WIRE).
   *
   * Va como método propio y no dentro de la transferencia porque **el monto
   * es otro**: recibir un cable cuesta y ese costo se le suma. Meterlo como
   * una pestaña más de la ACH haría que alguien mande el monto de la factura
   * y se quede corto.
   */
  wire?: {
    datos: DatosDeWire;
    concepto: string;
    montoTexto: string;
    facturaTexto: string;
    costoTexto: string;
  } | null;
  /**
   * ¿Este cobro acepta tarjeta?
   *
   * El comercio lo decide al crearlo. Si calculó la factura para cobrar por
   * transferencia, la tarjeta le come el 2,9% + $0.30 — y por eso puede
   * quitarla. Por defecto sí, que es como se comportan los cobros de antes.
   */
  aceptaTarjeta?: boolean;
}) {
  const t = useTranslations("cobro");
  /* Cuál de las dos cuentas de ACH está mirando. Índice y no un booleano: el
     día que haya una tercera, esto no cambia. */
  const [cuenta, setCuenta] = useState(0);
  const [metodo, setMetodo] = useState<
    "tarjeta" | "zelle" | "transferencia" | "wire"
  >(
    aceptaTarjeta === false
      ? transferencia
        ? "transferencia"
        : "zelle"
      : "tarjeta",
  );

  const conTarjeta = aceptaTarjeta !== false;

  /**
   * ══ SI EL COMERCIO QUITÓ LA TARJETA, NO SE CAE A LA TARJETA ══
   *
   * Aquí había un fallo de dinero. El comercio calculaba su factura para
   * cobrar por transferencia —sin el 2,9% + $0.30 del procesador—, quitaba la
   * tarjeta del enlace… y si la transferencia no estaba disponible (los datos
   * del banco sin configurar, o el monto por debajo del mínimo), esta línea
   * le ofrecía **tarjeta igual**, en silencio. Justo lo que quería evitar, y
   * con la factura ya calculada sin ese costo.
   *
   * Ahora se dice lo que pasa y no se cobra por un método que el comercio
   * descartó: un enlace que no se puede pagar se arregla con una llamada; un
   * cobro por el método equivocado se arregla devolviendo el dinero.
   */
  if (!zelle && !transferencia) {
    if (!conTarjeta) {
      return (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t("sinMetodoDisponible")}
          </p>
        </div>
      );
    }
    /* Con la tarjeta permitida y nada más disponible, se enseña directa: un
       «elige método» con una sola opción es una pantalla de más. */
    return <PagarCobro enlace={enlace} montoTexto={montoTexto} />;
  }
  /* Y al revés: si el comercio quitó la tarjeta y solo queda una forma, se
     enseña directa sin obligar a elegir. */
  if (!conTarjeta && transferencia && !zelle) {
    return (
      <PagarConTransferencia
        enlace={enlace}
        datos={transferencia.datos}
        concepto={transferencia.concepto}
        montoTexto={montoTexto}
      />
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold">{t("metodoTitulo")}</p>

      <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
        {[
          {
            clave: "tarjeta" as const,
            titulo: t("metodoTarjeta"),
            detalle: t("metodoTarjetaDetalle"),
            Icono: CreditCard,
          },
          {
            clave: "zelle" as const,
            titulo: t("metodoZelle"),
            detalle: t("metodoZelleDetalle"),
            Icono: Landmark,
          },
          {
            clave: "transferencia" as const,
            titulo: t("metodoTransferencia"),
            detalle: t("metodoTransferenciaDetalle"),
            Icono: Building2,
          },
          {
            clave: "wire" as const,
            titulo: t("metodoWire"),
            detalle: t("metodoWireDetalle"),
            Icono: Zap,
          },
        ]
          /* Solo los que de verdad están disponibles para este cobro. */
          .filter(
            (m) =>
              (m.clave === "tarjeta" && conTarjeta) ||
              (m.clave === "zelle" && zelle) ||
              (m.clave === "transferencia" && transferencia) ||
              (m.clave === "wire" && wire),
          )
          .map(({ clave, titulo, detalle, Icono }) => (
            <button
              key={clave}
              type="button"
              role="radio"
              aria-checked={metodo === clave}
              onClick={() => setMetodo(clave)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                metodo === clave
                  ? "border-carga-500 bg-carga-500/5 ring-2 ring-carga-500/30"
                  : "border-borde hover:border-carga-500/50",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <Icono className="h-4 w-4 text-carga-500" aria-hidden />
                {titulo}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-tinta-suave">
                {detalle}
              </span>
            </button>
          ))}
      </div>

      <div className="mt-4">
        {metodo === "tarjeta" ? (
          <PagarCobro enlace={enlace} montoTexto={montoTexto} />
        ) : metodo === "wire" && wire ? (
          <PagarConWire
            enlace={enlace}
            datos={wire.datos}
            concepto={wire.concepto}
            montoTexto={wire.montoTexto}
            facturaTexto={wire.facturaTexto}
            costoTexto={wire.costoTexto}
          />
        ) : metodo === "transferencia" && transferencia ? (
          <>
            {/* LAS DOS CUENTAS, si hay dos. Va ARRIBA de los datos: quien ya
                empezó a copiar el número no vuelve a subir a ver que había
                otra opción. */}
            {transferenciaAlterna ? (
              <div className="mb-3">
                <p className="text-xs font-semibold">{t("cualCuenta")}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[transferencia, transferenciaAlterna].map((c, i) => (
                    <button
                      key={c.datos.banco}
                      type="button"
                      onClick={() => setCuenta(i)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs",
                        cuenta === i
                          ? "border-carga-500 bg-carga-500/5 font-bold"
                          : "border-borde hover:border-carga-500/50",
                      )}
                    >
                      <span className="block">{c.datos.banco}</span>
                      <span className="block text-tinta-suave">
                        {i === 0 ? t("cuentaPrincipal") : t("cuentaAlterna")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <PagarConTransferencia
              enlace={enlace}
              datos={
                (cuenta === 1 && transferenciaAlterna
                  ? transferenciaAlterna
                  : transferencia
                ).datos
              }
              concepto={transferencia.concepto}
              montoTexto={montoTexto}
            />
          </>
        ) : zelle ? (
          <PagarConZelle
            enlace={enlace}
            receptor={zelle.receptor}
            nombreReceptor={zelle.nombreReceptor}
            concepto={zelle.concepto}
            montoTexto={montoTexto}
          />
        ) : null}
      </div>
    </div>
  );
}
