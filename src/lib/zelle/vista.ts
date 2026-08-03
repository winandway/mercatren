import type { PagoZelle } from "@/lib/db/schema";

/**
 * Version del pago lista para mandar al navegador.
 *
 * Las fechas viajan como numero (milisegundos) para que no dependan de como
 * cada navegador interprete el texto, y para que el componente las formatee
 * siempre en la misma zona horaria.
 */
export type PagoVista = {
  id: string;
  origen: "import" | "live";
  tipo: "entrada" | "retiro";
  estado: "aprobado" | "pendiente" | "rechazado";
  montoCentavos: number;
  comisionCentavos: number;
  netoCentavos: number;
  moneda: string;
  reciboUrl: string | null;
  notas: string | null;
  motivoRechazo: string | null;
  subidoEn: number | null;
  aprobadoEn: number | null;
  fechaTransaccion: number | null;
  codigoConfirmacion: string | null;
  pagadorNombre: string | null;
  pagadorNombreCrudo: string | null;
  pagadorCorreo: string | null;
  pagadorTipo: "persona" | "empresa" | "cuenta_bancaria" | "desconocido";
  bancoOrigen: string | null;
  cuentaUltimos4: string | null;
  receptorNombreCrudo: string | null;
  cuentaReceptora: string | null;
  sellerCuenta: string | null;
};

function ms(valor: Date | number | null): number | null {
  if (valor === null || valor === undefined) return null;
  return valor instanceof Date ? valor.getTime() : Number(valor) * 1000;
}

export function aPagoVista(pago: PagoZelle): PagoVista {
  return {
    id: pago.id,
    origen: pago.origen,
    tipo: pago.tipo,
    estado: pago.estado,
    montoCentavos: pago.montoCentavos,
    comisionCentavos: pago.comisionCentavos,
    netoCentavos: pago.netoCentavos,
    moneda: pago.moneda,
    reciboUrl: pago.reciboUrl,
    notas: pago.notas,
    motivoRechazo: pago.motivoRechazo,
    subidoEn: ms(pago.subidoEn),
    aprobadoEn: ms(pago.aprobadoEn),
    fechaTransaccion: ms(pago.fechaTransaccion),
    codigoConfirmacion: pago.codigoConfirmacion,
    pagadorNombre: pago.pagadorNombre,
    pagadorNombreCrudo: pago.pagadorNombreCrudo,
    pagadorCorreo: pago.pagadorCorreo,
    pagadorTipo: pago.pagadorTipo,
    bancoOrigen: pago.bancoOrigen,
    cuentaUltimos4: pago.cuentaUltimos4,
    receptorNombreCrudo: pago.receptorNombreCrudo,
    cuentaReceptora: pago.cuentaReceptora,
    sellerCuenta: pago.sellerCuenta,
  };
}
