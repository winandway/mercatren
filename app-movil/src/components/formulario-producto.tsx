import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { absoluta, pedirJson } from "@/lib/api";
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
import {
  igualQueLoGuardado,
  urlFotoDeMiProducto,
  urlMiProducto,
  type ProductoParaEditar,
} from "@/lib/ventas";

const VACIO: DatosProducto = {
  tituloEs: "",
  tituloEn: "",
  descripcionEs: "",
  descripcionEn: "",
  precio: "",
  existencias: "",
};
/* Hoy solo vende Estados Unidos; al editar, la moneda viene del producto. */
const MONEDA = "USD";

type FotoGuardada = { id: string; url: string | null };
type Fallo = { clave?: ClaveDeTexto; mensaje?: string } | null;

/**
 * EL FORMULARIO DE UN PRODUCTO, PARA SUBIRLO O PARA EDITARLO (una sola pieza).
 *
 * Fotos (cámara o galería, achicadas en el teléfono), nombre y descripción en
 * los dos idiomas, y el precio del comercio con el precio que verá el
 * comprador al lado. Se guarda con la MISMA acción de la web.
 *
 * Lo escrito se guarda solo mientras se escribe (regla de la casa). Al editar,
 * el borrador solo existe si hay algo distinto de lo guardado: abrir un
 * producto y salir sin tocar nada no deja un «Recuperamos lo que estabas
 * escribiendo» falso para la próxima vez.
 */
export function FormularioProducto({ id }: { id?: string }) {
  const editando = Boolean(id);
  const { pais, idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const [d, setD] = useState<DatosProducto>(VACIO);
  const [guardado, setGuardado] = useState<DatosProducto | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [moneda, setMoneda] = useState(MONEDA);
  const [fotosGuardadas, setFotosGuardadas] = useState<FotoGuardada[]>([]);
  const [fotos, setFotos] = useState<FotoLista[]>([]);
  const [error, setError] = useState<Fallo>(null);
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(editando);
  const hayBorrador = useRef(false);

  const { recuperado, limpiar } = useBorrador(
    editando ? `editar-producto:${id}` : "nuevo-producto",
    sesion?.user?.id,
    /* Al editar, sin cambios no hay borrador que guardar. */
    editando && igualQueLoGuardado(d, guardado) ? VACIO : d,
    (g) => {
      hayBorrador.current = true;
      setD((antes) => ({ ...antes, ...g }));
    },
  );

  /* Al editar: lo guardado en el servidor. Si había un borrador, manda él. */
  useEffect(() => {
    if (!id || !pais) return;
    let vivo = true;
    pedirJson<{ producto: ProductoParaEditar }>(
      urlMiProducto(id, pais, idioma),
      fetch,
      { headers: cabeceraDeSesion() },
    )
      .then(({ producto: p }) => {
        if (!vivo) return;
        const servidor: DatosProducto = {
          tituloEs: p.tituloEs,
          tituloEn: p.tituloEn,
          descripcionEs: p.descripcionEs,
          descripcionEn: p.descripcionEn,
          precio: p.precio,
          existencias: p.existencias,
        };
        setGuardado(servidor);
        if (!hayBorrador.current) setD(servidor);
        setEstado(p.estado);
        setMoneda(p.moneda);
        setFotosGuardadas(p.fotos);
      })
      .catch(() => vivo && setError({ clave: "errorGeneral" }))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
    // El idioma cambia los textos, no el producto: no se vuelve a pedir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pais]);

  const poner = (campo: keyof DatosProducto) => (valor: string) =>
    setD((antes) => ({ ...antes, [campo]: valor }));
  const base = aCentavos(d.precio, moneda);
  const enTotal = fotosGuardadas.length + fotos.length;

  const sumar = async (fuente: "camara" | "galeria") => {
    const quedan = FOTOS_POR_PRODUCTO - enTotal;
    if (quedan <= 0) return;
    const r =
      fuente === "camara" ? await tomarFoto() : await elegirFotos(quedan);
    if (r === "sin-permiso") {
      return setError({
        clave: fuente === "camara" ? "permisoCamara" : "permisoFotos",
      });
    }
    setError(null);
    setFotos((antes) =>
      [...antes, ...r].slice(0, FOTOS_POR_PRODUCTO - fotosGuardadas.length),
    );
  };

  /* Quitar una foto que ya está en el producto: se pregunta y se quita ya. */
  const quitarGuardada = (foto: FotoGuardada) => {
    if (!id || !pais) return;
    if (enTotal <= 1) return setError({ clave: "ultimaFoto" });
    Alert.alert(texto(idioma, "quitarFotoPregunta"), undefined, [
      { text: texto(idioma, "cancelar"), style: "cancel" },
      {
        text: texto(idioma, "quitarFoto"),
        style: "destructive",
        onPress: () => {
          void fetch(urlFotoDeMiProducto(id, foto.id, pais, idioma), {
            method: "DELETE",
            headers: cabeceraDeSesion(),
          })
            .then(async (r) => {
              const cuerpo = (await r.json().catch(() => null)) as {
                ok?: boolean;
                mensaje?: string;
                motivo?: string;
              } | null;
              if (r.ok && cuerpo?.ok) {
                setFotosGuardadas((antes) =>
                  antes.filter((f) => f.id !== foto.id),
                );
                return;
              }
              setError(
                cuerpo?.motivo === "ultima_foto"
                  ? { clave: "ultimaFoto" }
                  : cuerpo?.mensaje
                    ? { mensaje: cuerpo.mensaje }
                    : { clave: "errorGeneral" },
              );
            })
            .catch(() => setError({ clave: "errorGeneral" }));
        },
      },
    ]);
  };

  const guardar = async () => {
    if (!pais) return;
    const falta = faltaEnProducto(d, enTotal, moneda);
    if (falta) return setError({ clave: falta });
    setError(null);
    setOcupado(true);
    try {
      const cuerpo = new FormData();
      for (const [campo, valor] of Object.entries(camposDelProducto(d)))
        cuerpo.append(campo, valor);
      for (const foto of fotos) cuerpo.append("fotos", parteDeFoto(foto));
      const r = await fetch(
        id ? urlMiProducto(id, pais, idioma) : urlMisProductos(pais, idioma),
        { method: "POST", headers: cabeceraDeSesion(), body: cuerpo },
      );
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
                    : respuesta?.motivo === "no_editable"
                      ? "productoNoEditable"
                      : "errorGeneral",
              },
        );
      }
      /* Guardado con éxito: el borrador ya no hace falta. */
      await limpiar();
      if (editando) router.back();
      else router.replace("/mi-tienda");
    } catch (fallo) {
      /* Que el motivo quede en el registro de la app, no solo «algo salió mal». */
      console.warn("[producto] no se pudo guardar:", fallo);
      setError({ clave: "errorGeneral" });
    } finally {
      setOcupado(false);
    }
  };

  /* Pausar la venta o volver a publicar, sin tocar lo demás. */
  const cambiarEstado = async () => {
    if (!id || !pais || !estado) return;
    const nuevo = estado === "publicado" ? "borrador" : "publicado";
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(urlMiProducto(id, pais, idioma), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({ estado: nuevo }),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
      } | null;
      if (r.ok && cuerpo?.ok) setEstado(nuevo);
      else
        setError(
          cuerpo?.mensaje
            ? { mensaje: cuerpo.mensaje }
            : { clave: "errorGeneral" },
        );
    } catch {
      setError({ clave: "errorGeneral" });
    } finally {
      setOcupado(false);
    }
  };

  if (cargando) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator color={COLORES.naranja} />
      </View>
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
        {recuperado ? (
          <View style={estilos.recuperado}>
            <Text style={estilos.recuperadoTexto}>
              {texto(idioma, "borradorRecuperado")}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                hayBorrador.current = false;
                setD(guardado ?? VACIO);
                void limpiar();
              }}
            >
              <Text style={estilos.recuperadoBoton}>
                {texto(idioma, "empezarDeNuevo")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {editando && estado && estado !== "publicado" ? (
          <Aviso texto={texto(idioma, "ventaPausada")} tono="info" />
        ) : null}

        <Etiqueta>{`${texto(idioma, "fotos")} (${enTotal}/${FOTOS_POR_PRODUCTO})`}</Etiqueta>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.fotos}
        >
          {fotosGuardadas.map((f) => (
            <View key={f.id} style={estilos.foto}>
              <Image
                source={{ uri: absoluta(f.url) ?? undefined }}
                style={estilos.fotoImagen}
                contentFit="cover"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={texto(idioma, "quitarFoto")}
                onPress={() => quitarGuardada(f)}
                style={estilos.quitar}
                hitSlop={8}
              >
                <Text style={estilos.quitarTexto}>×</Text>
              </Pressable>
            </View>
          ))}
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
            {precioTexto(precioPublicadoCentavos(base), moneda, idioma)}.
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
          texto={texto(idioma, editando ? "guardarCambios" : "publicar")}
          onPress={guardar}
          ocupado={ocupado}
        />
        {editando && estado ? (
          <Pressable
            accessibilityRole="button"
            disabled={ocupado}
            onPress={() => void cambiarEstado()}
            style={estilos.secundario}
          >
            <Text style={estilos.secundarioTexto}>
              {texto(
                idioma,
                estado === "publicado" ? "pausarVenta" : "volverAPublicar",
              )}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
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
  secundario: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secundarioTexto: { color: COLORES.texto, fontWeight: "600", fontSize: 15 },
});
