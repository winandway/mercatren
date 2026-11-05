import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PortadaVender } from "@/components/portada-vender";
import { RejillaCatalogo } from "@/components/rejilla-catalogo";
import { SelectorIdioma } from "@/components/selector-idioma";
import { usePreferencias } from "@/contexto/preferencias";
import { COLORES } from "@/lib/colores";

/** Inicio: la cabecera azul de la marca y el catálogo del país (o la portada «Abre tu tienda»). */
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
      {/* Un país sin productos no es una pantalla en blanco: invita a vender
          (pedido de Gerencia). Con productos, la invitación va arriba, corta. */}
      <RejillaCatalogo
        pais={pais}
        idioma={idioma}
        vacio="sinProductos"
        alVaciar={<PortadaVender pais={pais} idioma={idioma} />}
      />
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
