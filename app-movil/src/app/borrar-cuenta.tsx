import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Aviso, Campo, Enlace } from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { authClient, cabeceraDeSesion, salir } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import {
  palabraDeConfirmacion,
  urlBorrarCuenta,
  confirmoElBorrado,
} from "@/lib/productos";
import { texto } from "@/lib/textos";

/**
 * BORRAR LA CUENTA DENTRO DE LA APP (Apple lo exige). Se llega desde el menú
 * de tres puntos de la cuenta, nunca con un botón a la vista, y se confirma
 * escribiendo la palabra. Usa la MISMA acción de la web; si la cuenta tiene
 * tienda, pedidos en camino o paquetes en la bodega, el servidor explica cómo
 * cerrarla con soporte.
 */
export default function BorrarCuenta() {
  const { idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const [palabra, setPalabra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [borrada, setBorrada] = useState(false);
  const listo = confirmoElBorrado(palabra);

  const borrar = async () => {
    if (!listo || ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(urlBorrarCuenta(idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({ palabra }),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
      } | null;
      if (!r.ok || !cuerpo?.ok) {
        setError(cuerpo?.mensaje ?? texto(idioma, "errorGeneral"));
        return;
      }
      /* La cuenta ya no existe: se borra también la sesión del teléfono. */
      await salir();
      setBorrada(true);
    } catch {
      setError(texto(idioma, "errorGeneral"));
    } finally {
      setOcupado(false);
    }
  };

  if (borrada) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>{texto(idioma, "cuentaBorrada")}</Text>
        <Enlace
          texto={texto(idioma, "volverInicio")}
          onPress={() => router.dismissAll()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.cuerpo}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={estilos.titulo}>{texto(idioma, "borrarCuenta")}</Text>
        {sesion?.user ? (
          <Text style={estilos.correo}>{sesion.user.email}</Text>
        ) : null}
        <Text style={estilos.texto}>{texto(idioma, "borrarCuentaTexto")}</Text>
        <Text style={estilos.etiqueta}>
          {texto(idioma, "borrarCuentaEscribe")}
        </Text>
        <Campo
          value={palabra}
          onChangeText={setPalabra}
          placeholder={palabraDeConfirmacion(idioma)}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {error ? <Aviso texto={error} tono="error" /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !listo || ocupado }}
          disabled={!listo || ocupado}
          onPress={borrar}
          style={[estilos.boton, (!listo || ocupado) && { opacity: 0.4 }]}
        >
          <Text style={estilos.botonTexto}>
            {texto(idioma, "borrarCuentaBoton")}
          </Text>
        </Pressable>
        <Enlace
          texto={texto(idioma, "cancelar")}
          onPress={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  cuerpo: { padding: 20, gap: 10, backgroundColor: "#FFFFFF", flexGrow: 1 },
  centro: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORES.texto,
    textAlign: "center",
  },
  correo: { fontSize: 15, color: COLORES.gris, textAlign: "center" },
  texto: { fontSize: 15, color: COLORES.texto, lineHeight: 21 },
  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORES.texto,
    marginTop: 8,
  },
  boton: {
    backgroundColor: COLORES.rojo,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  botonTexto: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
