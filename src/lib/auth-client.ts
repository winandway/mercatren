"use client";

import { createAuthClient } from "better-auth/react";

import { RUTA_AUTH } from "@/lib/rutas";

/**
 * Cliente de login para el navegador.
 * Apunta al mismo origen del sitio, en la ruta /datos/auth.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? RUTA_AUTH
      : `${window.location.origin}${RUTA_AUTH}`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
