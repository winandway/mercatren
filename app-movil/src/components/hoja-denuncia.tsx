import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Aviso, BotonPrincipal, Enlace } from "@/components/formulario";
import { cabeceraDeSesion } from "@/lib/auth-client";
import { COLORES } from "@/lib/colores";
import type { Idioma } from "@/lib/dinero";
import {
  enviar,
  MOTIVOS,
  urlDenunciar,
  type MotivoDenuncia,
  type ObjetivoDenuncia,
} from "@/lib/moderacion";
import { texto, type ClaveDeTexto } from "@/lib/textos";

/**
 * LA HOJA PARA DENUNCIAR (política UGC de Google Play): sube desde abajo con
 * los motivos, se manda, y termina con el mensaje de gracias. El motivo no
 * viene marcado de entrada: la persona elige. Sin sesión no llega aquí (la
 * ficha manda a entrar antes).
 */
export function HojaDenuncia({
  objetivo,
  pais,
  idioma,
  alCerrar,
}: {
  objetivo: ObjetivoDenuncia | null;
  pais: string;
  idioma: Idioma;
  alCerrar: () => void;
}) {
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<ClaveDeTexto | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setMotivo(null);
    setFallo(null);
    setListo(false);
    setEnviando(false);
  }, [objetivo?.tipo, objetivo?.id]);

  const mandar = async () => {
    if (!objetivo || !motivo || enviando) return;
    setEnviando(true);
    setFallo(null);
    const r = await enviar(
      urlDenunciar(pais, idioma),
      { tipo: objetivo.tipo, id: objetivo.id, motivo },
      cabeceraDeSesion(),
    );
    setEnviando(false);
    if (r.ok) setListo(true);
    else setFallo(r.clave);
  };

  return (
    <Modal
      transparent
      visible={objetivo !== null}
      animationType="slide"
      onRequestClose={alCerrar}
    >
      <Pressable style={estilos.fondo} onPress={alCerrar}>
        {/* Un toque dentro de la hoja no la cierra. */}
        <Pressable style={estilos.hoja} onPress={() => undefined}>
          <ScrollView contentContainerStyle={estilos.cuerpo}>
            {objetivo ? (
              <Text style={estilos.titulo}>
                {texto(
                  idioma,
                  objetivo.tipo === "tienda" ? "reportStore" : "reportProduct",
                )}
              </Text>
            ) : null}
            {objetivo ? (
              <Text style={estilos.nombre} numberOfLines={2}>
                {objetivo.nombre}
              </Text>
            ) : null}
            {listo ? (
              <>
                <Aviso texto={texto(idioma, "reportThanks")} tono="bien" />
                <BotonPrincipal
                  texto={texto(idioma, "cerrar")}
                  onPress={alCerrar}
                />
              </>
            ) : (
              <>
                <Text style={estilos.pregunta}>
                  {texto(idioma, "reportWhy")}
                </Text>
                {MOTIVOS.map((m) => (
                  <Pressable
                    key={m.motivo}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: motivo === m.motivo }}
                    onPress={() => setMotivo(m.motivo)}
                    style={estilos.opcion}
                  >
                    <View
                      style={[
                        estilos.circulo,
                        motivo === m.motivo && estilos.circuloLleno,
                      ]}
                    />
                    <Text style={estilos.opcionTexto}>
                      {texto(idioma, m.clave)}
                    </Text>
                  </Pressable>
                ))}
                {fallo ? (
                  <Aviso texto={texto(idioma, fallo)} tono="error" />
                ) : null}
                <BotonPrincipal
                  texto={texto(idioma, "reportSend")}
                  onPress={mandar}
                  ocupado={enviando || !motivo}
                />
                <Enlace texto={texto(idioma, "cancelar")} onPress={alCerrar} />
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  hoja: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "85%",
  },
  cuerpo: { padding: 20, gap: 10, paddingBottom: 34 },
  titulo: { fontSize: 20, fontWeight: "800", color: COLORES.azul },
  nombre: { fontSize: 14, color: COLORES.gris },
  pregunta: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORES.texto,
    marginTop: 6,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  circulo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORES.gris,
  },
  circuloLleno: {
    borderColor: COLORES.naranja,
    backgroundColor: COLORES.naranja,
  },
  opcionTexto: { fontSize: 16, color: COLORES.texto, flex: 1 },
});
