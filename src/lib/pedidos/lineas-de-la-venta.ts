import { divisorDe } from "@/lib/mercado/moneda";
const NOMBRE_DEL_METODO: Record<string, string> = {
  stripe: "Tarjeta",
  zelle: "Zelle",
  billetera: "Saldo en Mercatren",
};

/**
 * LAS LÍNEAS DEL AVISO DE UNA VENTA — puras, sin base y sin `server-only`,
 * para poder probarlas: el 30 ago 2026 el aviso de la MT-000010 (65.423 COP)
 * salió como «654.23 USD» y nadie tenía una prueba que lo viera.
 */
export type FichaDeVenta = {
  /** La moneda del pedido: un aviso de 65.423 COP no puede decir 654.23 USD. */
  moneda: string;
  numero: string;
  totalCentavos: number;
  metodoPago: string | null;
  /** `pi_…` de Stripe o el código de confirmación del banco. */
  referencia: string | null;
  comprador: { nombre: string; correo: string } | null;
  entrega: string | null;
  /** El teléfono con el que se le habla al comprador por este pedido. */
  telefono: string | null;
  /** Un renglón por comercio, con lo que se le compró y lo que se le paga. */
  comercios: Array<{
    nombre: string;
    /** Quién responde por la entrega: el dueño de la cuenta del comercio. */
    responsable: string | null;
    brutoCentavos: number;
    comisionCentavos: number;
    netoCentavos: number;
    articulos: Array<{ titulo: string; cantidad: number; centavos: number }>;
  }>;
  /** La factura de venta al comprador, si ya se emitió. */
  facturaNumero: string | null;
  /** Las órdenes de compra a los comercios, si ya se emitieron. */
  ordenesNumero: string[];
};

export function lineasDeLaVenta(f: FichaDeVenta): string[] {
  /* El divisor es el de la moneda del pedido: CLP y COP no tienen centavos.
     El ÷100 fijo convertía una venta de 65.423 COP en «654.23 USD» — el
     aviso mentía el monto Y la moneda. */
  const divisor = divisorDe(f.moneda);
  const usd = (c: number) =>
    `${(c / divisor).toFixed(divisor === 1 ? 0 : 2)} ${f.moneda}`;
  const lineas: string[] = [];

  lineas.push(
    `Pedido ${f.numero} · ${NOMBRE_DEL_METODO[f.metodoPago ?? ""] ?? "Sin método"} · Total ${usd(f.totalCentavos)}`,
  );

  if (f.referencia) lineas.push(`Referencia del cobro: ${f.referencia}`);

  if (f.comprador) {
    lineas.push(`Compró: ${f.comprador.nombre} · ${f.comprador.correo}`);
  }

  if (f.entrega) lineas.push(`Entregar a: ${f.entrega}`);
  if (f.telefono) lineas.push(`Teléfono: ${f.telefono}`);

  for (const c of f.comercios) {
    lineas.push(`— ${c.nombre} —`);
    if (c.responsable) lineas.push(`Entrega: ${c.responsable}`);
    for (const a of c.articulos) {
      lineas.push(`${a.cantidad} × ${a.titulo} — ${usd(a.centavos)}`);
    }
    lineas.push(
      `Vendido ${usd(c.brutoCentavos)} · comisión de Mercatren ${usd(c.comisionCentavos)} · se le paga ${usd(c.netoCentavos)}`,
    );
  }

  if (f.facturaNumero) lineas.push(`Factura de venta: ${f.facturaNumero}`);
  if (f.ordenesNumero.length) {
    lineas.push(`Orden de compra: ${f.ordenesNumero.join(", ")}`);
  }

  return lineas;
}
