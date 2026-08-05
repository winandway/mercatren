import { listarComercios, listarPagos } from "@/lib/zelle/consultas";
import { lineasDePagos } from "@/lib/zelle/lineas";
import { aPagoVista } from "@/lib/zelle/vista";

/**
 * Las siguientes tandas de ventas, para la carga infinita de Órdenes.
 *
 * Va en /datos y no en /api porque en YaDominios Cloud ese prefijo lo capturan
 * los archivos estáticos antes de llegar al código.
 *
 * EL ALCANCE MANDA. Se reutiliza `listarPagos`, que ya decide qué comercio
 * puede ver quién: si un vendedor pide otra tienda por la dirección, se le
 * ignora y se le devuelve la suya. Esta ruta no baja esa guardia por ser
 * JSON — es justo donde más fácil sería colarse.
 */
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);

  const pagina = Math.max(1, Number(url.searchParams.get("pagina")) || 1);
  const busqueda = url.searchParams.get("q") ?? undefined;
  const comercio = url.searchParams.get("comercio") ?? undefined;

  try {
    const [ventas, comercios] = await Promise.all([
      listarPagos({
        tipo: "entrada",
        estado: "aprobado",
        comercio,
        busqueda,
        pagina,
        porPagina: 24,
      }),
      listarComercios().catch(() => []),
    ]);

    const nombrePorTienda = new Map(comercios.map((c) => [c.id, c.nombre]));
    const lineasPorPago = await lineasDePagos(ventas.pagos.map((p) => p.id));

    return Response.json({
      tiques: ventas.pagos.map((p) => ({
        pago: aPagoVista(p),
        comercio: p.tiendaId ? (nombrePorTienda.get(p.tiendaId) ?? null) : null,
        lineas: lineasPorPago.get(p.id) ?? [],
      })),
      pagina: ventas.pagina,
      paginas: ventas.paginas,
    });
  } catch {
    /**
     * Sin sesión o sin permiso: se responde vacío, no un error.
     *
     * La lista ya está en pantalla; lo único que pasa es que deja de cargar
     * más. Soltar un 500 aquí llenaría la consola del navegador de rojo por
     * algo que, para quien mira, no es un fallo.
     */
    return Response.json({ tiques: [], pagina, paginas: pagina });
  }
}
