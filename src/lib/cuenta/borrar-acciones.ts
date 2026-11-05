"use server";

import { obtenerUsuario } from "@/lib/autorizacion";

import {
  confirmoElBorrado,
  esCuentaEliminada,
  puedeBorrarSuCuenta,
  type MotivoParaNoBorrar,
} from "./borrar-puro";

/**
 * Borrar la cuenta propia (27 oct 2026). La llama la página «Delete account»,
 * que es la misma dentro de la app de Android y en la web.
 *
 * Solo exporta funciones async: un archivo "use server" con una constante o
 * un tipo exportado rompe la compilación entera.
 */
export async function borrarMiCuenta(entrada: {
  palabra: string;
  origen: "app" | "web";
}): Promise<
  | { ok: true }
  | { ok: false; motivo: MotivoParaNoBorrar | "sesion" | "palabra" | "fallo" }
> {
  const usuario = await obtenerUsuario();
  if (!usuario || esCuentaEliminada(usuario.email)) {
    return { ok: false, motivo: "sesion" };
  }
  if (!confirmoElBorrado(String(entrada.palabra ?? ""))) {
    return { ok: false, motivo: "palabra" };
  }

  const { borrarCuenta, situacionDeLaCuenta } = await import("./borrar");
  const situacion = await situacionDeLaCuenta(
    usuario.id,
    usuario.rol ?? "cliente",
  );
  const decision = puedeBorrarSuCuenta(situacion);
  if (!decision.ok) return { ok: false, motivo: decision.motivo };

  const origen = entrada.origen === "app" ? "app" : "web";
  const destinatario = {
    email: usuario.email,
    name: usuario.name,
    idioma: (usuario as { idioma?: string }).idioma,
  };

  try {
    await borrarCuenta(usuario.id, usuario.email, origen);
  } catch (e) {
    console.error("[cuenta] no se pudo borrar la cuenta:", e);
    return { ok: false, motivo: "fallo" };
  }

  /* El aviso sale a la dirección VIEJA. Si falla, la cuenta ya se borró:
     no se deshace por un correo. */
  try {
    const { correoCuentaEliminada } = await import("@/lib/correo/correos");
    await correoCuentaEliminada(destinatario);
  } catch (e) {
    console.error("[cuenta] la cuenta se borró pero el aviso no salió:", e);
  }

  return { ok: true };
}

/**
 * PEDIR EL CIERRE DE UNA CUENTA CON TIENDA (5 nov 2026, Apple 5.1.1(v)).
 * La misma palabra de confirmación que el borrado. La tienda se apaga a la
 * venta en el acto y la cuenta se borra sola cuando no queda nada pendiente
 * (`cierre.ts`). La usan la página «Delete account» y la app.
 */
export async function pedirCierreDeMiCuenta(entrada: {
  palabra: string;
  origen: "app" | "web";
}): Promise<
  | { ok: true; borrada: boolean; pasos: Array<"pedidos" | "pagos" | "saldo"> }
  | { ok: false; motivo: "sesion" | "palabra" | "sin_tienda" | "fallo" }
> {
  const usuario = await obtenerUsuario();
  if (!usuario || esCuentaEliminada(usuario.email)) {
    return { ok: false, motivo: "sesion" };
  }
  if (!confirmoElBorrado(String(entrada.palabra ?? ""))) {
    return { ok: false, motivo: "palabra" };
  }
  try {
    const { pedirCierre } = await import("./cierre");
    const r = await pedirCierre(
      { id: usuario.id, email: usuario.email, name: usuario.name },
      entrada.origen === "app" ? "app" : "web",
    );
    if (!r.ok) return { ok: false, motivo: r.motivo };
    return {
      ok: true,
      borrada: r.borrada,
      pasos: r.estado.pedido ? r.estado.pasos : [],
    };
  } catch (e) {
    console.error("[cuenta] no se pudo pedir el cierre:", e);
    return { ok: false, motivo: "fallo" };
  }
}

/**
 * Lo que la página necesita saber antes de enseñar el formulario: si hay
 * sesión, y si esta cuenta puede borrarse sola ahora mismo.
 */
export async function estadoParaBorrar(): Promise<
  | { sesion: false }
  | { sesion: true; correo: string; puede: true }
  | {
      sesion: true;
      correo: string;
      puede: false;
      motivo: MotivoParaNoBorrar;
      /** Solo con tienda: si ya pidió el cierre y qué le falta. */
      cierre?: { pedido: boolean; pasos: Array<"pedidos" | "pagos" | "saldo"> };
    }
> {
  const usuario = await obtenerUsuario();
  if (!usuario || esCuentaEliminada(usuario.email)) return { sesion: false };

  const { situacionDeLaCuenta } = await import("./borrar");
  const decision = puedeBorrarSuCuenta(
    await situacionDeLaCuenta(usuario.id, usuario.rol ?? "cliente"),
  );
  if (decision.ok) return { sesion: true, correo: usuario.email, puede: true };
  if (decision.motivo !== "tienda") {
    return {
      sesion: true,
      correo: usuario.email,
      puede: false,
      motivo: decision.motivo,
    };
  }
  /* Con tienda: mirar su cuenta también revisa si el cierre ya puede
     terminar (por si lo último pendiente se resolvió sin avisar). */
  const { estadoDelCierre, revisarCierreDeUsuario } = await import("./cierre");
  if (await revisarCierreDeUsuario(usuario.id)) return { sesion: false };
  const cierre = await estadoDelCierre(usuario.id);
  return {
    sesion: true,
    correo: usuario.email,
    puede: false,
    motivo: "tienda",
    cierre: cierre.pedido
      ? { pedido: true, pasos: cierre.pasos }
      : { pedido: false, pasos: [] },
  };
}
