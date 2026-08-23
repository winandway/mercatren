"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { registrarVista, type Vista } from "@/lib/catalogo/afinidad";

/**
 * LAS ÚLTIMAS FICHAS QUE ABRIÓ LA PERSONA, guardadas en SU navegador.
 *
 * No sale de ahí: no se manda al servidor, no se asocia a una cuenta, no se
 * usa para nada más que para decidir qué enseñarle después («seguirle
 * mostrando pintalabios»). Es el mismo mecanismo que el carrito.
 *
 * La regla de qué categoría manda vive en `afinidad.ts`, pura y con pruebas;
 * aquí solo se guarda y se recuerda.
 */
type EstadoHistorial = {
  vistas: Vista[];
  registrar: (vista: Omit<Vista, "en">) => void;
};

export const useHistorial = create<EstadoHistorial>()(
  persist(
    (set) => ({
      vistas: [],
      registrar: (vista) =>
        set((estado) => ({
          vistas: registrarVista(estado.vistas, { ...vista, en: Date.now() }),
        })),
    }),
    { name: "mercatren-vistos" },
  ),
);
