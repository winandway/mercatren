import "server-only";

import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { rechazosCorreo } from "@/lib/db/schema";
import { dominioRecibeCorreo } from "@/lib/validacion/dns-correo";
import {
  revisarPorLista,
  type MotivoRechazo,
  type Veredicto,
} from "@/lib/validacion/correo-real";

/**
 * EL FILTRO COMPLETO, TAL COMO LO USA EL REGISTRO.
 *
 * Junta las tres capas en el orden barato → caro: primero las listas, que no
 * cuestan nada, y solo si el correo las pasa se sale a preguntarle al DNS.
 *
 * ══ VA EN EL SERVIDOR, Y ESO NO ES UN DETALLE ══
 *
 * El formulario del navegador se salta abriendo la consola. Si esta
 * comprobación viviera solo ahí, sería un adorno. Aquí es una puerta.
 *
 * ══ SOLO PARA CUENTAS NUEVAS ══
 *
 * A nadie que ya tenga cuenta se le vuelve a mirar el correo. Si el filtro se
 * pusiera en el login, un cliente de hace meses podría quedarse fuera de su
 * propia cuenta porque hoy su dominio no contesta.
 */

export type VeredictoCompleto = Veredicto;

export async function correoAceptable(
  correo: string,
): Promise<VeredictoCompleto> {
  const porLista = revisarPorLista(correo);
  if (!porLista.ok) return porLista;

  const dns = await dominioRecibeCorreo(porLista.dominio);

  /* `no_se_pudo` cuenta como sí. Es la regla que manda: nunca se cierra la
     puerta por un problema de infraestructura. */
  if (dns === "no_existe") {
    return {
      ok: false,
      motivo: "correoSinServidor",
      dominio: porLista.dominio,
    };
  }

  return porLista;
}

/**
 * Deja constancia de un rechazo.
 *
 * ══ PARA QUÉ ══
 *
 * Para poder revisar después si el filtro está rechazando gente de verdad. Un
 * filtro que nadie mide se convierte en una pared silenciosa: si mañana empieza
 * a rechazar un dominio legítimo, sin este registro nos enteraríamos por un
 * cliente enfadado — o por ninguno, porque el que no puede registrarse se va.
 *
 * Va en su propio `try`: **un registro que no se guarda jamás puede impedir un
 * alta**. Si esto falla, el rechazo sigue en pie y punto.
 */
export async function anotarRechazo(datos: {
  correo: string;
  motivo: MotivoRechazo;
  dominio: string;
  ip: string | null;
}): Promise<void> {
  try {
    await getDb()
      .insert(rechazosCorreo)
      .values({
        id: `rech-${nanoid(12)}`,
        correo: datos.correo.slice(0, 160),
        dominio: datos.dominio.slice(0, 120),
        motivo: datos.motivo,
        ip: datos.ip,
        creadoEn: new Date(),
      });
  } catch (fallo) {
    console.error("[registro] no se pudo anotar el rechazo:", fallo);
  }
}
