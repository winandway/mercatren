"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Link } from "@/i18n/navigation";
import { destinoDeVuelta } from "@/lib/catalogo/volver";
import { rutaAnteriorA } from "@/lib/navegacion/rastro";

/**
 * La flecha «← Volver» de la ficha del producto.
 *
 * Vuelve a donde la persona venía si llegó desde el propio sitio (la tienda,
 * una búsqueda, la portada); si entró por un enlace de fuera, va a la tienda
 * del producto. Ver `src/lib/catalogo/volver.ts` para la regla y el porqué.
 *
 * ══ POR QUÉ EL TEXTO CAMBIA DESPUÉS DE MONTAR ══
 *
 * En el servidor no se sabe de dónde viene la persona (el referrer solo lo
 * tiene el navegador), así que se dibuja «Volver a {tienda}», que es cierto
 * siempre. Ya montado, si hay de dónde volver, dice «Volver» a secas — si
 * dijera «Volver a la tienda» y la llevara a la búsqueda de la que venía,
 * mentiría.
 *
 * El `href` es un enlace de verdad a la tienda: sirve sin JavaScript, y
 * Google lo lee como lo que es.
 */
export function VolverDeLaFicha({
  tienda,
  tiendaSlug,
}: {
  tienda: string;
  tiendaSlug: string;
}) {
  const t = useTranslations("catalogo.producto");
  const hrefTienda = `/tienda/${tiendaSlug}`;

  /* El referrer y el historial solo existen en el navegador y no cambian
     mientras dura la página: `useSyncExternalStore` es la forma correcta de
     leer un valor así — en el servidor devuelve `false` (sin atrás), en el
     navegador el de verdad, sin un estado copiado en un efecto. */
  const decidir = () => {
    /* Dentro del sitio Next navega sin recargar y `document.referrer` NO se
       actualiza: primero se mira el rastro de la pestaña (la página anterior
       de verdad) y solo si no hay, el referrer de la primera carga. */
    const anterior = rutaAnteriorA(
      window.sessionStorage,
      window.location.pathname,
    );
    return destinoDeVuelta({
      referrer: anterior
        ? window.location.origin + anterior
        : document.referrer,
      origen: window.location.origin,
      paginaActual: window.location.pathname,
      hayHistorial: window.history.length > 1,
      hrefTienda,
    });
  };

  const hayAtras = useSyncExternalStore(
    () => () => {},
    () => decidir().modo === "atras",
    () => false,
  );

  return (
    <Link
      href={hrefTienda}
      onClick={(e) => {
        if (decidir().modo === "atras") {
          e.preventDefault();
          window.history.back();
        }
      }}
      className="text-sm font-medium text-tinta-suave hover:text-riel-900"
    >
      ← {hayAtras ? t("volver") : t("volverATienda", { tienda })}
    </Link>
  );
}
