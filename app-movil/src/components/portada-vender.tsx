import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { BotonPrincipal } from "@/components/formulario";
import { useMiTienda } from "@/hooks/use-mi-tienda";
import { COLORES } from "@/lib/colores";
import type { Idioma } from "@/lib/dinero";
import { texto } from "@/lib/textos";

/**
 * «ABRE TU TIENDA», LA PORTADA DEL INICIO (pedido de Gerencia, 5 nov 2026).
 * Un país sin productos no se enseña como una pantalla en blanco: se invita a
 * vender. Con `compacta` va como franja encima del catálogo cuando ya hay
 * productos. Quien ya tiene tienda ve su tienda, no la invitación.
 */
export function PortadaVender({
  pais,
  idioma,
  compacta = false,
}: {
  pais: string | null;
  idioma: Idioma;
  compacta?: boolean;
}) {
  const { conSesion, tienda } = useMiTienda(pais, idioma);
  const abrir = () =>
    router.push(conSesion ? "/crear-tienda" : "/crear-cuenta");

  if (tienda) {
    return (
      <View style={[estilos.caja, compacta && estilos.compacta]}>
        <Text style={estilos.titulo}>{texto(idioma, "tuTiendaAbierta")}</Text>
        <Text style={estilos.texto}>{tienda.nombre}</Text>
      </View>
    );
  }

  if (compacta) {
    return (
      <View style={[estilos.caja, estilos.compacta]}>
        <Text style={estilos.titulo}>{texto(idioma, "venderTitulo")}</Text>
        <BotonPrincipal texto={texto(idioma, "venderBoton")} onPress={abrir} />
      </View>
    );
  }

  return (
    <View style={estilos.caja}>
      <Text style={estilos.tituloGrande}>{texto(idioma, "venderTitulo")}</Text>
      <Text style={estilos.texto}>{texto(idioma, "venderTexto")}</Text>
      {(["venderPaso1", "venderPaso2", "venderPaso3"] as const).map(
        (paso, i) => (
          <View key={paso} style={estilos.paso}>
            <Text style={estilos.numero}>{i + 1}</Text>
            <Text style={estilos.pasoTexto}>{texto(idioma, paso)}</Text>
          </View>
        ),
      )}
      <BotonPrincipal texto={texto(idioma, "venderBoton")} onPress={abrir} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    margin: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORES.azul,
    gap: 10,
  },
  compacta: { padding: 16, gap: 4 },
  tituloGrande: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  titulo: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  texto: { color: "#D6DEE6", fontSize: 15, lineHeight: 21 },
  paso: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORES.naranja,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "800",
    overflow: "hidden",
  },
  pasoTexto: { flex: 1, color: "#FFFFFF", fontSize: 15 },
});
