import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORES } from "@/lib/colores";

/**
 * ELEGIR DE UNA LISTA (estado, provincia, región): se toca la casilla y se
 * abre la lista entera en una capa; se elige y se cierra. Nada se escribe a
 * mano: «Florida» y «FL» no son lo mismo para quien despacha.
 */
export function SelectorLista({
  valor,
  opciones,
  alElegir,
  titulo,
  marcador,
  cerrar,
}: {
  valor: string;
  opciones: { codigo: string; nombre: string }[];
  alElegir: (codigo: string) => void;
  titulo: string;
  marcador: string;
  cerrar: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegido = opciones.find(
    (o) => o.codigo.toUpperCase() === valor.trim().toUpperCase(),
  );
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titulo}
        onPress={() => setAbierto(true)}
        style={estilos.casilla}
      >
        <Text style={elegido ? estilos.valor : estilos.marcador}>
          {elegido?.nombre ?? marcador}
        </Text>
        <Text style={estilos.flecha}>▾</Text>
      </Pressable>
      <Modal
        visible={abierto}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAbierto(false)}
      >
        <SafeAreaView style={estilos.capa}>
          <View style={estilos.cabecera}>
            <Text style={estilos.titulo}>{titulo}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAbierto(false)}
              hitSlop={10}
            >
              <Text style={estilos.cerrar}>{cerrar}</Text>
            </Pressable>
          </View>
          <FlatList
            data={opciones}
            keyExtractor={(o) => o.codigo}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{
                  selected: item.codigo === elegido?.codigo,
                }}
                onPress={() => {
                  alElegir(item.codigo);
                  setAbierto(false);
                }}
                style={estilos.fila}
              >
                <Text
                  style={[
                    estilos.opcion,
                    item.codigo === elegido?.codigo && estilos.opcionElegida,
                  ]}
                >
                  {item.nombre}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  casilla: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
  },
  valor: { fontSize: 16, color: COLORES.texto },
  marcador: { fontSize: 16, color: COLORES.gris },
  flecha: { fontSize: 14, color: COLORES.gris },
  capa: { flex: 1, backgroundColor: "#FFFFFF" },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORES.grisClaro,
  },
  titulo: { fontSize: 18, fontWeight: "800", color: COLORES.azul },
  cerrar: { fontSize: 16, color: COLORES.naranja, fontWeight: "700" },
  fila: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORES.grisClaro,
  },
  opcion: { fontSize: 16, color: COLORES.texto },
  opcionElegida: { color: COLORES.naranja, fontWeight: "700" },
});
