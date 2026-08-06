import { z } from "zod";

/**
 * LAS REGLAS DE CADA TIPO DE CAMPO, ESCRITAS UNA SOLA VEZ.
 *
 * Aquí vive todo lo que se puede escribir en un formulario del sitio: un
 * teléfono lleva números, un nombre de persona no, una identificación fiscal es
 * alfanumérica. Cada tipo se define UNA vez y de esa definición salen las dos
 * barreras:
 *
 *   1. **El navegador** — el teclado correcto en el celular, el largo máximo, y
 *      el filtro que va quitando lo que no corresponde mientras se escribe.
 *   2. **El servidor** — el esquema de `zod` que se comprueba antes de tocar la
 *      base de datos.
 *
 * POR QUÉ LAS DOS SALEN DEL MISMO SITIO. Si se escriben por separado terminan
 * diciendo cosas distintas: el navegador acepta algo que el servidor rechaza y
 * el cliente ve un error que no entiende, o —mucho peor— al revés.
 *
 * **LA DEL NAVEGADOR NO ES SEGURIDAD, ES COMODIDAD.** Cualquiera puede
 * saltársela: abrir la consola, mandar la petición a mano, apagar JavaScript.
 * La que de verdad protege es la del servidor, y por eso ninguna acción guarda
 * nada sin pasar su esquema. Aquí se mueve dinero y datos de personas: lo que
 * llega de fuera se comprueba siempre, sin excepción.
 */

/** Lo que hay que ponerle al `<input>` para que se comporte bien. */
export type AtributosCampo = {
  /** Qué teclado sale en el celular. */
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "url";
  autoComplete?: string;
  /** Obligatorio: un campo sin tope acepta megabytes y eso llega a la base. */
  maxLength: number;
  type?: "text" | "tel" | "email" | "url";
};

export type ReglaCampo = {
  esquema: z.ZodType<string>;
  atributos: AtributosCampo;
  /**
   * Quita lo que no corresponde mientras la persona escribe.
   *
   * Se hace suave a propósito: **borra el carácter que sobra, nunca el resto
   * del texto**. Un filtro bruto que rechaza toda la casilla cuando alguien
   * pega un teléfono con paréntesis es peor que no tener filtro: la persona no
   * entiende qué pasó y se va.
   */
  filtrar: (valor: string) => string;
};

/* ── Los ladrillos de los que salen todas las reglas ────────────────────── */

/** Letras de los dos idiomas, con tildes y ñ. */
const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";

/**
 * Quita los caracteres de control invisibles.
 *
 * No se ven, no los escribe nadie a mano, y son la forma clásica de colar algo
 * raro dentro de un dato que parece normal: un salto de línea metido en el
 * nombre puede partir en dos la línea de un correo que enviamos después.
 *
 * Van escritos con su código (\u0000) a propósito: pegados como carácter real
 * son invisibles en el editor y el día que alguien reformatee el archivo
 * desaparecen sin que nadie lo note.
 */
function sinInvisibles(valor: string): string {
  return valor.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}

/** Deja un solo espacio entre palabras y quita los de las puntas. */
const limpiar = (valor: string) =>
  sinInvisibles(valor).replace(/\s+/g, " ").trim();

/* ── Las reglas ─────────────────────────────────────────────────────────── */

/**
 * TELÉFONO. Números, y los signos con los que la gente escribe un teléfono de
 * verdad: `+`, espacios, guiones y paréntesis.
 *
 * Se aceptan de 7 a 15 dígitos porque el sitio trabaja con Estados Unidos
 * (+1, 10 dígitos) y con Venezuela (+58, 10 dígitos), y 15 es el máximo que
 * permite el estándar internacional. Exigir un formato fijo dejaría fuera a
 * media clientela.
 */
const telefono: ReglaCampo = {
  atributos: {
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel",
    maxLength: 20,
  },
  filtrar: (v) => sinInvisibles(v).replace(/[^0-9+()\-\s]/g, ""),
  esquema: z
    .string()
    .transform(limpiar)
    .refine((v) => /^[0-9+()\-\s]+$/.test(v), { message: "telefonoCaracteres" })
    .refine(
      (v) => {
        const digitos = v.replace(/\D/g, "").length;
        return digitos >= 7 && digitos <= 15;
      },
      { message: "telefonoLargo" },
    ),
};

/**
 * NOMBRE DE UNA PERSONA. Letras, espacios, y los signos que llevan los nombres
 * de verdad: apóstrofe (O'Brien), guion (García-López) y punto (Jr.).
 *
 * **Sin números**, que es justo lo que se pidió. Un nombre con números casi
 * siempre es alguien equivocándose de casilla.
 */
const nombrePersona: ReglaCampo = {
  atributos: {
    type: "text",
    inputMode: "text",
    autoComplete: "name",
    maxLength: 80,
  },
  filtrar: (v) =>
    sinInvisibles(v).replace(new RegExp(`[^${LETRAS}\\s'’.\\-]`, "g"), ""),
  esquema: z
    .string()
    .transform(limpiar)
    .refine((v) => v.length >= 2, { message: "nombreCorto" })
    .refine((v) => v.length <= 80, { message: "nombreLargo" })
    .refine((v) => new RegExp(`^[${LETRAS}\\s'’.\\-]+$`).test(v), {
      message: "nombreCaracteres",
    }),
};

/**
 * RAZÓN SOCIAL. Como el nombre de persona, pero con números y los signos de
 * una empresa: `Ferremateriales Bley C.A`, `3M de Venezuela S.A.`, `Pérez & Hijos`.
 *
 * Aquí sí entran números: hay empresas que empiezan por uno.
 */
const razonSocial: ReglaCampo = {
  atributos: {
    type: "text",
    inputMode: "text",
    autoComplete: "organization",
    maxLength: 120,
  },
  filtrar: (v) =>
    sinInvisibles(v).replace(new RegExp(`[^${LETRAS}0-9\\s'’.,&\\-]`, "g"), ""),
  esquema: z
    .string()
    .transform(limpiar)
    .refine((v) => v.length >= 2, { message: "nombreCorto" })
    .refine((v) => v.length <= 120, { message: "nombreLargo" }),
};

/** CIUDAD. Letras y espacios; hay ciudades con guion y con apóstrofe. Sin números. */
const ciudad: ReglaCampo = {
  atributos: {
    type: "text",
    inputMode: "text",
    autoComplete: "address-level2",
    maxLength: 60,
  },
  filtrar: (v) =>
    sinInvisibles(v).replace(new RegExp(`[^${LETRAS}\\s'’.\\-]`, "g"), ""),
  esquema: z
    .string()
    .transform(limpiar)
    .refine((v) => v.length >= 2, { message: "ciudadCorta" })
    .refine((v) => v.length <= 60, { message: "ciudadLarga" }),
};

/**
 * CORREO. Se guarda siempre en minúsculas: `Juan@Correo.com` y `juan@correo.com`
 * son la misma cuenta, y si se guardan distinto se crean dos.
 */
const correo: ReglaCampo = {
  atributos: {
    type: "email",
    inputMode: "email",
    autoComplete: "email",
    maxLength: 254,
  },
  // Aquí no se filtra al escribir: un correo lleva signos raros a propósito.
  filtrar: (v) => sinInvisibles(v).replace(/\s/g, ""),
  esquema: z
    .string()
    .transform((v) => sinInvisibles(v).trim().toLowerCase())
    .pipe(z.string().email({ message: "correoInvalido" }).max(254)),
};

/**
 * IDENTIFICACIÓN FISCAL. Alfanumérica con guiones, en mayúsculas: `J-12345678-9`
 * en Venezuela, `12-3456789` (EIN) en Estados Unidos.
 *
 * No se valida contra el formato de un país en concreto: el sitio recibe
 * comercios de varios y una regla de un solo país rechazaría a los demás.
 */
const identificacionFiscal: ReglaCampo = {
  atributos: { type: "text", inputMode: "text", maxLength: 20 },
  filtrar: (v) =>
    sinInvisibles(v)
      .toUpperCase()
      .replace(/[^A-Z0-9\-]/g, ""),
  esquema: z
    .string()
    .transform((v) => sinInvisibles(v).trim().toUpperCase())
    .refine((v) => /^[A-Z0-9\-]{5,20}$/.test(v), {
      message: "identificacionInvalida",
    }),
};

/** SOLO NÚMEROS. Cantidades, existencias, códigos numéricos. */
const soloNumeros: ReglaCampo = {
  atributos: { type: "text", inputMode: "numeric", maxLength: 15 },
  filtrar: (v) => sinInvisibles(v).replace(/[^0-9]/g, ""),
  esquema: z
    .string()
    .transform((v) => sinInvisibles(v).trim())
    .refine((v) => /^[0-9]+$/.test(v), { message: "soloNumeros" }),
};

/** ALFANUMÉRICO. Letras y números, sin signos: códigos, referencias, slugs. */
const alfanumerico: ReglaCampo = {
  atributos: { type: "text", inputMode: "text", maxLength: 40 },
  filtrar: (v) => sinInvisibles(v).replace(/[^A-Za-z0-9\-]/g, ""),
  esquema: z
    .string()
    .transform((v) => sinInvisibles(v).trim())
    .refine((v) => /^[A-Za-z0-9\-]+$/.test(v), { message: "alfanumerico" }),
};

/** SITIO WEB. Se le pone `https://` solo si la persona no lo escribió. */
const sitioWeb: ReglaCampo = {
  atributos: {
    type: "url",
    inputMode: "url",
    autoComplete: "url",
    maxLength: 200,
  },
  filtrar: (v) => sinInvisibles(v).replace(/\s/g, ""),
  esquema: z
    .string()
    .transform((v) => {
      const limpio = sinInvisibles(v).trim();
      if (!limpio) return limpio;
      return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
    })
    .pipe(z.string().url({ message: "sitioWebInvalido" }).max(200)),
};

/**
 * TEXTO LIBRE. Descripciones, notas, motivos. No se filtra nada mientras se
 * escribe —es texto de verdad— pero sí se limita el largo y se quitan los
 * caracteres de control.
 */
function textoLibre(maximo: number): ReglaCampo {
  return {
    atributos: { type: "text", inputMode: "text", maxLength: maximo },
    filtrar: sinInvisibles,
    esquema: z
      .string()
      .transform((v) => sinInvisibles(v).trim())
      .refine((v) => v.length <= maximo, { message: "textoLargo" }),
  };
}

/** DIRECCIÓN. Lleva números (la casa) y signos comunes. */
const direccion: ReglaCampo = {
  atributos: {
    type: "text",
    inputMode: "text",
    autoComplete: "street-address",
    maxLength: 160,
  },
  filtrar: (v) =>
    sinInvisibles(v).replace(
      new RegExp(`[^${LETRAS}0-9\\s'’.,#\\-/]`, "g"),
      "",
    ),
  esquema: z
    .string()
    .transform(limpiar)
    .refine((v) => v.length <= 160, { message: "textoLargo" }),
};

/**
 * EL SELLO: le pega el tope de largo a las DOS barreras, campo por campo.
 *
 * Esto no es un detalle de estilo. El navegador ya trae su `maxLength`, pero el
 * servidor es el que de verdad decide, y cualquiera puede mandarle una petición
 * a mano sin pasar por la casilla. Si los dos topes se escriben por separado,
 * se desincronizan — y pasó al escribir este archivo: `alfanumerico` cortaba en
 * 40 caracteres en pantalla y el servidor aceptaba 9000. Lo encontró su propia
 * prueba.
 *
 * Al pasar TODAS por aquí, un campo nuevo no puede nacer con un tope en
 * pantalla y ninguno en el servidor: es imposible olvidarse.
 */
function sellar<T extends Record<string, ReglaCampo>>(reglas: T): T {
  const selladas = {} as Record<string, ReglaCampo>;

  for (const [nombre, r] of Object.entries(reglas)) {
    const tope = r.atributos.maxLength;
    selladas[nombre] = {
      atributos: r.atributos,
      filtrar: (valor) => r.filtrar(valor).slice(0, tope),
      esquema: r.esquema.refine((v) => v.length <= tope, {
        message: "textoLargo",
      }) as z.ZodType<string>,
    };
  }

  return selladas as T;
}

export const CAMPOS = sellar({
  telefono,
  nombrePersona,
  razonSocial,
  ciudad,
  correo,
  identificacionFiscal,
  soloNumeros,
  alfanumerico,
  sitioWeb,
  direccion,
  textoCorto: textoLibre(200),
  textoLargo: textoLibre(2000),
});

export type TipoCampo = keyof typeof CAMPOS;

/**
 * Hace opcional cualquier regla: una casilla vacía pasa, y si trae algo se le
 * exige lo mismo de siempre.
 *
 * Hace falta porque media ficha de comercio es opcional a propósito —lo que el
 * comercio deja vacío no se muestra en su tienda— pero lo que sí llena tiene
 * que estar bien.
 */
export function opcional(reglaCampo: ReglaCampo): z.ZodType<string> {
  return z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .superRefine((valor, ctx) => {
      if (valor === "") return; // vacío es una respuesta válida
      const r = reglaCampo.esquema.safeParse(valor);
      if (!r.success) {
        ctx.addIssue({
          code: "custom",
          message: r.error.issues[0]?.message ?? "invalido",
        });
      }
    })
    .transform((valor) => {
      if (valor === "") return "";
      const r = reglaCampo.esquema.safeParse(valor);
      // Si no pasó, superRefine ya marcó el error; se devuelve tal cual.
      return r.success ? r.data : valor;
    });
}
