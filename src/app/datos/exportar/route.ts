import { tienePermisoDePanel } from "@/lib/autorizacion";
import { aCsv, nombreDeArchivo } from "@/lib/exportar/csv";
import {
  tablaDeCobrosTarjeta,
  tablaDelAsientoMensual,
  tablaDeVentas,
} from "@/lib/exportar/consultas";

/**
 * DESCARGAR LOS NÚMEROS EN UNA HOJA DE CÁLCULO.
 *
 * Va en `/datos` y no en `/api` porque en YaDominios Cloud ese prefijo lo
 * capturan los archivos estáticos antes de llegar al código.
 *
 * ══ LA GUARDIA NO BAJA POR SER UN ARCHIVO ══
 *
 * Aquí sale de golpe todo lo que en pantalla se ve de a 25, con nombres y
 * correos de compradores dentro. Se exige sesión con permiso de panel, y el
 * alcance lo aplican las consultas: un vendedor que pida `?comercio=otro` se
 * lleva el suyo igual.
 */
export async function GET(peticion: Request) {
  if (!(await tienePermisoDePanel())) {
    return new Response("No autorizado", { status: 401 });
  }

  const url = new URL(peticion.url);
  const que = url.searchParams.get("que") ?? "ventas";
  const comercio = url.searchParams.get("comercio") ?? undefined;

  try {
    const tabla =
      que === "cobros"
        ? await tablaDeCobrosTarjeta(comercio)
        : que === "asiento"
          ? /* El asiento contable del mes, para Xero. No lleva `comercio`
               a propósito: es la contabilidad de Mercatren LLC entera, no la
               de un comercio. */
            await tablaDelAsientoMensual()
          : await tablaDeVentas(comercio);

    const cuerpo = aCsv(tabla.cabeceras, tabla.filas);
    const nombre = nombreDeArchivo(
      que === "cobros" ? "cobros" : que === "asiento" ? "asiento" : "ventas",
      new Date(),
    );

    return new Response(cuerpo, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${nombre}"`,
        /* Un archivo con dinero y datos de compradores no se guarda en ninguna
           caché intermedia. */
        "cache-control": "no-store",
        /* Se avisa cuando se llegó al tope. Un archivo recortado en silencio
           haría sumar una parte creyendo que es el total. */
        ...(tabla.recortado ? { "x-recortado": "1" } : {}),
      },
    });
  } catch (error) {
    /* Un alcance que corta (cuenta sin comercio asignado) llega aquí. Se
       responde 403 sin detalles: el motivo exacto ya lo dice el panel. */
    console.error("[exportar] no se pudo generar el archivo", error);
    return new Response("No se pudo generar el archivo", { status: 403 });
  }
}
