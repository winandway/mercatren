"use server";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { listarCuentas, mercuryConfigurado } from "@/lib/mercury/cliente";
import { mensajes } from "@/lib/mensajes";

/**
 * COMPROBAR QUE EL TOKEN DEL BANCO SIRVE.
 *
 * ══ POR QUÉ HACE FALTA UN BOTÓN Y NO BASTA CON «SE GUARDÓ» ══
 *
 * El token se pega en el panel de la plataforma y ahí no hay forma de saber si
 * quedó bien: si le sobra un espacio, si le faltan permisos, o si se copió a
 * medias. Guardar una variable siempre «funciona». Lo que falla es la primera
 * llamada de verdad — y sin esto, esa primera llamada sería un retiro real de
 * un comercio esperando su dinero.
 *
 * Es la misma idea que «Probar el envío» del correo: la pieza que vive fuera
 * del navegador se comprueba con un botón, no con fe.
 *
 * ══ POR QUÉ LEE CUENTAS Y NO PIDE UN PAGO ══
 *
 * Es la llamada más inofensiva que existe: no mueve un centavo y no deja nada
 * escrito en el banco. Si devuelve las cuentas, el token viaja bien y está
 * autorizado. Lo demás —que tenga el permiso de pedir pagos— se ve en Mercury,
 * no se prueba mandando dinero de mentira.
 */

export type ResultadoSonda = {
  ok: boolean;
  mensaje: string;
  /** Lo que contestó el banco, para poder pegarlo si hay que preguntar. */
  detalle?: string;
  cuentas?: { nombre: string; tipo: string; saldo: number; estado: string }[];
};

export async function probarMercury(): Promise<ResultadoSonda> {
  await exigirEquipoInterno();
  const t = await mensajes();

  if (!mercuryConfigurado()) {
    return { ok: false, mensaje: t("mercury.sinToken") };
  }

  const respuesta = await listarCuentas();

  if (!respuesta.ok) {
    /* El 401 es el caso común y merece su propio mensaje: casi siempre es un
       token mal copiado, no un problema del banco. */
    const mensaje =
      respuesta.estado === 401
        ? t("mercury.tokenRechazado")
        : t("mercury.falloConEstado", { estado: respuesta.estado });

    return { ok: false, mensaje, detalle: respuesta.motivo };
  }

  const cuentas = respuesta.datos.accounts ?? [];

  return {
    ok: true,
    mensaje: t("mercury.conectado", { n: cuentas.length }),
    cuentas: cuentas.map((c) => ({
      nombre: c.name,
      tipo: c.kind,
      /* Mercury devuelve dólares con decimales; aquí se enseña tal cual y no
         se convierte a centavos: es un diagnóstico, no un asiento contable. */
      saldo: c.availableBalance,
      estado: c.status,
    })),
  };
}
