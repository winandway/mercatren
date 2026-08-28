import type { Destino } from "@/lib/destino/reglas";

/**
 * QUÉ DATOS DE ENTREGA PIDE CADA DESTINO.
 *
 * ══ POR QUÉ HACÍA FALTA (18 ago 2026) ══
 *
 * El dueño compró un producto del catálogo de Estados Unidos, eligió «que me
 * lo envíen», y **no había dónde escribir la dirección**: el formulario solo
 * pedía nombre, teléfono y en qué ciudad estaba. Escribió «MI» en la casilla
 * de ciudad, que es exactamente lo que hace cualquiera cuando el formulario
 * no dice qué quiere.
 *
 * No era un descuido: el checkout se construyó cuando Mercatren solo vendía
 * en Venezuela, donde **todo se retira en el depósito** y pedir calle y número
 * contradecía cada ficha del sitio. Ese comentario sigue en el código y era
 * correcto. Dejó de serlo el día que entró el catálogo de Estados Unidos.
 *
 * ══ Y LO QUE NO SE VEÍA EN LA PANTALLA ══
 *
 * Comprobado contra la documentación de CJ: **`shippingProvince` (el estado)
 * es OBLIGATORIO** para crear un pedido. Hoy se le mandaba
 * `entrega.referencia` —una casilla prestada que va vacía—, así que el pedido
 * se habría rechazado aunque el comprador pagara. Y el código postal no se
 * mandaba en absoluto: CJ lo da por opcional, pero sin él USPS entrega a
 * ciegas.
 *
 * ══ POR QUÉ ESTO ES UNA TABLA Y NO UN `if` ══
 *
 * Porque Chile y Colombia van a pedir lo suyo, y cada uno tiene su forma de
 * escribir una dirección. Con un `if (destino === "US")` repartido por el
 * formulario, el servidor y el proveedor, el primer país nuevo obliga a
 * encontrar los tres — y siempre se olvida uno.
 */

/** Una casilla del formulario de entrega. */
export type CampoDeEntrega = {
  /** El `name` del formulario, y la llave con la que se guarda. */
  nombre: string;
  /** El tipo de `<Campo>`, que decide teclado, filtro y comprobación. */
  tipo: "nombrePersona" | "telefono" | "ciudad" | "direccion" | "textoCorto";
  obligatorio: boolean;
  /** Ocupa las dos columnas del formulario. */
  ancho?: boolean;
  /** `autocomplete` del navegador: rellena la dirección de un toque. */
  auto?: string;
};

/** Lo que se pide siempre, vaya donde vaya el pedido. */
const COMUNES: CampoDeEntrega[] = [
  { nombre: "nombre", tipo: "nombrePersona", obligatorio: true, auto: "name" },
  { nombre: "telefono", tipo: "telefono", obligatorio: true, auto: "tel" },
];

/**
 * VENEZUELA: se retira en el depósito.
 *
 * Se pide en qué ciudad está quien retira, para confirmar que sabe a dónde
 * tiene que ir. **No se pide calle y número a propósito**: el sitio entero
 * dice que se retira, y pedir una dirección haría creer que llevamos.
 */
const VENEZUELA: CampoDeEntrega[] = [
  ...COMUNES,
  {
    nombre: "ciudad",
    tipo: "ciudad",
    obligatorio: true,
    auto: "address-level2",
  },
];

/**
 * ESTADOS UNIDOS: se despacha a una dirección.
 *
 * El orden es el de un sobre, que es como lo tiene memorizado cualquiera:
 * calle, apartamento, ciudad, estado, código postal.
 */
const ESTADOS_UNIDOS: CampoDeEntrega[] = [
  ...COMUNES,
  {
    nombre: "direccion",
    tipo: "direccion",
    obligatorio: true,
    ancho: true,
    auto: "address-line1",
  },
  {
    /* Apartamento, suite, piso. Opcional de verdad: mucha gente vive en una
       casa. Va aparte de la calle porque CJ tiene su propio campo
       (`shippingAddress2`) y meterlo todo junto corta a los 500 caracteres. */
    nombre: "direccion2",
    tipo: "textoCorto",
    obligatorio: false,
    ancho: true,
    auto: "address-line2",
  },
  {
    nombre: "ciudad",
    tipo: "ciudad",
    obligatorio: true,
    auto: "address-level2",
  },
  {
    /* El ESTADO. Es el que faltaba y el que hace que CJ rechace el pedido. */
    nombre: "estado",
    tipo: "textoCorto",
    obligatorio: true,
    auto: "address-level1",
  },
  {
    nombre: "codigoPostal",
    tipo: "textoCorto",
    obligatorio: true,
    auto: "postal-code",
  },
];

/**
 * Chile y Colombia piden LO MISMO que EE. UU.: quién recibe, calle, ciudad,
 * región/departamento de una lista, y código postal. La lista cambia por
 * país (abajo), los campos no — por eso comparten la tabla de EE. UU. en vez
 * de copiarla: una copia por país se desincroniza al primer arreglo.
 */
const POR_DESTINO: Record<Destino, CampoDeEntrega[]> = {
  VE: VENEZUELA,
  US: ESTADOS_UNIDOS,
  CL: ESTADOS_UNIDOS,
  CO: ESTADOS_UNIDOS,
};

/** Las casillas que hay que dibujar para este destino. */
export function camposDeEntrega(destino: Destino): CampoDeEntrega[] {
  return POR_DESTINO[destino];
}

/**
 * ¿Falta algo? Devuelve los NOMBRES de las casillas obligatorias vacías.
 *
 * Se devuelven todas, no la primera: quien está llenando el formulario tiene
 * que poder arreglarlo de una pasada. Ir de una en una es cómo se abandona
 * una compra.
 */
export function faltantesDeEntrega(
  destino: Destino,
  valores: Record<string, string | undefined | null>,
): string[] {
  return camposDeEntrega(destino)
    .filter((c) => c.obligatorio)
    .filter((c) => !(valores[c.nombre] ?? "").trim())
    .map((c) => c.nombre);
}

/**
 * LOS ESTADOS DE ESTADOS UNIDOS, con su código de dos letras.
 *
 * Se elige de una lista y NO se escribe a mano, por dos razones que cuestan
 * dinero: CJ compara este valor contra su propia tabla, y «Florida», «florida»
 * y «FL» no son lo mismo para ellos — un pedido con el estado mal escrito lo
 * rechazan. Y quien escribe a mano pone «MI» pensando en su ciudad, que es
 * justo lo que pasó al descubrir este fallo.
 *
 * Se manda el CÓDIGO de dos letras, que es lo que espera cualquier
 * transportista de allá.
 */
export const ESTADOS_US: ReadonlyArray<{ codigo: string; nombre: string }> = [
  { codigo: "AL", nombre: "Alabama" },
  { codigo: "AK", nombre: "Alaska" },
  { codigo: "AZ", nombre: "Arizona" },
  { codigo: "AR", nombre: "Arkansas" },
  { codigo: "CA", nombre: "California" },
  { codigo: "CO", nombre: "Colorado" },
  { codigo: "CT", nombre: "Connecticut" },
  { codigo: "DE", nombre: "Delaware" },
  { codigo: "DC", nombre: "District of Columbia" },
  { codigo: "FL", nombre: "Florida" },
  { codigo: "GA", nombre: "Georgia" },
  { codigo: "HI", nombre: "Hawaii" },
  { codigo: "ID", nombre: "Idaho" },
  { codigo: "IL", nombre: "Illinois" },
  { codigo: "IN", nombre: "Indiana" },
  { codigo: "IA", nombre: "Iowa" },
  { codigo: "KS", nombre: "Kansas" },
  { codigo: "KY", nombre: "Kentucky" },
  { codigo: "LA", nombre: "Louisiana" },
  { codigo: "ME", nombre: "Maine" },
  { codigo: "MD", nombre: "Maryland" },
  { codigo: "MA", nombre: "Massachusetts" },
  { codigo: "MI", nombre: "Michigan" },
  { codigo: "MN", nombre: "Minnesota" },
  { codigo: "MS", nombre: "Mississippi" },
  { codigo: "MO", nombre: "Missouri" },
  { codigo: "MT", nombre: "Montana" },
  { codigo: "NE", nombre: "Nebraska" },
  { codigo: "NV", nombre: "Nevada" },
  { codigo: "NH", nombre: "New Hampshire" },
  { codigo: "NJ", nombre: "New Jersey" },
  { codigo: "NM", nombre: "New Mexico" },
  { codigo: "NY", nombre: "New York" },
  { codigo: "NC", nombre: "North Carolina" },
  { codigo: "ND", nombre: "North Dakota" },
  { codigo: "OH", nombre: "Ohio" },
  { codigo: "OK", nombre: "Oklahoma" },
  { codigo: "OR", nombre: "Oregon" },
  { codigo: "PA", nombre: "Pennsylvania" },
  { codigo: "RI", nombre: "Rhode Island" },
  { codigo: "SC", nombre: "South Carolina" },
  { codigo: "SD", nombre: "South Dakota" },
  { codigo: "TN", nombre: "Tennessee" },
  { codigo: "TX", nombre: "Texas" },
  { codigo: "UT", nombre: "Utah" },
  { codigo: "VT", nombre: "Vermont" },
  { codigo: "VA", nombre: "Virginia" },
  { codigo: "WA", nombre: "Washington" },
  { codigo: "WV", nombre: "West Virginia" },
  { codigo: "WI", nombre: "Wisconsin" },
  { codigo: "WY", nombre: "Wyoming" },
  /* Hawái y Alaska SÍ están en la lista aunque el mapa de la ficha no los
     dibuje: quien vive allá puede comprar y el plazo se le avisa aparte. */
];

/** ¿Es un estado de verdad? Se comprueba en el servidor, no solo al elegir. */
export function esEstadoUS(valor: string | null | undefined): boolean {
  const v = (valor ?? "").trim().toUpperCase();
  return ESTADOS_US.some((e) => e.codigo === v);
}

/**
 * El código postal de Estados Unidos: cinco dígitos, o cinco más cuatro.
 *
 * Se acepta con guion o sin él —la gente escribe las dos formas— y se guarda
 * como venga: es lo que va en la etiqueta del paquete.
 */
export function esCodigoPostalUS(valor: string | null | undefined): boolean {
  return /^\d{5}(-\d{4})?$/.test((valor ?? "").trim());
}

/**
 * LAS REGIONES DE CHILE, de una lista y jamás escritas a mano.
 *
 * ══ SE MANDA EL NOMBRE COMPLETO Y SIN ACENTOS, no una sigla ══
 *
 * Con EE. UU. se manda «FL» porque esa ES la tabla de los transportistas de
 * allá. Para Chile no existe una tabla de siglas estándar: «RM» no le dice
 * nada a un courier. Se manda el nombre oficial de la región, sin acentos —
 * los acentos son la primera causa de un texto que «no coincide» en el
 * sistema de un transportista. Si CJ rechaza alguno, su mensaje sale entero
 * en el panel y se corrige aquí, en una lista, no en mil pedidos.
 */
export const REGIONES_CL: ReadonlyArray<{ codigo: string; nombre: string }> = [
  { codigo: "Arica y Parinacota", nombre: "Arica y Parinacota" },
  { codigo: "Tarapaca", nombre: "Tarapacá" },
  { codigo: "Antofagasta", nombre: "Antofagasta" },
  { codigo: "Atacama", nombre: "Atacama" },
  { codigo: "Coquimbo", nombre: "Coquimbo" },
  { codigo: "Valparaiso", nombre: "Valparaíso" },
  { codigo: "Region Metropolitana", nombre: "Región Metropolitana (Santiago)" },
  { codigo: "O'Higgins", nombre: "O'Higgins" },
  { codigo: "Maule", nombre: "Maule" },
  { codigo: "Nuble", nombre: "Ñuble" },
  { codigo: "Biobio", nombre: "Biobío" },
  { codigo: "La Araucania", nombre: "La Araucanía" },
  { codigo: "Los Rios", nombre: "Los Ríos" },
  { codigo: "Los Lagos", nombre: "Los Lagos" },
  { codigo: "Aysen", nombre: "Aysén" },
  { codigo: "Magallanes", nombre: "Magallanes" },
];

/** Los departamentos de Colombia, misma regla que las regiones chilenas. */
export const DEPARTAMENTOS_CO: ReadonlyArray<{
  codigo: string;
  nombre: string;
}> = [
  { codigo: "Amazonas", nombre: "Amazonas" },
  { codigo: "Antioquia", nombre: "Antioquia" },
  { codigo: "Arauca", nombre: "Arauca" },
  { codigo: "Atlantico", nombre: "Atlántico" },
  { codigo: "Bogota DC", nombre: "Bogotá D.C." },
  { codigo: "Bolivar", nombre: "Bolívar" },
  { codigo: "Boyaca", nombre: "Boyacá" },
  { codigo: "Caldas", nombre: "Caldas" },
  { codigo: "Caqueta", nombre: "Caquetá" },
  { codigo: "Casanare", nombre: "Casanare" },
  { codigo: "Cauca", nombre: "Cauca" },
  { codigo: "Cesar", nombre: "Cesar" },
  { codigo: "Choco", nombre: "Chocó" },
  { codigo: "Cordoba", nombre: "Córdoba" },
  { codigo: "Cundinamarca", nombre: "Cundinamarca" },
  { codigo: "Guainia", nombre: "Guainía" },
  { codigo: "Guaviare", nombre: "Guaviare" },
  { codigo: "Huila", nombre: "Huila" },
  { codigo: "La Guajira", nombre: "La Guajira" },
  { codigo: "Magdalena", nombre: "Magdalena" },
  { codigo: "Meta", nombre: "Meta" },
  { codigo: "Narino", nombre: "Nariño" },
  { codigo: "Norte de Santander", nombre: "Norte de Santander" },
  { codigo: "Putumayo", nombre: "Putumayo" },
  { codigo: "Quindio", nombre: "Quindío" },
  { codigo: "Risaralda", nombre: "Risaralda" },
  { codigo: "San Andres y Providencia", nombre: "San Andrés y Providencia" },
  { codigo: "Santander", nombre: "Santander" },
  { codigo: "Sucre", nombre: "Sucre" },
  { codigo: "Tolima", nombre: "Tolima" },
  { codigo: "Valle del Cauca", nombre: "Valle del Cauca" },
  { codigo: "Vaupes", nombre: "Vaupés" },
  { codigo: "Vichada", nombre: "Vichada" },
];

/**
 * La lista de estados/regiones/departamentos de un destino, o null si ese
 * destino escribe la ciudad libre (Venezuela). El checkout dibuja el `select`
 * con lo que salga de aquí: UNA función, no un `if` por país en la pantalla.
 */
export function listaDeEstados(
  destino: Destino,
): ReadonlyArray<{ codigo: string; nombre: string }> | null {
  if (destino === "US") return ESTADOS_US;
  if (destino === "CL") return REGIONES_CL;
  if (destino === "CO") return DEPARTAMENTOS_CO;
  return null;
}
