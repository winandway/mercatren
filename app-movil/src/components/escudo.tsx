import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { API_BASE, urlEscudo } from "@/lib/api";
import { COLORES } from "@/lib/colores";
import type { Idioma } from "@/lib/dinero";
import { leerMensajeDelEscudo, type EstadoEscudo } from "@/lib/escudo";
import { texto } from "@/lib/textos";

/**
 * EL ESCUDO ANTI-ROBOTS DE ENTRAR Y CREAR CUENTA: la página de Turnstile del
 * sitio (`/datos/app/escudo`) en una vista web, como indica Cloudflare para
 * apps. Casi siempre pasa sola; si Cloudflare duda, enseña su casilla aquí.
 * El pase sirve UNA vez: tras cada intento la pantalla cambia `vuelta` y la
 * vista se recarga para pedir otro.
 */
/* La vista solo navega por el sitio y por Cloudflare (y los «about:» que usa
   Turnstile por dentro); cualquier otra dirección la abriría fuera de la app. */
const ORIGENES = [
  `${API_BASE}*`,
  "https://challenges.cloudflare.com*",
  "about:*",
];

export function Escudo({
  idioma,
  vuelta,
  alCambiar,
}: {
  idioma: Idioma;
  vuelta: number;
  alCambiar: (estado: EstadoEscudo) => void;
}) {
  const [listo, setListo] = useState(false);
  const [sinEscudo, setSinEscudo] = useState(false);
  return (
    <View style={sinEscudo ? estilos.oculta : estilos.caja}>
      {!listo ? (
        <Text style={estilos.aviso}>{texto(idioma, "comprobando")}</Text>
      ) : null}
      <WebView
        key={`${idioma}-${vuelta}`}
        source={{ uri: urlEscudo(idioma) }}
        style={estilos.web}
        originWhitelist={ORIGENES}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={(e) => {
          const estado = leerMensajeDelEscudo(e.nativeEvent.data);
          setListo(true);
          /* Sin escudo configurado no hay nada que enseñar: no ocupa lugar. */
          setSinEscudo(estado.tipo === "sin-escudo");
          alCambiar(estado);
        }}
        onError={() => alCambiar({ tipo: "error" })}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { minHeight: 72, justifyContent: "center" },
  oculta: { height: 0, overflow: "hidden" },
  web: { height: 72, backgroundColor: "transparent" },
  aviso: {
    position: "absolute",
    alignSelf: "center",
    color: COLORES.gris,
    fontSize: 13,
  },
});
