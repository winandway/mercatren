import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { usePreferencias } from "@/contexto/preferencias";
import {
  leerCarrito,
  llaveDelCarrito,
  ponerCantidad,
  sumar,
  type LineaCarrito,
} from "@/lib/carrito";

/** El carrito de la app, guardado en el teléfono por país. */
type Valor = {
  lineas: LineaCarrito[];
  agregar: (l: LineaCarrito) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
};

const Contexto = createContext<Valor | null>(null);

export function ProveedorDeCarrito({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pais } = usePreferencias();
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);

  useEffect(() => {
    if (!pais) return setLineas([]);
    let vivo = true;
    AsyncStorage.getItem(llaveDelCarrito(pais))
      .then((crudo) => vivo && setLineas(leerCarrito(crudo)))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [pais]);

  const guardar = useCallback(
    (siguiente: LineaCarrito[]) => {
      setLineas(siguiente);
      if (pais)
        void AsyncStorage.setItem(
          llaveDelCarrito(pais),
          JSON.stringify(siguiente),
        ).catch(() => undefined);
    },
    [pais],
  );

  const valor: Valor = {
    lineas,
    agregar: (l) => guardar(sumar(lineas, l)),
    cambiarCantidad: (id, n) => guardar(ponerCantidad(lineas, id, n)),
    vaciar: () => guardar([]),
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error("useCarrito fuera del proveedor");
  return v;
}
