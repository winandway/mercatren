import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { COLORES } from "@/lib/colores";

/**
 * EL CAMPO DE CONTRASEÑA, CON SU OJITO (regla de la casa). Arranca oculto y se
 * ve solo al tocar el ojo. Toda contraseña de la app pasa por aquí: ningún
 * `secureTextEntry` suelto (hay prueba).
 */
export function CampoClave({
  etiquetaVer,
  etiquetaOcultar,
  ...props
}: TextInputProps & { etiquetaVer: string; etiquetaOcultar: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={estilos.caja}>
      <TextInput
        {...props}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={[estilos.campo, props.style]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? etiquetaOcultar : etiquetaVer}
        onPress={() => setVisible((v) => !v)}
        hitSlop={10}
        style={estilos.ojo}
      >
        <SymbolView
          name={
            visible
              ? { ios: "eye.slash", android: "visibility_off" }
              : { ios: "eye", android: "visibility" }
          }
          size={22}
          tintColor={COLORES.gris}
        />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  campo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORES.texto,
  },
  ojo: { paddingHorizontal: 12 },
});
