import { Globe2, PackageCheck, Truck } from "lucide-react";

import { MapaAlmacen } from "@/components/catalogo/mapa-almacen";
import { almacenDeLaTienda } from "@/lib/destino/almacenes";
import { destinoDeLaTienda } from "@/lib/destino/reglas";

/**
 * LO QUE HAY QUE DECIRLE A QUIEN ABRE UN PRODUCTO DE ESTADOS UNIDOS.
 *
 * ══ EL HUECO QUE TAPA ══
 *
 * La ficha no decía **ni que el envío es gratis, ni a dónde llega**. Y eso es
 * exactamente lo que uno se pregunta antes de comprar: si no lo encuentra, no
 * pregunta — se va.
 *
 * Va arriba, pegado al precio, porque abajo no se lee.
 *
 * ══ POR QUÉ «GRATIS» ES CIERTO Y NO UN TRUCO ══
 *
 * El costo del envío está **dentro del precio publicado**, igual que el margen
 * y la tarifa de Stripe (ver `lib/destino/precio-us.ts`). Lo que el comprador
 * ve es lo que paga, sin una sorpresa en el último paso del checkout — que es
 * donde se abandona una compra.
 *
 * ══ EL CONSEJO DEL CASILLERO ══
 *
 * Va más abajo y en gris, sin competirle al botón de comprar. Quien está en
 * Colombia, Chile, Panamá o España ya usa casilleros; decírselo nosotros evita
 * que se vaya sin preguntar.
 *
 * Y se dice con cuidado, porque es un consejo y no un servicio nuestro: **no se
 * nombra ninguna empresa** y **no se promete nada del tramo internacional** —
 * ni plazo, ni costo, ni aduana. Ahí no mandamos nosotros, y prometer lo que no
 * se controla es como se pierde un cliente y se gana un contracargo.
 */
export function EntregaEstadosUnidos({
  paisOrigen,
  tiendaId,
  idioma,
  textos,
}: {
  paisOrigen: string | null | undefined;
  /** De aquí sale el estado del almacén: cada tienda enseña el suyo. */
  tiendaId: string;
  idioma: string;
  textos: {
    envioGratis: string;
    aTodoEeuu: string;
    plazo: string;
    precioFinal: string;
    casilleroTitulo: string;
    casilleroTexto: string;
    mapaTitulo: string;
    mapaPie: string;
  };
}) {
  if (destinoDeLaTienda(paisOrigen) !== "US") return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <Truck className="h-4.5 w-4.5 shrink-0" aria-hidden />
          {textos.envioGratis}
        </p>
        <p className="mt-1.5 text-sm text-emerald-900/90">{textos.aTodoEeuu}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-emerald-900/80">
          <PackageCheck className="h-4 w-4 shrink-0" aria-hidden />
          {textos.plazo}
        </p>
        <p className="mt-1 text-xs font-semibold text-emerald-900/80">
          {textos.precioFinal}
        </p>
      </div>

      <MapaAlmacen
        almacen={almacenDeLaTienda(tiendaId)}
        idioma={idioma}
        titulo={textos.mapaTitulo}
        pie={textos.mapaPie}
      />

      {/* EL CONSEJO, en gris y abajo: es una salida para quien no está en
          Estados Unidos, no una oferta nuestra. */}
      <details className="rounded-xl border border-borde bg-slate-50 px-3.5 py-3">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-tinta">
          <Globe2 className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden />
          {textos.casilleroTitulo}
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
          {textos.casilleroTexto}
        </p>
      </details>
    </div>
  );
}
