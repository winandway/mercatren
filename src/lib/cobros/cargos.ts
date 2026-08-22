/**
 * FLETE Y MANEJO: LOS CARGOS QUE NO SON MERCANCÍA — la parte pura.
 *
 * ══ EL CASO REAL QUE LO PIDIÓ ══
 *
 * Una ferretería vende diez sacos de cemento por $540. El cliente pide que se
 * los lleven: el camión son $40, y subirlos a un tercer piso con dos ayudantes,
 * $20 más. El cliente paga $600.
 *
 * Sin esto, el comercio tenía dos salidas y las dos malas: sumarlo al precio de
 * la mercancía —y entonces la factura dice que el cemento costó $600, que es
 * falso— o no cobrarlo y perder el dinero.
 *
 * ══ POR QUÉ SE LLAMAN ASÍ Y NO «GASTOS ADICIONALES» ══
 *
 * `flete` es el traslado. `manejo` es lo que se hace con la mercancía:
 * embalaje especial, carga y descarga, acarreo, subir a un piso. Es el término
 * de la industria (*handling*) y separarlos importa de verdad — el flete lo
 * cobra quien transporta y el manejo lo cobra quien pone la gente. Un solo
 * renglón de «otros gastos» es exactamente lo que hace que un cliente llame a
 * preguntar, y a veces a su banco.
 */

export const TIPOS_DE_CARGO = ["flete", "manejo"] as const;
export type TipoDeCargo = (typeof TIPOS_DE_CARGO)[number];

export type Cargo = {
  tipo: TipoDeCargo;
  concepto: string | null;
  montoCentavos: number;
};

/**
 * TOPE POR CARGO.
 *
 * No es desconfianza: es que un dedo de más convierte $40 en $4.000 y quien
 * paga lo ve como un robo. El tope corta el error de tecleo, no el negocio —
 * ningún flete de una ferretería llega a cinco mil dólares.
 */
export const MAXIMO_CARGO_CENTAVOS = 500_000;

/**
 * EL TOTAL DE UN COBRO: MERCANCÍA MÁS LOS CARGOS.
 *
 * Se calcula, nunca se guarda aparte. Guardar el total además de sus partes es
 * tener dos verdades, y el día que no coincidan nadie sabrá cuál vale.
 */
export function totalDelCobro(
  mercanciaCentavos: number,
  cargos: readonly Cargo[],
): number {
  return cargos.reduce(
    (suma, c) => suma + Math.max(0, c.montoCentavos),
    Math.max(0, mercanciaCentavos),
  );
}

export type FalloDeCargo =
  "flete_invalido" | "manejo_invalido" | "flete_muy_alto" | "manejo_muy_alto";

/**
 * Revisa los cargos que llegaron del formulario.
 *
 * Devuelve la lista COMPLETA de lo que está mal, como el resto del proyecto:
 * quien llena esto tiene un cliente delante y no puede corregir de uno en uno.
 */
export function revisarCargos(
  crudos: { tipo: TipoDeCargo; montoCentavos: number | null }[],
): FalloDeCargo[] {
  const fallos: FalloDeCargo[] = [];

  for (const c of crudos) {
    /* Un cargo vacío NO es un error: la mayoría de las ventas no llevan flete
       ni manejo, y exigirlos convertiría el caso normal en un formulario que
       no deja pasar. */
    if (c.montoCentavos === null) continue;

    if (!Number.isFinite(c.montoCentavos) || c.montoCentavos < 0) {
      fallos.push(c.tipo === "flete" ? "flete_invalido" : "manejo_invalido");
      continue;
    }
    if (c.montoCentavos > MAXIMO_CARGO_CENTAVOS) {
      fallos.push(c.tipo === "flete" ? "flete_muy_alto" : "manejo_muy_alto");
    }
  }

  return fallos;
}

/**
 * Se queda solo con los cargos que de verdad hay que guardar.
 *
 * **Un cargo en CERO no se guarda**, y es deliberado: en la página de pago
 * saldría un renglón «Flete: $0.00» que no significa nada y hace dudar de si
 * falta algo por cobrar.
 */
export function cargosAGuardar(
  crudos: {
    tipo: TipoDeCargo;
    concepto: string;
    montoCentavos: number | null;
  }[],
): Cargo[] {
  return crudos
    .filter((c) => c.montoCentavos !== null && c.montoCentavos > 0)
    .map((c) => ({
      tipo: c.tipo,
      /* El concepto se recorta pero NO se exige. Un comercio con prisa escribe
         el monto y se va; obligarlo a explicar cada cargo haría que sumara el
         flete al precio de la mercancía, que es justo lo que esto viene a
         evitar. */
      concepto: c.concepto.trim() ? c.concepto.trim().slice(0, 160) : null,
      montoCentavos: c.montoCentavos!,
    }));
}
