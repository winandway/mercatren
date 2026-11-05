import { Image } from "expo-image";
import { router } from "expo-router";
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

import {
  Aviso,
  BotonPrincipal,
  Campo,
  Etiqueta,
} from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { useBorrador } from "@/hooks/use-borrador";
import { authClient, cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import {
  elegirFotos,
  parteDeFoto,
  tomarFoto,
  type FotoLista,
} from "@/lib/fotos";
import {
  aCentavos,
  camposDelProducto,
  faltaEnProducto,
  FOTOS_POR_PRODUCTO,
  precioPublicadoCentavos,
  urlMisProductos,
  type DatosProducto,
} from "@/lib/productos";
import { texto, type ClaveDeTexto } from "@/lib/textos";

const VACIO: DatosProducto = {
  tituloEs: "",
  tituloEn: "",
  descripcionEs: "",
  descripcionEn: "",
  precio: "",
  existencias: "",
};
/* Hoy solo vende Estados Unidos; cuando se encienda otro país, la moneda sale
   del país de la tienda (el servidor ya la pone al guardar). */
const MONEDA = "USD";

/**
 * SUBIR UN PRODUCTO CON LA CÁMARA: fotos (cámara o galería, achicadas en el
 * teléfono), nombre y descripción en los dos idiomas, y el precio del
 * comercio, con el precio que verá el comprador al lado. Se guarda con la
 * MISMA acción de la web. Los textos se guardan solos mientras se escribe.
 */
export default function NuevoProducto() {
  const { pais, idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const [d, setD] = useState<DatosProducto>(VACIO);
  const [fotos, setFotos] = useState<FotoLista[]>([]);
  const [error, setError] = useState<{
    clave?: ClaveDeTexto;
    mensaje?: string;
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const { recuperado, limpiar } = useBorrador(
    "nuevo-producto",
    sesion?.user?.id,
    d,
    (g) => setD((antes) => ({ ...antes, ...g })),
  );

  const poner = (campo: keyof DatosProducto) => (valor: string) =>
    setD((antes) => ({ ...antes, [campo]: valor }));
  const base = aCentavos(d.precio, MONEDA);

  const sumar = async (fuente: "camara" | "galeria") => {
    const quedan = FOTOS_POR_PRODUCTO - fotos.length;
    if (quedan <= 0) return;
    const r =
      fuente === "camara" ? await tomarFoto() : await elegirFotos(quedan);
    if (r === "sin-permiso") {
      return setError({
        clave: fuente === "camara" ? "permisoCamara" : "permisoFotos",
      });
    }
    setError(null);
    setFotos((antes) => [...antes, ...r].slice(0, FOTOS_POR_PRODUCTO));
  };

  const publicar = async () => {
    if (!pais) return;
    const falta = faltaEnProducto(d, fotos.length, MONEDA);
    if (falta) return setError({ clave: falta });
    setError(null);
    setOcupado(true);
    try {
      const cuerpo = new FormData();
      for (const [campo, valor] of Object.entries(camposDelProducto(d)))
        cuerpo.append(campo, valor);
      for (const foto of fotos) cuerpo.append("fotos", parteDeFoto(foto));
      const r = await fetch(urlMisProductos(pais, idioma), {
        method: "POST",
        headers: cabeceraDeSesion(),
        body: cuerpo,
      });
      const respuesta = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
        motivo?: string;
      } | null;
      if (!r.ok || !respuesta?.ok) {
        return setError(
          respuesta?.mensaje
            ? { mensaje: respuesta.mensaje }
            : {
                clave:
                  respuesta?.motivo === "sin_fotos"
                    ? "faltaFoto"
                    : "errorGeneral",
              },
        );
      }
      /* Guardado con éxito: el borrador ya no hace falta. */
      await limpiar();
      router.replace("/mi-tienda");
    } catch (fallo) {
      /* Que el motivo quede en el registro de la app, no solo «algo salió mal». */
      console.warn("[nuevo-producto] no se pudo publicar:", fallo);
      setError({ clave: "errorGeneral" });
    } finally {
      setOcupado(false);
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
        {recuperado ? (
          <View style={estilos.recuperado}>
            <Text style={estilos.recuperadoTexto}>
              {texto(idioma, "borradorRecuperado")}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setD(VACIO);
                void limpiar();
              }}
            >
              <Text style={estilos.recuperadoBoton}>
                {texto(idioma, "empezarDeNuevo")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Etiqueta>{`${texto(idioma, "fotos")} (${fotos.length}/${FOTOS_POR_PRODUCTO})`}</Etiqueta>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.fotos}
        >
          {fotos.map((f, i) => (
            <View key={f.uri} style={estilos.foto}>
              <Image
                source={{ uri: f.uri }}
                style={estilos.fotoImagen}
                contentFit="cover"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={texto(idioma, "quitarFoto")}
                onPress={() =>
                  setFotos((antes) => antes.filter((_, j) => j !== i))
                }
                style={estilos.quitar}
                hitSlop={8}
              >
                <Text style={estilos.quitarTexto}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View style={estilos.botonesFoto}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void sumar("camara")}
            style={estilos.botonFoto}
          >
            <Text style={estilos.botonFotoTexto}>
              {texto(idioma, "tomarFoto")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void sumar("galeria")}
            style={estilos.botonFoto}
          >
            <Text style={estilos.botonFotoTexto}>
              {texto(idioma, "elegirFotos")}
            </Text>
          </Pressable>
        </View>

        <Etiqueta>{texto(idioma, "tituloEsLabel")}</Etiqueta>
        <Campo
          value={d.tituloEs}
          onChangeText={poner("tituloEs")}
          placeholder={texto(idioma, "tituloEsLabel")}
        />
        <Etiqueta>{texto(idioma, "tituloEnLabel")}</Etiqueta>
        <Campo
          value={d.tituloEn}
          onChangeText={poner("tituloEn")}
          placeholder={texto(idioma, "tituloEnLabel")}
        />

        <Etiqueta>{texto(idioma, "precioLabel")}</Etiqueta>
        <Campo
          value={d.precio}
          onChangeText={poner("precio")}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {base ? (
          <Text style={estilos.ayuda}>
            {texto(idioma, "precioAyuda")}{" "}
            {precioTexto(precioPublicadoCentavos(base), MONEDA, idioma)}.
          </Text>
        ) : null}

        <Etiqueta>{texto(idioma, "existenciasLabel")}</Etiqueta>
        <Campo
          value={d.existencias}
          onChangeText={poner("existencias")}
          placeholder="0"
          keyboardType="number-pad"
        />

        <Etiqueta>{texto(idioma, "descripcionEsLabel")}</Etiqueta>
        <Campo
          value={d.descripcionEs}
          onChangeText={poner("descripcionEs")}
          placeholder={texto(idioma, "descripcionEsLabel")}
          multiline
          style={estilos.largo}
        />
        <Etiqueta>{texto(idioma, "descripcionEnLabel")}</Etiqueta>
        <Campo
          value={d.descripcionEn}
          onChangeText={poner("descripcionEn")}
          placeholder={texto(idioma, "descripcionEnLabel")}
          multiline
          style={estilos.largo}
        />

        {error ? (
          <Aviso
            texto={
              error.mensaje ?? texto(idioma, error.clave ?? "errorGeneral")
            }
            tono="error"
          />
        ) : null}
        <BotonPrincipal
          texto={texto(idioma, "publicar")}
          onPress={publicar}
          ocupado={ocupado}
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
    marginBottom: 8,
  },
  recuperadoTexto: { flex: 1, fontSize: 13, color: COLORES.azul },
  recuperadoBoton: { fontSize: 13, fontWeight: "700", color: COLORES.naranja },
  fotos: { gap: 10, paddingVertical: 4 },
  foto: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  fotoImagen: { width: "100%", height: "100%" },
  quitar: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  quitarTexto: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "700",
  },
  botonesFoto: { flexDirection: "row", gap: 10, marginTop: 8 },
  botonFoto: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORES.azul,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botonFotoTexto: { color: COLORES.azul, fontWeight: "700", fontSize: 15 },
  ayuda: { fontSize: 13, color: COLORES.gris, marginTop: 6 },
  largo: { minHeight: 80, textAlignVertical: "top" },
});
