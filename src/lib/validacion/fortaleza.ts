/**
 * QUÉ TAN FUERTE ES UNA CONTRASEÑA.
 *
 * Función pura, sin dependencias: la usa el navegador para pintar la barra
 * mientras la persona escribe, y el servidor para no dejar pasar una clave
 * indefendible. Una sola cuenta para los dos lados, así que lo que ve el
 * cliente en pantalla es exactamente lo que va a aplicar el servidor.
 *
 * POR QUÉ NO SE USA UNA LIBRERÍA. Las buenas (zxcvbn y compañía) pesan cientos
 * de kilobytes porque traen diccionarios enteros. Esto se carga en la pantalla
 * de registro, que es de las primeras que ve un cliente nuevo; media hoja de
 * cálculos propios hace el 90% del trabajo sin castigar la carga.
 *
 * LO QUE MÁS IMPORTA ES EL LARGO, no los símbolos raros. `Tr3s!` se rompe en
 * segundos; `mi perro come tres veces al dia` no. Por eso el largo pesa más que
 * todo lo demás junto, y una frase larga puede sacar la nota máxima aunque no
 * lleve ni un signo de admiración. Es lo que recomiendan hoy NIST y el NCSC, y
 * es lo contrario de lo que pide la mayoría de los formularios.
 */

/** De 0 (indefendible) a 4 (muy fuerte). */
export type NivelClave = 0 | 1 | 2 | 3 | 4;

export type Fortaleza = {
  nivel: NivelClave;
  /** Para pintar la barra: de 0 a 100. */
  porcentaje: number;
  /** Qué le falta, en orden de lo que más ayudaría. Claves de traducción. */
  consejos: string[];
  /** Si es `false`, ni siquiera se deja guardar. */
  aceptable: boolean;
};

/** Lo mínimo que se acepta. Por debajo de esto no se guarda, se mida como se mida. */
export const LARGO_MINIMO = 8;

/**
 * Las contraseñas más usadas del mundo, y las que se le ocurren a cualquiera
 * en un sitio que se llama Mercatren.
 *
 * No es un diccionario completo —para eso hace falta una librería pesada— pero
 * atrapa lo indefendible: estas son literalmente las primeras que prueba
 * cualquier ataque automático, y con una de ellas la cuenta dura segundos.
 */
const CONOCIDAS = new Set([
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "passw0rd",
  "qwerty",
  "qwertyui",
  "qwerty123",
  "abc123",
  "111111",
  "000000",
  "iloveyou",
  "admin",
  "administrador",
  "welcome",
  "monkey",
  "dragon",
  "letmein",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "superman",
  "trustno1",
  "contrasena",
  "contraseña",
  "clave123",
  "mercatren",
  "mercatren1",
  "mercatren123",
  "windoce",
  "venezuela",
  "colombia",
  "caracas",
  "valencia",
  "maracaibo",
]);

/** ¿Es todo el mismo carácter? `aaaaaaaa`, `11111111`. */
function todoIgual(texto: string): boolean {
  return texto.length > 0 && new Set(texto).size === 1;
}

/**
 * ¿Es una tirada del teclado o del abecedario? `12345678`, `abcdefgh`, `qwerty`.
 * Se mira en los dos sentidos: `87654321` es igual de mala.
 */
function esSecuencia(texto: string): boolean {
  if (texto.length < 4) return false;

  const filas = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];
  const bajo = texto.toLowerCase();
  const alReves = [...bajo].reverse().join("");

  return filas.some((fila) => fila.includes(bajo) || fila.includes(alReves));
}

/** Cuántas familias de caracteres distintas usa: minúsculas, mayúsculas, números, signos. */
function familias(texto: string): number {
  let cuenta = 0;
  if (/[a-záéíóúñü]/.test(texto)) cuenta++;
  if (/[A-ZÁÉÍÓÚÑÜ]/.test(texto)) cuenta++;
  if (/[0-9]/.test(texto)) cuenta++;
  if (/[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ]/.test(texto)) cuenta++;
  return cuenta;
}

/**
 * Mide una contraseña.
 *
 * `contexto` son datos de la propia persona (su correo, su nombre): una clave
 * que contiene su propio correo es de las primeras que prueba quien la conoce.
 */
export function medirClave(clave: string, contexto: string[] = []): Fortaleza {
  const consejos: string[] = [];

  // Vacía: no se mide, se pide.
  if (!clave) {
    return {
      nivel: 0,
      porcentaje: 0,
      consejos: ["escribeUna"],
      aceptable: false,
    };
  }

  const normalizada = clave.toLowerCase().trim();

  /* LO INDEFENDIBLE SE CORTA AQUÍ, sin importar cuántos signos lleve. Una de
     las contraseñas más usadas del mundo no se salva porque tenga 12 letras. */
  if (CONOCIDAS.has(normalizada)) {
    return {
      nivel: 0,
      porcentaje: 10,
      consejos: ["demasiadoComun"],
      aceptable: false,
    };
  }

  if (todoIgual(clave)) {
    return {
      nivel: 0,
      porcentaje: 10,
      consejos: ["todoIgual"],
      aceptable: false,
    };
  }

  if (esSecuencia(clave)) {
    return {
      nivel: 0,
      porcentaje: 10,
      consejos: ["esUnaSecuencia"],
      aceptable: false,
    };
  }

  /* Que no lleve dentro su propio correo o su nombre. Quien intenta entrar a
     una cuenta ajena casi siempre conoce esos dos datos.

     SE COMPARA POR TROZOS, no contra el dato entero. Nadie usa de contraseña
     "carlos@correo.com" completo; usa "carlos2024". Buscar la cadena entera
     dejaba pasar justo el caso que importa. */
  for (const dato of contexto) {
    const trozos = dato.toLowerCase().split(/[@.\s_\-+]+/);
    for (const trozo of trozos) {
      // Solo trozos que signifiquen algo: "com" o "de" aparecen en todas partes.
      if (trozo.length >= 4 && normalizada.includes(trozo)) {
        return {
          nivel: 0,
          porcentaje: 15,
          consejos: ["llevaTusDatos"],
          aceptable: false,
        };
      }
    }
  }

  if (clave.length < LARGO_MINIMO) {
    return {
      nivel: 0,
      porcentaje: 15,
      consejos: ["muyCorta"],
      aceptable: false,
    };
  }

  /* ── A partir de aquí ya es aceptable; ahora se puntúa qué tan buena es. ── */

  let puntos = 0;

  /* EL LARGO ES LO QUE MANDA: hasta 4 puntos de los 6 posibles. Cada carácter
     de más multiplica el trabajo de quien intenta adivinarla. */
  if (clave.length >= 8) puntos += 1;
  if (clave.length >= 12) puntos += 1;
  if (clave.length >= 16) puntos += 1;
  if (clave.length >= 20) puntos += 1;

  // La variedad ayuda, pero mucho menos de lo que la gente cree: hasta 2 puntos.
  const cuantasFamilias = familias(clave);
  if (cuantasFamilias >= 2) puntos += 1;
  if (cuantasFamilias >= 3) puntos += 1;

  /* Poca variedad de letras distintas ("abababababab") engaña al largo: se
     penaliza, porque de fuerte no tiene nada. */
  const distintos = new Set(clave.toLowerCase()).size;
  if (distintos <= 4 && clave.length >= 8) puntos -= 1;

  // Los consejos van en orden de lo que más subiría la nota.
  if (clave.length < 12) consejos.push("hazlaMasLarga");
  if (cuantasFamilias < 3) consejos.push("mezclaTipos");
  if (clave.length >= 12 && cuantasFamilias >= 3) consejos.push("vaMuyBien");

  const nivel = Math.max(1, Math.min(4, puntos - 1)) as NivelClave;

  return {
    nivel,
    // El 20% inicial es "ya pasó el mínimo"; el resto reparte los 4 niveles.
    porcentaje: 20 + nivel * 20,
    consejos,
    aceptable: true,
  };
}
