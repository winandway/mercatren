import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * El botón que se lleva la tabla a una hoja de cálculo.
 *
 * Es un enlace normal (`<a href>`), no un botón con JavaScript: así funciona
 * con el clic derecho, se puede abrir en otra pestaña y no depende de que la
 * página haya terminado de hidratarse. Lo que descarga lo decide el servidor.
 */
export async function Exportar({
  que,
  comercio,
}: {
  /** Qué tabla: `ventas`, `cobros` o el asiento contable del mes. */
  que: "ventas" | "cobros" | "asiento";
  comercio?: string;
}) {
  const t = await getTranslations("panel.exportar");

  /* El asiento lleva su propia etiqueta: «Descargar en Excel» no dice nada de
     lo que hace, y esto se pulsa una vez al mes con el contador esperando. */
  const ta = await getTranslations("panel.asiento");

  const parametros = new URLSearchParams({ que });
  if (comercio) parametros.set("comercio", comercio);

  return (
    <a
      href={`/datos/exportar?${parametros}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-borde bg-white px-3 py-1.5 text-xs font-semibold text-tinta-suave transition-colors hover:border-carga-500 hover:text-tinta"
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      {que === "asiento" ? ta("boton") : t("boton")}
    </a>
  );
}
