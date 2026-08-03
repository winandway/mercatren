"use client";

import { createAuthClient } from "better-auth/react";

import { RUTA_AUTH } from "@/lib/rutas";

/**
 * Cliente de login para el navegador.
 *
 * El `basePath` va como opcion propia y NO pegado al `baseURL`: si se mete
 * dentro de la direccion, la libreria le agrega igual su ruta por defecto
 * (/api/auth) y las peticiones terminan en una direccion que no existe.
 */
export const authClient = createAuthClient({
  basePath: RUTA_AUTH,
});

export const { signIn, signUp, signOut, useSession } = authClient;
