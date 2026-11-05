import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

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
      <StatusBar style="light" />
      <Navegacion />
    </ProveedorDePreferencias>
  );
}
