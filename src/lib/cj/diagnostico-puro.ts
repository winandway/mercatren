/**
 * LO PURO DEL DIAGNÓSTICO DE COMPRAS A CJ (5 sep 2026).
 *
 * Sin `server-only` a propósito: estas dos funciones no tocan red ni base y
 * son justo lo que hay que poder probar en un vitest. El resto del
 * diagnóstico —lo que le habla a CJ— sigue en `diagnostico.ts`.
 */

/** Un paso del diagnóstico, con lo que CJ contestó de verdad. */
export type PasoDiagnostico = {
  numero: number;
  titulo: string;
  estado: "ok" | "aviso" | "fallo";
  /** Una línea en palabras normales: es lo que se lee primero. */
  resumen: string;
  /** La respuesta de CJ tal cual, para poder mirar los campos que no leemos. */
  crudo?: unknown;
};

export type Diagnostico = {
  pasos: PasoDiagnostico[];
  /** Dónde se detuvo, si se detuvo. */
  seDetuvoEn: string | null;
};

/* Las dos funciones puras viven en `diagnostico-puro.ts` para poder probarse
   sin `server-only`, que revienta bajo vitest. Se reexportan aquí para que
   quien ya las importaba de este archivo no tenga que cambiar nada. */

/** Saca el slug de una dirección de producto o de un slug pelado. */
export function slugDeLaUrl(entrada: string): string | null {
  const texto = entrada.trim();
  if (!texto) return null;
  /* Se admite el enlace completo Y el slug suelto: el dueño va a pegar lo que
     tenga a mano, y rechazar un slug porque no es una URL es una pared. */
  const conBarra = texto.match(/\/producto\/([^/?#]+)/);
  if (conBarra?.[1]) return decodeURIComponent(conBarra[1]);
  if (/^https?:\/\//i.test(texto)) return null;
  return texto.replace(/^\/+|\/+$/g, "") || null;
}

/**
 * ¿QUÉ ALMACENES NOMBRA CJ EN ESTA RESPUESTA?
 *
 * CJ no documenta un nombre fijo para el campo del almacén y cambia según el
 * endpoint (`countryCode`, `warehouseName`, `areaEn`…). En vez de adivinar
 * uno, se recogen TODOS los que aparezcan: lo que importa es poder ver si el
 * transporte elegido y el stock hablan del mismo sitio.
 */
export function almacenesNombrados(datos: unknown): string[] {
  const vistos = new Set<string>();
  const mirar = (v: unknown, hondo = 0) => {
    if (hondo > 4 || v === null || typeof v !== "object") return;
    if (Array.isArray(v)) {
      for (const x of v.slice(0, 60)) mirar(x, hondo + 1);
      return;
    }
    for (const [clave, valor] of Object.entries(v as Record<string, unknown>)) {
      if (
        /warehouse|almacen|areaEn|countryCode|fromCountry/i.test(clave) &&
        typeof valor === "string" &&
        valor.trim()
      ) {
        vistos.add(`${clave}=${valor.trim()}`);
      }
      mirar(valor, hondo + 1);
    }
  };
  mirar(datos);
  return [...vistos];
}

/* ══ LO QUE EL ARCHIVO DE ACCIONES NO PUEDE EXPORTAR ══
   `probar-compra.ts` lleva «use server», y un archivo así solo puede
   exportar funciones async: una constante o un tipo exportado hace que
   Turbopack rechace el módulo ENTERO («the module has no exports»). tsc no
   lo ve; la compilación sí. Por eso viven aquí. */

/** Donde queda el rastro de la última compra de prueba a CJ. */
export const LLAVE_ULTIMA_PRUEBA = "cj_ultima_compra_de_prueba";

export type UltimaCompraDePrueba = {
  numero: string;
  producto: string;
  estado: "pagado" | "creado_sin_pagar" | "fallo";
  detalle: string;
  ids: string[];
  /** El número del ENVÍO (SD…) que pide `payBalanceV2`. Lo da CJ al crear o
      al confirmar el carrito; si no se guarda, no se puede pagar después. */
  shipmentOrderId?: string | null;
  enMs: number;
  quien: string;
};

export type DireccionDePrueba = {
  nombre: string;
  direccion: string;
  direccion2?: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  telefono?: string;
};

/* ═══════════════════════════════════════════════════════════════════════════
   LA SONDA DE CJ: QUÉ RUTAS SE PUEDEN LLAMAR DESDE LA PUERTA DE PRUEBAS
   ═══════════════════════════════════════════════════════════════════════════

   `/datos/probar-compra` (5 sep 2026) deja mandarle a CJ una llamada suelta
   —leer un pedido, ver el saldo, probar un pago— para poder depurar el
   circuito SIN publicar una versión nueva por cada intento. Va con la llave
   del reloj, y aun así se acota a lo que el sitio ya le pide a CJ. La
   autenticación queda fuera a propósito: por ahí se renueva el token. */
export const PREFIJOS_DE_SONDA = [
  "/shopping/order/",
  "/shopping/pay/",
  "/product/",
  "/logistic/",
] as const;

export function rutaDeSondaPermitida(ruta: unknown): boolean {
  if (typeof ruta !== "string") return false;
  const r = ruta.trim();
  if (!r.startsWith("/") || r.includes("..") || /\s/.test(r)) return false;
  return PREFIJOS_DE_SONDA.some((prefijo) => r.startsWith(prefijo));
}
