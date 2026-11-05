import { Image } from "expo-image";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BotonPrincipal } from "@/components/formulario";
import { useCarrito } from "@/contexto/carrito";
import { usePreferencias } from "@/contexto/preferencias";
import { absoluta } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { totalCentavos } from "@/lib/carrito";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import { texto } from "@/lib/textos";

/** El carrito: lo agregado, la cantidad de cada cosa y el total para enseñar. */
export default function Carrito() {
  const { idioma } = usePreferencias();
  const { lineas, cambiarCantidad } = useCarrito();
  const { data: sesion } = authClient.useSession();
  const moneda = lineas[0]?.precio.moneda ?? "USD";

  return (
    <View style={estilos.pantalla}>
      <SafeAreaView edges={["top"]} style={estilos.cabecera}>
        <Text style={estilos.titulo}>{texto(idioma, "carrito")}</Text>
      </SafeAreaView>
      <FlatList
        data={lineas}
        keyExtractor={(l) => l.productoId}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Text style={estilos.vacioTexto}>
              {texto(idioma, "carritoVacio")}
            </Text>
            <BotonPrincipal
              texto={texto(idioma, "seguirComprando")}
              onPress={() => router.navigate("/")}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <View style={estilos.marco}>
              {item.foto ? (
                <Image
                  source={{ uri: absoluta(item.foto) ?? undefined }}
                  style={estilos.foto}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={estilos.nombre} numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text style={estilos.precio}>
                {precioTexto(item.precio.centavos, item.precio.moneda, idioma)}
              </Text>
              <View style={estilos.cantidad}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="−"
                  onPress={() =>
                    cambiarCantidad(item.productoId, item.cantidad - 1)
                  }
                  style={estilos.boton}
                >
                  <Text style={estilos.botonTexto}>−</Text>
                </Pressable>
                <Text style={estilos.numero}>{item.cantidad}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="+"
                  onPress={() =>
                    cambiarCantidad(item.productoId, item.cantidad + 1)
                  }
                  style={estilos.boton}
                >
                  <Text style={estilos.botonTexto}>+</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => cambiarCantidad(item.productoId, 0)}
                >
                  <Text style={estilos.quitar}>{texto(idioma, "quitar")}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          lineas.length ? (
            <View style={estilos.pie}>
              <View style={estilos.totalFila}>
                <Text style={estilos.totalTexto}>{texto(idioma, "total")}</Text>
                <Text style={estilos.totalTexto}>
                  {precioTexto(totalCentavos(lineas), moneda, idioma)}
                </Text>
              </View>
              <Text style={estilos.nota}>{texto(idioma, "totalNota")}</Text>
              <BotonPrincipal
                texto={texto(idioma, "irAPagar")}
                onPress={() => router.push(sesion?.user ? "/pagar" : "/entrar")}
              />
            </View>
          ) : undefined
        }
      />
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
  lista: { padding: 16, gap: 10, flexGrow: 1 },
  vacio: { padding: 24, gap: 8, alignItems: "stretch" },
  vacioTexto: { textAlign: "center", color: COLORES.gris, fontSize: 16 },
  fila: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
  },
  marco: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  foto: { width: "100%", height: "100%" },
  nombre: { fontSize: 15, color: COLORES.texto, fontWeight: "600" },
  precio: { fontSize: 15, color: COLORES.azul, fontWeight: "700" },
  cantidad: { flexDirection: "row", alignItems: "center", gap: 12 },
  boton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { fontSize: 18, color: COLORES.texto, fontWeight: "700" },
  numero: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  quitar: { color: COLORES.gris, fontSize: 14, marginLeft: 8 },
  pie: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, gap: 6 },
  totalFila: { flexDirection: "row", justifyContent: "space-between" },
  totalTexto: { fontSize: 18, fontWeight: "800", color: COLORES.texto },
  nota: { fontSize: 12, color: COLORES.gris },
});
