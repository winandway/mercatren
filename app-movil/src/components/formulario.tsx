import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { COLORES } from "@/lib/colores";

/** Las piezas comunes de los formularios de la app, con la marca. */
export function Etiqueta({ children }: { children: string }) {
  return <Text style={estilos.etiqueta}>{children}</Text>;
}

export function Campo(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={COLORES.gris}
      {...props}
      style={[estilos.campo, props.style]}
    />
  );
}

export function BotonPrincipal({
  texto,
  onPress,
  ocupado,
}: {
  texto: string;
  onPress: () => void;
  ocupado?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: !!ocupado, disabled: !!ocupado }}
      disabled={ocupado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        (pressed || ocupado) && { opacity: 0.6 },
      ]}
    >
      <Text style={estilos.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

/**
 * Un aviso en línea. Lo que salió bien va en VERDE («bien»), nunca en el
 * color de la marca ni en azul (regla de la casa); el rojo es solo para
 * problemas y el azul para lo que informa o espera.
 */
export function Aviso({
  texto,
  tono,
}: {
  texto: string;
  tono: "error" | "info" | "bien";
}) {
  return (
    <View
      style={[
        estilos.aviso,
        tono === "error"
          ? estilos.avisoError
          : tono === "bien"
            ? estilos.avisoBien
            : estilos.avisoInfo,
      ]}
    >
      <Text
        style={[
          estilos.avisoTexto,
          {
            color:
              tono === "error"
                ? COLORES.rojo
                : tono === "bien"
                  ? COLORES.verde
                  : COLORES.azul,
          },
        ]}
      >
        {texto}
      </Text>
    </View>
  );
}

export function Enlace({
  texto,
  onPress,
}: {
  texto: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text style={estilos.enlace}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORES.texto,
    marginTop: 10,
    marginBottom: 6,
  },
  campo: {
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORES.texto,
  },
  boton: {
    backgroundColor: COLORES.naranja,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 18,
  },
  botonTexto: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  aviso: { borderRadius: 10, padding: 12, marginTop: 12 },
  avisoError: { backgroundColor: "#FEF2F2" },
  avisoInfo: { backgroundColor: "#EFF6FF" },
  avisoBien: { backgroundColor: "#ECFDF5" },
  avisoTexto: { fontSize: 14, lineHeight: 20 },
  enlace: {
    color: COLORES.azul,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 10,
  },
});
