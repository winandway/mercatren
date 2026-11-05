import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RejillaCatalogo } from "@/components/rejilla-catalogo";
import { SelectorIdioma } from "@/components/selector-idioma";
import { usePreferencias } from "@/contexto/preferencias";
import { COLORES } from "@/lib/colores";

/** Inicio: la cabecera azul de la marca y el catálogo del país. */
export default function Inicio() {
  const { pais, idioma } = usePreferencias();
  return (
    <View style={estilos.pantalla}>
      <SafeAreaView edges={["top"]} style={estilos.cabecera}>
        <View style={estilos.fila}>
          <Image
            source={require("@/assets/images/logo-horizontal.png")}
            style={estilos.logo}
            contentFit="contain"
            accessibilityLabel="Mercatren"
          />
          <SelectorIdioma />
        </View>
      </SafeAreaView>
      <RejillaCatalogo pais={pais} idioma={idioma} vacio="sinProductos" />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#F3F4F6" },
  cabecera: { backgroundColor: COLORES.azul },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
    paddingTop: 4,
  },
  logo: { width: 150, height: 34 },
});
