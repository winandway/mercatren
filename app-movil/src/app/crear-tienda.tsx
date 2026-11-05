import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
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
  Enlace,
  Etiqueta,
} from "@/components/formulario";
import { usePreferencias } from "@/contexto/preferencias";
import { useBorrador } from "@/hooks/use-borrador";
import { useMiTienda } from "@/hooks/use-mi-tienda";
import { API_BASE, pedirJson, urlPaises, type Pais } from "@/lib/api";
import { authClient, cabeceraDeSesion } from "@/lib/auth-client";
import { bandera, COLORES } from "@/lib/colores";
import {
  cuerpoDelAlta,
  faltaEnTienda,
  urlMiTienda,
  type DatosTienda,
} from "@/lib/tienda";
import { texto, type ClaveDeTexto } from "@/lib/textos";

const VACIO: DatosTienda = {
  nombre: "",
  razonSocial: "",
  identificacionFiscal: "",
  correoContacto: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  paisOrigen: "",
  descripcionEs: "",
};

/**
 * CREAR LA TIENDA DESDE LA APP, con la MISMA alta de la web: los datos de la
 * empresa son obligatorios (las ventas se facturan a su nombre) y se firman
 * los términos. La tienda nace activa, en el país de la app. Lo escrito se
 * guarda solo y vuelve si la app se cierra.
 */
export default function CrearTienda() {
  const { pais, idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const { documento, tienda, recargar } = useMiTienda(pais, idioma);
  const [d, setD] = useState<DatosTienda>({ ...VACIO, paisOrigen: pais ?? "" });
  const [acepta, setAcepta] = useState(false);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [error, setError] = useState<{
    clave?: ClaveDeTexto;
    mensaje?: string;
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [lista, setLista] = useState(false);

  const { recuperado, limpiar } = useBorrador(
    "crear-tienda",
    sesion?.user?.id,
    d,
    (g) => setD((antes) => ({ ...antes, ...g })),
  );

  /* El correo de contacto arranca con el de la cuenta: casi siempre es ese. */
  useEffect(() => {
    if (sesion?.user?.email) {
      setD((antes) =>
        antes.correoContacto
          ? antes
          : { ...antes, correoContacto: sesion.user.email },
      );
    }
  }, [sesion?.user?.email]);

  useEffect(() => {
    pedirJson<{ paises: Pais[] }>(urlPaises(idioma))
      .then((r) => setPaises(r.paises))
      .catch(() => undefined);
  }, [idioma]);

  const poner = (campo: keyof DatosTienda) => (valor: string) =>
    setD((antes) => ({ ...antes, [campo]: valor }));

  const crear = async () => {
    if (!pais) return;
    const falta = faltaEnTienda(d, acepta);
    if (falta) return setError({ clave: falta });
    setError(null);
    setOcupado(true);
    try {
      const r = await fetch(urlMiTienda(pais, idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify(cuerpoDelAlta(d, acepta)),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
      } | null;
      if (r.status === 401) return setError({ clave: "entraParaVender" });
      if (!r.ok || !cuerpo?.ok) {
        return setError(
          cuerpo?.mensaje
            ? { mensaje: cuerpo.mensaje }
            : { clave: "errorGeneral" },
        );
      }
      await limpiar();
      recargar();
      setLista(true);
    } catch {
      setError({ clave: "errorGeneral" });
    } finally {
      setOcupado(false);
    }
  };

  if (!sesion?.user) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.ayuda}>{texto(idioma, "entraParaVender")}</Text>
        <BotonPrincipal
          texto={texto(idioma, "crearCuenta")}
          onPress={() => router.replace("/crear-cuenta")}
        />
        <Enlace
          texto={texto(idioma, "entrar")}
          onPress={() => router.replace("/entrar")}
        />
      </View>
    );
  }

  if (lista || tienda) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.lista}>
          {texto(idioma, lista ? "tiendaLista" : "tuTiendaAbierta")}
        </Text>
        {tienda ? <Text style={estilos.ayuda}>{tienda.nombre}</Text> : null}
        <Text style={estilos.ayuda}>{texto(idioma, "tiendaListaTexto")}</Text>
        <BotonPrincipal
          texto={texto(idioma, "primerProducto")}
          onPress={() => router.replace("/nuevo-producto")}
        />
        <Enlace
          texto={texto(idioma, "volverInicio")}
          onPress={() => router.back()}
        />
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
                setD({ ...VACIO, paisOrigen: pais ?? "" });
                void limpiar();
              }}
            >
              <Text style={estilos.recuperadoBoton}>
                {texto(idioma, "empezarDeNuevo")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={estilos.ayuda}>{texto(idioma, "datosEmpresa")}</Text>

        <Etiqueta>{texto(idioma, "nombreTienda")}</Etiqueta>
        <Campo
          value={d.nombre}
          onChangeText={poner("nombre")}
          placeholder={texto(idioma, "nombreTienda")}
        />

        <Etiqueta>{texto(idioma, "razonSocial")}</Etiqueta>
        <Campo
          value={d.razonSocial}
          onChangeText={poner("razonSocial")}
          placeholder={texto(idioma, "razonSocial")}
          autoComplete="organization"
          textContentType="organizationName"
        />

        <Etiqueta>{documento?.nombre ?? ""}</Etiqueta>
        <Campo
          value={d.identificacionFiscal}
          onChangeText={poner("identificacionFiscal")}
          placeholder={documento?.ejemplo ?? documento?.nombre ?? ""}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Etiqueta>{texto(idioma, "correoContacto")}</Etiqueta>
        <Campo
          value={d.correoContacto}
          onChangeText={poner("correoContacto")}
          placeholder={texto(idioma, "correoContacto")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Etiqueta>{texto(idioma, "telefono")}</Etiqueta>
        <Campo
          value={d.telefono}
          onChangeText={poner("telefono")}
          placeholder={texto(idioma, "telefono")}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        <Etiqueta>{texto(idioma, "direccion")}</Etiqueta>
        <Campo
          value={d.direccion}
          onChangeText={poner("direccion")}
          placeholder={texto(idioma, "direccion")}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
        />

        <Etiqueta>{texto(idioma, "ciudad")}</Etiqueta>
        <Campo
          value={d.ciudad}
          onChangeText={poner("ciudad")}
          placeholder={texto(idioma, "ciudad")}
          textContentType="addressCity"
        />

        <Etiqueta>{texto(idioma, "paisOrigen")}</Etiqueta>
        <View style={estilos.paises}>
          {paises.map((p) => (
            <Pressable
              key={p.codigo}
              accessibilityRole="radio"
              accessibilityState={{ checked: d.paisOrigen === p.codigo }}
              onPress={() => poner("paisOrigen")(p.codigo)}
              style={[
                estilos.pais,
                d.paisOrigen === p.codigo && estilos.paisMarcado,
              ]}
            >
              <Text style={estilos.paisTexto}>
                {bandera(p.codigo)} {p.nombre}
              </Text>
            </Pressable>
          ))}
        </View>

        <Etiqueta>{texto(idioma, "descripcionTienda")}</Etiqueta>
        <Campo
          value={d.descripcionEs}
          onChangeText={poner("descripcionEs")}
          placeholder={texto(idioma, "descripcionTienda")}
          multiline
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acepta }}
          onPress={() => setAcepta((v) => !v)}
          style={estilos.acepto}
        >
          <View style={[estilos.casilla, acepta && estilos.casillaMarcada]}>
            {acepta ? <Text style={estilos.palomita}>✓</Text> : null}
          </View>
          <Text style={estilos.aceptoTexto}>
            {texto(idioma, "aceptoTerminos")}
          </Text>
        </Pressable>
        <Enlace
          texto={texto(idioma, "leerTerminos")}
          onPress={() =>
            void WebBrowser.openBrowserAsync(`${API_BASE}/${idioma}/terminos`)
          }
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
          texto={texto(idioma, "crearTienda")}
          onPress={crear}
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
  centro: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  ayuda: {
    fontSize: 15,
    color: COLORES.gris,
    lineHeight: 21,
    textAlign: "center",
  },
  lista: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORES.verde,
    textAlign: "center",
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
  paises: { gap: 8 },
  pais: {
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    borderRadius: 10,
    padding: 12,
  },
  paisMarcado: {
    borderColor: COLORES.naranja,
    borderWidth: 2,
    backgroundColor: "#FFF4ED",
  },
  paisTexto: { fontSize: 15, color: COLORES.texto },
  acepto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  casilla: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORES.gris,
    alignItems: "center",
    justifyContent: "center",
  },
  casillaMarcada: {
    borderColor: COLORES.naranja,
    backgroundColor: COLORES.naranja,
  },
  palomita: { color: "#FFFFFF", fontWeight: "800" },
  aceptoTexto: { flex: 1, fontSize: 14, color: COLORES.texto },
});
