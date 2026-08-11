import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { fechaCorta } from "@/lib/fechas";
import type { HitoVista } from "@/lib/pedidos/hitos";
import { cn } from "@/lib/utils";

/**
 * LOS PASOS DE LA VENTA, EN HORIZONTAL.
 *
 * ══ POR QUÉ HACÍA FALTA ══
 *
 * El estado del pedido decía dónde está hoy, pero no **por dónde ha pasado ni
 * qué falta**. Para saber si una venta estaba completa había que cruzar cuatro
 * pantallas: el pedido, el cobro, la orden de compra y la billetera. El dueño
 * lo dijo con estas palabras: «no tengo claro para controlar».
 *
 * Aquí se ve de un vistazo, de izquierda a derecha, como pasa de verdad.
 *
 * ══ EL ÚLTIMO PASO ES EL QUE FALTABA ══
 *
 * La pregunta que cierra la venta es «¿y el comercio ya tiene su dinero?», y
 * no se podía contestar sin salir de la ficha.
 *
 * ══ POR QUÉ DICE «EN LA BILLETERA» Y NO «RETIRADO» ══
 *
 * Un retiro NO es un hecho de este pedido: el comercio pide un monto contra su
 * saldo, que junta muchas ventas. Marcar una venta concreta como «retirada»
 * obligaría a repartir cada retiro entre las ventas que lo componen —una
 * atribución que el sistema no guarda y que nadie firmó—, y ante un reclamo no
 * habría con qué sostenerla.
 *
 * Lo que sí es cierto de ESTE pedido es que su dinero quedó acreditado y está
 * disponible. El retiro se mira donde de verdad ocurre: en la billetera, con
 * su enlace aquí mismo.
 */

/** Los pasos por los que pasa toda venta, en orden. */
const PASOS = ["pagado", "enviado", "entregado"] as const;

export async function PasosDeLaVenta({
  estado,
  creadoEn,
  hitos,
  enBilletera,
  idioma,
}: {
  estado: string;
  creadoEn: number;
  hitos: HitoVista[];
  /** Si el dinero de esta venta ya quedó acreditado al comercio. */
  enBilletera: boolean;
  idioma: string;
}) {
  const t = await getTranslations("panel.pasos");

  /* Un pedido cancelado o reembolsado no recorre los pasos: enseñar una fila
     de casillas a medias sobre algo que ya murió confunde más que ayuda. */
  if (estado === "cancelado" || estado === "reembolsado") return null;

  const hito = (clave: string) => hitos.find((h) => h.hito === clave) ?? null;

  const orden = [
    "pendiente_pago",
    "pagado",
    "preparando",
    "enviado",
    "entregado",
  ];
  const posicion = orden.indexOf(estado);

  const columnas = [
    {
      clave: "comprada",
      hecho: true,
      pie: fechaCorta(creadoEn, idioma) ?? "",
    },
    ...PASOS.map((paso) => {
      const h = hito(paso);
      const hecho = posicion >= orden.indexOf(paso);
      return {
        clave: paso,
        hecho,
        /* Quién lo hizo importa tanto como cuándo: con un contracargo de por
           medio, «entregado» a secas no defiende a nadie. */
        pie: h
          ? [
              h.fecha ? fechaCorta(h.fecha, idioma) : null,
              h.porNombre ? t("por", { quien: h.porNombre }) : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : hecho
            ? ""
            : t("aunNo"),
      };
    }),
    {
      clave: "enBilletera",
      hecho: enBilletera,
      pie: enBilletera ? t("disponible") : t("aunNo"),
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Se desliza en el celular en vez de apretujarse: cinco columnas en
          375px quedan ilegibles. */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {columnas.map((c) => (
          <div
            key={c.clave}
            className={cn(
              "min-w-[92px] flex-1 border-t-[3px] pt-2",
              c.hecho ? "border-precio-600" : "border-borde",
            )}
          >
            <p
              className={cn(
                "text-sm font-medium",
                c.hecho ? "" : "text-tinta-suave",
              )}
            >
              {t(c.clave)}
            </p>
            {c.pie ? (
              <p className="mt-0.5 text-xs text-tinta-suave">{c.pie}</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* DÓNDE SE MIRA EL RETIRO. La pregunta «¿ya cobró?» se contesta en la
          billetera, que es donde el retiro ocurre de verdad. */}
      {enBilletera ? (
        <p className="mt-4 border-t border-borde pt-3 text-xs text-tinta-suave">
          {t("dondeSeRetira")}{" "}
          <Link
            href="/panel/billetera"
            className="font-semibold text-carga-600 hover:underline"
          >
            {t("verBilletera")}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
