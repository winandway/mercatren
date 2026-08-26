/**
 * CUADRAR UNA FACTURA CON CANTIDADES ENTERAS (26 ago 2026).
 *
 * ══ EL CASO REAL ══
 *
 * Un comercio vende tubo estructural a $199.05 la unidad y tiene que cobrar
 * una factura de **$7,475.00 exactos**. Divide: 7475 / 199.05 = 37,55
 * unidades. No da entero, y se puso a probar a mano —14 tubos, 20 tubos— para
 * ver cuál se acercaba. Sus palabras: «¿va agregando un tubo uno por uno?».
 *
 * Esto responde eso: dados los precios de sus productos y el monto que tiene
 * que cobrar, devuelve las cantidades que lo dan EXACTO — y si no existe
 * combinación exacta, la más cercana, diciendo cuánto falta o sobra.
 *
 * ══ POR QUÉ EN CENTAVOS Y CON PROGRAMACIÓN DINÁMICA ══
 *
 * Todo el dinero del proyecto va en centavos enteros, y aquí importa el
 * doble: la diferencia entre cuadrar y no cuadrar es un centavo. La búsqueda
 * es la del problema del cambio de moneda —qué monedas suman exacto—, que con
 * enteros se resuelve entero y sin aproximaciones de coma flotante.
 */

export type ProductoParaCuadrar = {
  id: string;
  titulo: string;
  precioCentavos: number;
};

export type LineaCuadrada = {
  id: string;
  titulo: string;
  precioCentavos: number;
  cantidad: number;
  subtotalCentavos: number;
};

export type Cuadre = {
  /** `exacto` cuando suma justo el objetivo. */
  exacto: boolean;
  lineas: LineaCuadrada[];
  totalCentavos: number;
  /** Positivo si el total se pasa del objetivo; negativo si se queda corto. */
  diferenciaCentavos: number;
};

/**
 * Tope de la búsqueda: 50 millones de centavos son $500.000.
 *
 * No es un límite de negocio, es de memoria: la tabla lleva una entrada por
 * centavo. Por encima de eso se cae a la búsqueda aproximada, que no necesita
 * tabla — y una factura de medio millón de dólares no se cuadra a mano.
 */
export const TOPE_BUSQUEDA_CENTAVOS = 50_000_000;

/**
 * Las cantidades que suman el objetivo.
 *
 * Devuelve `null` solo si no hay con qué trabajar (sin productos, o todos con
 * precio cero): en cualquier otro caso devuelve algo, aunque sea aproximado —
 * un «no se pudo» deja al comercio en el mismo sitio donde empezó.
 */
export function cuadrarFactura(
  productos: ProductoParaCuadrar[],
  objetivoCentavos: number,
): Cuadre | null {
  const usables = productos.filter((p) => p.precioCentavos > 0);
  if (usables.length === 0 || objetivoCentavos <= 0) return null;

  if (objetivoCentavos <= TOPE_BUSQUEDA_CENTAVOS) {
    const mejor = buscarMejor(usables, objetivoCentavos);
    if (mejor) return mejor;
  }
  return aproximar(usables, objetivoCentavos);
}

/**
 * LA BÚSQUEDA: el importe alcanzable MÁS CERCANO al objetivo.
 *
 * `desde[i]` guarda con qué producto se llegó al importe `i`, y de ahí se
 * reconstruye la combinación hacia atrás.
 *
 * ══ POR QUÉ NO BASTA CON BUSCAR EL OBJETIVO EXACTO ══
 *
 * Casi nunca existe. En el caso real —tubos de $199.05 y $191.61 para una
 * factura de $7,475— no hay ninguna combinación exacta, y la primera versión
 * caía entonces a un llenado voraz que devolvía $7,556.46: **$81 de más**.
 * Recorriendo la misma tabla en busca del más cercano sale `26 × $199.05 +
 * 12 × $191.61 = $7,474.62` — treinta y ocho centavos. La tabla ya estaba
 * calculada; era cuestión de mirarla entera en vez de una sola casilla.
 *
 * Se explora un poco más allá del objetivo para poder pasarse por poco: a
 * veces quedarse corto cuesta más que excederse, y quien decide es el
 * comercio — por eso la diferencia se le enseña con su signo.
 */
function buscarMejor(
  productos: ProductoParaCuadrar[],
  objetivo: number,
): Cuadre | null {
  const masCaro = Math.max(...productos.map((p) => p.precioCentavos));
  const tope = Math.min(objetivo + masCaro, TOPE_BUSQUEDA_CENTAVOS);

  /* -1 = todavía no se sabe llegar a ese importe. */
  const desde = new Int32Array(tope + 1).fill(-1);
  desde[0] = -2; /* el cero se alcanza sin comprar nada */

  for (let importe = 1; importe <= tope; importe++) {
    for (let i = 0; i < productos.length; i++) {
      const precio = productos[i]!.precioCentavos;
      if (precio > importe) continue;
      if (desde[importe - precio] !== -1) {
        desde[importe] = i;
        break;
      }
    }
  }

  /* El alcanzable más cercano, mirando a los dos lados a la vez. */
  let mejor = -1;
  for (let d = 0; d <= tope; d++) {
    const abajo = objetivo - d;
    if (abajo > 0 && desde[abajo] !== -1) {
      mejor = abajo;
      break;
    }
    const arriba = objetivo + d;
    if (arriba <= tope && desde[arriba] !== -1) {
      mejor = arriba;
      break;
    }
  }
  if (mejor < 0) return null;

  const cantidades = new Map<string, number>();
  let resto = mejor;
  while (resto > 0) {
    const i = desde[resto]!;
    const producto = productos[i]!;
    cantidades.set(producto.id, (cantidades.get(producto.id) ?? 0) + 1);
    resto -= producto.precioCentavos;
  }

  return armar(productos, cantidades, objetivo);
}

/**
 * El respaldo para facturas por encima del tope de la tabla.
 *
 * Llena con el más caro que quepa —así se usan menos unidades— y prueba a
 * sumar una del más barato por si pasarse deja menos diferencia. Es peor que
 * la búsqueda, pero una factura de más de medio millón de dólares no se
 * cuadra a mano de todos modos.
 */
function aproximar(productos: ProductoParaCuadrar[], objetivo: number): Cuadre {
  const orden = [...productos].sort(
    (a, b) => b.precioCentavos - a.precioCentavos,
  );
  const cantidades = new Map<string, number>();
  let acumulado = 0;

  for (const p of orden) {
    const caben = Math.floor((objetivo - acumulado) / p.precioCentavos);
    if (caben > 0) {
      cantidades.set(p.id, (cantidades.get(p.id) ?? 0) + caben);
      acumulado += caben * p.precioCentavos;
    }
  }

  const porDebajo = armar(productos, cantidades, objetivo);
  const masBarato = orden[orden.length - 1]!;
  const arriba = new Map(cantidades);
  arriba.set(masBarato.id, (arriba.get(masBarato.id) ?? 0) + 1);
  const porEncima = armar(productos, arriba, objetivo);

  return Math.abs(porEncima.diferenciaCentavos) <
    Math.abs(porDebajo.diferenciaCentavos)
    ? porEncima
    : porDebajo;
}

function armar(
  productos: ProductoParaCuadrar[],
  cantidades: Map<string, number>,
  objetivo: number,
): Cuadre {
  const lineas: LineaCuadrada[] = productos
    .map((p) => {
      const cantidad = cantidades.get(p.id) ?? 0;
      return {
        id: p.id,
        titulo: p.titulo,
        precioCentavos: p.precioCentavos,
        cantidad,
        subtotalCentavos: cantidad * p.precioCentavos,
      };
    })
    .filter((l) => l.cantidad > 0);

  const totalCentavos = lineas.reduce((s, l) => s + l.subtotalCentavos, 0);
  return {
    exacto: totalCentavos === objetivo,
    lineas,
    totalCentavos,
    diferenciaCentavos: totalCentavos - objetivo,
  };
}

/**
 * LAS DOS CIFRAS DE UNA FACTURA, SIN AMBIGÜEDAD.
 *
 * Es de donde salía la confusión: el comercio decía «$7,475 con el 3% dentro»
 * y a la vez «$2,775 menos el 3%», que son dos cosas distintas. Aquí se
 * calculan las dos siempre y se le enseñan las dos, para que no haya que
 * adivinar cuál quiso decir.
 *
 * - `paga el cliente` es el monto del cobro.
 * - `recibe el comercio` es eso menos el margen de Mercatren.
 */
export function lasDosCifras(
  totalCentavos: number,
  comisionPuntosBase: number,
): { pagaElCliente: number; recibeElComercio: number; margen: number } {
  const margen = Math.round((totalCentavos * comisionPuntosBase) / 10_000);
  return {
    pagaElCliente: totalCentavos,
    recibeElComercio: totalCentavos - margen,
    margen,
  };
}

/**
 * Al revés: cuánto hay que cobrar para que al comercio le lleguen X limpios.
 *
 * Se redondea hacia ARRIBA a propósito. Hacia abajo, el comercio recibiría un
 * centavo menos de lo que pidió — y en una pantalla de dinero un centavo que
 * falta es una llamada.
 */
export function cuantoCobrarParaRecibir(
  netoDeseadoCentavos: number,
  comisionPuntosBase: number,
): number {
  if (comisionPuntosBase >= 10_000) return netoDeseadoCentavos;
  return Math.ceil(
    (netoDeseadoCentavos * 10_000) / (10_000 - comisionPuntosBase),
  );
}
