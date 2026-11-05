import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TarjetaProducto } from "@/components/tarjeta-producto";
import { useCatalogo } from "@/hooks/use-catalogo";
import { COLORES } from "@/lib/colores";
import type { Idioma } from "@/lib/dinero";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/** La rejilla de dos columnas del catálogo, con sus tres estados a la vista. */
export function RejillaCatalogo({
  pais,
  idioma,
  q = "",
  vacio,
  cabecera,
  alVaciar,
}: {
  pais: string | null;
  idioma: Idioma;
  q?: string;
  vacio: ClaveDeTexto;
  /** Lo que va encima de los productos (solo cuando hay productos). */
  cabecera?: React.ReactElement;
  /** Lo que se enseña cuando no hay productos (en vez del texto `vacio`). */
  alVaciar?: React.ReactElement;
}) {
  const { productos, estado, hayMas, masAbajo, reiniciar } = useCatalogo(
    pais,
    idioma,
    q,
  );

  if (estado === "sin_conexion") {
    return (
      <View style={estilos.centro}>
        {cabecera}
        <Text style={estilos.aviso}>{texto(idioma, "sinConexion")}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={reiniciar}
          style={estilos.boton}
        >
          <Text style={estilos.botonTexto}>{texto(idioma, "reintentar")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={productos}
      keyExtractor={(p) => p.id}
      numColumns={2}
      contentContainerStyle={estilos.lista}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      /* La cabecera va solo con productos; sin ellos manda `alVaciar`. */
      ListHeaderComponent={productos.length ? cabecera : undefined}
      renderItem={({ item }) => <TarjetaProducto p={item} idioma={idioma} />}
      onEndReached={masAbajo}
      onEndReachedThreshold={0.6}
      /* Jalar hacia abajo vuelve a pedir la primera página (como en toda
         tienda): lo nuevo aparece sin cerrar la app. */
      refreshing={false}
      onRefresh={reiniciar}
      ListEmptyComponent={
        estado === "cargando" ? (
          <ActivityIndicator style={estilos.cargando} color={COLORES.naranja} />
        ) : (
          (alVaciar ?? (
            <Text style={estilos.aviso}>{texto(idioma, vacio)}</Text>
          ))
        )
      }
      ListFooterComponent={
        hayMas ? (
          <ActivityIndicator style={estilos.cargando} color={COLORES.naranja} />
        ) : undefined
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 6, paddingBottom: 32 },
  centro: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  aviso: {
    fontSize: 15,
    color: COLORES.gris,
    textAlign: "center",
    padding: 24,
  },
  cargando: { padding: 32 },
  boton: {
    backgroundColor: COLORES.naranja,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
