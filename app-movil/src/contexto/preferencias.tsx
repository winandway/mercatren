import { getLocales } from "expo-localization";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { Idioma } from "@/lib/dinero";
import { paisSigueEncendido, pedirPaises } from "@/lib/api";
import {
  guardarPreferencias,
  leerPreferencias,
  olvidarPais,
  type Preferencias,
} from "@/lib/preferencias";
import { idiomaDelTelefono } from "@/lib/textos";

/**
 * El país y el idioma de la persona, para toda la app. Mientras no eligió
 * país, `pais` es null y la app la lleva a la bienvenida. El idioma arranca
 * con el del teléfono.
 */
type Valor = {
  cargando: boolean;
  pais: string | null;
  idioma: Idioma;
  cambiar: (p: Partial<Preferencias>) => Promise<void>;
};

const Contexto = createContext<Valor | null>(null);

export function ProveedorDePreferencias({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cargando, setCargando] = useState(true);
  const [pais, setPais] = useState<string | null>(null);
  const [idioma, setIdioma] = useState<Idioma>(() =>
    idiomaDelTelefono(getLocales()[0]?.languageCode),
  );

  useEffect(() => {
    let vivo = true;
    leerPreferencias().then((p) => {
      if (!vivo) return;
      if (p) {
        setPais(p.pais);
        setIdioma(p.idioma);
        /* Sin esperar: si el país guardado se apagó, de vuelta a la bienvenida. */
        const guardado = p.pais;
        if (guardado)
          pedirPaises(p.idioma)
            .then((r) => {
              if (vivo && !paisSigueEncendido(guardado, r.paises)) {
                setPais(null);
                void olvidarPais(p.idioma);
              }
            })
            .catch(() => undefined);
      }
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const cambiar = useCallback(
    async (p: Partial<Preferencias>) => {
      const siguiente = { pais: p.pais ?? pais, idioma: p.idioma ?? idioma };
      if (p.idioma) setIdioma(p.idioma);
      if (p.pais) setPais(p.pais);
      if (siguiente.pais) {
        await guardarPreferencias({
          pais: siguiente.pais,
          idioma: siguiente.idioma,
        });
      }
    },
    [pais, idioma],
  );

  return (
    <Contexto.Provider value={{ cargando, pais, idioma, cambiar }}>
      {children}
    </Contexto.Provider>
  );
}

export function usePreferencias(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error("usePreferencias fuera del proveedor");
  return v;
}
