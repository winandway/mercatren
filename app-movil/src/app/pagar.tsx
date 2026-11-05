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
import { useCarrito } from "@/contexto/carrito";
import { usePreferencias } from "@/contexto/preferencias";
import { useBorrador } from "@/hooks/use-borrador";
import { urlPedido } from "@/lib/api";
import { authClient, cabeceraDeSesion } from "@/lib/auth-client";
import { lineasParaElPedido, totalCentavos } from "@/lib/carrito";
import { cobrarConHoja } from "@/lib/cobrar";
import { COLORES } from "@/lib/colores";
import { precioTexto } from "@/lib/dinero";
import {
  faltaEnEntrega,
  entregaParaElPedido,
  type DatosEntrega,
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
 * PAGAR: la dirección de entrega y la hoja de pago de Stripe. El pedido lo
 * crea el servidor con la MISMA acción de la web (precio, existencia y pausa
 * leídos de la base); la app solo manda qué productos y cuántos. El cobro lo
 * acredita el aviso de Stripe al servidor, nunca la app.
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
  const [hecho, setHecho] = useState<{
    numero: string;
    pagado: boolean;
  } | null>(null);

  const { recuperado, limpiar } = useBorrador(
    "pagar",
    sesion?.user?.id,
    d,
    (g) => setD((antes) => ({ ...antes, ...g })),
  );
  const poner = (campo: keyof DatosEntrega) => (v: string) =>
    setD((a) => ({ ...a, [campo]: v }));
  const moneda = lineas[0]?.precio.moneda ?? "USD";

  const pagar = async () => {
    if (!pais || !lineas.length) return;
    const falta = faltaEnEntrega(d);
    if (falta) return setError({ clave: falta });
    setError(null);
    setOcupado(true);
    try {
      const r = await fetch(urlPedido(pais, idioma), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraDeSesion() },
        body: JSON.stringify({
          entrega: entregaParaElPedido(d),
          lineas: lineasParaElPedido(lineas),
        }),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        ok?: boolean;
        mensaje?: string;
        numero?: string;
        pago?: {
          clientSecret?: string;
          clavePublica?: string;
          sinConfigurar?: boolean;
        };
      } | null;
      if (r.status === 401) return setError({ clave: "entraParaComprar" });
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
      if (!cuerpo.pago?.clientSecret || !cuerpo.pago.clavePublica) {
        setHecho({ numero: cuerpo.numero, pagado: false });
        return setError({ clave: "pagoNoDisponible" });
      }
      const cobro = await cobrarConHoja(
        {
          clientSecret: cuerpo.pago.clientSecret,
          clavePublica: cuerpo.pago.clavePublica,
        },
        d.nombre.trim(),
      );
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
        <Text style={estilos.subtitulo}>{texto(idioma, "entregaTitulo")}</Text>
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
        <Etiqueta>{texto(idioma, "direccion1")}</Etiqueta>
        <Campo
          value={d.direccion}
          onChangeText={poner("direccion")}
          placeholder={texto(idioma, "direccion1")}
          autoComplete="street-address"
          textContentType="streetAddressLine1"
        />
        <Etiqueta>{texto(idioma, "direccion2")}</Etiqueta>
        <Campo
          value={d.direccion2}
          onChangeText={poner("direccion2")}
          placeholder={texto(idioma, "direccion2")}
          textContentType="streetAddressLine2"
        />
        <Etiqueta>{texto(idioma, "ciudad")}</Etiqueta>
        <Campo
          value={d.ciudad}
          onChangeText={poner("ciudad")}
          placeholder={texto(idioma, "ciudad")}
          textContentType="addressCity"
        />
        <View style={estilos.dos}>
          <View style={{ flex: 1 }}>
            <Etiqueta>{texto(idioma, "estadoUS")}</Etiqueta>
            <Campo
              value={d.estado}
              onChangeText={poner("estado")}
              placeholder="FL"
              autoCapitalize="characters"
              maxLength={2}
              textContentType="addressState"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Etiqueta>{texto(idioma, "codigoPostal")}</Etiqueta>
            <Campo
              value={d.codigoPostal}
              onChangeText={poner("codigoPostal")}
              placeholder="00000"
              keyboardType="number-pad"
              maxLength={10}
              textContentType="postalCode"
            />
          </View>
        </View>
        <View style={estilos.totalFila}>
          <Text style={estilos.totalTexto}>{texto(idioma, "total")}</Text>
          <Text style={estilos.totalTexto}>
            {precioTexto(totalCentavos(lineas), moneda, idioma)}
          </Text>
        </View>
        <Text style={estilos.nota}>{texto(idioma, "totalNota")}</Text>
        {error ? (
          <Aviso
            texto={
              error.mensaje ?? texto(idioma, error.clave ?? "errorGeneral")
            }
            tono="error"
          />
        ) : null}
        <BotonPrincipal
          texto={texto(idioma, "pagarConTarjeta")}
          onPress={pagar}
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
});
