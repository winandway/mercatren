"use server";

import { obtenerUsuario } from "@/lib/autorizacion";
import { correoBienvenida } from "@/lib/correo/correos";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { sondearEnvio } from "@/lib/correo/sonda";

/**
 * Prueba de humo del envio de correos, desde el panel.
 *
 * Existe porque el correo es la unica pieza del sistema que no se puede
 * comprobar mirando la pantalla: sale del servidor y llega a otro lado. Sin
 * esto, la unica forma de saber si funciona es esperar a que un cliente se
 * queje de que no le llego nada.
 *
 * Manda el correo de bienvenida real, no uno inventado: si este llega, llegan
 * todos, porque todos usan la misma plantilla y el mismo camino.
 *
 * SOLO SOPORTE. Un vendedor no dispara correos a direcciones ajenas.
 */
export async function enviarCorreoDePrueba(
  _estadoPrevio: unknown,
  datos: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const usuario = await obtenerUsuario().catch(() => null);

  if (usuario?.rol !== "soporte") {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const correo = String(datos.get("correo") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { ok: false, mensaje: "Escribe una dirección de correo válida." };
  }

  const resultado = await correoBienvenida({
    email: correo,
    name: usuario.name ?? null,
    idioma: "es",
  });

  if (resultado.enviado) {
    return { ok: true, mensaje: `Enviado a ${correo}. Revisa la bandeja.` };
  }

  /**
   * Si el servicio rechaza la forma del mensaje, se sondea.
   *
   * El codigo que devuelve (`invalid_request_schema`) no dice que campo esta
   * mal, asi que la sonda prueba las formas posibles y dice cual acepta. Sin
   * esto habria que gastar un despliegue por cada intento.
   */
  if (resultado.motivo?.includes("invalid_request_schema")) {
    const sonda = await sondearEnvio(correo, CORREO_CONTACTO);

    if (sonda.funciona) {
      return {
        ok: true,
        mensaje: `Enviado a ${correo} con la forma «${sonda.funciona}». Revisa la bandeja.`,
      };
    }

    const resumen = sonda.detalle
      .map((d) => `${d.forma}: ${d.estado} ${d.respuesta}`)
      .join(" || ");

    return { ok: false, mensaje: `Ninguna forma sirvió — ${resumen}` };
  }

  // El motivo real, no un "no se pudo": esta pantalla existe para diagnosticar.
  return {
    ok: false,
    mensaje: `No salió — ${resultado.motivo ?? "sin motivo del servicio"}`,
  };
}
