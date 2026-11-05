import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

import { CampoClave } from "@/components/campo-clave";
import { Escudo } from "@/components/escudo";
import {
  Aviso,
  BotonPrincipal,
  Campo,
  Enlace,
  Etiqueta,
} from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { useBorrador } from "@/hooks/use-borrador";
import { API_BASE } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { faltaEnEntrada, mensajeDeError } from "@/lib/cuentas";
import { cabeceraDelEscudo, type EstadoEscudo } from "@/lib/escudo";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/**
 * ENTRAR con correo y contraseña. Nunca se dice si el correo tiene cuenta:
 * solo «el correo o la contraseña no coinciden». La contraseña olvidada se
 * recupera en la web, que manda el enlace por correo.
 */
export default function Entrar() {
  const { idioma } = usePreferencias();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<ClaveDeTexto | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [escudo, setEscudo] = useState<EstadoEscudo>({ tipo: "esperando" });
  const [vuelta, setVuelta] = useState(0);

  const { limpiar } = useBorrador("entrar", null, { correo }, (g) => {
    if (g.correo) setCorreo(g.correo);
  });

  const entrar = async () => {
    const falta = faltaEnEntrada({ correo, clave });
    if (falta) return setError(falta);
    const cabeceras = cabeceraDelEscudo(escudo);
    if (!cabeceras)
      return setError(escudo.tipo === "error" ? "errorEscudo" : "comprobando");
    setError(null);
    setOcupado(true);
    try {
      const r = await authClient.signIn.email(
        { email: correo.trim().toLowerCase(), password: clave },
        { headers: cabeceras },
      );
      if (r.error) {
        setError(mensajeDeError(r.error.code, r.error.status));
        return;
      }
      await limpiar();
      setClave("");
      router.back();
    } catch {
      setError("errorGeneral");
    } finally {
      setOcupado(false);
      setEscudo({ tipo: "esperando" });
      setVuelta((n) => n + 1);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.cuerpo}
        keyboardShouldPersistTaps="handled"
      >
        <Etiqueta>{texto(idioma, "correo")}</Etiqueta>
        <Campo
          value={correo}
          onChangeText={setCorreo}
          placeholder={texto(idioma, "correo")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Etiqueta>{texto(idioma, "clave")}</Etiqueta>
        <CampoClave
          value={clave}
          onChangeText={setClave}
          placeholder={texto(idioma, "clave")}
          autoComplete="current-password"
          textContentType="password"
          etiquetaVer={texto(idioma, "verClave")}
          etiquetaOcultar={texto(idioma, "ocultarClave")}
        />
        <Enlace
          texto={texto(idioma, "olvideClave")}
          onPress={() =>
            void WebBrowser.openBrowserAsync(
              `${API_BASE}/${idioma}/olvide-mi-clave`,
            )
          }
        />
        <Escudo idioma={idioma} vuelta={vuelta} alCambiar={setEscudo} />
        {error ? (
          <Aviso
            texto={texto(idioma, error)}
            tono={error === "comprobando" ? "info" : "error"}
          />
        ) : null}
        <BotonPrincipal
          texto={texto(idioma, "entrar")}
          onPress={entrar}
          ocupado={ocupado}
        />
        <Enlace
          texto={texto(idioma, "noTengoCuenta")}
          onPress={() => router.replace("/crear-cuenta")}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  cuerpo: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: "#FFFFFF",
    flexGrow: 1,
  },
});
