import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SelectorIdioma } from "@/components/selector-idioma";
import { usePreferencias } from "@/contexto/preferencias";
import { pedirJson, urlPaises, type Pais } from "@/lib/api";
import { bandera, COLORES } from "@/lib/colores";
import { texto } from "@/lib/textos";

/**
 * ELEGIR EL PAÍS: de qué país compra la persona. El país decide la moneda, los
 * precios y la entrega (plan PLAN-UNA-SOLA-MERCATREN: un .com, el país lo
 * elige la persona). Los países que todavía no venden salen con «Muy pronto»
 * y no se pueden elegir. Lo usan la bienvenida (la primera vez) y «Cambiar de
 * país» desde la cuenta.
 */
export function ElegirPais({ alElegir }: { alElegir?: () => void }) {
  const { idioma, pais: actual, cambiar } = usePreferencias();
  const [paises, setPaises] = useState<Pais[] | null>(null);
  const [fallo, setFallo] = useState(false);
  const [elegido, setElegido] = useState<string | null>(actual);
  const [intento, setIntento] = useState(0);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    let vivo = true;
    setFallo(false);
    pedirJson<{ paises: Pais[] }>(urlPaises(idioma))
      .then((r) => vivo && setPaises(r.paises))
      .catch(() => vivo && setFallo(true));
    return () => {
      vivo = false;
    };
  }, [idioma, intento]);

  const continuar = async () => {
    if (!elegido) return;
    await cambiar({ pais: elegido });
    alElegir?.();
  };

  return (
    <SafeAreaView style={estilos.pantalla} edges={["top"]}>
      <View style={estilos.cabecera}>
        <Image
          source={require("@/assets/images/logo-horizontal.png")}
          style={estilos.logo}
          contentFit="contain"
          accessibilityLabel="Mercatren"
        />
        <SelectorIdioma />
      </View>
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        <Text style={estilos.titulo}>{texto(idioma, "eligePais")}</Text>
        <Text style={estilos.ayuda}>{texto(idioma, "eligePaisAyuda")}</Text>
        {fallo ? (
          <View style={estilos.fallo}>
            <Text style={estilos.ayuda}>{texto(idioma, "sinConexion")}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIntento((n) => n + 1)}
              style={estilos.reintentar}
            >
              <Text style={estilos.reintentarTexto}>
                {texto(idioma, "reintentar")}
              </Text>
            </Pressable>
          </View>
        ) : !paises ? (
          <ActivityIndicator color={COLORES.naranja} style={{ padding: 32 }} />
        ) : (
          paises.map((p) => {
            const marcado = elegido === p.codigo;
            return (
              <Pressable
                key={p.codigo}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: marcado,
                  disabled: !p.encendido,
                }}
                disabled={!p.encendido}
                onPress={() => setElegido(p.codigo)}
                style={[
                  estilos.pais,
                  marcado && estilos.paisMarcado,
                  !p.encendido && estilos.paisApagado,
                ]}
              >
                <Text style={estilos.bandera}>{bandera(p.codigo)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.paisNombre}>{p.nombre}</Text>
                  <Text style={estilos.paisMoneda}>
                    {p.encendido ? p.moneda : texto(idioma, "pronto")}
                  </Text>
                </View>
                <View style={[estilos.radio, marcado && estilos.radioLleno]} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
      <View style={[estilos.pie, { paddingBottom: 16 + bottom }]}>
        <Pressable
          accessibilityRole="button"
          disabled={!elegido}
          onPress={continuar}
          style={[estilos.continuar, !elegido && estilos.continuarApagado]}
        >
          <Text style={estilos.continuarTexto}>
            {texto(idioma, "continuar")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.azul },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logo: { width: 170, height: 38 },
  cuerpo: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
    flexGrow: 1,
  },
  titulo: { fontSize: 24, fontWeight: "800", color: COLORES.azul },
  ayuda: { fontSize: 15, color: COLORES.gris, marginBottom: 8 },
  fallo: { alignItems: "center", gap: 12, padding: 24 },
  reintentar: {
    backgroundColor: COLORES.naranja,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reintentarTexto: { color: "#FFFFFF", fontWeight: "700" },
  pais: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
  },
  paisMarcado: {
    borderColor: COLORES.naranja,
    borderWidth: 2,
    backgroundColor: "#FFF4ED",
  },
  paisApagado: { opacity: 0.5 },
  bandera: { fontSize: 30 },
  paisNombre: { fontSize: 17, fontWeight: "600", color: COLORES.texto },
  paisMoneda: { fontSize: 13, color: COLORES.gris, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORES.gris,
  },
  radioLleno: { borderColor: COLORES.naranja, borderWidth: 7 },
  pie: { backgroundColor: "#FFFFFF", padding: 16 },
  continuar: {
    backgroundColor: COLORES.naranja,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  continuarApagado: { opacity: 0.4 },
  continuarTexto: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
