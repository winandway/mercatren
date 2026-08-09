/**
 * SI UNA TIENDA ESTÁ VERIFICADA O TODAVÍA SE LA ESTÁ MIRANDO.
 *
 * ══ POR QUÉ EXISTE (9 ago 2026) ══
 *
 * Decisión del dueño: un comerciante que se registra **no puede quedarse
 * esperando** a que alguien lo apruebe. Un negocio que arranca no se da ese
 * lujo — el que llega con ganas de vender y encuentra una sala de espera, se
 * va. Así que abre su tienda y sube productos desde el primer minuto.
 *
 * Pero alguien tiene que comprobar que ese comercio existe de verdad: que la
 * tienda física está, que la empresa es real, que no es alguien montando un
 * catálogo de cosas caras para cobrar y desaparecer. Eso se hace **por
 * detrás**, con calma, y el comerciante no se entera.
 *
 * ══ POR QUÉ ES UN CAMPO APARTE Y NO UN ESTADO MÁS DE LA TIENDA ══
 *
 * Son dos preguntas distintas sobre la misma tienda:
 *
 *   `tiendas.estado`  → ¿la puede ver el público?   (borrador · activa · …)
 *   la verificación   → ¿comprobamos que es real?   (esto)
 *
 * Mezclarlas obligaría a elegir entre «vende pero sin revisar» y «revisada
 * pero no vende», y justo lo que se quiere es lo primero: **vender mientras se
 * revisa**. Una tienda puede estar activa y en observación a la vez, y esa es
 * la situación normal de cualquier comercio nuevo.
 *
 * ══ Y LO QUE DE VERDAD ENCIENDE ══
 *
 * **El sello verde de «Empresa verificada» de la ficha pública.**
 *
 * Hasta hoy ese sello se dibujaba SIEMPRE, a toda tienda, sin mirar nada. Con
 * el registro abierto eso se vuelve peligroso: el primero que venga a estafar
 * se lleva nuestro respaldo puesto en su ficha. Un sello que se le da a todos
 * no dice nada, y encima engaña a quien confía en él.
 *
 * Y hay una promesa escrita de por medio: los términos dicen que verificamos
 * identidad y registro mercantil antes de aprobar un comercio. Hoy no se
 * cumplía.
 */

export const ESTADOS_VERIFICACION = [
  /** Vende con normalidad, y nosotros la estamos mirando. Es el de entrada. */
  "en_observacion",
  /** Comprobada: existe, es real, y se gana el sello. */
  "verificada",
  /** Se miró y no pasó. Deja de tener sello; qué más se hace es otra decisión. */
  "rechazada",
] as const;

export type EstadoVerificacion = (typeof ESTADOS_VERIFICACION)[number];

/**
 * El estado de una tienda que todavía no tiene fila de verificación.
 *
 * Es `en_observacion` a propósito, y esta es la línea que más importa del
 * archivo: **lo seguro por defecto es NO estar verificado**. Si un día se
 * agrega una tienda por un camino que olvida crear su fila, lo peor que pasa
 * es que no luzca el sello — nunca que se lo lleve sin haberlo ganado.
 */
export const VERIFICACION_POR_DEFECTO: EstadoVerificacion = "en_observacion";

export function estadoDeVerificacion(
  guardado: string | null | undefined,
): EstadoVerificacion {
  return ESTADOS_VERIFICACION.includes(guardado as EstadoVerificacion)
    ? (guardado as EstadoVerificacion)
    : VERIFICACION_POR_DEFECTO;
}

/**
 * ¿Se le dibuja el sello verde al comprador?
 *
 * Solo con `verificada`. Ni «en observación» ni «rechazada» lo lucen — y en
 * los dos casos la tienda puede seguir vendiendo: el sello no es un permiso
 * para vender, es lo que nosotros afirmamos sobre ese comercio.
 */
export function luceElSello(estado: EstadoVerificacion): boolean {
  return estado === "verificada";
}

/**
 * ¿Sale en la zona de vigilancia del panel?
 *
 * Lo pidió el dueño con estas palabras: hoy, al aceptar a alguien, «se
 * revuelve con los que ya están aceptados, y solo hay una diferencia de un
 * botón entre tantos botones». Una lista donde lo revisado y lo no revisado
 * conviven es una lista que nadie revisa.
 *
 * Las rechazadas también se quedan aquí: son las que más hay que seguir
 * mirando, no las que hay que archivar.
 */
export function estaEnVigilancia(estado: EstadoVerificacion): boolean {
  return estado !== "verificada";
}

/**
 * LO QUE EL COMERCIANTE VE DE TODO ESTO: NADA.
 *
 * Decisión del dueño, y se cumple aquí para que no se filtre por descuido en
 * ninguna pantalla. Si supiera que está «en observación» se sentiría vigilado
 * y sospechoso desde el primer día, cuando en realidad es lo normal de
 * cualquier comercio que entra.
 *
 * Y hay un motivo más práctico: quien viene a estafar, sabiendo que lo miran,
 * se comporta bien justo el tiempo que dure la mirada.
 *
 * Por eso esta función existe: para que cualquiera que vaya a enseñar el
 * estado en una pantalla del comercio tenga que pasar por aquí y leer esto.
 * `tests/unit/verificacion-estado.test.ts` lo vigila.
 */
export function visibleParaElComercio(): false {
  return false;
}
