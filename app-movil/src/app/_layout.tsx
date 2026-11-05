import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { ProveedorDeCarrito } from "@/contexto/carrito";
import {
  ProveedorDePreferencias,
  usePreferencias,
} from "@/contexto/preferencias";
import { COLORES } from "@/lib/colores";
import { texto } from "@/lib/textos";

SplashScreen.preventAutoHideAsync();

/** La pantalla de arranque se queda hasta saber el país guardado. */
function Navegacion() {
  const { cargando, pais, idioma } = usePreferencias();

  useEffect(() => {
    if (!cargando) void SplashScreen.hideAsync();
  }, [cargando]);

  if (cargando) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.azul },
        headerTintColor: "#FFFFFF",
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: "#F3F4F6" },
      }}
    >
      <Stack.Protected guard={pais !== null}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="producto/[slug]" options={{ title: "" }} />
        <Stack.Screen
          name="entrar"
          options={{ presentation: "modal", title: texto(idioma, "entrar") }}
        />
        <Stack.Screen
          name="crear-cuenta"
          options={{
            presentation: "modal",
            title: texto(idioma, "crearCuenta"),
          }}
        />
        <Stack.Screen
          name="crear-tienda"
          options={{
            presentation: "modal",
            title: texto(idioma, "crearTienda"),
          }}
        />
        <Stack.Screen
          name="mi-tienda"
          options={{ title: texto(idioma, "miTienda") }}
        />
        <Stack.Screen
          name="pagar"
          options={{ title: texto(idioma, "pagar") }}
        />
        <Stack.Screen
          name="mis-pedidos"
          options={{ title: texto(idioma, "misPedidos") }}
        />
        <Stack.Screen
          name="nuevo-producto"
          options={{
            presentation: "modal",
            title: texto(idioma, "nuevoProducto"),
          }}
        />
        <Stack.Screen
          name="mis-ventas"
          options={{ title: texto(idioma, "misVentas") }}
        />
        <Stack.Screen
          name="venta/[numero]"
          options={{ title: texto(idioma, "venta") }}
        />
        <Stack.Screen
          name="editar-producto/[id]"
          options={{
            presentation: "modal",
            title: texto(idioma, "editarProducto"),
          }}
        />
        <Stack.Screen
          name="borrar-cuenta"
          options={{
            presentation: "modal",
            title: texto(idioma, "borrarCuenta"),
          }}
        />
        <Stack.Screen
          name="cambiar-pais"
          options={{
            headerShown: false,
            presentation: "modal",
            title: texto(idioma, "cambiarPais"),
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={pais === null}>
        <Stack.Screen
          name="bienvenida"
          options={{ headerShown: false, title: texto(idioma, "bienvenida") }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function Raiz() {
  return (
    <ProveedorDePreferencias>
      <ProveedorDeCarrito>
        <StatusBar style="light" />
        <Navegacion />
      </ProveedorDeCarrito>
    </ProveedorDePreferencias>
  );
}
