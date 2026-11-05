import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SelectorIdioma } from "@/components/selector-idioma";
import { usePreferencias } from "@/contexto/preferencias";
import { API_BASE, pedirJson, urlPaises, type Pais } from "@/lib/api";
import { bandera, COLORES } from "@/lib/colores";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/**
 * La cuenta. Por ahora: el país y el idioma, y las páginas de ayuda y legales
 * (que las tiendas de apps exigen a mano). Entrar y crear cuenta llegan con la
 * parte 3 del plan; aquí no se pone un botón que todavía no lleve a nada.
 */
const PAGINAS: Array<{ clave: ClaveDeTexto; ruta: string }> = [
  { clave: "ayuda", ruta: "ayuda" },
  { clave: "privacidad", ruta: "privacidad" },
  { clave: "terminos", ruta: "terminos" },
];

export default function Cuenta() {
  const { pais, idioma } = usePreferencias();
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    pedirJson<{ paises: Pais[] }>(urlPaises(idioma))
      .then(
        (r) =>
          vivo &&
          setNombre(r.paises.find((p) => p.codigo === pais)?.nombre ?? null),
      )
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [pais, idioma]);

  return (
    <View style={estilos.pantalla}>
      <SafeAreaView edges={["top"]} style={estilos.cabecera}>
        <Text style={estilos.titulo}>{texto(idioma, "cuenta")}</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        <View style={estilos.grupo}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/cambiar-pais")}
            style={estilos.fila}
          >
            <Text style={estilos.etiqueta}>{texto(idioma, "pais")}</Text>
            <Text style={estilos.valor}>
              {pais ? `${bandera(pais)} ${nombre ?? pais}` : ""}
            </Text>
            <Text style={estilos.flecha}>›</Text>
          </Pressable>
          <View style={[estilos.fila, estilos.separada]}>
            <Text style={estilos.etiqueta}>{texto(idioma, "idioma")}</Text>
            <View style={{ flex: 1 }} />
            <SelectorIdioma claro={false} />
          </View>
        </View>
        <View style={estilos.grupo}>
          {PAGINAS.map((p, i) => (
            <Pressable
              key={p.ruta}
              accessibilityRole="link"
              onPress={() =>
                void WebBrowser.openBrowserAsync(
                  `${API_BASE}/${idioma}/${p.ruta}`,
                )
              }
              style={[estilos.fila, i > 0 && estilos.separada]}
            >
              <Text style={estilos.etiqueta}>{texto(idioma, p.clave)}</Text>
              <View style={{ flex: 1 }} />
              <Text style={estilos.flecha}>›</Text>
            </Pressable>
          ))}
        </View>
        <Text style={estilos.pie}>
          © {new Date().getFullYear()} Mercatren LLC
        </Text>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#F3F4F6" },
  cabecera: {
    backgroundColor: COLORES.azul,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titulo: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 4 },
  cuerpo: { padding: 16, gap: 16 },
  grupo: { backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  separada: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORES.grisClaro,
  },
  etiqueta: { fontSize: 16, color: COLORES.texto },
  valor: { flex: 1, textAlign: "right", fontSize: 15, color: COLORES.gris },
  flecha: { fontSize: 22, color: COLORES.gris },
  pie: { textAlign: "center", color: COLORES.gris, fontSize: 12, marginTop: 8 },
});
