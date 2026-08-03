"use server";

import { mensajes } from "@/lib/mensajes";
import { obtenerUsuario } from "@/lib/autorizacion";
import { correoBienvenida } from "@/lib/correo/correos";

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
  const t = await mensajes();

  const usuario = await obtenerUsuario().catch(() => null);

  if (usuario?.rol !== "soporte") {
    return { ok: false, mensaje: t("sinPermiso") };
  }

  const correo = String(datos.get("correo") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { ok: false, mensaje: t("escribeCorreo") };
  }

  const resultado = await correoBienvenida({
    email: correo,
    name: usuario.name ?? null,
    idioma: "es",
  });

  if (resultado.enviado) {
    return { ok: true, mensaje: t("correoEnviado", { correo }) };
  }

  // El motivo real, no un "no se pudo": esta pantalla existe para diagnosticar.
  return {
    ok: false,
    mensaje: t("correoNoSalio", {
      motivo: resultado.motivo ?? t("correoSinMotivo"),
    }),
  };
}
