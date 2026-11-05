import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { urlPlan, vistaDelPlan, type RespuestaPlan } from "@/lib/ganar";
import { texto } from "@/lib/textos";

/**
 * EL PLAN PRO (5 nov 2026, Fase 4): qué incluye, el mes gratis y, con Pro,
 * las estadísticas de los últimos 30 días (salen de las ventas guardadas).
 * El mismo plan del panel web. NADA SE COBRA: el mes gratis no pide tarjeta.
 */
export default function PlanPro() {
  const { pais, idioma } = usePreferencias();
  const [datos, setDatos] = useState<RespuestaPlan | null>(null);
  const [fallo, setFallo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => {
    if (!pais) return;
    pedirJson<RespuestaPlan>(urlPlan(pais, idioma), fetch, {
      headers: cabeceraDeSesion(),
    })
      .then((r) => {
        setDatos(r);
        setFallo(false);
      })
      .catch(() => setFallo(true));
  }, [pais, idioma]);
  useFocusEffect(cargar);

  const hacer = async (accion: "empezar" | "cancelar" | "seguir") => {
    if (!pais) return;
    setOcupado(true);
    try {
      await pedirJson(urlPlan(pais, idioma), fetch, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({ accion }),
      });
      cargar();
    } catch {
      setFallo(true);
    } finally {
      setOcupado(false);
    }
  };

  if (fallo && !datos) {
    return (
      <View style={estilos.centro}>
        <Aviso texto={texto(idioma, "errorGeneral")} tono="error" />
      </View>
    );
  }
  if (!datos) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={COLORES.naranja} />
      </View>
    );
  }

  const { plan, precio, estadisticas: e } = datos;
  const vista = vistaDelPlan(plan);
  const fecha = (ms: number | null) =>
    ms
      ? new Date(ms).toLocaleDateString(idioma === "es" ? "es-US" : "en-US", {
          month: "long",
          day: "numeric",
        })
      : "";
  function dinero(c: number) {
    return precioTexto(c, "USD", idioma);
  }

  return (
    <ScrollView contentContainerStyle={estilos.cuerpo}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{texto(idioma, "planPro")}</Text>
        <Text style={estilos.precio}>
          {precioTexto(precio.centavos, precio.moneda, idioma)}{" "}
          <Text style={estilos.gris}>{texto(idioma, "alMes")}</Text>
        </Text>
        <Text style={estilos.verde}>{texto(idioma, "primerMesGratis")}</Text>
        <Text style={estilos.resumen}>{texto(idioma, "planProResumen")}</Text>
        {(
          [
            "planProBeneficio1",
            "planProBeneficio2",
            "planProBeneficio3",
          ] as const
        ).map((clave) => (
          <Text key={clave} style={estilos.beneficio}>
            ✓ {texto(idioma, clave)}
          </Text>
        ))}
        <Text style={[estilos.gris, { marginTop: 8 }]}>
          {texto(idioma, "productosPublicados")}: {plan.publicados} /{" "}
          {plan.tope.toLocaleString(idioma === "es" ? "es-US" : "en-US")}
        </Text>
      </View>

      {vista === "ofrecer" ? (
        <>
          <BotonPrincipal
            texto={texto(idioma, "empezarMesGratis")}
            onPress={() => void hacer("empezar")}
            ocupado={ocupado}
          />
          <Text style={estilos.nota}>{texto(idioma, "sinTarjeta")}</Text>
        </>
      ) : null}

      {vista === "pro" ? (
        <Aviso
          tono="bien"
          texto={`${texto(idioma, plan.enPrueba ? "mesGratisHasta" : "tienesProHasta")} ${fecha(plan.hasta)}.`}
        />
      ) : null}

      {vista === "termina" ? (
        <>
          <Aviso
            tono="info"
            texto={`${texto(idioma, "proTermina")} ${fecha(plan.hasta)}.`}
          />
          <BotonPrincipal
            texto={texto(idioma, "seguirConPro")}
            onPress={() => void hacer("seguir")}
            ocupado={ocupado}
          />
        </>
      ) : null}

      {vista === "terminado" ? (
        <Aviso tono="info" texto={texto(idioma, "proTerminado")} />
      ) : null}

      {e ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>
            {texto(idioma, "tusEstadisticas")}
          </Text>
          <View style={estilos.cifras}>
            {[
              [texto(idioma, "ventas"), dinero(e.ventasCentavos)],
              [texto(idioma, "paraTi"), dinero(e.paraTiCentavos)],
              [texto(idioma, "pedidosLabel"), String(e.pedidos)],
              [texto(idioma, "unidades"), String(e.unidades)],
            ].map(([etiqueta, valor]) => (
              <View key={etiqueta} style={estilos.cifra}>
                <Text style={estilos.valor}>{valor}</Text>
                <Text style={estilos.gris}>{etiqueta}</Text>
              </View>
            ))}
          </View>
          <Text style={[estilos.subtitulo, { marginTop: 12 }]}>
            {texto(idioma, "masVendidos")}
          </Text>
          {e.masVendidos.length === 0 ? (
            <Text style={estilos.gris}>{texto(idioma, "sinVentasAun")}</Text>
          ) : (
            e.masVendidos.map((p, i) => (
              <View key={`${p.productoId}-${i}`} style={estilos.fila}>
                <Text style={estilos.producto} numberOfLines={1}>
                  {p.titulo}
                </Text>
                <Text style={estilos.gris}>
                  {p.unidades} · {dinero(p.ventasCentavos)}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}

      {vista === "pro" ? (
        <Pressable
          accessibilityRole="button"
          disabled={ocupado}
          onPress={() =>
            Alert.alert(texto(idioma, "cancelarProPregunta"), undefined, [
              { text: texto(idioma, "seguirConPro"), style: "cancel" },
              {
                text: texto(idioma, "cancelarPro"),
                style: "destructive",
                onPress: () => void hacer("cancelar"),
              },
            ])
          }
        >
          <Text style={estilos.enlace}>{texto(idioma, "cancelarPro")}</Text>
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
  cuerpo: { padding: 16, gap: 14, paddingBottom: 48 },
  tarjeta: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  titulo: { fontSize: 22, fontWeight: "800", color: COLORES.azul },
  precio: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORES.texto,
    marginTop: 6,
  },
  verde: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORES.verde,
    marginTop: 2,
  },
  resumen: {
    fontSize: 15,
    color: COLORES.texto,
    marginTop: 10,
    marginBottom: 6,
  },
  beneficio: { fontSize: 15, color: COLORES.texto, marginTop: 4 },
  gris: { fontSize: 13, color: COLORES.gris, fontWeight: "400" },
  nota: { fontSize: 13, color: COLORES.gris, textAlign: "center" },
  subtitulo: { fontSize: 16, fontWeight: "700", color: COLORES.texto },
  cifras: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  cifra: { width: "50%", paddingVertical: 8 },
  valor: { fontSize: 18, fontWeight: "800", color: COLORES.azul },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
  },
  producto: { flex: 1, fontSize: 14, color: COLORES.texto },
  enlace: {
    textAlign: "center",
    color: COLORES.gris,
    fontSize: 14,
    textDecorationLine: "underline",
    paddingVertical: 8,
  },
});
