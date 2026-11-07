import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORES } from "@/lib/colores";

/**
 * EL MENÚ DE TRES PUNTOS (regla de la casa: lo que borra nunca va a la vista,
 * va aquí dentro). Ventanita blanca bajo el botón, con sus opciones; las que
 * destruyen algo, en rojo.
 */
export type OpcionDelMenu = {
  texto: string;
  destructiva?: boolean;
  alTocar: () => void;
};

export function MenuTresPuntos({
  etiqueta,
  opciones,
}: {
  etiqueta: string;
  opciones: OpcionDelMenu[];
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        hitSlop={10}
        onPress={() => setAbierto(true)}
        style={estilos.boton}
      >
        <SymbolView
          name={{ ios: "ellipsis", android: "more_horiz" }}
          size={22}
          tintColor="#FFFFFF"
        />
      </Pressable>
      <Modal
        transparent
        visible={abierto}
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={estilos.fondo} onPress={() => setAbierto(false)}>
          <View style={estilos.ventana}>
            {opciones.map((o, i) => (
              <Pressable
                key={o.texto}
                accessibilityRole="button"
                onPress={() => {
                  setAbierto(false);
                  /* En iPhone, abrir una alerta u otra ventana mientras esta
                     todavía se está cerrando la deja perdida (se vio el 6 nov
                     2026 con «Denunciar»): se espera a que termine de cerrar. */
                  setTimeout(o.alTocar, 450);
                }}
                style={[estilos.opcion, i > 0 && estilos.separada]}
              >
                <Text
                  style={[
                    estilos.opcionTexto,
                    o.destructiva && { color: COLORES.rojo },
                  ]}
                >
                  {o.texto}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  boton: { padding: 6 },
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 12,
  },
  ventana: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    minWidth: 220,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  opcion: { paddingVertical: 14, paddingHorizontal: 16 },
  separada: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORES.grisClaro,
  },
  opcionTexto: { fontSize: 16, color: COLORES.texto },
});
