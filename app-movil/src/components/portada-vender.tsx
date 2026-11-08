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
        <BotonPrincipal
          texto={texto(idioma, "verMiTienda")}
          onPress={() => router.push("/mi-tienda")}
        />
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

  /* La versión grande sale solo cuando el país NO tiene productos: a quien
     viene a comprar se le dice primero, claro, que llegan muy pronto
     (8 nov 2026), y después se le invita a vender. */
  return (
    <View style={estilos.caja}>
      <View style={estilos.pronto}>
        <Text style={estilos.prontoEtiqueta}>{texto(idioma, "pronto")}</Text>
        <Text style={estilos.prontoTexto}>
          {texto(idioma, "muyProntoProductos")}
        </Text>
      </View>
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
  pronto: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 6,
  },
  prontoEtiqueta: {
    alignSelf: "flex-start",
    backgroundColor: COLORES.naranja,
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  prontoTexto: { color: COLORES.azul, fontSize: 15, fontWeight: "600" },
});
