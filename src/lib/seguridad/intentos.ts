/**
 * LÍMITE DE INTENTOS EN LAS PUERTAS DE ENTRADA.
 *
 * ══ POR QUÉ HACÍA FALTA (12 ago 2026) ══
 *
 * Hasta hoy **no había ninguno**. La única defensa de `/entrar` era Turnstile,
 * que frena robots tontos y no a alguien decidido: el pase se pide una vez y
 * después se pueden mandar contraseñas tan rápido como aguante el servidor. Y
 * detrás de esa puerta está el panel donde un comercio ve su dinero y pide sus
 * retiros.
 *
 * ══ SOLO SE CUENTAN LOS FALLOS ══
 *
 * Contar también los aciertos dejaría fuera a una ferretería donde entran seis
 * personas desde la misma conexión. Al entrar bien, el contador de esa cuenta
 * se borra: quien recordó su contraseña vuelve a empezar de cero.
 *
 * ══ SE CUENTA POR IP **Y** POR CUENTA, Y LAS DOS HACEN FALTA ══
 *
 * - Por IP frena a quien prueba mil contraseñas contra muchas cuentas.
 * - Por cuenta frena lo contrario: mil máquinas distintas probando contra UNA
 *   cuenta, que es como se roba una en concreto. Sin esto, el límite por IP no
 *   sirve de nada contra una red de bots.
 *
 * **El tope por cuenta es alto a propósito.** Quien conoce el correo de alguien
 * podría dejarlo fuera a base de fallar aposta. Ocho fallos en quince minutos
 * es muchísimo más de lo que hace una persona de verdad —que prueba dos o
 * tres— y a la vez deja el bloqueo corto, así que el daño de esa jugada es
 * pequeño y el ataque de fuerza bruta se muere igual.
 *
 * ══ SI LA BASE FALLA, SE DEJA PASAR ══
 *
 * Igual que el escudo. Detrás siguen la contraseña y el rol; cerrarle la
 * entrada a todos los clientes por un mal minuto de la base cuesta más que el
 * ataque que evitaría. Y sin base tampoco habría con qué autenticar a nadie.
 */

/** Cuánto dura la ventana en que se cuentan los fallos. */
export const VENTANA_MS = 15 * 60 * 1000;

/** Fallos permitidos en esa ventana, por cuenta. */
export const TOPE_POR_CUENTA = 8;

/**
 * Fallos permitidos por dirección, mucho más alto.
 *
 * Detrás de una sola dirección puede haber una oficina entera, un locutorio o
 * el móvil de media ciudad: en Venezuela es lo normal. Un tope bajo aquí deja
 * fuera a clientes de verdad.
 */
export const TOPE_POR_IP = 40;

export type Contador = {
  /** Fallos acumulados en la ventana vigente. */
  intentos: number;
  /** Cuándo empezó esa ventana. */
  ventanaDesde: number;
};

export type Veredicto =
  { permitido: true } | { permitido: false; esperaSegundos: number };

/**
 * ¿Se le deja intentar?
 *
 * `null` es «nunca ha fallado», que es el caso de casi todo el mundo.
 */
export function puedeIntentar(
  contador: Contador | null,
  tope: number,
  ahora: number,
): Veredicto {
  if (!contador) return { permitido: true };

  const finDeVentana = contador.ventanaDesde + VENTANA_MS;

  /* La ventana ya pasó: lo de antes no cuenta y empieza de cero. */
  if (ahora >= finDeVentana) return { permitido: true };

  if (contador.intentos < tope) return { permitido: true };

  return {
    permitido: false,
    /* Hacia arriba: decir «espera 0 segundos» y seguir rechazando es la peor
       combinación posible para quien está mirando la pantalla. */
    esperaSegundos: Math.max(1, Math.ceil((finDeVentana - ahora) / 1000)),
  };
}

/**
 * El contador después de un fallo.
 *
 * Si la ventana venció, se abre una nueva con este fallo dentro; si no, se
 * suma al que había.
 */
export function trasFallar(contador: Contador | null, ahora: number): Contador {
  if (!contador || ahora >= contador.ventanaDesde + VENTANA_MS) {
    return { intentos: 1, ventanaDesde: ahora };
  }

  return {
    intentos: contador.intentos + 1,
    ventanaDesde: contador.ventanaDesde,
  };
}

/**
 * La llave con la que se guarda cada contador.
 *
 * El correo se normaliza —minúsculas y sin espacios— porque si no
 * `Correo@X.com` y `correo@x.com` serían dos contadores distintos y bastaría
 * alternar mayúsculas para duplicar los intentos permitidos.
 */
export function llaveDeCuenta(correo: string): string {
  return `cuenta:${correo.trim().toLowerCase()}`;
}

export function llaveDeIp(ip: string): string {
  return `ip:${ip.trim()}`;
}

/**
 * La dirección de quien llama, sacada de las cabeceras.
 *
 * En Cloudflare la buena es `cf-connecting-ip`: la pone el borde y no se puede
 * falsear desde fuera. `x-forwarded-for` sí se puede, y por eso **solo se mira
 * si la primera no está** y se toma únicamente el primer valor de la lista —
 * los demás los pudo escribir el propio atacante.
 *
 * Sin dirección se devuelve `null` y el límite por IP no se aplica: el de
 * cuenta sigue en pie. Inventarse una llave como «desconocido» sería juntar a
 * todo el que llegue sin cabecera en un mismo contador y bloquearlos a todos a
 * la vez.
 */
export function ipDeLaPeticion(cabeceras: {
  cfConnectingIp?: string | null;
  xForwardedFor?: string | null;
}): string | null {
  const directa = cabeceras.cfConnectingIp?.trim();
  if (directa) return directa;

  const primera = cabeceras.xForwardedFor?.split(",")[0]?.trim();
  return primera || null;
}
