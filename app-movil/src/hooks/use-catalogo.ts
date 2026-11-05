import { useCallback, useEffect, useRef, useState } from "react";

import {
  pedirJson,
  urlCatalogo,
  type PaginaCatalogo,
  type ProductoApp,
} from "@/lib/api";
import type { Idioma } from "@/lib/dinero";

type Estado = "cargando" | "listo" | "sin_conexion";

/**
 * El catálogo del país, de a 24, que carga solo al bajar (como la web: sin
 * botón «siguiente»). Una página se pide UNA vez: el servidor la guarda en el
 * borde y la app no vuelve a preguntar mientras la tiene.
 */
export function useCatalogo(pais: string | null, idioma: Idioma, q = "") {
  const [productos, setProductos] = useState<ProductoApp[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [hayMas, setHayMas] = useState(false);
  const pagina = useRef(0);
  const pidiendo = useRef(false);
  const turno = useRef(0);

  const pedir = useCallback(
    async (siguiente: number, mio: number) => {
      if (!pais || pidiendo.current) return;
      pidiendo.current = true;
      try {
        const r = await pedirJson<PaginaCatalogo>(
          urlCatalogo({ pais, idioma, q, pagina: siguiente }),
        );
        if (mio !== turno.current) return;
        pagina.current = r.pagina;
        /* Una página vacía corta la carga: la cuenta del catálogo puede ir
           unos minutos atrasada, y no se sigue pidiendo (ni girando) en vano. */
        setHayMas(r.pagina < r.paginas && r.productos.length > 0);
        setProductos((antes) =>
          siguiente === 1 ? r.productos : [...antes, ...r.productos],
        );
        setEstado("listo");
      } catch {
        if (mio !== turno.current) return;
        setEstado((antes) => (siguiente === 1 ? "sin_conexion" : antes));
      } finally {
        pidiendo.current = false;
      }
    },
    [pais, idioma, q],
  );

  const reiniciar = useCallback(() => {
    turno.current += 1;
    pidiendo.current = false;
    pagina.current = 0;
    setProductos([]);
    setHayMas(false);
    setEstado("cargando");
    void pedir(1, turno.current);
  }, [pedir]);

  useEffect(() => {
    reiniciar();
  }, [reiniciar]);

  const masAbajo = useCallback(() => {
    if (hayMas && estado === "listo")
      void pedir(pagina.current + 1, turno.current);
  }, [hayMas, estado, pedir]);

  return { productos, estado, hayMas, masAbajo, reiniciar };
}
