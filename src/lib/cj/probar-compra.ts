"use server";

import type {
  UltimaCompraDePrueba,
  DireccionDePrueba,
} from "@/lib/cj/diagnostico-puro";
import {
  comprarDeVerdadACjNucleo,
  leerUltimaCompraDePruebaNucleo,
  pagarUltimaPruebaPendienteNucleo,
  probarCompraDeCjNucleo,
  type ResultadoDePrueba,
} from "@/lib/cj/probar-compra-nucleo";
import { esSoporteDeVerdad, obtenerUsuario } from "@/lib/autorizacion";

/**
 * PROBAR EL TRAMO DE CJ PEGANDO UN ENLACE (5 sep 2026).
 *
 * Lo pidió el dueño después de la tercera compra fallida: «no puedo estar
 * probando en Stripe cada rato». Y es lo correcto — el cobro con tarjeta ya
 * está probado; lo que falla una y otra vez es el proveedor.
 *
 * Estas son las ACCIONES que llama la pantalla. Lo que hacen vive en
 * `probar-compra-nucleo.ts`, que también usa la puerta sin sesión
 * (`/datos/probar-compra`) con la que se prueba desde GitHub. Aquí solo se
 * comprueba quién pulsa: **soporte DE VERDAD**, porque esto le habla al
 * proveedor, gasta puntos de CJ y, en la compra, dinero del saldo. Con el
 * disfraz de «ver su panel» no se prueban compras.
 *
 * Un archivo `"use server"` solo puede exportar funciones async: nada de
 * constantes ni tipos aquí (Turbopack rechaza el módulo entero).
 */
const SIN_PERMISO: ResultadoDePrueba = {
  ok: false,
  mensaje: "No tienes permiso para esto.",
  pasos: [],
  seDetuvoEn: "permiso",
};

export async function probarCompraDeCj(entrada: {
  enlace: string;
  estado?: string;
  codigoPostal?: string;
}): Promise<ResultadoDePrueba> {
  if (!(await esSoporteDeVerdad())) return SIN_PERMISO;
  return probarCompraDeCjNucleo(entrada);
}

export async function comprarDeVerdadACj(entrada: {
  enlace: string;
  direccion: DireccionDePrueba;
}): Promise<ResultadoDePrueba> {
  if (!(await esSoporteDeVerdad())) return SIN_PERMISO;
  const usuario = await obtenerUsuario();
  const quien = usuario?.name || usuario?.email || "soporte";
  return comprarDeVerdadACjNucleo(entrada, quien);
}

export async function pagarUltimaPruebaPendiente(): Promise<ResultadoDePrueba> {
  if (!(await esSoporteDeVerdad())) return SIN_PERMISO;
  return pagarUltimaPruebaPendienteNucleo();
}

export async function leerUltimaCompraDePrueba(): Promise<UltimaCompraDePrueba | null> {
  if (!(await esSoporteDeVerdad())) return null;
  return leerUltimaCompraDePruebaNucleo();
}
