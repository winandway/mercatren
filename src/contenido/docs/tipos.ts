/**
 * Las piezas con las que se arma un documento publico.
 *
 * El contenido largo vive aqui, en archivos de datos, y no en messages/*.json:
 * los mensajes son para la interfaz (botones, etiquetas) y se llenarian de
 * parrafos que nadie encuentra. Asi cada documento se lee de corrido en su
 * propio archivo y se traduce al lado.
 */

/** Un panel de los que van en pareja: "lo que si" / "lo que no". */
export type Panel = {
  titulo: string;
  tono: "bien" | "ojo";
  puntos: string[];
};

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; puntos: { titulo?: string; texto: string }[] }
  | {
      tipo: "aviso";
      tono: "neutro" | "acento" | "bien" | "ojo";
      titulo: string;
      parrafos: string[];
    }
  | { tipo: "dosColumnas"; izquierda: Panel; derecha: Panel }
  | {
      tipo: "tabla";
      encabezados: string[];
      filas: string[][];
      /** Pie de la tabla, para explicar de donde salen los numeros. */
      nota?: string;
    }
  | {
      tipo: "pasos";
      pasos: {
        numero: string;
        etiqueta: string;
        titulo: string;
        parrafos: string[];
      }[];
    }
  | {
      tipo: "fases";
      fases: { titulo: string; ocurre: string; evidencia: string[] }[];
    }
  | { tipo: "figuraCiclo" }
  | { tipo: "figuraFrontera" }
  | { tipo: "figuraResumen" }
  | { tipo: "cifras"; items: { valor: string; texto: string }[] };

export type Seccion = {
  /** Va en la URL (#ancla) y en el indice lateral. */
  id: string;
  numero: string;
  titulo: string;
  /** La etiqueta corta de la derecha en el indice del PDF. */
  etiqueta: string;
  bloques: Bloque[];
};

/** Los textos de los dibujos. Van aqui para que se traduzcan como el resto. */
export type TextosFiguras = {
  /**
   * Figura 1: la compraventa. A la izquierda Estados Unidos, donde ocurre
   * toda la operacion comercial; a la derecha, la entrega del producto.
   */
  ciclo: {
    titulo: string;
    eeuu: string;
    venezuela: string;
    comprador: { rol: string; nombre: string; detalle: string };
    mercatren: { rol: string; nombre: string; detalle: string };
    proveedor: { rol: string; nombre: string; detalle: string };
    comercio: { rol: string; nombre: string; detalle: string };
    consumidor: { rol: string; nombre: string; detalle: string };
    paga: string;
    /** El segundo movimiento de dinero: la compra de la mercancia. */
    compra: string;
    pide: string;
    entrega: string;
    enlace: string;
    orden: string;
    fuera: string;
    pie: string;
  };
  /**
   * Figura 2: lo que Mercatren no hace, y lo que si hace.
   *
   * Arriba, en rojo, la figura que el modelo NO tiene: recibir dinero de una
   * persona para entregarselo a otra. Abajo, la real: una compraventa de
   * mercancia con dos facturas, cerrada dentro de Estados Unidos.
   */
  frontera: {
    noTitulo: string;
    noTexto: string;
    noCajas: string[];
    noNota: string;
    siTitulo: string;
    siTexto: string;
    /** Lo que ocurre dentro de Estados Unidos. */
    siCajas: string[];
    /** Lo unico que cruza la frontera: el producto. */
    cruzaCajas: string[];
    circuito: string;
    frontera: string;
    consecuencia: string;
  };
  resumen: {
    pasos: { titulo: string; detalle: string }[];
    banda: string;
    sinDinero: string;
    afirmaciones: string[];
  };
};

export type Documento = {
  /** Para <title> y el H1. */
  titulo: string;
  subtitulo: string;
  /** Meta description y entradilla. */
  resumen: string;
  version: string;
  actualizado: string;
  entradilla: string[];
  cifras: { valor: string; texto: string }[];
  ideasClave: { titulo: string; texto: string }[];
  indiceTitulo: string;
  secciones: Seccion[];
  figuras: TextosFiguras;
  preguntas: { pregunta: string; respuesta: string }[];
  preguntasTitulo: string;
  aviso: string;
};
