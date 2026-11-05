import { router } from "expo-router";
import { useEffect, useState } from "react";
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

import { Aviso, Campo, Enlace } from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { pedirJson } from "@/lib/api";
import { authClient, cabeceraDeSesion, salir } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import {
  confirmoElBorrado,
  palabraDeConfirmacion,
  textoDelPaso,
  urlBorrarCuenta,
  urlCerrarCuenta,
  type EstadoDelCierre,
  type PasoDelCierre,
} from "@/lib/productos";
import { texto } from "@/lib/textos";

/**
 * BORRAR LA CUENTA DENTRO DE LA APP (Apple 5.1.1(v)). Se llega desde el menú
 * de tres puntos de la cuenta, nunca con un botón a la vista, y se confirma
 * escribiendo la palabra.
 *
 * - Sin tienda: se borra en el acto (la MISMA acción de la web).
 * - Con tienda: se pide el CIERRE (la misma pieza que la web): la tienda deja
 *   de venderse ya, se termina lo pendiente y la cuenta se borra sola, con los
 *   pasos y los días a la vista. Nunca «escribe a soporte».
 */
export default function BorrarCuenta() {
  const { pais, idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const [cierre, setCierre] = useState<EstadoDelCierre | null>(null);
  const [palabra, setPalabra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [borrada, setBorrada] = useState(false);
  const listo = confirmoElBorrado(palabra);

  useEffect(() => {
    if (!pais) return;
    let vivo = true;
    pedirJson<EstadoDelCierre>(urlCerrarCuenta(pais, idioma), fetch, {
      headers: cabeceraDeSesion(),
    })
      .then((r) => vivo && setCierre(r))
      .catch(() => vivo && setCierre({ ok: true, conTienda: false }));
    return () => {
      vivo = false;
    };
  }, [pais, idioma]);

  const conTienda =
    cierre !== null && "conTienda" in cierre && cierre.conTienda;
  const pedido = conTienda && cierre.pedido;
  const pasos: PasoDelCierre[] = conTienda ? cierre.pasos : [];

  const confirmar = async () => {
    if (!listo || ocupado || !pais) return;
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(
        conTienda ? urlCerrarCuenta(pais, idioma) : urlBorrarCuenta(idioma),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...cabeceraDeSesion(),
          },
          body: JSON.stringify({ palabra }),
        },
      );
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
        borrada?: boolean;
        pasos?: PasoDelCierre[];
      } | null;
      if (!r.ok || !cuerpo?.ok) {
        setError(cuerpo?.mensaje ?? texto(idioma, "errorGeneral"));
        return;
      }
      if (conTienda && !cuerpo.borrada) {
        /* El cierre quedó pedido: la tienda ya no se vende; se enseña lo que falta. */
        setCierre({
          ok: true,
          conTienda: true,
          pedido: true,
          pasos: cuerpo.pasos ?? [],
        });
        return;
      }
      /* La cuenta ya no existe: se borra también la sesión del teléfono. */
      await salir();
      setBorrada(true);
    } catch {
      setError(texto(idioma, "errorGeneral"));
    } finally {
      setOcupado(false);
    }
  };

  if (borrada || (cierre && "borrada" in cierre && cierre.borrada)) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>{texto(idioma, "cuentaBorrada")}</Text>
        <Enlace
          texto={texto(idioma, "volverInicio")}
          onPress={() => router.dismissAll()}
        />
      </View>
    );
  }

  if (cierre === null) {
    return <ActivityIndicator style={estilos.centro} color={COLORES.naranja} />;
  }

  if (pedido) {
    return (
      <ScrollView contentContainerStyle={estilos.cuerpo}>
        <Text style={estilos.titulo}>{texto(idioma, "cierreEnCurso")}</Text>
        <Text style={estilos.texto}>{texto(idioma, "cierreEnCursoTexto")}</Text>
        {pasos.length ? (
          pasos.map((p) => (
            <Text key={p} style={estilos.paso}>
              • {texto(idioma, textoDelPaso(p))}
            </Text>
          ))
        ) : (
          <Text style={[estilos.paso, { color: COLORES.verde }]}>
            {texto(idioma, "cierreNada")}
          </Text>
        )}
        <Text style={estilos.legal}>{texto(idioma, "cierreLegal")}</Text>
        <Enlace
          texto={texto(idioma, "volverInicio")}
          onPress={() => router.back()}
        />
      </ScrollView>
    );
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
        <Text style={estilos.titulo}>
          {texto(idioma, conTienda ? "cierreTitulo" : "borrarCuenta")}
        </Text>
        {sesion?.user ? (
          <Text style={estilos.correo}>{sesion.user.email}</Text>
        ) : null}
        {conTienda ? (
          <>
            <Text style={estilos.texto}>{texto(idioma, "cierreTexto")}</Text>
            {(
              [
                "cierrePaso1",
                "cierrePaso2",
                "cierrePaso3",
                "cierrePaso4",
              ] as const
            ).map((paso, i) => (
              <Text key={paso} style={estilos.paso}>
                {i + 1}. {texto(idioma, paso)}
              </Text>
            ))}
            <Text style={estilos.legal}>{texto(idioma, "cierreLegal")}</Text>
          </>
        ) : (
          <Text style={estilos.texto}>
            {texto(idioma, "borrarCuentaTexto")}
          </Text>
        )}
        <Text style={estilos.etiqueta}>
          {texto(idioma, "borrarCuentaEscribe")}
        </Text>
        <Campo
          value={palabra}
          onChangeText={setPalabra}
          placeholder={palabraDeConfirmacion(idioma)}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {error ? <Aviso texto={error} tono="error" /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !listo || ocupado }}
          disabled={!listo || ocupado}
          onPress={confirmar}
          style={[estilos.boton, (!listo || ocupado) && { opacity: 0.4 }]}
        >
          <Text style={estilos.botonTexto}>
            {texto(idioma, conTienda ? "cierreBoton" : "borrarCuentaBoton")}
          </Text>
        </Pressable>
        <Enlace
          texto={texto(idioma, "cancelar")}
          onPress={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  cuerpo: { padding: 20, gap: 10, backgroundColor: "#FFFFFF", flexGrow: 1 },
  centro: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORES.texto,
    textAlign: "center",
  },
  correo: { fontSize: 15, color: COLORES.gris, textAlign: "center" },
  texto: { fontSize: 15, color: COLORES.texto, lineHeight: 21 },
  paso: { fontSize: 15, color: COLORES.texto, lineHeight: 21 },
  legal: { fontSize: 13, color: COLORES.gris, lineHeight: 18 },
  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORES.texto,
    marginTop: 8,
  },
  boton: {
    backgroundColor: COLORES.rojo,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  botonTexto: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
