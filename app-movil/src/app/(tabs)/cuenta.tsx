import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BotonPrincipal, Enlace } from "@/components/formulario";
import { MenuTresPuntos } from "@/components/menu-tres-puntos";
import { SelectorIdioma } from "@/components/selector-idioma";
import { usePreferencias } from "@/contexto/preferencias";
import { useMiTienda } from "@/hooks/use-mi-tienda";
import { pedirPaises, urlLegal, type PaginaLegal } from "@/lib/api";
import { authClient, salir } from "@/lib/auth-client";
import { bandera, COLORES } from "@/lib/colores";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/**
 * La cuenta: entrar o crear cuenta (o, con sesión, el nombre y «Cerrar
 * sesión»), el país, el idioma y las páginas de ayuda y legales.
 */
const PAGINAS: Array<{ clave: ClaveDeTexto; ruta: PaginaLegal }> = [
  { clave: "ayuda", ruta: "ayuda" },
  { clave: "privacidad", ruta: "privacidad" },
  { clave: "terminos", ruta: "terminos" },
];

export default function Cuenta() {
  const { pais, idioma } = usePreferencias();
  const [nombre, setNombre] = useState<string | null>(null);
  const { data: sesion } = authClient.useSession();
  const [saliendo, setSaliendo] = useState(false);
  const { tienda } = useMiTienda(pais, idioma);

  useEffect(() => {
    let vivo = true;
    pedirPaises(idioma)
      .then(
        (r) =>
          vivo &&
          setNombre(r.paises.find((p) => p.codigo === pais)?.nombre ?? null),
      )
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [pais, idioma]);

  return (
    <View style={estilos.pantalla}>
      <SafeAreaView edges={["top"]} style={estilos.cabecera}>
        <View style={estilos.filaCabecera}>
          <Text style={estilos.titulo}>{texto(idioma, "cuenta")}</Text>
          {/* Borrar la cuenta va escondido aquí, nunca a la vista. */}
          {sesion?.user ? (
            <MenuTresPuntos
              etiqueta={texto(idioma, "masOpciones")}
              opciones={[
                {
                  texto: texto(idioma, "borrarCuenta"),
                  destructiva: true,
                  alTocar: () => router.push("/borrar-cuenta"),
                },
              ]}
            />
          ) : null}
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        {sesion?.user ? (
          <View style={[estilos.grupo, estilos.persona]}>
            <Text style={estilos.hola}>
              {texto(idioma, "hola")}, {sesion.user.name}
            </Text>
            <Text style={estilos.correo}>{sesion.user.email}</Text>
            <BotonPrincipal
              texto={texto(idioma, "misPedidos")}
              onPress={() => router.push("/mis-pedidos")}
            />
            {tienda ? (
              <BotonPrincipal
                texto={texto(idioma, "miTienda")}
                onPress={() => router.push("/mi-tienda")}
              />
            ) : null}
            <Enlace
              texto={texto(idioma, "salir")}
              onPress={async () => {
                if (saliendo) return;
                setSaliendo(true);
                await salir();
                setSaliendo(false);
              }}
            />
          </View>
        ) : (
          <View style={[estilos.grupo, estilos.persona]}>
            <BotonPrincipal
              texto={texto(idioma, "entrar")}
              onPress={() => router.push("/entrar")}
            />
            <Enlace
              texto={texto(idioma, "crearCuenta")}
              onPress={() => router.push("/crear-cuenta")}
            />
          </View>
        )}
        <View style={estilos.grupo}>
          {sesion?.user ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/mis-datos")}
              style={[estilos.fila, estilos.abajo]}
            >
              <Text style={estilos.etiqueta}>
                {texto(idioma, "misDatosFila")}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={estilos.flecha}>›</Text>
            </Pressable>
          ) : null}
          {sesion?.user ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/bloqueados")}
              style={[estilos.fila, estilos.abajo]}
            >
              <Text style={estilos.etiqueta}>
                {texto(idioma, "blockedSellers")}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={estilos.flecha}>›</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/cambiar-pais")}
            style={estilos.fila}
          >
            <Text style={estilos.etiqueta}>{texto(idioma, "pais")}</Text>
            <Text style={estilos.valor}>
              {pais ? `${bandera(pais)} ${nombre ?? pais}` : ""}
            </Text>
            <Text style={estilos.flecha}>›</Text>
          </Pressable>
          <View style={[estilos.fila, estilos.separada]}>
            <Text style={estilos.etiqueta}>{texto(idioma, "idioma")}</Text>
            <View style={{ flex: 1 }} />
            <SelectorIdioma claro={false} />
          </View>
        </View>
        <View style={estilos.grupo}>
          {PAGINAS.map((p, i) => (
            <Pressable
              key={p.ruta}
              accessibilityRole="link"
              onPress={() =>
                void WebBrowser.openBrowserAsync(urlLegal(pais, idioma, p.ruta))
              }
              style={[estilos.fila, i > 0 && estilos.separada]}
            >
              <Text style={estilos.etiqueta}>{texto(idioma, p.clave)}</Text>
              <View style={{ flex: 1 }} />
              <Text style={estilos.flecha}>›</Text>
            </Pressable>
          ))}
        </View>
        <Text style={estilos.pie}>
          © {new Date().getFullYear()} Mercatren LLC
        </Text>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: "#F3F4F6" },
  cabecera: {
    backgroundColor: COLORES.azul,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titulo: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 4 },
  filaCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cuerpo: { padding: 16, gap: 16 },
  grupo: { backgroundColor: "#FFFFFF", borderRadius: 12, overflow: "hidden" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  abajo: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORES.grisClaro,
  },
  separada: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORES.grisClaro,
  },
  etiqueta: { fontSize: 16, color: COLORES.texto },
  valor: { flex: 1, textAlign: "right", fontSize: 15, color: COLORES.gris },
  flecha: { fontSize: 22, color: COLORES.gris },
  pie: { textAlign: "center", color: COLORES.gris, fontSize: 12, marginTop: 8 },
  persona: { padding: 16, paddingTop: 4 },
  hola: { fontSize: 20, fontWeight: "700", color: COLORES.azul, marginTop: 12 },
  correo: { fontSize: 14, color: COLORES.gris, marginTop: 4 },
});
