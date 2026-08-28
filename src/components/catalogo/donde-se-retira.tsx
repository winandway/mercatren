import { BadgeCheck, MapPin, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { destinoDeLaTienda } from "@/lib/destino/reglas";
import { porcentajeVisible, type ModoEnvio } from "@/lib/envios/politica";
import {
  distanciaDeRetiro,
  zonaPorNombre,
  zonaPorSlug,
  type Zona,
} from "@/lib/entrega/zonas";
import { cn } from "@/lib/utils";

/**
 * DÓNDE SE RETIRA ESTO, justo debajo de quién lo vende.
 *
 * EL TEXTO DE ABAJO YA NO ES FIJO (8 ago 2026). Decía "por ahora todo se
 * retira en el depósito, no hacemos entregas a domicilio" para todos los
 * productos, y desde que los comercios pueden despachar **eso es mentira**:
 * a un comercio que envía a toda Venezuela le estábamos diciendo a su
 * comprador que no lo hace, y quitándole la venta en la propia ficha.
 *
 * Ahora sale la política de ESE comercio. Y sigue diciéndose ANTES de pagar,
 * que es lo que importaba: nadie se entera de cómo lo recibe en el correo de
 * después.
 *
 * EL TONO CAMBIA CON LA DISTANCIA, y esa es toda la gracia. No es lo mismo
 * "pasas y lo recoges" que "tendrías que manejar siete horas". Un aviso
 * gris para las tres cosas se lee igual que no avisar.
 *
 * Sin ciudad elegida se enseña neutro: dónde está y ya. A quien acaba de
 * llegar no se le grita por no haber dicho todavía dónde vive.
 *
 * ══ SIN DEPÓSITO, LA TIENDA (23 ago 2026) ══
 *
 * Lo destapó el dueño con unos zapatos de Variedades COLOMBIA NEXT: la ficha
 * no decía dónde se retiraban. La tienda tiene su dirección cargada («Vía
 * Panamericana CC El Metro locales 7-8-14, Tucaní») pero el producto no
 * tiene depósito, y este bloque callaba. Palabras suyas: «¿cómo yo compro
 * unos zapatos ahí si no sé ni dónde los voy a recibir? … nadie es adivino».
 *
 * Ahora, sin depósito, el producto HEREDA LA CIUDAD Y LA DIRECCIÓN DE SU
 * TIENDA — la misma regla que ya usaba el filtro por ciudad (`enZona`), así
 * que la ficha y el filtro cuentan la misma historia. Y se dice con claridad
 * qué pasa después de pagar: reclamas el producto ahí, con tu número de
 * pedido, en un comercio verificado. Lo que se inventa: nada. Si la tienda
 * tampoco cargó ciudad, se dice que falta y que le escriba antes de pagar.
 *
 * No se dibuja para lo que se entrega en Estados Unidos: ahí no se retira
 * nada, se despacha (ver `EntregaEstadosUnidos`).
 */
export async function DondeSeRetira({
  deposito,
  tienda,
  paisOrigen,
  zonaCliente,
  envio,
}: {
  deposito: {
    nombre: string | null;
    zona: string | null;
    queGuarda: string | null;
    direccion: string | null;
    comoLlegar: string | null;
  };
  /** La tienda del producto: el respaldo cuando no hay depósito. */
  tienda: {
    nombre: string;
    ciudad: string | null;
    direccion: string | null;
  };
  /** De dónde sale la mercancía. `US` no se retira: se despacha. */
  paisOrigen: string | null;
  zonaCliente: string | null;
  /** Cómo despacha el comercio de ESTE producto. */
  envio: { modo: ModoEnvio; porcentajePuntosBase: number };
}) {
  /* Este bloque contesta «¿dónde lo retiro?», y esa pregunta solo existe en
     Venezuela. Lo que se DESPACHA —EE. UU., Chile, Colombia— no se retira en
     ningún lado, y aquí salía «Envío a toda Venezuela · aún no especificado»
     en una ficha de mercatren.cl: el mismo fallo del 15 de agosto con otro
     disfraz. La regla vive en `destinoDeLaTienda`, no en otro `=== "US"`. */
  if (destinoDeLaTienda(paisOrigen) !== "VE") return null;

  const t = await getTranslations("entrega");
  const te = await getTranslations("envio");

  /* Primero el depósito (más preciso); si no hay, la tienda. */
  const zonaDeposito = deposito.zona ? zonaPorSlug(deposito.zona) : null;
  const zonaTienda = zonaDeposito ? null : zonaPorNombre(tienda.ciudad);
  const zona: Zona | null = zonaDeposito ?? zonaTienda;
  const ciudadTexto = zona?.nombre ?? tienda.ciudad?.trim() ?? null;
  const lugar = zonaDeposito ? deposito.nombre : tienda.nombre;
  const direccion = zonaDeposito
    ? deposito.direccion
    : (tienda.direccion?.trim() ?? null);
  const comoLlegar = zonaDeposito ? deposito.comoLlegar : null;

  const distancia = zona ? distanciaDeRetiro(zona.slug, zonaCliente) : null;
  const esLejos = distancia === "lejos" && Boolean(zonaCliente);
  const esCerca = distancia === "cerca";

  const lineaDeEnvio =
    envio.modo === "porcentaje"
      ? te("conCosto", { pct: porcentajeVisible(envio.porcentajePuntosBase) })
      : te(
          envio.modo === "incluido"
            ? "incluido"
            : envio.modo === "solo_retiro"
              ? "soloRetiro"
              : "sinDefinir",
        );

  /* Ni depósito ni ciudad: no se inventa un lugar, se dice que falta. */
  if (!ciudadTexto) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        <p className="flex items-start gap-2 font-semibold">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t("sinLugar")}</span>
        </p>
        <p className="mt-1.5 pl-6 text-xs">{lineaDeEnvio}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        esLejos
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : esCerca
            ? "border-carga-500/40 bg-carga-500/5"
            : "border-borde bg-slate-50",
      )}
    >
      <p className="flex items-start gap-2 font-semibold">
        {esLejos ? (
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-carga-600"
            aria-hidden
          />
        )}
        <span>
          {t("seRetiraEn")} {ciudadTexto}
          {lugar ? (
            <span className="font-normal text-tinta-suave"> · {lugar}</span>
          ) : null}
        </span>
      </p>

      {/* La frase que cambia según qué tan lejos le queda. */}
      {zonaCliente && zona && distancia ? (
        <p className={cn("mt-1 pl-6", esLejos ? "" : "text-tinta-suave")}>
          {distancia === "aqui"
            ? t("aqui")
            : esCerca
              ? t("cerca", { ciudad: zona.nombre })
              : t("lejos", { ciudad: zona.nombre })}
        </p>
      ) : null}

      {direccion ? (
        <p className="mt-1 pl-6 text-tinta-suave">
          {direccion}
          {comoLlegar ? ` · ${comoLlegar}` : ""}
        </p>
      ) : (
        <p className="mt-1 pl-6 text-xs text-tinta-suave">
          {t("sinDireccion")}
        </p>
      )}

      {/* Qué pasa después de pagar, dicho con todas las letras. */}
      <p className="mt-1.5 pl-6 text-xs text-tinta-suave">
        {t("comoReclamar")}
      </p>
      <p className="mt-1 flex items-center gap-1.5 pl-6 text-xs font-medium text-precio-600">
        <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t("comercioVerificado")}
      </p>

      <p className="mt-1.5 pl-6 text-xs text-tinta-suave">{lineaDeEnvio}</p>
    </div>
  );
}
