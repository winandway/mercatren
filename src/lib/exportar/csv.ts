/**
 * LLEVARSE LOS NÚMEROS A UNA HOJA DE CÁLCULO.
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * El panel enseña las ventas de a 25 y con el formato de la pantalla. El
 * contador, el banco y cualquiera que tenga que cuadrar cifras trabajan en una
 * hoja de cálculo, y hoy la única forma de pasarlas era copiándolas a mano.
 * Copiar cifras a mano es como aparece un número que no cuadra con nada.
 *
 * ══ POR QUÉ ES UN ARCHIVO APARTE Y PURO ══
 *
 * Un CSV parece trivial —pegar comas— y tiene tres trampas que muerden con
 * datos reales: la coma dentro del texto, el acento que Excel dibuja al revés,
 * y la fórmula. Se resuelven aquí una vez y se prueban.
 */

/**
 * EL BOM: TRES BYTES QUE DECIDEN SI SE LEE O NO.
 *
 * Sin él, Excel en Windows abre el archivo en su código de página local y
 * «Ferremateriales Bley C.A» sale como «FerrematerialesÂ Bley». El contador no
 * sospecha del archivo: sospecha de los datos.
 */
const BOM = "﻿";

/**
 * LO QUE EMPIEZA POR ESTOS SIGNOS ES UNA FÓRMULA PARA EXCEL.
 *
 * Un nombre de cliente que empiece por «=» o por «+» —o cualquier texto que
 * alguien de fuera haya podido escribir— se ejecuta al abrir el archivo. Es
 * una vía real de ataque (inyección de fórmulas en CSV) y aquí los nombres y
 * los conceptos los escriben personas de fuera.
 *
 * Se neutraliza anteponiendo un apóstrofo, que es lo que entiende la hoja de
 * cálculo como «esto es texto». No se borra ni se recorta el dato: lo que
 * escribió la persona se sigue leyendo entero.
 */
const PELIGROSOS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * UN NÚMERO NEGATIVO NO ES UNA FÓRMULA, Y LA DIFERENCIA CUESTA DINERO.
 *
 * `-25.50` empieza por «-», pero marcarlo como texto deja una columna de
 * importes que la hoja de cálculo **no suma**: el contador ve los retiros y
 * los reembolsos ahí y el total le sale mal, sin un solo aviso.
 *
 * Lo que es un número negativo de verdad se deja pasar; lo demás se neutraliza.
 * Se comprueba sin expresión regular a propósito: `Number()` decide esto mejor
 * que un patrón, y sin el riesgo de que un texto largo lo haga trabajar de más.
 */
function esNegativoDeVerdad(texto: string): boolean {
  return texto.startsWith("-") && Number.isFinite(Number(texto));
}

/** Una celda, lista para pegarse en el archivo. */
export function celda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";

  let texto = String(valor);

  if (
    texto.length > 0 &&
    PELIGROSOS.includes(texto[0]!) &&
    !esNegativoDeVerdad(texto)
  ) {
    texto = `'${texto}`;
  }

  /* Se entrecomilla siempre que haya coma, comilla o salto de línea. Las
     comillas de dentro se duplican, que es como manda el formato. */
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }

  return texto;
}

/**
 * EL DINERO SALE EN DÓLARES CON DOS DECIMALES, NO EN CENTAVOS.
 *
 * Dentro del sistema el dinero es un entero de centavos y así se queda. Pero
 * este archivo lo abre una persona para sumar: una columna que diga `10310`
 * cuando el cobro fue de $103.10 se suma mal a la primera.
 *
 * Sin separador de miles y con punto decimal: es lo que toda hoja de cálculo
 * entiende como número sin tener que configurarle nada.
 */
export function dinero(centavos: number): string {
  const signo = centavos < 0 ? "-" : "";
  const abs = Math.abs(Math.round(centavos));
  return `${signo}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/**
 * La fecha en ISO corto (`2026-08-11`), que es la única que toda hoja de
 * cálculo ordena bien. `11/08/2026` se lee distinto en Estados Unidos que en
 * Venezuela, y el archivo cruza de un país a otro.
 */
export function fechaIso(fecha: Date | number | null | undefined): string {
  if (fecha === null || fecha === undefined) return "";
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** El archivo entero: cabecera y filas. */
export function aCsv(
  cabeceras: string[],
  filas: (string | number | null | undefined)[][],
): string {
  const lineas = [
    cabeceras.map(celda).join(","),
    ...filas.map((f) => f.map(celda).join(",")),
  ];

  /* CRLF, no LF: es lo que dice el formato y lo que no rompe en Excel viejo. */
  return BOM + lineas.join("\r\n") + "\r\n";
}

/**
 * El nombre del archivo que se descarga.
 *
 * Lleva la fecha porque quien exporta dos veces en la misma semana termina con
 * `ventas.csv` y `ventas (1).csv` y no sabe cuál es cuál.
 */
export function nombreDeArchivo(que: string, hoy: Date): string {
  return `mercatren-${que}-${fechaIso(hoy)}.csv`;
}
