import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { intentosAcceso } from "@/lib/db/schema";
import {
  ipDeLaPeticion,
  llaveDeCuenta,
  llaveDeIp,
  puedeIntentar,
  TOPE_POR_CUENTA,
  TOPE_POR_IP,
  trasFallar,
  type Contador,
} from "@/lib/seguridad/intentos";

/**
 * EL LÍMITE DE INTENTOS, CONTRA LA BASE.
 *
 * Las decisiones —cuántos fallos, cuánto dura la ventana, de qué cabecera sale
 * la dirección— viven en `intentos.ts`, que es puro y tiene pruebas. Aquí solo
 * está el ir y venir a la base.
 *
 * ══ TODO VA DENTRO DE UN `try`, Y SE DEJA PASAR SI FALLA ══
 *
 * Igual que el escudo. Detrás siguen la contraseña y el rol; cerrarle la
 * entrada a todos los clientes por un mal minuto de la base cuesta mucho más
 * que el ataque que evitaría — y sin base tampoco habría con qué autenticar a
 * nadie.
 */

type Resultado =
  { permitido: true } | { permitido: false; esperaSegundos: number };

/** Las dos llaves que se vigilan en esta petición. */
function llavesDe(correo: string | null, ip: string | null) {
  const llaves: { llave: string; tope: number }[] = [];
  if (correo)
    llaves.push({ llave: llaveDeCuenta(correo), tope: TOPE_POR_CUENTA });
  if (ip) llaves.push({ llave: llaveDeIp(ip), tope: TOPE_POR_IP });
  return llaves;
}

async function leerContadores(llaves: string[]) {
  const filas = await getDb()
    .select({
      llave: intentosAcceso.llave,
      intentos: intentosAcceso.intentos,
      ventanaDesde: intentosAcceso.ventanaDesde,
    })
    .from(intentosAcceso)
    .where(inArray(intentosAcceso.llave, llaves));

  return new Map<string, Contador>(
    filas.map((f) => [
      f.llave,
      { intentos: f.intentos, ventanaDesde: f.ventanaDesde },
    ]),
  );
}

/**
 * ¿Se le deja probar?
 *
 * Se llama ANTES de mirar la contraseña, igual que el escudo: si no se le deja,
 * la base de cuentas ni se toca.
 */
export async function dejaIntentar(
  correo: string | null,
  ip: string | null,
): Promise<Resultado> {
  const llaves = llavesDe(correo, ip);
  if (llaves.length === 0) return { permitido: true };

  try {
    const contadores = await leerContadores(llaves.map((l) => l.llave));
    const ahora = Date.now();

    /* Gana el más restrictivo: si la cuenta está bloqueada da igual que la
       dirección tenga margen, y al revés. */
    let espera = 0;
    for (const { llave, tope } of llaves) {
      const veredicto = puedeIntentar(
        contadores.get(llave) ?? null,
        tope,
        ahora,
      );
      if (!veredicto.permitido) {
        espera = Math.max(espera, veredicto.esperaSegundos);
      }
    }

    return espera > 0
      ? { permitido: false, esperaSegundos: espera }
      : { permitido: true };
  } catch (fallo) {
    console.error("[limite] no se pudo consultar los intentos:", fallo);
    return { permitido: true };
  }
}

/** Un intento que salió mal: suma en las dos llaves. */
export async function anotarFallo(correo: string | null, ip: string | null) {
  const llaves = llavesDe(correo, ip);
  if (llaves.length === 0) return;

  try {
    const db = getDb();
    const contadores = await leerContadores(llaves.map((l) => l.llave));
    const ahora = Date.now();

    for (const { llave } of llaves) {
      const nuevo = trasFallar(contadores.get(llave) ?? null, ahora);
      await db
        .insert(intentosAcceso)
        .values({
          llave,
          intentos: nuevo.intentos,
          ventanaDesde: nuevo.ventanaDesde,
        })
        .onConflictDoUpdate({
          target: intentosAcceso.llave,
          set: { intentos: nuevo.intentos, ventanaDesde: nuevo.ventanaDesde },
        });
    }
  } catch (fallo) {
    /* No poder anotar un fallo jamás puede tumbar la entrada de nadie. */
    console.error("[limite] no se pudo anotar el intento:", fallo);
  }
}

/**
 * Entró bien: se le borra el contador a esa CUENTA.
 *
 * La dirección NO se limpia, y es deliberado: en un ataque desde una sola
 * conexión, el atacante entraría a una cuenta cualquiera que sí conoce y con
 * eso se limpiaría el marcador para seguir probando contra las demás.
 */
export async function olvidarFallos(correo: string | null) {
  if (!correo) return;

  try {
    await getDb()
      .delete(intentosAcceso)
      .where(eq(intentosAcceso.llave, llaveDeCuenta(correo)));
  } catch (fallo) {
    console.error("[limite] no se pudo limpiar los intentos:", fallo);
  }
}

/** La dirección de quien llama, leída de las cabeceras de la petición. */
export function ipDe(request: Request): string | null {
  return ipDeLaPeticion({
    cfConnectingIp: request.headers.get("cf-connecting-ip"),
    xForwardedFor: request.headers.get("x-forwarded-for"),
  });
}
