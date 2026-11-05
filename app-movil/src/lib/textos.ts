import type { Idioma } from "./dinero";

/**
 * Los textos de la app, en los dos idiomas. El inglés es el principal (la app
 * es para Estados Unidos primero) y tiene que sonar a nativo.
 */
export const TEXTOS = {
  en: {
    bienvenida: "Welcome to Mercatren",
    eligePais: "Where are you shopping from?",
    eligePaisAyuda: "Prices, currency and delivery depend on your country.",
    pronto: "Coming soon",
    continuar: "Continue",
    inicio: "Home",
    buscar: "Search",
    cuenta: "Account",
    buscarPlaceholder: "Search products and stores",
    sinProductos: "No products here yet. Check back soon.",
    sinResultados: "No results. Try other words.",
    sinConexion: "No connection. Check your internet and try again.",
    reintentar: "Try again",
    agotado: "Sold out",
    vendidoPor: "Sold by",
    descripcion: "Description",
    noExiste: "This product is no longer available.",
    cambiarIdioma: "Change language",
    pais: "Country",
    idioma: "Language",
    cambiarPais: "Change country",
    cargando: "Loading…",
    ayuda: "Help",
    privacidad: "Privacy",
    terminos: "Terms",
  },
  es: {
    bienvenida: "Bienvenido a Mercatren",
    eligePais: "¿Desde qué país compras?",
    eligePaisAyuda: "Los precios, la moneda y la entrega dependen de tu país.",
    pronto: "Muy pronto",
    continuar: "Continuar",
    inicio: "Inicio",
    buscar: "Buscar",
    cuenta: "Cuenta",
    buscarPlaceholder: "Busca productos y tiendas",
    sinProductos: "Todavía no hay productos aquí. Vuelve pronto.",
    sinResultados: "Sin resultados. Prueba con otras palabras.",
    sinConexion: "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    reintentar: "Reintentar",
    agotado: "Agotado",
    vendidoPor: "Vendido por",
    descripcion: "Descripción",
    noExiste: "Este producto ya no está disponible.",
    cambiarIdioma: "Cambiar idioma",
    pais: "País",
    idioma: "Idioma",
    cambiarPais: "Cambiar de país",
    cargando: "Cargando…",
    ayuda: "Ayuda",
    privacidad: "Privacidad",
    terminos: "Términos",
  },
} as const satisfies Record<Idioma, Record<string, string>>;

export type ClaveDeTexto = keyof (typeof TEXTOS)["en"];

export function texto(idioma: Idioma, clave: ClaveDeTexto): string {
  return TEXTOS[idioma][clave];
}

/** El idioma del teléfono, si es español; si no, inglés. */
export function idiomaDelTelefono(codigo: string | null | undefined): Idioma {
  return codigo?.toLowerCase().startsWith("es") ? "es" : "en";
}
