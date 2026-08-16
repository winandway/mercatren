"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";

/**
 * EL BUSCADOR DE LAS LISTAS DEL PANEL.
 *
 * Uno solo para todas — cuentas, comercios, compradores, pagos, cobros — en
 * vez de uno por pantalla. Escritos por separado se desincronizan: uno espera
 * 350 ms y otro 800, uno limpia el filtro de la dirección y otro solo vacía la
 * casilla, y quien usa el panel tiene que aprenderse cada uno.
 *
 * ══ POR QUÉ FILTRA EN EL SERVIDOR Y NO EN LA PANTALLA ══
 *
 * Filtrar lo ya traído es más fácil de escribir, pero obliga a bajarse las
 * cuentas enteras cada vez que se abre la página. Con veinte da igual; con
 * doscientas, la pantalla tarda antes de dejar escribir. Se filtra en la base
 * y viaja en la dirección — así además el resultado sobrevive a un refresco y
 * se puede pasar por chat.
 *
 * ══ ESPERA A QUE DEJE DE ESCRIBIR ══
 *
 * Sin la espera, «Bleyder» son siete consultas a la base y siete recargas de
 * la lista, con el texto saltando mientras se teclea. Con 350 ms se manda una
 * sola: es el tiempo justo para que no se note la espera y no se dispare por
 * cada letra.
 */
export function BuscadorPanel({
  busqueda,
  ruta,
  placeholder,
  textoTotal,
  textoResultados,
}: {
  busqueda: string;
  /** A dónde vuelve con el filtro puesto. Ej.: `/panel/tiendas`. */
  ruta: string;
  placeholder: string;
  /* Los textos llegan YA TRADUCIDOS del servidor y no por una clave: cada
     pantalla nombra lo suyo —«28 comercios», «745 pagos»— y un texto genérico
     («28 resultados») obliga a mirar arriba para saber de qué se habla. */
  textoTotal: string;
  textoResultados: string;
}) {
  const t = useTranslations("panel.buscador");
  const router = useRouter();
  const [texto, setTexto] = useState(busqueda);

  /**
   * SI LA DIRECCIÓN CAMBIA POR FUERA, LA CASILLA SE PONE AL DÍA.
   *
   * Pasa con el botón de atrás y con un enlace: sin esto, la casilla seguiría
   * enseñando un texto que ya no filtra nada.
   *
   * Se ajusta DURANTE el renderizado y no en un efecto — es el patrón que
   * recomienda React para esto, y el lint rechaza el otro con razón: un
   * `setState` dentro de un efecto dispara un segundo renderizado en cascada,
   * y aquí eso se vería como un parpadeo del texto mientras se escribe.
   */
  const [urlPrevia, setUrlPrevia] = useState(busqueda);
  if (busqueda !== urlPrevia) {
    setUrlPrevia(busqueda);
    setTexto(busqueda);
  }

  useEffect(() => {
    if (texto === busqueda) return;

    const reloj = window.setTimeout(() => {
      const limpio = texto.trim();
      router.replace(limpio ? `${ruta}?q=${encodeURIComponent(limpio)}` : ruta);
    }, 350);

    return () => window.clearTimeout(reloj);
  }, [texto, busqueda, router, ruta]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
          aria-hidden
        />
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          aria-label={t("buscar")}
          /* Se apaga la equis que Chrome dibuja sola en los `type="search"`:
             con la nuestra al lado salían DOS, y la del navegador no borra el
             filtro de la dirección — solo vacía la casilla, así que la lista
             se quedaba filtrada con la casilla en blanco. */
          className="h-11 w-full rounded-lg border border-borde pr-9 pl-9 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {texto ? (
          <button
            type="button"
            onClick={() => setTexto("")}
            aria-label={t("limpiar")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-tinta-suave hover:text-tinta"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* El conteo va SIEMPRE, no solo al buscar: con sesenta tarjetas, saber
          cuántas son de un vistazo es la mitad de la pregunta. */}
      <p className="text-sm text-tinta-suave">
        {busqueda ? textoResultados : textoTotal}
      </p>
    </div>
  );
}
