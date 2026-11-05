import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  hayAlgoEscrito,
  leerBorrador,
  llaveDeBorrador,
  sinSensibles,
} from "@/lib/borrador";

/**
 * EL BORRADOR DE UN FORMULARIO: se guarda solo medio segundo después de dejar
 * de escribir, se devuelve al volver (aunque la app se haya cerrado) y se
 * borra al guardar con éxito o al tocar «Empezar de nuevo». Nunca guarda lo
 * sensible (ver `lib/borrador.ts`).
 */
export function useBorrador<T extends Record<string, string>>(
  formulario: string,
  cuenta: string | null | undefined,
  valores: T,
  restaurar: (guardado: Partial<T>) => void,
) {
  const llave = llaveDeBorrador(formulario, cuenta);
  const [recuperado, setRecuperado] = useState(false);
  const leido = useRef<string | null>(null);
  const restaurarRef = useRef(restaurar);
  restaurarRef.current = restaurar;

  useEffect(() => {
    let vivo = true;
    leido.current = null;
    AsyncStorage.getItem(llave)
      .then((crudo) => {
        if (!vivo) return;
        const guardado = leerBorrador(crudo);
        if (guardado) {
          restaurarRef.current(guardado as Partial<T>);
          setRecuperado(true);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (vivo) leido.current = llave;
      });
    return () => {
      vivo = false;
    };
  }, [llave]);

  const seguro = JSON.stringify(sinSensibles(valores));
  useEffect(() => {
    if (leido.current !== llave) return;
    const reloj = setTimeout(() => {
      const actuales = JSON.parse(seguro) as Record<string, string>;
      void (
        hayAlgoEscrito(actuales)
          ? AsyncStorage.setItem(llave, seguro)
          : AsyncStorage.removeItem(llave)
      ).catch(() => undefined);
    }, 500);
    return () => clearTimeout(reloj);
  }, [llave, seguro]);

  /** Al guardar con éxito o cancelar a propósito. */
  const limpiar = useCallback(async () => {
    setRecuperado(false);
    await AsyncStorage.removeItem(llave).catch(() => undefined);
  }, [llave]);

  return { recuperado, limpiar };
}
