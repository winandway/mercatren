import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

import {
  comprarDeVerdadACjNucleo,
  leerUltimaCompraDePruebaNucleo,
  pagarUltimaPruebaPendienteNucleo,
  probarCompraDeCjNucleo,
  saldoDeCj,
  sondaCj,
} from "@/lib/cj/probar-compra-nucleo";
import { autorizadoPorLlave } from "@/lib/seguridad/llave-del-reloj";

/**
 * LA PUERTA PARA PROBAR LA COMPRA A CJ SIN SESIÓN (5 sep 2026).
 *
 * Palabras del dueño: «el de pruebas debería tomar el control de ese botón y
 * tú directamente hacer pruebas hasta que esa mierda funcione. ¿Qué me pones
 * a mí a perder el tiempo aquí en esto?». Tenía razón: cada intento era él
 * pulsando un botón y mandando una captura.
 *
 * Esta puerta hace LO MISMO que los botones de Panel → Probar una compra,
 * pero la dispara el flujo `probar-compra.yml` de GitHub con la llave del
 * reloj (`SINCRONIZAR_LLAVE`, la misma de `/datos/vigilante`), y devuelve
 * el diagnóstico entero —cada paso con lo que CJ contestó— en la respuesta.
 * Así se repite la prueba las veces que haga falta sin que nadie toque nada,
 * y solo cuando sale en verde se le pide a él la compra real.
 *
 * Sin llave cargada, 503 y no hace nada; a quien no la trae, 404. Todo lo
 * que entra pasa por zod. La sonda (`accion: "cj"`) solo deja rutas de CJ
 * de la lista de `rutaDeSondaPermitida`.
 */
export const dynamic = "force-dynamic";

const Direccion = z.object({
  nombre: z.string().min(1),
  direccion: z.string().min(1),
  direccion2: z.string().optional(),
  ciudad: z.string().min(1),
  estado: z.string().min(1),
  codigoPostal: z.string().default(""),
  telefono: z.string().optional(),
});

const Peticion = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("saldo") }),
  z.object({ accion: z.literal("ultima") }),
  z.object({
    accion: z.literal("mirar"),
    enlace: z.string().min(1),
    estado: z.string().optional(),
    codigoPostal: z.string().optional(),
  }),
  z.object({
    accion: z.literal("comprar"),
    enlace: z.string().min(1),
    direccion: Direccion,
  }),
  z.object({ accion: z.literal("pagar") }),
  z.object({
    accion: z.literal("cj"),
    ruta: z.string().min(1).max(500),
    metodo: z.enum(["GET", "POST", "PATCH", "DELETE"]).optional(),
    cuerpo: z.unknown().optional(),
  }),
]);

export async function POST(peticion: Request) {
  const { env } = getCloudflareContext();
  const permiso = autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE);
  if (permiso === "sin_llave") {
    return Response.json(
      { ok: false, motivo: "Falta SINCRONIZAR_LLAVE." },
      { status: 503 },
    );
  }
  if (permiso === "no") return Response.json({ ok: false }, { status: 404 });

  const crudo = await peticion.json().catch(() => null);
  const entrada = Peticion.safeParse(crudo);
  if (!entrada.success) {
    return Response.json(
      { ok: false, motivo: "Cuerpo inválido.", detalle: entrada.error.issues },
      { status: 400 },
    );
  }

  const e = entrada.data;
  const empezo = Date.now();
  let resultado: unknown;
  switch (e.accion) {
    case "saldo":
      resultado = await saldoDeCj();
      break;
    case "ultima":
      resultado = await leerUltimaCompraDePruebaNucleo();
      break;
    case "mirar":
      resultado = await probarCompraDeCjNucleo({
        enlace: e.enlace,
        estado: e.estado,
        codigoPostal: e.codigoPostal,
      });
      break;
    case "comprar":
      resultado = await comprarDeVerdadACjNucleo(
        { enlace: e.enlace, direccion: e.direccion },
        "puerta de pruebas (GitHub)",
      );
      break;
    case "pagar":
      resultado = await pagarUltimaPruebaPendienteNucleo();
      break;
    case "cj":
      resultado = await sondaCj({
        ruta: e.ruta,
        metodo: e.metodo,
        cuerpo: e.cuerpo,
      });
      break;
  }

  return Response.json({
    ok: true,
    accion: e.accion,
    duracionMs: Date.now() - empezo,
    resultado,
  });
}
