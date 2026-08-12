/**
 * EL BORRADOR: LO ESCRITO NO SE PIERDE, PASE LO QUE PASE.
 *
 * ══ POR QUÉ EXISTE (12 ago 2026) ══
 *
 * Un comercio real —MEGAYES, que vende motos— pasó días sin poder cargar sus
 * productos. Lo peor no era el fallo en sí: era que **cada intento le borraba
 * todo lo escrito** y tenía que empezar de cero. Cargar un producto con su
 * descripción, su precio y sus fotos son diez minutos de trabajo; perderlos tres
 * veces seguidas es perder al comercio.
 *
 * Ya se había blindado el formulario para que una excepción del servidor no lo
 * desmontara, y aun así seguía pasando. La razón es que la pérdida **no siempre
 * viene del servidor**:
 *
 *  - En un teléfono, abrir el carrete deja el navegador en segundo plano. Si el
 *    sistema anda justo de memoria, **mata la pestaña**; al volver, la página se
 *    recarga sola y las casillas salen vacías. Nada de nuestro código se entera.
 *  - Un toque en «atrás», un corte de red al navegar, una recarga sin querer.
 *
 * Contra eso no sirve ningún `try`: la página ya no existe. Lo único que sirve
 * es que lo escrito **viva fuera de la página**. Por eso se guarda en el propio
 * navegador según se escribe, y al volver a abrir el formulario se restituye.
 *
 * ══ VALE PARA TODOS LOS FORMULARIOS, NO SOLO EL DE PRODUCTOS ══
 *
 * Fue lo primero que pidió el dueño al ver el arreglo: *«la persistencia de
 * todos los formularios, no solamente de este»*. Y tiene razón — el formulario
 * de datos de empresa, el de la cuenta bancaria de un retiro o el de la
 * dirección de entrega son igual de largos y se pierden igual. Por eso esto vive
 * en `lib/formularios` y no dentro de productos: se adopta envolviendo el
 * `<form>` en `<FormularioPersistente>` y no hay que escribir nada más.
 *
 * ══ CUATRO REGLAS QUE NO SE TOCAN ══
 *
 * 1. **Las contraseñas y los datos de tarjeta NUNCA se guardan.** Quedarían en
 *    claro en el navegador, sobreviviendo a la sesión, en una computadora que
 *    puede ser prestada. Se descartan por el TIPO de casilla, no por su nombre:
 *    un nombre se escribe distinto en cada formulario y el descuido de uno solo
 *    deja una contraseña escrita en el disco.
 * 2. **Los archivos tampoco.** Una foto son megabytes y el almacén del navegador
 *    ronda los 5 MB para todo el sitio: una sola llenaría el cupo y haría fallar
 *    el guardado del texto, que es justo lo que esto viene a salvar. Las fotos se
 *    vuelven a elegir; el texto no se vuelve a escribir.
 * 3. **Cada formulario tiene su propia llave.** Con una sola, el borrador de una
 *    moto se colaría en el formulario de la siguiente y el comercio publicaría un
 *    producto con los datos de otro.
 * 4. **El borrador se borra al guardar bien.** Uno que sobrevive al guardado
 *    reaparece la próxima vez con datos viejos encima de los buenos, y eso es
 *    peor que no tener borrador.
 */

/** Cuánto vive un borrador sin tocarse: 24 horas. */
export const VIDA_BORRADOR_MS = 24 * 60 * 60 * 1000;

/**
 * Casillas que nunca entran al borrador, por su NOMBRE.
 *
 * `id` y `tiendaId` los pone el servidor al dibujar la página. Restituirlos
 * desde el navegador dejaría que un borrador viejo mandara a guardar contra
 * **otro producto o la tienda de otro comercio**.
 */
export const NOMBRES_PROHIBIDOS = new Set(["id", "tiendaId", "productoId"]);

export type Borrador = {
  /** Nombre de la casilla → lo que había escrito. */
  campos: Record<string, string>;
  /** Cuándo se guardó, para poder caducarlo. */
  guardadoEn: number;
};

/** La llave de este formulario concreto. */
export function llaveDeBorrador(nombre: string): string {
  return `mercatren:borrador:${nombre}`;
}

/**
 * ¿Esta casilla se puede guardar?
 *
 * Se decide por el tipo de la casilla y su `autocomplete`, no por su nombre:
 * los nombres cambian de un formulario a otro y basta uno mal escrito para
 * dejar una contraseña guardada en el disco de una computadora prestada.
 */
export function campoGuardable(campo: {
  nombre: string;
  tipo: string;
  autoCompletado?: string | null;
}): boolean {
  if (!campo.nombre) return false;
  if (NOMBRES_PROHIBIDOS.has(campo.nombre)) return false;

  /* `hidden` lo pone el sistema, no la persona: restituirlo sería devolverle a
     un formulario nuevo el identificador de otra cosa. */
  const tipo = campo.tipo.toLowerCase();
  if (
    ["password", "file", "hidden", "submit", "button", "image"].includes(tipo)
  ) {
    return false;
  }

  /* Tarjetas y contraseñas se marcan así aunque la casilla sea de texto — es
     como lo declara cualquier formulario de pago bien hecho. */
  const auto = (campo.autoCompletado ?? "").toLowerCase();
  if (auto.includes("password") || auto.startsWith("cc-")) return false;

  return true;
}

/**
 * ¿Vale la pena ofrecer este borrador?
 *
 * Uno vacío o caducado no se restituye: ofrecerle recuperar «nada» a alguien que
 * acaba de abrir un formulario limpio solo confunde.
 */
export function borradorUtil(
  borrador: Borrador | null,
  ahora: number,
): borrador is Borrador {
  if (!borrador) return false;
  if (ahora - borrador.guardadoEn > VIDA_BORRADOR_MS) return false;

  return Object.values(borrador.campos).some((v) => v.trim().length > 0);
}

/** Interpreta lo guardado. Cualquier cosa rara se trata como «no hay». */
export function leerBorrador(crudo: string | null): Borrador | null {
  if (!crudo) return null;

  try {
    const dato: unknown = JSON.parse(crudo);
    if (!dato || typeof dato !== "object") return null;

    const { campos, guardadoEn } = dato as Partial<Borrador>;
    if (!campos || typeof campos !== "object") return null;
    if (typeof guardadoEn !== "number" || !Number.isFinite(guardadoEn)) {
      return null;
    }

    const limpios: Record<string, string> = {};
    for (const [nombre, valor] of Object.entries(campos)) {
      if (typeof valor === "string" && !NOMBRES_PROHIBIDOS.has(nombre)) {
        limpios[nombre] = valor;
      }
    }

    return { campos: limpios, guardadoEn };
  } catch {
    /* Un borrador ilegible no puede tumbar el formulario: se ignora y la
       persona escribe como si no hubiera nada guardado. */
    return null;
  }
}

/** Lo que se escribe en el navegador. */
export function escribirBorrador(
  campos: Record<string, string>,
  ahora: number,
): string {
  return JSON.stringify({ campos, guardadoEn: ahora } satisfies Borrador);
}
