import type { PaginaContenido } from "./tipos";

/**
 * ══ CADA DOMINIO ENSEÑA LAS SECCIONES DE SU PAÍS (20 sep 2026) ══
 *
 * La política de devoluciones de mercatren.com (Estados Unidos) traía tres
 * secciones «Venezuela · …» sobre retirar en el depósito, y la de
 * mercatren.com.ve empezaba por «Pedidos con entrega en Estados Unidos». Desde
 * que Venezuela vive en su dominio, cada tienda cuenta lo suyo — y Google
 * evalúa la de Estados Unidos leyendo exactamente estas páginas.
 *
 * No se reescribe ni una condición: solo se decide DÓNDE sale cada sección, y
 * se vuelven a numerar para que no quede «1, 5, 6, 7».
 */
export function paraElMercado(
  pagina: PaginaContenido,
  mercado: string,
): PaginaContenido {
  const codigo = mercado.trim().toUpperCase();
  const visibles = pagina.secciones.filter(
    (s) => !s.mercados || s.mercados.includes(codigo),
  );
  return {
    ...pagina,
    secciones: visibles.map((s, i) => ({
      ...s,
      numero: s.numero === undefined ? undefined : String(i + 1),
    })),
  };
}
