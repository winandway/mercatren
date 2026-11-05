import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RejillaCatalogo } from "@/components/rejilla-catalogo";
import { usePreferencias } from "@/contexto/preferencias";
import { COLORES } from "@/lib/colores";
import { texto } from "@/lib/textos";

/**
 * Buscar: la búsqueda sale medio segundo después de dejar de escribir, y nunca
 * con menos de dos letras. Así cada palabra no es una consulta a la base.
 */
export default function Buscar() {
  const { pais, idioma } = usePreferencias();
  const [escrito, setEscrito] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const limpio = escrito.trim();
    const reloj = setTimeout(() => setQ(limpio.length >= 2 ? limpio : ""), 500);
    return () => clearTimeout(reloj);
  }, [escrito]);

  return (
    <View style={estilos.pantalla}>
      <SafeAreaView edges={["top"]} style={estilos.cabecera}>
        <TextInput
          value={escrito}
          onChangeText={setEscrito}
          placeholder={texto(idioma, "buscarPlaceholder")}
          placeholderTextColor={COLORES.gris}
          style={estilos.caja}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel={texto(idioma, "buscar")}
        />
      </SafeAreaView>
      {q ? (
        <RejillaCatalogo
          pais={pais}
          idioma={idioma}
          q={q}
          vacio="sinResultados"
        />
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#F3F4F6" },
  cabecera: {
    backgroundColor: COLORES.azul,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  caja: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: COLORES.texto,
    marginTop: 4,
  },
});
