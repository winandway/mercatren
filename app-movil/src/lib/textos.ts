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
    entrar: "Sign in",
    crearCuenta: "Create account",
    nombre: "Full name",
    correo: "Email",
    clave: "Password",
    claveAyuda: "At least 10 characters",
    verClave: "Show password",
    ocultarClave: "Hide password",
    olvideClave: "Forgot your password?",
    yaTengoCuenta: "Already have an account? Sign in",
    noTengoCuenta: "New to Mercatren? Create an account",
    salir: "Sign out",
    hola: "Hi",
    paisDeLaCuenta: "Country for your account",
    alCrear:
      "By creating an account, you agree to Mercatren's Terms and Privacy Policy.",
    borradorRecuperado: "We restored what you were typing.",
    empezarDeNuevo: "Start over",
    faltaNombre: "Enter your name.",
    faltaCorreo: "Enter a valid email address.",
    faltaClave: "Enter your password.",
    claveCorta: "Your password needs at least 10 characters.",
    errorCredenciales: "The email or password doesn't match.",
    errorYaExiste:
      "There's already an account with this email. Sign in instead.",
    errorCorreoNoSirve:
      "That email can't receive messages. Check the spelling — your confirmation goes there.",
    errorEscudo: "We couldn't confirm you're a person. Please try again.",
    errorDemasiados: "Too many attempts. Wait a few minutes and try again.",
    errorGeneral: "Something went wrong. Check your connection and try again.",
    comprobando: "Checking you're a person…",
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
    entrar: "Entrar",
    crearCuenta: "Crear cuenta",
    nombre: "Nombre completo",
    correo: "Correo electrónico",
    clave: "Contraseña",
    claveAyuda: "Mínimo 10 caracteres",
    verClave: "Ver la contraseña",
    ocultarClave: "Ocultar la contraseña",
    olvideClave: "¿Olvidaste tu contraseña?",
    yaTengoCuenta: "¿Ya tienes cuenta? Entra",
    noTengoCuenta: "¿Eres nuevo en Mercatren? Crea tu cuenta",
    salir: "Cerrar sesión",
    hola: "Hola",
    paisDeLaCuenta: "País de tu cuenta",
    alCrear:
      "Al crear tu cuenta aceptas los Términos y la Política de privacidad de Mercatren.",
    borradorRecuperado: "Recuperamos lo que estabas escribiendo.",
    empezarDeNuevo: "Empezar de nuevo",
    faltaNombre: "Escribe tu nombre.",
    faltaCorreo: "Escribe un correo válido.",
    faltaClave: "Escribe tu contraseña.",
    claveCorta: "La contraseña necesita al menos 10 caracteres.",
    errorCredenciales: "El correo o la contraseña no coinciden.",
    errorYaExiste: "Ya hay una cuenta con este correo. Entra con ella.",
    errorCorreoNoSirve:
      "Ese correo no puede recibir mensajes. Revisa que esté bien escrito: ahí te llega la confirmación.",
    errorEscudo:
      "No pudimos comprobar que eres una persona. Inténtalo de nuevo.",
    errorDemasiados:
      "Demasiados intentos. Espera unos minutos y vuelve a probar.",
    errorGeneral: "Algo salió mal. Revisa tu conexión e inténtalo de nuevo.",
    comprobando: "Comprobando que eres una persona…",
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
