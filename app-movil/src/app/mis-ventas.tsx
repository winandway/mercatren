import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePreferencias } from "@/contexto/preferencias";
import { pedirJson } from "@/lib/api";
import { cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import { ESTADOS_BUENOS, nombreDelEstado } from "@/lib/estados-de-pedido";
import { texto } from "@/lib/textos";
import { urlMisVentas, type Venta } from "@/lib/ventas";

/**
 * MIS VENTAS: los pedidos que le compraron a mi tienda, los más nuevos
 * primero, con lo que vendí en cada uno (solo mis productos) y su estado. Es
 * la misma lista de «Órdenes» del panel web. Tocar una abre el detalle con la
 * dirección y los botones de «Enviado» y «Entregado».
 */
export default function MisVentas() {
  const { pais, idioma } = usePreferencias();
  const [vuelta, setVuelta] = useState(0);
  const [lista, setLista] = useState<Venta[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!pais) return;
      let vivo = true;
      pedirJson<{ ventas: Venta[] }>(urlMisVentas(pais, idioma), fetch, {
        headers: cabeceraDeSesion(),
      })
        .then((r) => vivo && setLista(r.ventas))
        .catch(() => vivo && setLista([]));
      return () => {
        vivo = false;
      };
    }, [pais, idioma, vuelta]),
  );

  const fecha = (ms: number) =>
    new Date(ms).toLocaleDateString(idioma === "es" ? "es-US" : "en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <FlatList
      data={lista ?? []}
      keyExtractor={(v) => v.numero}
      contentContainerStyle={estilos.lista}
      refreshing={false}
      onRefresh={() => setVuelta((n) => n + 1)}
      ListEmptyComponent={
        lista === null ? (
          <ActivityIndicator color={COLORES.naranja} style={{ padding: 32 }} />
        ) : (
          <Text style={estilos.vacio}>{texto(idioma, "sinVentas")}</Text>
        )
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/venta/[numero]",
              params: { numero: item.numero },
            })
          }
          style={estilos.fila}
        >
          <View style={{ flex: 1 }}>
            <Text style={estilos.numero}>{item.numero}</Text>
            <Text style={estilos.detalle} numberOfLines={1}>
              {item.cliente}
            </Text>
            <Text style={estilos.detalle}>
              {fecha(item.creadoEn)} · {item.articulos}{" "}
              {texto(idioma, item.articulos === 1 ? "articulo" : "articulos")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={estilos.total}>
              {precioTexto(item.monto.centavos, item.monto.moneda, idioma)}
            </Text>
            <Text
              style={[
                estilos.estado,
                ESTADOS_BUENOS.has(item.estado) && { color: COLORES.verde },
              ]}
            >
              {nombreDelEstado(item.estado, idioma)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: 16, gap: 10, backgroundColor: "#F3F4F6", flexGrow: 1 },
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
    padding: 14,
  },
  numero: { fontSize: 16, fontWeight: "700", color: COLORES.texto },
  detalle: { fontSize: 13, color: COLORES.gris, marginTop: 2 },
  total: { fontSize: 16, fontWeight: "800", color: COLORES.azul },
  estado: {
    fontSize: 13,
    color: COLORES.gris,
    marginTop: 2,
    fontWeight: "600",
  },
});
