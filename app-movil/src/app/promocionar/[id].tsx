import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Aviso,
  BotonPrincipal,
  Campo,
  Etiqueta,
} from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { useBorrador } from "@/hooks/use-borrador";
import { pedirJson } from "@/lib/api";
import { authClient, cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import {
  clicsPorDia,
  presupuestoACentavos,
  urlPromociones,
  type Promocion,
} from "@/lib/ganar";
import { texto, type ClaveDeTexto } from "@/lib/textos";
import { urlMiProducto, type ProductoParaEditar } from "@/lib/ventas";

type Mensaje = { clave: ClaveDeTexto; tono: "error" | "info" | "bien" } | null;

/**
 * PROMOCIONAR UN PRODUCTO (5 nov 2026, Fase 4): el presupuesto del día, lo
 * que eso alcanza, y, si ya está promocionado, lo de hoy y los últimos 30
 * días con pausar y reanudar. El mismo «Promocionar» del panel web. NADA SE
 * COBRA TODAVÍA, y se dice.
 */
export default function Promocionar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pais, idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const [producto, setProducto] = useState<ProductoParaEditar | null>(null);
  const [promo, setPromo] = useState<Promocion | null>(null);
  const [cargado, setCargado] = useState(false);
  const [presupuesto, setPresupuesto] = useState("5");
  const [aviso, setAviso] = useState<Mensaje>(null);
  const [ocupado, setOcupado] = useState(false);

  const { limpiar } = useBorrador(
    `promocionar:${id}`,
    sesion?.user?.id,
    { presupuesto },
    (g) => g.presupuesto && setPresupuesto(g.presupuesto),
  );

  const cargar = useCallback(async () => {
    if (!pais || !id) return;
    try {
      const [p, lista] = await Promise.all([
        pedirJson<{ producto: ProductoParaEditar }>(
          urlMiProducto(id, pais, idioma),
          fetch,
          { headers: cabeceraDeSesion() },
        ),
        pedirJson<{ promociones: Promocion[] }>(
          urlPromociones(pais, idioma),
          fetch,
          { headers: cabeceraDeSesion() },
        ),
      ]);
      setProducto(p.producto);
      const suya = lista.promociones.find((x) => x.productoId === id) ?? null;
      setPromo(suya);
      if (suya) setPresupuesto((suya.presupuestoCentavos / 100).toString());
    } catch {
      setAviso({ clave: "errorGeneral", tono: "error" });
    } finally {
      setCargado(true);
    }
  }, [pais, idioma, id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const centavos = presupuestoACentavos(presupuesto);

  const guardar = async () => {
    if (!pais || !id) return;
    if (!centavos) return setAviso({ clave: "presupuestoMal", tono: "error" });
    setOcupado(true);
    setAviso(null);
    try {
      const r = await fetch(urlPromociones(pais, idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({ productoId: id, presupuesto }),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        motivo?: string;
      } | null;
      if (!r.ok || !cuerpo?.ok) {
        return setAviso({
          clave:
            cuerpo?.motivo === "no_publicado"
              ? "soloPublicados"
              : cuerpo?.motivo === "presupuesto"
                ? "presupuestoMal"
                : "errorGeneral",
          tono: "error",
        });
      }
      await limpiar();
      setAviso({ clave: "promoGuardada", tono: "bien" });
      await cargar();
    } catch {
      setAviso({ clave: "errorGeneral", tono: "error" });
    } finally {
      setOcupado(false);
    }
  };

  const cambiarEstado = async () => {
    if (!pais || !promo) return;
    setOcupado(true);
    try {
      await pedirJson(urlPromociones(pais, idioma), fetch, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({
          promocionId: promo.id,
          estado: promo.estado === "activa" ? "pausada" : "activa",
        }),
      });
      await cargar();
    } catch {
      setAviso({ clave: "errorGeneral", tono: "error" });
    } finally {
      setOcupado(false);
    }
  };

  if (!cargado) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={COLORES.naranja} />
      </View>
    );
  }

  const titulo =
    idioma === "en" && producto?.tituloEn
      ? producto.tituloEn
      : producto?.tituloEs;
  function dinero(c: number) {
    return precioTexto(c, "USD", idioma);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.cuerpo}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo} numberOfLines={2}>
            {titulo ?? ""}
          </Text>
          <Text style={estilos.texto}>{texto(idioma, "promoExplica")}</Text>
        </View>

        {producto && producto.estado !== "publicado" ? (
          <Aviso tono="error" texto={texto(idioma, "soloPublicados")} />
        ) : null}

        <View style={estilos.tarjeta}>
          <Etiqueta>{texto(idioma, "presupuestoDiario")}</Etiqueta>
          <Campo
            value={presupuesto}
            onChangeText={setPresupuesto}
            placeholder="5"
            keyboardType="decimal-pad"
          />
          <Text style={estilos.gris}>
            {centavos
              ? `${texto(idioma, "hasta")} ${clicsPorDia(centavos)} ${texto(idioma, "personasAlDia")}.`
              : texto(idioma, "presupuestoAyuda")}
          </Text>
          {aviso ? (
            <Aviso texto={texto(idioma, aviso.clave)} tono={aviso.tono} />
          ) : null}
          <BotonPrincipal
            texto={texto(idioma, promo ? "guardarPresupuesto" : "promocionar")}
            onPress={guardar}
            ocupado={ocupado}
          />
          <Text style={[estilos.gris, { marginTop: 8 }]}>
            {texto(idioma, "sinCobroAun")}
          </Text>
        </View>

        {promo ? (
          <View style={estilos.tarjeta}>
            <Text
              style={[
                estilos.estado,
                promo.estado === "activa" && { color: COLORES.verde },
              ]}
            >
              {texto(
                idioma,
                promo.estado === "activa" ? "promoActiva" : "pausado",
              )}
            </Text>
            <View style={estilos.cifras}>
              {[
                [texto(idioma, "promoHoy"), promo.hoy],
                [texto(idioma, "promo30"), promo.ultimos30],
              ].map(([etiqueta, c]) => {
                const cifras = c as { clics: number; gastoCentavos: number };
                return (
                  <View key={etiqueta as string} style={estilos.cifra}>
                    <Text style={estilos.subtitulo}>{etiqueta as string}</Text>
                    <Text style={estilos.texto}>
                      {texto(idioma, "toques")}: {cifras.clics}
                    </Text>
                    <Text style={estilos.texto}>
                      {texto(idioma, "gastado")}: {dinero(cifras.gastoCentavos)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={ocupado}
              onPress={() => void cambiarEstado()}
              style={estilos.secundario}
            >
              <Text style={estilos.secundarioTexto}>
                {texto(
                  idioma,
                  promo.estado === "activa"
                    ? "pausarPromocion"
                    : "reanudarPromocion",
                )}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  cuerpo: { padding: 16, gap: 14, paddingBottom: 48 },
  tarjeta: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  titulo: { fontSize: 18, fontWeight: "800", color: COLORES.azul },
  texto: { fontSize: 15, color: COLORES.texto, marginTop: 6, lineHeight: 21 },
  gris: { fontSize: 13, color: COLORES.gris, marginTop: 6 },
  subtitulo: { fontSize: 15, fontWeight: "700", color: COLORES.texto },
  estado: { fontSize: 15, fontWeight: "700", color: COLORES.gris },
  cifras: { flexDirection: "row", marginTop: 8 },
  cifra: { flex: 1 },
  secundario: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORES.azul,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secundarioTexto: { color: COLORES.azul, fontWeight: "700", fontSize: 15 },
});
