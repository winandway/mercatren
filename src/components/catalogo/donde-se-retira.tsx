import { MapPin, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { porcentajeVisible, type ModoEnvio } from "@/lib/envios/politica";
import { distanciaDeRetiro, zonaPorSlug } from "@/lib/entrega/zonas";
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
 */
export async function DondeSeRetira({
  deposito,
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
  zonaCliente: string | null;
  /** Cómo despacha el comercio de ESTE producto. */
  envio: { modo: ModoEnvio; porcentajePuntosBase: number };
}) {
  // Sin depósito no se inventa nada: mejor callar que mandar a alguien a una
  // dirección que no sabemos.
  if (!deposito.zona) return null;

  const t = await getTranslations("entrega");
  const te = await getTranslations("envio");
  const zona = zonaPorSlug(deposito.zona);
  if (!zona) return null;

  const distancia = distanciaDeRetiro(deposito.zona, zonaCliente);
  const esLejos = distancia === "lejos" && zonaCliente;
  const esCerca = distancia === "cerca";

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
          {t("seRetiraEn")} {zona.nombre}
          {deposito.nombre ? (
            <span className="font-normal text-tinta-suave">
              {" "}
              · {deposito.nombre}
            </span>
          ) : null}
        </span>
      </p>

      {/* La frase que cambia según qué tan lejos le queda. */}
      {zonaCliente ? (
        <p className={cn("mt-1 pl-6", esLejos ? "" : "text-tinta-suave")}>
          {distancia === "aqui"
            ? t("aqui")
            : esCerca
              ? t("cerca", { ciudad: zona.nombre })
              : t("lejos", { ciudad: zona.nombre })}
        </p>
      ) : null}

      {deposito.direccion ? (
        <p className="mt-1 pl-6 text-tinta-suave">
          {deposito.direccion}
          {deposito.comoLlegar ? ` · ${deposito.comoLlegar}` : ""}
        </p>
      ) : (
        <p className="mt-1 pl-6 text-xs text-tinta-suave">
          {t("sinDireccion")}
        </p>
      )}

      <p className="mt-1.5 pl-6 text-xs text-tinta-suave">
        {envio.modo === "porcentaje"
          ? te("conCosto", {
              pct: porcentajeVisible(envio.porcentajePuntosBase),
            })
          : te(
              envio.modo === "incluido"
                ? "incluido"
                : envio.modo === "solo_retiro"
                  ? "soloRetiro"
                  : "sinDefinir",
            )}
      </p>
    </div>
  );
}
