import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import { urlLegal, type PaginaLegal } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { bandera, COLORES } from "@/lib/colores";
import { faltaEnAlta, mensajeDeError } from "@/lib/cuentas";
import { cabeceraDelEscudo, type EstadoEscudo } from "@/lib/escudo";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/**
 * CREAR CUENTA: nombre, correo y contraseña. La cuenta nace con el país que la
 * persona eligió en la bienvenida (de ahí sale su moneda) y con su idioma.
 * Lo escrito se guarda solo (menos la contraseña) y vuelve si la app se cierra.
 */
export default function CrearCuenta() {
  const { pais, idioma } = usePreferencias();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<ClaveDeTexto | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [escudo, setEscudo] = useState<EstadoEscudo>({ tipo: "esperando" });
  const [vuelta, setVuelta] = useState(0);

  const { recuperado, limpiar } = useBorrador(
    "crear-cuenta",
    null,
    { nombre, correo },
    (g) => {
      if (g.nombre) setNombre(g.nombre);
      if (g.correo) setCorreo(g.correo);
    },
  );

  const crear = async () => {
    const falta = faltaEnAlta({ nombre, correo, clave });
    if (falta) return setError(falta);
    const cabeceras = cabeceraDelEscudo(escudo);
    if (!cabeceras)
      return setError(escudo.tipo === "error" ? "errorEscudo" : "comprobando");
    setError(null);
    setOcupado(true);
    try {
      const r = await authClient.signUp.email(
        {
          name: nombre.trim(),
          email: correo.trim().toLowerCase(),
          password: clave,
          idioma,
          paisEntrega: pais ?? undefined,
        },
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

  const abrir = (ruta: PaginaLegal) => {
    void WebBrowser.openBrowserAsync(urlLegal(pais, idioma, ruta));
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
        {recuperado ? (
          <View style={estilos.recuperado}>
            <Text style={estilos.recuperadoTexto}>
              {texto(idioma, "borradorRecuperado")}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setNombre("");
                setCorreo("");
                void limpiar();
              }}
            >
              <Text style={estilos.recuperadoBoton}>
                {texto(idioma, "empezarDeNuevo")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Etiqueta>{texto(idioma, "nombre")}</Etiqueta>
        <Campo
          value={nombre}
          onChangeText={setNombre}
          placeholder={texto(idioma, "nombre")}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />

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
          placeholder={texto(idioma, "claveAyuda")}
          autoComplete="new-password"
          textContentType="newPassword"
          etiquetaVer={texto(idioma, "verClave")}
          etiquetaOcultar={texto(idioma, "ocultarClave")}
        />

        <Etiqueta>{texto(idioma, "paisDeLaCuenta")}</Etiqueta>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/cambiar-pais")}
          style={estilos.pais}
        >
          <Text style={estilos.paisTexto}>
            {pais ? `${bandera(pais)}  ${pais}` : ""}
          </Text>
          <Text style={estilos.paisCambiar}>
            {texto(idioma, "cambiarPais")}
          </Text>
        </Pressable>

        <Escudo idioma={idioma} vuelta={vuelta} alCambiar={setEscudo} />

        {error ? (
          <Aviso
            texto={texto(idioma, error)}
            tono={error === "comprobando" ? "info" : "error"}
          />
        ) : null}

        <BotonPrincipal
          texto={texto(idioma, "crearCuenta")}
          onPress={crear}
          ocupado={ocupado}
        />

        <Text style={estilos.legal}>{texto(idioma, "alCrear")}</Text>
        <View style={estilos.legales}>
          <Enlace
            texto={texto(idioma, "terminos")}
            onPress={() => abrir("terminos")}
          />
          <Enlace
            texto={texto(idioma, "privacidad")}
            onPress={() => abrir("privacidad")}
          />
        </View>

        <Enlace
          texto={texto(idioma, "yaTengoCuenta")}
          onPress={() => router.replace("/entrar")}
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
  recuperado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 10,
  },
  recuperadoTexto: { flex: 1, fontSize: 13, color: COLORES.azul },
  recuperadoBoton: { fontSize: 13, fontWeight: "700", color: COLORES.naranja },
  pais: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  paisTexto: { fontSize: 16, color: COLORES.texto },
  paisCambiar: { fontSize: 14, fontWeight: "600", color: COLORES.azul },
  legal: {
    fontSize: 12,
    color: COLORES.gris,
    textAlign: "center",
    marginTop: 14,
  },
  legales: { flexDirection: "row", justifyContent: "center", gap: 18 },
});
