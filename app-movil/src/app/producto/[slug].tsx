import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { BotonPrincipal } from "@/components/formulario";
import { useCarrito } from "@/contexto/carrito";
import { usePreferencias } from "@/contexto/preferencias";
import {
  absoluta,
  FalloDeRed,
  pedirJson,
  urlProducto,
  type FichaApp,
} from "@/lib/api";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import { texto } from "@/lib/textos";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "listo"; ficha: FichaApp }
  | { tipo: "no_existe" }
  | { tipo: "sin_conexion" };

/** La ficha de un producto: fotos que se pasan con el dedo, precio y tienda. */
export default function Producto() {
  const { agregar } = useCarrito();
  const [agregado, setAgregado] = useState(false);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { pais, idioma } = usePreferencias();
  const { width } = useWindowDimensions();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!pais || !slug) return;
    let vivo = true;
    setEstado({ tipo: "cargando" });
    pedirJson<{ producto: FichaApp }>(urlProducto(slug, pais, idioma))
      .then((r) => vivo && setEstado({ tipo: "listo", ficha: r.producto }))
      .catch((fallo) => {
        if (!vivo) return;
        setEstado(
          fallo instanceof FalloDeRed && fallo.motivo === "no_existe"
            ? { tipo: "no_existe" }
            : { tipo: "sin_conexion" },
        );
      });
    return () => {
      vivo = false;
    };
  }, [slug, pais, idioma, intento]);

  if (estado.tipo === "cargando") {
    return <ActivityIndicator style={estilos.centro} color={COLORES.naranja} />;
  }
  if (estado.tipo !== "listo") {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.aviso}>
          {texto(
            idioma,
            estado.tipo === "no_existe" ? "noExiste" : "sinConexion",
          )}
        </Text>
        {estado.tipo === "sin_conexion" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIntento((n) => n + 1)}
            style={estilos.boton}
          >
            <Text style={estilos.botonTexto}>
              {texto(idioma, "reintentar")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const f = estado.ficha;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {(f.fotos.length ? f.fotos : [{ url: "", alt: null }]).map(
          (foto, i) => (
            <Image
              key={`${foto.url}-${i}`}
              source={
                foto.url ? { uri: absoluta(foto.url) ?? undefined } : undefined
              }
              style={{ width, height: width, backgroundColor: "#FFFFFF" }}
              contentFit="contain"
              cachePolicy="disk"
              accessibilityLabel={foto.alt ?? f.titulo}
            />
          ),
        )}
      </ScrollView>
      <View style={estilos.cuerpo}>
        {f.marca ? <Text style={estilos.marca}>{f.marca}</Text> : null}
        <Text style={estilos.titulo}>{f.titulo}</Text>
        <View style={estilos.precios}>
          <Text style={estilos.precio}>
            {precioTexto(f.precio.centavos, f.precio.moneda, idioma)}
          </Text>
          {f.precioAntes ? (
            <Text style={estilos.antes}>
              {precioTexto(
                f.precioAntes.centavos,
                f.precioAntes.moneda,
                idioma,
              )}
            </Text>
          ) : null}
        </View>
        {f.agotado ? (
          <Text style={estilos.agotado}>{texto(idioma, "agotado")}</Text>
        ) : null}
        <Text style={estilos.tienda}>
          {texto(idioma, "vendidoPor")}{" "}
          <Text style={estilos.tiendaNombre}>{f.tienda.nombre}</Text>
        </Text>
        {/* Se compra solo si hay existencias y la venta del país no está en
            pausa (la MISMA pausa de la web, que el servidor vuelve a mirar). */}
        {f.seVende === false ? (
          <Text style={estilos.noSeVende}>{texto(idioma, "noSeVende")}</Text>
        ) : !f.agotado ? (
          <BotonPrincipal
            texto={
              agregado
                ? texto(idioma, "agregado")
                : texto(idioma, "agregarAlCarrito")
            }
            onPress={() => {
              agregar({
                productoId: f.id,
                slug: f.slug,
                titulo: f.titulo,
                foto: f.fotos[0]?.url ?? null,
                precio: f.precio,
                cantidad: 1,
              });
              setAgregado(true);
            }}
          />
        ) : null}
        {f.descripcion ? (
          <>
            <Text style={estilos.subtitulo}>
              {texto(idioma, "descripcion")}
            </Text>
            <Text style={estilos.descripcion}>{f.descripcion}</Text>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  aviso: { fontSize: 16, color: COLORES.gris, textAlign: "center" },
  boton: {
    backgroundColor: COLORES.naranja,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  cuerpo: { backgroundColor: "#FFFFFF", padding: 16, gap: 8 },
  marca: {
    fontSize: 13,
    color: COLORES.gris,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titulo: { fontSize: 20, fontWeight: "700", color: COLORES.texto },
  precios: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginTop: 4,
  },
  precio: { fontSize: 26, fontWeight: "800", color: COLORES.azul },
  antes: {
    fontSize: 15,
    color: COLORES.gris,
    textDecorationLine: "line-through",
  },
  noSeVende: { fontSize: 14, color: COLORES.gris, marginTop: 8 },
  agotado: {
    alignSelf: "flex-start",
    backgroundColor: COLORES.gris,
    color: "#FFFFFF",
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  tienda: { fontSize: 14, color: COLORES.gris, marginTop: 4 },
  tiendaNombre: { color: COLORES.azul, fontWeight: "600" },
  subtitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORES.texto,
    marginTop: 14,
  },
  descripcion: { fontSize: 15, lineHeight: 22, color: COLORES.texto },
});
