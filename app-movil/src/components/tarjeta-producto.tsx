import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { absoluta, type ProductoApp } from "@/lib/api";
import { COLORES } from "@/lib/colores";
import { precioTexto, type Idioma } from "@/lib/dinero";
import { texto } from "@/lib/textos";

/** Una tarjeta del catálogo: foto, título, precio y tienda. Abre la ficha. */
export function TarjetaProducto({
  p,
  idioma,
}: {
  p: ProductoApp;
  idioma: Idioma;
}) {
  const foto = absoluta(p.foto);
  return (
    <Link
      href={{ pathname: "/producto/[slug]", params: { slug: p.slug } }}
      asChild
    >
      <Pressable style={estilos.tarjeta} accessibilityRole="link">
        <View style={estilos.marco}>
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={estilos.foto}
              contentFit="cover"
              cachePolicy="disk"
              accessibilityLabel={p.fotoAlt ?? p.titulo}
            />
          ) : null}
          {p.agotado ? (
            <Text style={estilos.agotado}>{texto(idioma, "agotado")}</Text>
          ) : null}
        </View>
        <Text style={estilos.titulo} numberOfLines={2}>
          {p.titulo}
        </Text>
        <View style={estilos.precios}>
          <Text style={estilos.precio}>
            {precioTexto(p.precio.centavos, p.precio.moneda, idioma)}
          </Text>
          {p.precioAntes ? (
            <Text style={estilos.antes}>
              {precioTexto(
                p.precioAntes.centavos,
                p.precioAntes.moneda,
                idioma,
              )}
            </Text>
          ) : null}
        </View>
        <Text style={estilos.tienda} numberOfLines={1}>
          {p.tienda.nombre}
        </Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flex: 1,
    margin: 6,
    backgroundColor: COLORES.fondo,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORES.grisClaro,
  },
  marco: { aspectRatio: 1, backgroundColor: "#F3F4F6" },
  foto: { width: "100%", height: "100%" },
  agotado: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORES.gris,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  titulo: {
    fontSize: 14,
    color: COLORES.texto,
    paddingHorizontal: 8,
    paddingTop: 8,
    minHeight: 44,
  },
  precios: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  precio: { fontSize: 16, fontWeight: "700", color: COLORES.azul },
  antes: {
    fontSize: 12,
    color: COLORES.gris,
    textDecorationLine: "line-through",
  },
  tienda: {
    fontSize: 12,
    color: COLORES.gris,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
