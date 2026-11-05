import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { usePreferencias } from "@/contexto/preferencias";
import { COLORES } from "@/lib/colores";
import type { Idioma } from "@/lib/dinero";
import { texto } from "@/lib/textos";

/**
 * EL SELECTOR DE IDIOMA ESTILO AMAZON (regla global de Richard). El botón
 * dice «🇺🇸 EN ▾» o «🇪🇸 ES ▾»; al tocarlo sale una ventanita blanca con
 * «Change language» y dos opciones con círculo, separadas por una línea gris.
 * En la app va en una capa flotante (Modal) para que nada la tape. Español
 * con la bandera de España; inglés con la de Estados Unidos.
 */
const OPCIONES: Array<{ idioma: Idioma; bandera: string; nombre: string }> = [
  { idioma: "en", bandera: "🇺🇸", nombre: "English - EN" },
  { idioma: "es", bandera: "🇪🇸", nombre: "español - ES" },
];

export function SelectorIdioma({ claro = true }: { claro?: boolean }) {
  const { idioma, cambiar } = usePreferencias();
  const [abierto, setAbierto] = useState(false);
  const actual = OPCIONES.find((o) => o.idioma === idioma) ?? OPCIONES[0];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={texto(idioma, "cambiarIdioma")}
        onPress={() => setAbierto(true)}
        style={({ pressed }) => [estilos.boton, pressed && estilos.botonActivo]}
      >
        <Text
          style={[
            estilos.botonTexto,
            { color: claro ? "#FFFFFF" : COLORES.texto },
          ]}
        >
          {actual.bandera} {actual.idioma.toUpperCase()} ▾
        </Text>
      </Pressable>
      <Modal
        transparent
        visible={abierto}
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={estilos.fondo} onPress={() => setAbierto(false)}>
          <View style={estilos.ventana}>
            <View style={estilos.piquito} />
            <Text style={estilos.titulo}>{texto(idioma, "cambiarIdioma")}</Text>
            {OPCIONES.map((o, i) => (
              <Pressable
                key={o.idioma}
                accessibilityRole="radio"
                accessibilityState={{ checked: o.idioma === idioma }}
                onPress={() => {
                  setAbierto(false);
                  void cambiar({ idioma: o.idioma });
                }}
                style={[estilos.opcion, i > 0 && estilos.separada]}
              >
                <View
                  style={[
                    estilos.radio,
                    o.idioma === idioma && estilos.radioLleno,
                  ]}
                />
                <Text style={estilos.opcionTexto}>
                  {o.bandera} {o.nombre}
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
  boton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  botonActivo: { borderColor: "#FFFFFF" },
  botonTexto: { fontWeight: "700", fontSize: 15 },
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 220,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  piquito: {
    position: "absolute",
    top: -7,
    right: 22,
    width: 14,
    height: 14,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: COLORES.grisClaro,
    transform: [{ rotate: "45deg" }],
  },
  titulo: {
    fontWeight: "700",
    fontSize: 15,
    color: COLORES.texto,
    marginBottom: 6,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  separada: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORES.grisClaro,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORES.gris,
  },
  radioLleno: {
    borderColor: COLORES.naranja,
    backgroundColor: COLORES.naranja,
  },
  opcionTexto: { fontSize: 15, color: COLORES.texto },
});
