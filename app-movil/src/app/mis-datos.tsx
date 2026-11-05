import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CampoClave } from "@/components/campo-clave";
import {
  Aviso,
  BotonPrincipal,
  Campo,
  Etiqueta,
} from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { useBorrador } from "@/hooks/use-borrador";
import { authClient } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { problemaDeClave, nombreValido } from "@/lib/mis-datos";
import { texto, type ClaveDeTexto } from "@/lib/textos";

type Mensaje = {
  clave: ClaveDeTexto;
  tono: "error" | "info" | "bien";
} | null;

/**
 * MIS DATOS: el nombre, el correo y la contraseña de la cuenta.
 *
 * El nombre se guarda con la acción oficial de las cuentas (la puerta del
 * servidor revisa lo que llega: `lib/cuenta/cambio-de-datos.ts`) y su borrador
 * solo existe si es distinto del guardado. La contraseña se cambia igual que
 * en la web: pidiendo la actual y cerrando la sesión en los demás aparatos.
 * Las contraseñas nunca van al borrador.
 */
export default function MisDatos() {
  const { idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const guardado = sesion?.user?.name ?? "";
  const [nombre, setNombre] = useState(guardado);
  const [avisoNombre, setAvisoNombre] = useState<Mensaje>(null);
  const [guardando, setGuardando] = useState(false);

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [avisoClave, setAvisoClave] = useState<Mensaje>(null);
  const [cambiando, setCambiando] = useState(false);

  /* Cuando llega la sesión, el nombre de la cuenta (si no hay borrador). */
  const [tocado, setTocado] = useState(false);
  useEffect(() => {
    if (!tocado) setNombre(guardado);
  }, [guardado, tocado]);

  const { recuperado, limpiar } = useBorrador(
    "mis-datos",
    sesion?.user?.id,
    { nombre: nombre.trim() === guardado.trim() ? "" : nombre },
    (g) => {
      if (g.nombre) {
        setTocado(true);
        setNombre(g.nombre);
      }
    },
  );

  const guardarNombre = async () => {
    if (!nombreValido(nombre)) {
      return setAvisoNombre({ clave: "nombreNoValido", tono: "error" });
    }
    setGuardando(true);
    setAvisoNombre(null);
    const { error } = await authClient.updateUser({ name: nombre.trim() });
    setGuardando(false);
    if (error) return setAvisoNombre({ clave: "errorGeneral", tono: "error" });
    await limpiar();
    setTocado(false);
    setAvisoNombre({ clave: "nombreGuardado", tono: "bien" });
  };

  const cambiarClave = async () => {
    const problema = problemaDeClave(actual, nueva, repetida);
    if (problema) return setAvisoClave({ clave: problema, tono: "error" });
    setCambiando(true);
    setAvisoClave(null);
    const { error } = await authClient.changePassword({
      currentPassword: actual,
      newPassword: nueva,
      /* Esta sesión sigue; las demás se cierran, por si alguien la vio. */
      revokeOtherSessions: true,
    });
    setCambiando(false);
    if (error) return setAvisoClave({ clave: "claveActualMal", tono: "error" });
    setActual("");
    setNueva("");
    setRepetida("");
    setAvisoClave({ clave: "claveCambiada", tono: "bien" });
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
        <View style={estilos.grupo}>
          {recuperado ? (
            <Aviso texto={texto(idioma, "borradorRecuperado")} tono="info" />
          ) : null}
          <Etiqueta>{texto(idioma, "nombre")}</Etiqueta>
          <Campo
            value={nombre}
            onChangeText={(v) => {
              setTocado(true);
              setNombre(v);
            }}
            placeholder={texto(idioma, "nombre")}
            autoComplete="name"
            textContentType="name"
          />
          <Etiqueta>{texto(idioma, "correo")}</Etiqueta>
          <Text style={estilos.correo} selectable>
            {sesion?.user?.email ?? ""}
          </Text>
          <Text style={estilos.ayuda}>{texto(idioma, "correoNoCambia")}</Text>
          {avisoNombre ? (
            <Aviso
              texto={texto(idioma, avisoNombre.clave)}
              tono={avisoNombre.tono}
            />
          ) : null}
          <BotonPrincipal
            texto={texto(idioma, "guardarCambios")}
            onPress={guardarNombre}
            ocupado={guardando}
          />
        </View>

        <View style={estilos.grupo}>
          <Text style={estilos.titulo}>{texto(idioma, "cambiarClave")}</Text>
          <Text style={estilos.ayuda}>
            {texto(idioma, "cambiarClaveTexto")}
          </Text>
          <Etiqueta>{texto(idioma, "claveActual")}</Etiqueta>
          <CampoClave
            value={actual}
            onChangeText={setActual}
            placeholder={texto(idioma, "claveActual")}
            autoComplete="current-password"
            textContentType="password"
            etiquetaVer={texto(idioma, "verClave")}
            etiquetaOcultar={texto(idioma, "ocultarClave")}
          />
          <Etiqueta>{texto(idioma, "claveNueva")}</Etiqueta>
          <CampoClave
            value={nueva}
            onChangeText={setNueva}
            placeholder={texto(idioma, "claveAyuda")}
            autoComplete="new-password"
            textContentType="newPassword"
            etiquetaVer={texto(idioma, "verClave")}
            etiquetaOcultar={texto(idioma, "ocultarClave")}
          />
          <Etiqueta>{texto(idioma, "claveRepetida")}</Etiqueta>
          <CampoClave
            value={repetida}
            onChangeText={setRepetida}
            placeholder={texto(idioma, "claveRepetida")}
            autoComplete="new-password"
            textContentType="newPassword"
            etiquetaVer={texto(idioma, "verClave")}
            etiquetaOcultar={texto(idioma, "ocultarClave")}
          />
          {avisoClave ? (
            <Aviso
              texto={texto(idioma, avisoClave.clave)}
              tono={avisoClave.tono}
            />
          ) : null}
          <BotonPrincipal
            texto={texto(idioma, "cambiarClave")}
            onPress={cambiarClave}
            ocupado={cambiando}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  cuerpo: { padding: 16, gap: 16, paddingBottom: 48 },
  grupo: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  titulo: { fontSize: 17, fontWeight: "700", color: COLORES.texto },
  correo: { fontSize: 15, color: COLORES.texto, paddingVertical: 6 },
  ayuda: { fontSize: 13, color: COLORES.gris, marginTop: 4, marginBottom: 4 },
});
