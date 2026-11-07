import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Aviso } from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { pedirJson } from "@/lib/api";
import { cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { enviar, urlBloqueos, type Bloqueado } from "@/lib/moderacion";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/**
 * VENDEDORES BLOQUEADOS: la lista de a quién se bloqueó desde la ficha de un
 * producto, con el botón para deshacerlo (política UGC de Google Play). Se
 * llega desde «Cuenta».
 */
export default function Bloqueados() {
  const { pais, idioma } = usePreferencias();
  const [lista, setLista] = useState<Bloqueado[] | null>(null);
  const [aviso, setAviso] = useState<{
    clave: ClaveDeTexto;
    tono: "bien" | "error";
  } | null>(null);

  const cargar = useCallback(async () => {
    if (!pais) return;
    try {
      const r = await pedirJson<{ bloqueados: Bloqueado[] }>(
        urlBloqueos(pais, idioma),
        fetch,
        { headers: cabeceraDeSesion() },
      );
      setLista(r.bloqueados);
    } catch {
      setLista([]);
      setAviso({ clave: "sinConexion", tono: "error" });
    }
  }, [pais, idioma]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const desbloquear = async (slug: string) => {
    if (!pais) return;
    const r = await enviar(
      urlBloqueos(pais, idioma),
      { slug },
      cabeceraDeSesion(),
    );
    if (r.ok) {
      setAviso({ clave: "unblockDone", tono: "bien" });
      setLista((l) => (l ?? []).filter((b) => b.slug !== slug));
    } else {
      setAviso({ clave: r.clave, tono: "error" });
    }
  };

  if (lista === null) {
    return (
      <ActivityIndicator style={{ marginTop: 40 }} color={COLORES.naranja} />
    );
  }
  return (
    <View style={estilos.pantalla}>
      {aviso ? (
        <Aviso texto={texto(idioma, aviso.clave)} tono={aviso.tono} />
      ) : null}
      <FlatList
        data={lista}
        keyExtractor={(b) => b.slug}
        ListEmptyComponent={
          <Text style={estilos.vacio}>{texto(idioma, "blockedNone")}</Text>
        }
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {item.nombre}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void desbloquear(item.slug)}
              style={estilos.boton}
            >
              <Text style={estilos.botonTexto}>{texto(idioma, "unblock")}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 16, gap: 12 },
  vacio: { textAlign: "center", color: COLORES.gris, marginTop: 40 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  nombre: { flex: 1, fontSize: 16, color: COLORES.texto },
  boton: {
    borderWidth: 1,
    borderColor: COLORES.naranja,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  botonTexto: { color: COLORES.naranja, fontWeight: "700" },
});
