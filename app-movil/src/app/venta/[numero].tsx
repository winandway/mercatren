import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Aviso, BotonPrincipal } from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { pedirJson } from "@/lib/api";
import { cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import { ESTADOS_BUENOS, nombreDelEstado } from "@/lib/estados-de-pedido";
import { texto } from "@/lib/textos";
import { urlVenta, type DetalleDeVenta } from "@/lib/ventas";

/**
 * UNA VENTA: lo que lleva (solo mis productos), a dónde va y a quién, y los
 * botones que la cierran. «Entregado» va primero y en grande; «Enviado», al
 * lado y más discreto (igual que en el panel web). Los dos piden confirmar,
 * porque al cliente le llega un correo y no se puede volver atrás.
 */
export default function DetalleVenta() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { pais, idioma } = usePreferencias();
  const [venta, setVenta] = useState<DetalleDeVenta | null>(null);
  const [fallo, setFallo] = useState(false);
  const [aviso, setAviso] = useState<{
    texto: string;
    tono: "error" | "info" | "bien";
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => {
    if (!pais || !numero) return;
    pedirJson<{ venta: DetalleDeVenta }>(
      urlVenta(numero, pais, idioma),
      fetch,
      { headers: cabeceraDeSesion() },
    )
      .then((r) => setVenta(r.venta))
      .catch(() => setFallo(true));
  }, [pais, idioma, numero]);

  useEffect(cargar, [cargar]);

  const avanzar = (estado: "enviado" | "entregado") => {
    if (!pais || !numero) return;
    Alert.alert(
      texto(idioma, estado === "enviado" ? "marcarEnviado" : "marcarEntregado"),
      texto(
        idioma,
        estado === "enviado" ? "confirmarEnviado" : "confirmarEntregado",
      ),
      [
        { text: texto(idioma, "cancelar"), style: "cancel" },
        {
          text: texto(idioma, "confirmar"),
          onPress: () => {
            setOcupado(true);
            setAviso(null);
            fetch(urlVenta(numero, pais, idioma), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...cabeceraDeSesion(),
              },
              body: JSON.stringify({ estado }),
            })
              .then(async (r) => {
                const cuerpo = (await r.json().catch(() => null)) as {
                  ok?: boolean;
                  mensaje?: string;
                } | null;
                if (r.ok && cuerpo?.ok) {
                  setAviso({
                    texto: texto(idioma, "ventaActualizada"),
                    tono: "bien",
                  });
                  cargar();
                } else {
                  setAviso({
                    texto: cuerpo?.mensaje ?? texto(idioma, "errorGeneral"),
                    tono: "error",
                  });
                }
              })
              .catch(() =>
                setAviso({
                  texto: texto(idioma, "errorGeneral"),
                  tono: "error",
                }),
              )
              .finally(() => setOcupado(false));
          },
        },
      ],
    );
  };

  if (fallo) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.gris}>{texto(idioma, "errorGeneral")}</Text>
      </View>
    );
  }
  if (!venta) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={COLORES.naranja} />
      </View>
    );
  }

  const direccion = venta.entrega.lineas;

  return (
    <ScrollView contentContainerStyle={estilos.cuerpo}>
      <View style={estilos.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.numero}>{venta.numero}</Text>
          <Text style={estilos.gris}>
            {new Date(venta.creadoEn).toLocaleDateString(
              idioma === "es" ? "es-US" : "en-US",
              { month: "long", day: "numeric", year: "numeric" },
            )}
          </Text>
        </View>
        <Text
          style={[
            estilos.estado,
            ESTADOS_BUENOS.has(venta.estado) && { color: COLORES.verde },
          ]}
        >
          {nombreDelEstado(venta.estado, idioma)}
        </Text>
      </View>

      {aviso ? <Aviso texto={aviso.texto} tono={aviso.tono} /> : null}
      {venta.estado === "pendiente_pago" ? (
        <Aviso texto={texto(idioma, "esperandoPago")} tono="info" />
      ) : venta.puedeEnviar ? (
        <Aviso texto={texto(idioma, "prepararVenta")} tono="info" />
      ) : venta.estado === "enviado" ? (
        <Aviso texto={texto(idioma, "enCaminoVenta")} tono="info" />
      ) : null}

      <View style={estilos.caja}>
        <Text style={estilos.titulo}>{texto(idioma, "loQueLleva")}</Text>
        {venta.renglones.map((r, i) => (
          <View key={i} style={estilos.renglon}>
            <Text style={estilos.cantidad}>{r.cantidad}×</Text>
            <Text style={estilos.producto} numberOfLines={2}>
              {r.titulo}
            </Text>
            <Text style={estilos.importe}>
              {precioTexto(r.subtotalCentavos, venta.monto.moneda, idioma)}
            </Text>
          </View>
        ))}
        <View style={[estilos.renglon, estilos.totalFila]}>
          <Text style={estilos.producto}>
            {texto(idioma, "totalDeLaVenta")}
          </Text>
          <Text style={estilos.total}>
            {precioTexto(venta.monto.centavos, venta.monto.moneda, idioma)}
          </Text>
        </View>
      </View>

      <View style={estilos.caja}>
        <Text style={estilos.titulo}>{texto(idioma, "enviarA")}</Text>
        {direccion.length > 0 ? (
          direccion.map((linea, i) => (
            <Text key={i} style={estilos.linea} selectable>
              {linea}
            </Text>
          ))
        ) : (
          <Aviso texto={texto(idioma, "sinDireccion")} tono="error" />
        )}
        <Text style={[estilos.gris, { marginTop: 10 }]}>
          {texto(idioma, "cliente")}
        </Text>
        <Text style={estilos.linea}>{venta.cliente}</Text>
        {venta.entrega.telefono ? (
          <>
            <Text style={[estilos.gris, { marginTop: 10 }]}>
              {texto(idioma, "telefono")}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                void Linking.openURL(`tel:${venta.entrega.telefono}`)
              }
            >
              <Text style={estilos.enlace}>{venta.entrega.telefono}</Text>
            </Pressable>
          </>
        ) : null}
        {venta.entrega.notas ? (
          <>
            <Text style={[estilos.gris, { marginTop: 10 }]}>
              {texto(idioma, "notasDelCliente")}
            </Text>
            <Text style={estilos.linea}>{venta.entrega.notas}</Text>
          </>
        ) : null}
      </View>

      {venta.puedeEntregar ? (
        <BotonPrincipal
          texto={texto(idioma, "marcarEntregado")}
          onPress={() => avanzar("entregado")}
          ocupado={ocupado}
        />
      ) : null}
      {venta.puedeEnviar ? (
        <Pressable
          accessibilityRole="button"
          disabled={ocupado}
          onPress={() => avanzar("enviado")}
          style={estilos.secundario}
        >
          <Text style={estilos.secundarioTexto}>
            {texto(idioma, "marcarEnviado")}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cuerpo: { padding: 16, gap: 12, paddingBottom: 48 },
  cabecera: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  numero: { fontSize: 22, fontWeight: "800", color: COLORES.azul },
  gris: { fontSize: 13, color: COLORES.gris },
  estado: { fontSize: 15, fontWeight: "700", color: COLORES.gris },
  caja: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14 },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 8,
  },
  renglon: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
  cantidad: { fontSize: 15, fontWeight: "700", color: COLORES.texto },
  producto: { flex: 1, fontSize: 15, color: COLORES.texto },
  importe: { fontSize: 15, color: COLORES.texto },
  totalFila: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORES.grisClaro,
    marginTop: 6,
    paddingTop: 8,
  },
  total: { fontSize: 16, fontWeight: "800", color: COLORES.azul },
  linea: { fontSize: 15, color: COLORES.texto, lineHeight: 21 },
  enlace: { fontSize: 15, color: COLORES.naranja, fontWeight: "600" },
  secundario: {
    borderWidth: 1,
    borderColor: COLORES.azul,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secundarioTexto: { color: COLORES.azul, fontWeight: "700", fontSize: 15 },
});
