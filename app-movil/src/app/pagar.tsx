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
  Etiqueta,
} from "@/components/formulario";
import { useCarrito } from "@/contexto/carrito";
import { usePreferencias } from "@/contexto/preferencias";
import { SelectorLista } from "@/components/selector-lista";
import { useBorrador } from "@/hooks/use-borrador";
import { pedirJson, urlPagarPedido, urlPedido } from "@/lib/api";
import { authClient, cabeceraDeSesion } from "@/lib/auth-client";
import { lineasParaElPedido, totalCentavos } from "@/lib/carrito";
import { cobrarConHoja } from "@/lib/cobrar";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import {
  ENTREGA_US,
  faltaEnEntrega,
  entregaParaElPedido,
  metodosDeRespaldo,
  metodosLeidos,
  siguientePaso,
  totalZelleEstimado,
  urlEntrega,
  urlMetodos,
  type ConfigEntrega,
  type DatosEntrega,
  type MetodoApp,
  type RespuestaDePago,
} from "@/lib/pago";
import { texto, type ClaveDeTexto } from "@/lib/textos";

const VACIO: DatosEntrega = {
  nombre: "",
  telefono: "",
  direccion: "",
  direccion2: "",
  ciudad: "",
  estado: "",
  codigoPostal: "",
};

/**
 * PAGAR: la dirección de entrega y el método. El pedido lo crea el servidor
 * con la MISMA acción de la web (precio, existencia y pausa leídos de la
 * base); la app solo manda qué productos, cuántos y con qué se paga.
 *
 * ══ 8 nov 2026: NADA COBRA SIN PROBAR ══
 * La hoja de tarjeta de Stripe solo la ve el equipo (prueba 9). El público
 * paga con Zelle en la web: el pedido se crea y se abre en el navegador su
 * página de pago en la web del país, la misma que ya usa mercatren.com.ve.
 */
export default function Pagar() {
  const { pais, idioma } = usePreferencias();
  const { data: sesion } = authClient.useSession();
  const { lineas, vaciar } = useCarrito();
  const [d, setD] = useState<DatosEntrega>({
    ...VACIO,
    nombre: sesion?.user?.name ?? "",
  });
  const [error, setError] = useState<{
    clave?: ClaveDeTexto;
    mensaje?: string;
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  /* Cómo se entrega en este país (dirección o retiro, y su lista de estados
     o provincias): sale del servidor, la misma fuente que la web. */
  const [entrega, setEntrega] = useState<ConfigEntrega>(ENTREGA_US);
  useEffect(() => {
    if (!pais) return;
    let vivo = true;
    pedirJson<{ entrega: ConfigEntrega }>(urlEntrega(pais, idioma))
      .then((r) => vivo && setEntrega(r.entrega))
      .catch((fallo: unknown) => console.warn("[pagar] entrega", fallo));
    return () => {
      vivo = false;
    };
  }, [pais, idioma]);
  function pide(campo: string) {
    return entrega.campos.find((c) => c.nombre === campo);
  }
  const [hecho, setHecho] = useState<{
    numero: string;
    pagado: boolean;
    enLaWeb?: boolean;
  } | null>(null);
  /* Con qué puede pagar esta persona aquí: lo dice el servidor (la tarjeta
     de la app solo para el equipo). Mientras llega, solo Zelle donde existe. */
  const respaldo: MetodoApp[] = metodosDeRespaldo(pais);
  const primero: MetodoApp | null = respaldo[0] ?? null;
  const [metodos, setMetodos] = useState(respaldo);
  const [zelleMinimo, setZelleMinimo] = useState(20_000);
  const [metodo, setMetodo] = useState(primero);
  useEffect(() => {
    if (!pais) return;
    let vivo = true;
    pedirJson<{ metodos: unknown; zelleMinimoCentavos?: number }>(
      urlMetodos(pais, idioma),
      fetch,
      { headers: cabeceraDeSesion() },
    )
      .then((r) => {
        if (!vivo) return;
        const leidos = metodosLeidos(r.metodos);
        setMetodos(leidos);
        setMetodo((antes) =>
          antes && leidos.includes(antes) ? antes : (leidos[0] ?? null),
        );
        if (typeof r.zelleMinimoCentavos === "number")
          setZelleMinimo(r.zelleMinimoCentavos);
      })
      .catch((fallo: unknown) => console.warn("[pagar] métodos", fallo));
    return () => {
      vivo = false;
    };
  }, [pais, idioma]);

  const { recuperado, limpiar } = useBorrador(
    /* Uno por PAÍS: la dirección de Madrid no sirve para retirar en
       Maracaibo, y se colaba al cambiar de país (5 nov 2026). */
    `pagar-${pais}`,
    sesion?.user?.id,
    d,
    (g) => setD((antes) => ({ ...antes, ...g })),
  );
  /* Al corregir, el aviso de lo que faltaba se va: dejarlo en rojo encima de
     un dato ya bien escrito hace creer que sigue mal. */
  const poner = (campo: keyof DatosEntrega) => (v: string) => {
    setError(null);
    setD((a) => ({ ...a, [campo]: v }));
  };
  const moneda = lineas[0]?.precio.moneda ?? "USD";
  const conZelle = metodo === "zelle";
  const totalAMostrar = conZelle
    ? totalZelleEstimado(lineas)
    : totalCentavos(lineas);

  /* Abre en el navegador la página de pago del pedido (Zelle en la web).
     Si el enlace que vino con el pedido ya se usó, se pide uno nuevo. */
  const abrirPagoEnLaWeb = async (numero: string, url?: string) => {
    let destino = url;
    if (!destino && pais) {
      const r = await fetch(urlPagarPedido(pais, idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({ numero }),
      }).catch(() => null);
      const respuesta: RespuestaDePago = await r?.json().catch(() => null);
      const paso = siguientePaso(respuesta ?? null);
      if (paso.tipo === "web") destino = paso.url;
    }
    if (!destino) return setError({ clave: "pagoNoDisponible" });
    await WebBrowser.openBrowserAsync(destino);
  };

  const pagar = async () => {
    if (!pais || !lineas.length || !metodo) return;
    const falta = faltaEnEntrega(d, entrega);
    if (falta) return setError({ clave: falta });
    setError(null);
    setOcupado(true);
    try {
      const r = await fetch(urlPedido(pais, idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({
          entrega: entregaParaElPedido(d, entrega),
          lineas: lineasParaElPedido(lineas),
          metodoPago: metodo,
        }),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
        numero?: string;
        pagoEnLaWeb?: string | null;
        pago?: {
          clientSecret?: string;
          clavePublica?: string;
          sinConfigurar?: boolean;
        };
      } | null;
      if (r.status === 401) return setError({ clave: "entraParaComprar" });
      /* El país se apagó mientras tanto (o nunca estuvo encendido): se dice
         claro, no un «algo salió mal». */
      if (r.status === 403) return setError({ clave: "paisApagado" });
      if (!r.ok || !cuerpo?.ok || !cuerpo.numero) {
        return setError(
          cuerpo?.mensaje
            ? { mensaje: cuerpo.mensaje }
            : { clave: "errorGeneral" },
        );
      }
      /* El pedido ya existe: el carrito y el borrador ya no hacen falta. */
      vaciar();
      await limpiar();
      const paso = siguientePaso(cuerpo);
      if (paso.tipo === "web") {
        setHecho({ numero: cuerpo.numero, pagado: false, enLaWeb: true });
        await abrirPagoEnLaWeb(cuerpo.numero, paso.url);
        return;
      }
      if (paso.tipo !== "hoja") {
        setHecho({ numero: cuerpo.numero, pagado: false });
        return setError({ clave: "pagoNoDisponible" });
      }
      const cobro = await cobrarConHoja(paso, d.nombre.trim());
      if (cobro.tipo !== "pagado") {
        setHecho({ numero: cuerpo.numero, pagado: false });
        return setError(
          cobro.tipo === "cancelado"
            ? { clave: "pagoCancelado" }
            : { mensaje: cobro.mensaje },
        );
      }
      setHecho({ numero: cuerpo.numero, pagado: true });
    } catch {
      setError({ clave: "errorGeneral" });
    } finally {
      setOcupado(false);
    }
  };

  if (hecho?.pagado) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.listo}>{texto(idioma, "pedidoPagado")}</Text>
        <Text style={estilos.ayuda}>{hecho.numero}</Text>
        <Text style={estilos.ayuda}>{texto(idioma, "pedidoPagadoTexto")}</Text>
        <BotonPrincipal
          texto={texto(idioma, "misPedidos")}
          onPress={() => router.replace("/mis-pedidos")}
        />
      </View>
    );
  }

  if (hecho) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.titulo}>{texto(idioma, "pedidoCreado")}</Text>
        <Text style={estilos.ayuda}>{hecho.numero}</Text>
        {hecho.enLaWeb ? (
          <>
            <Text style={estilos.ayuda}>
              {texto(idioma, "pagarEnLaWebTexto")}
            </Text>
            <BotonPrincipal
              texto={texto(idioma, "pagarEnLaWeb")}
              onPress={() => void abrirPagoEnLaWeb(hecho.numero)}
            />
          </>
        ) : null}
        {error ? (
          <Aviso
            texto={
              error.mensaje ?? texto(idioma, error.clave ?? "errorGeneral")
            }
            tono="error"
          />
        ) : null}
        <BotonPrincipal
          texto={texto(idioma, "misPedidos")}
          onPress={() => router.replace("/mis-pedidos")}
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
        <Text style={estilos.subtitulo}>
          {texto(
            idioma,
            entrega.forma === "retiro" ? "retiroTitulo" : "entregaTitulo",
          )}
        </Text>
        <Etiqueta>{texto(idioma, "nombre")}</Etiqueta>
        <Campo
          value={d.nombre}
          onChangeText={poner("nombre")}
          placeholder={texto(idioma, "nombre")}
          autoComplete="name"
          textContentType="name"
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
        {entrega.forma === "retiro" ? (
          <Aviso texto={texto(idioma, "retiroAviso")} tono="info" />
        ) : null}
        {pide("direccion") ? (
          <>
            <Etiqueta>{texto(idioma, "direccion1")}</Etiqueta>
            <Campo
              value={d.direccion}
              onChangeText={poner("direccion")}
              placeholder={texto(idioma, "direccion1")}
              autoComplete="street-address"
              textContentType="streetAddressLine1"
            />
          </>
        ) : null}
        {pide("direccion2") ? (
          <>
            <Etiqueta>
              {texto(idioma, etiquetaDeDireccion2(entrega.pais))}
            </Etiqueta>
            <Campo
              value={d.direccion2}
              onChangeText={poner("direccion2")}
              placeholder={texto(idioma, etiquetaDeDireccion2(entrega.pais))}
              textContentType="streetAddressLine2"
            />
          </>
        ) : null}
        {pide("ciudad") ? (
          <>
            <Etiqueta>{texto(idioma, "ciudad")}</Etiqueta>
            <Campo
              value={d.ciudad}
              onChangeText={poner("ciudad")}
              placeholder={texto(idioma, "ciudad")}
              textContentType="addressCity"
            />
          </>
        ) : null}
        {pide("estado") ? (
          <>
            <Etiqueta>
              {texto(idioma, etiquetaDelEstado(entrega.pais))}
            </Etiqueta>
            {entrega.estados ? (
              <SelectorLista
                valor={d.estado}
                opciones={entrega.estados}
                alElegir={poner("estado")}
                titulo={texto(idioma, etiquetaDelEstado(entrega.pais))}
                marcador={texto(idioma, "elegir")}
                cerrar={texto(idioma, "cerrar")}
              />
            ) : (
              <Campo
                value={d.estado}
                onChangeText={poner("estado")}
                placeholder="FL"
                autoCapitalize="characters"
                maxLength={2}
                textContentType="addressState"
              />
            )}
          </>
        ) : null}
        {pide("codigoPostal") ? (
          <>
            <Etiqueta>
              {texto(
                idioma,
                pide("codigoPostal")?.obligatorio
                  ? entrega.pais === "US"
                    ? "codigoPostal"
                    : /* «ZIP code» es solo de Estados Unidos. */
                      "codigoPostalFuera"
                  : "codigoPostalOpcional",
              )}
            </Etiqueta>
            <Campo
              value={d.codigoPostal}
              onChangeText={poner("codigoPostal")}
              placeholder="00000"
              keyboardType="number-pad"
              maxLength={10}
              textContentType="postalCode"
            />
          </>
        ) : null}
        <Text style={[estilos.subtitulo, { marginTop: 18 }]}>
          {texto(idioma, "comoPagas")}
        </Text>
        {metodos.length === 0 ? (
          <Aviso texto={texto(idioma, "sinMetodosDePago")} tono="info" />
        ) : (
          metodos.map((m) => {
            const marcado = metodo === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: marcado }}
                onPress={() => {
                  setError(null);
                  setMetodo(m);
                }}
                style={[estilos.metodo, marcado && estilos.metodoMarcado]}
              >
                <View style={[estilos.radio, marcado && estilos.radioLleno]} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.metodoNombre}>
                    {texto(
                      idioma,
                      m === "zelle" ? "metodoZelle" : "metodoTarjeta",
                    )}
                  </Text>
                  <Text style={estilos.nota}>
                    {texto(
                      idioma,
                      m === "zelle" ? "metodoZelleAyuda" : "metodoTarjetaAyuda",
                    )}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
        <View style={estilos.totalFila}>
          <Text style={estilos.totalTexto}>
            {texto(idioma, conZelle ? "totalEstimadoZelle" : "total")}
          </Text>
          <Text style={estilos.totalTexto}>
            {precioTexto(totalAMostrar, moneda, idioma)}
          </Text>
        </View>
        <Text style={estilos.nota}>
          {texto(idioma, conZelle ? "totalExactoEnLaWeb" : "totalNota")}
        </Text>
        {conZelle && totalAMostrar < zelleMinimo ? (
          <Aviso
            texto={texto(idioma, "zelleDesde").replace(
              "{monto}",
              precioTexto(zelleMinimo, "USD", idioma),
            )}
            tono="info"
          />
        ) : null}
        {error ? (
          <Aviso
            texto={
              error.mensaje ?? texto(idioma, error.clave ?? "errorGeneral")
            }
            tono="error"
          />
        ) : null}
        {metodo ? (
          <BotonPrincipal
            texto={texto(idioma, conZelle ? "seguirAlPago" : "pagarConTarjeta")}
            onPress={pagar}
            ocupado={ocupado}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** En España la segunda línea es el piso y la puerta («3.º B»), no la
 *  «suite» de Estados Unidos. */
function etiquetaDeDireccion2(pais: string): "direccion2" | "direccion2Piso" {
  return pais === "ES" ? "direccion2Piso" : "direccion2";
}

/** Cómo se llama el «estado» en cada país. */
function etiquetaDelEstado(
  pais: string,
): "estadoLabel" | "provinciaLabel" | "regionLabel" | "departamentoLabel" {
  if (pais === "ES") return "provinciaLabel";
  if (pais === "CL") return "regionLabel";
  if (pais === "CO") return "departamentoLabel";
  return "estadoLabel";
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
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORES.texto,
    textAlign: "center",
  },
  listo: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORES.verde,
    textAlign: "center",
  },
  ayuda: { fontSize: 15, color: COLORES.gris, textAlign: "center" },
  subtitulo: { fontSize: 18, fontWeight: "800", color: COLORES.azul },
  dos: { flexDirection: "row", gap: 12 },
  totalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  totalTexto: { fontSize: 18, fontWeight: "800", color: COLORES.texto },
  nota: { fontSize: 12, color: COLORES.gris },
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
  metodo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES.grisClaro,
    marginTop: 8,
  },
  metodoMarcado: {
    borderColor: COLORES.naranja,
    borderWidth: 2,
    backgroundColor: "#FFF4ED",
  },
  metodoNombre: { fontSize: 16, fontWeight: "700", color: COLORES.texto },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORES.gris,
  },
  radioLleno: { borderColor: COLORES.naranja, borderWidth: 7 },
});
