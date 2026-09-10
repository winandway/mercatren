"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { crearMiCasillero } from "@/lib/casillero/acciones";

/** Los países a los que se despacha hoy. Se amplía cuando se abra otro. */
export const PAISES_DESTINO = [
  { codigo: "VE", nombre: "Venezuela" },
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "CL", nombre: "Chile" },
  { codigo: "PE", nombre: "Perú" },
  { codigo: "EC", nombre: "Ecuador" },
  { codigo: "BO", nombre: "Bolivia" },
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "PY", nombre: "Paraguay" },
  { codigo: "UY", nombre: "Uruguay" },
  { codigo: "BR", nombre: "Brasil" },
] as const;

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton-principal w-full" disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * ══ EL FORMULARIO PIDE LO MÍNIMO ══
 *
 * Nombre legal, teléfono y país. Nada más: cada campo de más es gente que
 * abandona, y el resto de los datos se piden cuando hagan falta de verdad
 * (la dirección de destino, al despachar; el documento, al verificar).
 *
 * **El nombre legal lleva su advertencia y no es un capricho**: es el que
 * va en la etiqueta de Amazon. Quien se registre como «Juanchi» y compre
 * como «Juan Carlos Pérez» tiene una caja que no cuadra con nadie.
 */
export function FormularioCasillero({
  textos,
}: {
  textos: {
    nombreLegal: string;
    nombreAyuda: string;
    telefono: string;
    telefonoAyuda: string;
    pais: string;
    terminos: string;
    crear: string;
    enviando: string;
    errorNombre: string;
    errorTelefono: string;
    errorTerminos: string;
    errorSesion: string;
    errorFallo: string;
  };
}) {
  const [estado, accion] = useActionState(crearMiCasillero, null);

  const mensajeDeError = (e: string) =>
    ({
      "nombre-incompleto": textos.errorNombre,
      "telefono-invalido": textos.errorTelefono,
      terminos: textos.errorTerminos,
      sesion: textos.errorSesion,
    })[e] ?? textos.errorFallo;

  return (
    <form action={accion} className="space-y-4">
      {estado?.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
        >
          {mensajeDeError(estado.error)}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-semibold">{textos.nombreLegal}</span>
        <input
          name="nombreLegal"
          required
          autoComplete="name"
          placeholder="Nombre y apellidos"
          className="mt-1 w-full rounded-lg border border-borde px-3 py-2"
        />
        <span className="mt-1 block text-xs text-tinta-suave">
          {textos.nombreAyuda}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">{textos.telefono}</span>
        <input
          name="telefono"
          required
          type="tel"
          autoComplete="tel"
          placeholder="+58 412 000 0000"
          className="mt-1 w-full rounded-lg border border-borde px-3 py-2"
        />
        <span className="mt-1 block text-xs text-tinta-suave">
          {textos.telefonoAyuda}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">{textos.pais}</span>
        <select
          name="paisDestino"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2"
        >
          <option value="" disabled>
            —
          </option>
          {PAISES_DESTINO.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input name="terminos" type="checkbox" className="mt-1" required />
        <span>{textos.terminos}</span>
      </label>

      <Boton texto={textos.crear} enviando={textos.enviando} />
    </form>
  );
}
