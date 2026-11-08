import { API_BASE } from "./api";
import type { Idioma } from "./dinero";
import type { ClaveDeTexto } from "./textos";

/**
 * La dirección de entrega del pago, pura (la prueba el sitio). Las reglas
 * finas las pone el servidor con la MISMA validación de la web; esto solo
 * evita mandar algo que de seguro falla.
 *
 * CADA PAÍS ENTREGA DISTINTO (5 nov 2026, Fase 5): Estados Unidos y España
 * despachan a una dirección (con su estado o su provincia); Venezuela se
 * retira en una ciudad. Qué casillas pide cada país y su lista de estados
 * salen del servidor (`/datos/app/v1/entrega`, de `destino/direccion.ts`):
 * la app no lleva una regla propia por país.
 */
export type DatosEntrega = {
  nombre: string;
  telefono: string;
  direccion: string;
  direccion2: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
};

export type CampoDeEntregaApp = {
  nombre: "direccion" | "direccion2" | "ciudad" | "estado" | "codigoPostal";
  obligatorio: boolean;
};

export type ConfigEntrega = {
  pais: string;
  forma: "envio" | "retiro";
  campos: CampoDeEntregaApp[];
  estados: { codigo: string; nombre: string }[] | null;
};

/** Mientras llega la del servidor: la de Estados Unidos (la de siempre). */
export const ENTREGA_US: ConfigEntrega = {
  pais: "US",
  forma: "envio",
  campos: [
    { nombre: "direccion", obligatorio: true },
    { nombre: "direccion2", obligatorio: false },
    { nombre: "ciudad", obligatorio: true },
    { nombre: "estado", obligatorio: true },
    { nombre: "codigoPostal", obligatorio: true },
  ],
  estados: null,
};

export function urlEntrega(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/v1/entrega?pais=${encodeURIComponent(pais)}&idioma=${idioma}`;
}

const FALTA: Record<CampoDeEntregaApp["nombre"], ClaveDeTexto> = {
  direccion: "faltaDireccion",
  direccion2: "faltaDireccion",
  ciudad: "faltaCiudad",
  estado: "faltaEstado",
  codigoPostal: "faltaCodigoPostal",
};

/** España: 5 cifras y las dos primeras son la provincia (01 a 52). */
const CP_ES = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

export function faltaEnEntrega(
  d: DatosEntrega,
  config: ConfigEntrega = ENTREGA_US,
): ClaveDeTexto | null {
  if (d.nombre.trim().length < 2) return "faltaNombre";
  if (d.telefono.replace(/\D/g, "").length < 7) return "faltaTelefono";
  for (const campo of config.campos) {
    const valor = (d[campo.nombre] ?? "").trim();
    if (
      campo.obligatorio &&
      valor.length < (campo.nombre === "direccion" ? 4 : 2)
    )
      return FALTA[campo.nombre];
  }
  const pide = (n: CampoDeEntregaApp["nombre"]) =>
    config.campos.some((c) => c.nombre === n);
  if (pide("estado") && config.estados) {
    const elegido = d.estado.trim().toUpperCase();
    if (!config.estados.some((e) => e.codigo.toUpperCase() === elegido))
      return "faltaEstado";
  }
  const cp = d.codigoPostal.trim();
  if (config.pais === "US") {
    if (!/^[A-Za-z]{2}$/.test(d.estado.trim())) return "faltaEstado";
    if (!/^\d{5}(-\d{4})?$/.test(cp)) return "faltaCodigoPostal";
  }
  if (config.pais === "ES" && cp) {
    if (!CP_ES.test(cp) || !cp.startsWith(d.estado.trim()))
      return "faltaCodigoPostal";
  }
  return null;
}

/**
 * La entrega como la espera el servidor (`esquemaEntrega` de la web). Para
 * un retiro solo viajan quién, su teléfono y su ciudad: pedir una dirección
 * haría creer que llevamos. El nombre del país lo pone el servidor.
 */
export type EntregaParaElPedido = {
  nombre: string;
  telefono: string;
  ciudad: string;
  direccion?: string;
  direccion2?: string;
  estado?: string;
  codigoPostal?: string;
};

export function entregaParaElPedido(
  d: DatosEntrega,
  config: ConfigEntrega = ENTREGA_US,
): EntregaParaElPedido {
  const base = {
    nombre: d.nombre.trim(),
    telefono: d.telefono.trim(),
    ciudad: d.ciudad.trim(),
  };
  if (config.forma === "retiro") return base;
  return {
    ...base,
    direccion: d.direccion.trim(),
    direccion2: d.direccion2.trim() || undefined,
    estado:
      config.pais === "US" ? d.estado.trim().toUpperCase() : d.estado.trim(),
    codigoPostal: d.codigoPostal.trim() || undefined,
  };
}

/* ══ CÓMO SE PAGA EN LA APP (8 nov 2026) ══
 *
 * Nada cobra sin probar: la tarjeta dentro de la app (hoja de Stripe) solo
 * la ve el equipo hasta la prueba 9; el público paga con Zelle en la web.
 * Qué métodos tiene cada quien lo dice el servidor (`/datos/app/mi/metodos`,
 * de `src/lib/app-movil/cobro-en-la-app.ts` del sitio); aquí solo se lee. */
export type MetodoApp = "tarjeta" | "zelle";

export function urlMetodos(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/metodos?pais=${encodeURIComponent(pais)}&idioma=${idioma}`;
}

/** Lo que se ofrece mientras llega la respuesta (o si no llega): solo Zelle
 *  donde existe. Nunca la tarjeta por adivinar: el servidor la rechazaría. */
export function metodosDeRespaldo(pais: string | null): MetodoApp[] {
  return pais === "VE" || pais === "US" ? ["zelle"] : [];
}

/** Los métodos que mandó el servidor, filtrados a los que la app conoce. */
export function metodosLeidos(crudo: unknown): MetodoApp[] {
  if (!Array.isArray(crudo)) return [];
  return crudo.filter((m): m is MetodoApp => m === "tarjeta" || m === "zelle");
}

/* El precio con Zelle, para ESTIMAR el total en la pantalla. El de verdad lo
 * calcula el servidor al crear el pedido (y la página de pago lo enseña
 * antes de pagar). Copia de `baseDesdePublicado` y `precioZelleCentavos` de
 * `src/lib/dinero.ts`: la prueba `app-movil-pago-en-la-web.test.ts` falla si
 * se separan (por ejemplo, si sube el margen y aquí no). */
const PROCESADOR_PORCENTAJE_PB = 290;
const PROCESADOR_FIJO_CENTAVOS = 30;
const COMISION_TARJETA_PB = 300;
const COMISION_ZELLE_PB = 600;

export function precioZelleDesdePublicado(publicado: number): number {
  if (publicado <= 0) return 0;
  const base = Math.max(
    0,
    Math.floor(
      (publicado * (10_000 - PROCESADOR_PORCENTAJE_PB - COMISION_TARJETA_PB)) /
        10_000,
    ) - PROCESADOR_FIJO_CENTAVOS,
  );
  if (base <= 0) return 0;
  return Math.ceil((base * 10_000) / (10_000 - COMISION_ZELLE_PB));
}

export function totalZelleEstimado(
  lineas: { precio: { centavos: number }; cantidad: number }[],
): number {
  return lineas.reduce(
    (suma, l) =>
      suma + precioZelleDesdePublicado(l.precio.centavos) * l.cantidad,
    0,
  );
}

const WEB_DE_MERCATREN =
  /^(https:\/\/(www\.)?mercatren\.(com|com\.ve|cl|com\.co)\/|http:\/\/(10\.0\.2\.2|localhost|127\.0\.0\.1|[a-z]+\.localhost)(:\d+)?\/)/;

/** Qué hacer con la respuesta del pedido (o de «pagar» en Mis pedidos). */
export type SiguientePaso =
  | { tipo: "web"; url: string }
  | { tipo: "hoja"; clientSecret: string; clavePublica: string }
  | { tipo: "sinPago" };

export type RespuestaDePago = {
  pagoEnLaWeb?: string | null;
  pago?: { clientSecret?: string; clavePublica?: string } | null;
} | null;

export function siguientePaso(cuerpo: RespuestaDePago): SiguientePaso {
  const web = cuerpo?.pagoEnLaWeb;
  /* Solo un dominio de Mercatren con https (o la máquina de desarrollo):
     nada de abrir lo que sea que venga en la respuesta. */
  if (typeof web === "string" && WEB_DE_MERCATREN.test(web)) {
    return { tipo: "web", url: web };
  }
  if (cuerpo?.pago?.clientSecret && cuerpo.pago.clavePublica) {
    return {
      tipo: "hoja",
      clientSecret: cuerpo.pago.clientSecret,
      clavePublica: cuerpo.pago.clavePublica,
    };
  }
  return { tipo: "sinPago" };
}
