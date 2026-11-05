import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Idioma } from "./dinero";

/**
 * El país y el idioma elegidos, guardados en el teléfono. Se leen al abrir la
 * app y se escriben solo cuando la persona los cambia.
 */
const LLAVE = "mercatren:preferencias";

export type Preferencias = { pais: string; idioma: Idioma };

/** Lo guardado. El país puede faltar (nunca se eligió, o se apagó). */
export async function leerPreferencias(): Promise<{
  pais: string | null;
  idioma: Idioma;
} | null> {
  try {
    const crudo = await AsyncStorage.getItem(LLAVE);
    if (!crudo) return null;
    const p = JSON.parse(crudo) as Partial<Preferencias>;
    if (p.idioma !== "es" && p.idioma !== "en") return null;
    return {
      pais: typeof p.pais === "string" ? p.pais : null,
      idioma: p.idioma,
    };
  } catch {
    return null;
  }
}

export async function guardarPreferencias(p: Preferencias): Promise<void> {
  await AsyncStorage.setItem(LLAVE, JSON.stringify(p));
}

/** Olvida el país (por ejemplo, porque se apagó): la app vuelve a preguntarlo. */
export async function olvidarPais(idioma: Idioma): Promise<void> {
  await AsyncStorage.setItem(LLAVE, JSON.stringify({ idioma }));
}
