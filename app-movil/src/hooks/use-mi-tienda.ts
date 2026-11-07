import { useCallback, useEffect, useState } from "react";

import { pedirJson } from "@/lib/api";
import { authClient, cabeceraDeSesion } from "@/lib/auth-client";
import type { Idioma } from "@/lib/dinero";
import { urlMiTienda, type RespuestaMiTienda } from "@/lib/tienda";

/**
 * ¿Quien mira tiene tienda? Solo se pregunta con sesión (sin ella la
 * respuesta es «no» sin gastar una consulta) y una vez por pantalla.
 */
export function useMiTienda(pais: string | null, idioma: Idioma) {
  const { data: sesion } = authClient.useSession();
  const conSesion = Boolean(sesion?.user);
  const [datos, setDatos] = useState<RespuestaMiTienda | null>(null);
  const [vuelta, setVuelta] = useState(0);
  /* Ya llegó la respuesta (buena o mala): distingue «todavía no sé» de «no tiene». */
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!pais || !conSesion) {
      setDatos(null);
      setCargado(false);
      return;
    }
    let vivo = true;
    pedirJson<RespuestaMiTienda>(urlMiTienda(pais, idioma), fetch, {
      headers: cabeceraDeSesion(),
    })
      .then((r) => {
        if (!vivo) return;
        setDatos(r);
        setCargado(true);
      })
      .catch(() => {
        if (!vivo) return;
        setDatos(null);
        setCargado(true);
      });
    return () => {
      vivo = false;
    };
  }, [pais, idioma, conSesion, vuelta]);

  const recargar = useCallback(() => setVuelta((n) => n + 1), []);
  return {
    conSesion,
    cargado,
    tienda: datos?.tienda ?? null,
    documento: datos?.documento ?? null,
    recargar,
  };
}
