import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";

import { FormularioProducto } from "@/components/formulario-producto";
import { usePreferencias } from "@/contexto/preferencias";
import { useMiTienda } from "@/hooks/use-mi-tienda";
import { COLORES } from "@/lib/colores";

/**
 * SUBIR UN PRODUCTO CON LA CÁMARA. El formulario es la misma pieza que edita
 * (`components/formulario-producto.tsx`).
 *
 * Solo con tienda (6 nov 2026, política UGC de Google Play): quien llega por
 * un enlace sin sesión va a entrar, y quien no tiene tienda va a crearla (el
 * alta pide aceptar los términos). El servidor lo vuelve a exigir.
 */
export default function NuevoProducto() {
  const { pais, idioma } = usePreferencias();
  const { conSesion, cargado, tienda } = useMiTienda(pais, idioma);

  if (!conSesion) return <Redirect href="/entrar" />;
  if (!cargado) {
    return (
      <ActivityIndicator style={{ marginTop: 40 }} color={COLORES.naranja} />
    );
  }
  if (!tienda) return <Redirect href="/crear-tienda" />;
  return <FormularioProducto />;
}
