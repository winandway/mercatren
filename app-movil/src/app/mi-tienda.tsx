import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BotonPrincipal } from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { useMiTienda } from "@/hooks/use-mi-tienda";
import { absoluta, pedirJson } from "@/lib/api";
import { cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import { urlMisProductos, type MiProducto } from "@/lib/productos";
import { texto } from "@/lib/textos";

/**
 * MI TIENDA: el nombre, «Agregar un producto» y lo que ya está subido, con su
 * precio publicado y su estado. Se vuelve a pedir al volver a la pantalla (por
 * ejemplo, después de publicar uno).
 */
export default function MiTienda() {
  const { pais, idioma } = usePreferencias();
  const { tienda } = useMiTienda(pais, idioma);
  const [lista, setLista] = useState<MiProducto[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!pais) return;
      let vivo = true;
      pedirJson<{ productos: MiProducto[] }>(
        urlMisProductos(pais, idioma),
        fetch,
        {
          headers: cabeceraDeSesion(),
        },
      )
        .then((r) => vivo && setLista(r.productos))
        .catch(() => vivo && setLista([]));
      return () => {
        vivo = false;
      };
    }, [pais, idioma]),
  );

  return (
    <FlatList
      data={lista ?? []}
      keyExtractor={(p) => p.id}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        <View style={estilos.cabecera}>
          {tienda ? <Text style={estilos.nombre}>{tienda.nombre}</Text> : null}
          <BotonPrincipal
            texto={texto(idioma, "agregarProducto")}
            onPress={() => router.push("/nuevo-producto")}
          />
        </View>
      }
      ListEmptyComponent={
        lista === null ? (
          <ActivityIndicator color={COLORES.naranja} style={{ padding: 32 }} />
        ) : (
          <Text style={estilos.vacio}>{texto(idioma, "sinMisProductos")}</Text>
        )
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
          <View style={{ flex: 1 }}>
            <Text style={estilos.titulo} numberOfLines={2}>
              {item.titulo}
            </Text>
            <Text style={estilos.precio}>
              {precioTexto(item.precio.centavos, item.precio.moneda, idioma)}
            </Text>
            <Text
              style={[
                estilos.estado,
                item.estado === "publicado" ? estilos.publicado : null,
              ]}
            >
              {texto(
                idioma,
                item.estado === "publicado" ? "verEnLaTienda" : "borrador",
              )}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 10, backgroundColor: "#F3F4F6", flexGrow: 1 },
  cabecera: { gap: 4, marginBottom: 8 },
  nombre: { fontSize: 22, fontWeight: "800", color: COLORES.azul },
  vacio: {
    textAlign: "center",
    color: COLORES.gris,
    padding: 24,
    fontSize: 15,
  },
  fila: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
  },
  marco: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  foto: { width: "100%", height: "100%" },
  titulo: { fontSize: 15, color: COLORES.texto, fontWeight: "600" },
  precio: {
    fontSize: 15,
    color: COLORES.azul,
    fontWeight: "700",
    marginTop: 2,
  },
  estado: { fontSize: 12, color: COLORES.gris, marginTop: 2 },
  publicado: { color: COLORES.verde, fontWeight: "700" },
});
