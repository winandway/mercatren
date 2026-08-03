import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/**
 * El precio como se ve en una tienda: el simbolo y los centavos chiquitos, y
 * los dolares grandes. Se lee de un vistazo, que es de lo que se trata.
 */
export function PrecioTienda({
  centavos,
  idioma,
  moneda = "USD",
  tamano = "normal",
  className,
}: {
  centavos: number;
  idioma: Idioma;
  moneda?: string;
  tamano?: "normal" | "grande";
  className?: string;
}) {
  // Se parte el texto ya formateado para no reinventar el formato de moneda.
  const texto = formatearPrecio(centavos, idioma, moneda);
  const partes = texto.match(/^(\D*)([\d.,]+?)([.,]\d{2})?$/);

  if (!partes) {
    return <span className={cn("font-bold", className)}>{texto}</span>;
  }

  const [, simbolo, enteros, decimales] = partes;

  return (
    <span
      className={cn(
        "inline-flex items-start font-bold tabular-nums",
        className,
      )}
    >
      <span
        className={tamano === "grande" ? "mt-1 text-base" : "mt-0.5 text-xs"}
      >
        {simbolo}
      </span>
      <span className={tamano === "grande" ? "text-3xl" : "text-xl"}>
        {enteros}
      </span>
      {decimales ? (
        <span
          className={tamano === "grande" ? "mt-1 text-base" : "mt-0.5 text-xs"}
        >
          {decimales.slice(1)}
        </span>
      ) : null}
    </span>
  );
}
