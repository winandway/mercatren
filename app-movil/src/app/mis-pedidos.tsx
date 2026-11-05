import { useFocusEffect } from "expo-router";
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
import { Aviso } from "@/components/formulario";
import { pedirJson, urlMisPedidos, urlPagarPedido } from "@/lib/api";
import { cobrarConHoja } from "@/lib/cobrar";
import { cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import { ESTADOS_BUENOS, nombreDelEstado } from "@/lib/estados-de-pedido";
import { texto } from "@/lib/textos";

type Pedido = {
  numero: string;
  estado: string;
  total: { centavos: number; moneda: string };
  articulos: number;
  guia: string | null;
};

/** Mis pedidos: la MISMA lista de la web, con su número, total y estado. */
export default function MisPedidos() {
  const { pais, idioma } = usePreferencias();
  const [lista, setLista] = useState<Pedido[] | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pagando, setPagando] = useState<string | null>(null);

  /* Pagar lo que quedó por pagar: el servidor reutiliza el intento vivo. */
  const pagar = async (numero: string) => {
    if (!pais || pagando) return;
    setPagando(numero);
    setAviso(null);
    try {
      const r = await fetch(urlPagarPedido(pais, idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({ numero }),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        pago?: { clientSecret: string; clavePublica: string };
      } | null;
      if (!r.ok || !cuerpo?.ok || !cuerpo.pago)
        return setAviso(texto(idioma, "pagoNoDisponible"));
      const cobro = await cobrarConHoja(cuerpo.pago);
      if (cobro.tipo === "error") setAviso(cobro.mensaje);
      if (cobro.tipo === "pagado") setAviso(texto(idioma, "pedidoPagado"));
      setVuelta((n) => n + 1);
    } catch {
      setAviso(texto(idioma, "errorGeneral"));
    } finally {
      setPagando(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!pais) return;
      let vivo = true;
      pedirJson<{ pedidos: Pedido[] }>(urlMisPedidos(pais, idioma), fetch, {
        headers: cabeceraDeSesion(),
      })
        .then((r) => vivo && setLista(r.pedidos))
        .catch(() => vivo && setLista([]));
      return () => {
        vivo = false;
      };
    }, [pais, idioma, vuelta]),
  );

  return (
    <FlatList
      data={lista ?? []}
      keyExtractor={(p) => p.numero}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        aviso ? <Aviso texto={aviso} tono="info" /> : undefined
      }
      ListEmptyComponent={
        lista === null ? (
          <ActivityIndicator color={COLORES.naranja} style={{ padding: 32 }} />
        ) : (
          <Text style={estilos.vacio}>{texto(idioma, "sinPedidos")}</Text>
        )
      }
      renderItem={({ item }) => (
        <View style={estilos.fila}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.numero}>{item.numero}</Text>
            <Text style={estilos.detalle}>
              {item.articulos}{" "}
              {texto(idioma, item.articulos === 1 ? "articulo" : "articulos")}
            </Text>
            {item.guia ? (
              <Text style={estilos.detalle}>{item.guia}</Text>
            ) : null}
            {item.estado === "pendiente_pago" ? (
              <Pressable
                accessibilityRole="button"
                disabled={pagando !== null}
                onPress={() => void pagar(item.numero)}
                style={estilos.pagar}
              >
                <Text style={estilos.pagarTexto}>
                  {texto(idioma, "pagarConTarjeta")}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={estilos.total}>
              {precioTexto(item.total.centavos, item.total.moneda, idioma)}
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
        </View>
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
  pagar: {
    alignSelf: "flex-start",
    backgroundColor: COLORES.naranja,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  pagarTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
