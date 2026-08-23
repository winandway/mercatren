"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import type { ProductoLista } from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";

/**
 * TODOS los productos, en parrilla, cargando solos mientras se baja.
 *
 * Es lo que hacen Mercado Libre y AliExpress, y por la misma razón: el
 * cliente que llega no quiere navegar un índice, quiere ver cosas. Con 622
 * productos, meterlos en dos carruseles de catorce era enseñar el 4% del
 * catálogo y esconder el resto detrás de una flechita.
 *
 * LA SEMILLA LA PONE EL SERVIDOR y viaja en cada tanda. Si cada tanda barajara
 * de nuevo, al bajar saldría el mismo taladro tres veces y otros productos
 * no saldrían nunca.
 */
export function ParrillaInfinita({
  inicial,
  semilla,
  paginas,
  idioma,
  textoCargando,
  textoFinal,
  sinFiltroDeZona = false,
  desdePagina = 1,
}: {
  inicial: ProductoLista[];
  semilla: number;
  paginas: number;
  /**
   * La tanda inicial puede no ser la primera: la portada enseña la página 1
   * arriba («De todas las tiendas») y aquí abajo sigue desde la 2, así que
   * la siguiente que se pide es la 3 y nada sale repetido.
   */
  desdePagina?: number;
  idioma: Idioma;
  textoCargando: string;
  textoFinal: string;
  /**
   * La primera tanda la armó el servidor; las siguientes tienen que seguir la
   * MISMA regla, o al bajar aparecería mercancía de otra ciudad en una
   * portada filtrada. El servidor de tandas lee la ciudad de la cookie; esta
   * bandera le dice cuándo ignorarla (portada en "toda Venezuela").
   */
  sinFiltroDeZona?: boolean;
}) {
  const [productos, setProductos] = useState(inicial);
  const [pagina, setPagina] = useState(desdePagina);
  const [cargando, setCargando] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);
  const hayMas = pagina < paginas;

  const traerMas = useCallback(async () => {
    if (cargando || !hayMas) return;
    setCargando(true);

    try {
      const siguiente = pagina + 1;
      const r = await fetch(
        `/datos/catalogo?pagina=${siguiente}&semilla=${semilla}${sinFiltroDeZona ? "&todas=1" : ""}`,
      );
      const datos = (await r.json()) as { productos: ProductoLista[] };

      if (datos.productos?.length) {
        setProductos((antes) => [...antes, ...datos.productos]);
        setPagina(siguiente);
      } else {
        // Sin nada que agregar, se deja de pedir: si no, cada scroll
        // dispararía otra petición que tampoco trae nada.
        setPagina(paginas);
      }
    } catch {
      // Un fallo de red no puede dejar la parrilla trabada: se vuelve a
      // intentar en el siguiente scroll.
    } finally {
      setCargando(false);
    }
  }, [cargando, hayMas, pagina, paginas, semilla, sinFiltroDeZona]);

  /**
   * Se mide la posición a mano en vez de usar IntersectionObserver, igual que
   * en la lista de tiques: es más fácil de seguir y no se queda pegado cuando
   * el contenido cambia de alto al cargar las fotos.
   *
   * 800px de adelanto para que la siguiente tanda esté lista antes de que se
   * llegue al final y no se vea el salto.
   */
  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo || !hayMas) return;

    const mirar = () => {
      if (nodo.getBoundingClientRect().top < window.innerHeight + 800) {
        void traerMas();
      }
    };

    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    window.addEventListener("resize", mirar, { passive: true });
    return () => {
      window.removeEventListener("scroll", mirar);
      window.removeEventListener("resize", mirar);
    };
  }, [hayMas, traerMas]);

  return (
    <>
      {/* TRES POR HILERA EN EL CELULAR, como Amazon. Con dos, cada foto sale
          enorme y en la primera pantalla apenas caben dos productos; con tres
          se ven seis y la tienda parece una tienda. */}
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {productos.map((producto) => (
          <li key={producto.id}>
            <TarjetaProducto producto={producto} idioma={idioma} />
          </li>
        ))}
      </ul>

      <div ref={centinela} className="py-8 text-center">
        {cargando ? (
          <p className="inline-flex items-center gap-2 text-sm text-tinta-suave">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {textoCargando}
          </p>
        ) : !hayMas ? (
          <p className="text-sm text-tinta-suave">{textoFinal}</p>
        ) : null}
      </div>
    </>
  );
}
