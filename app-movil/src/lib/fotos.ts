import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { LADO_DE_LA_FOTO } from "./productos";

/**
 * LAS FOTOS DEL PRODUCTO SE ACHICAN EN EL TELÉFONO antes de subir (como en la
 * web, que las comprime en el navegador): lado mayor de 1600 píxeles, JPEG al
 * 80 %. Una foto de cámara de 5 MB queda en unos 300 KB: sube rápido con mala
 * señal y no llena el almacenamiento con originales que nadie ve.
 */
export type FotoLista = { uri: string; nombre: string; tipo: "image/jpeg" };

async function achicar(
  uri: string,
  ancho: number,
  alto: number,
): Promise<FotoLista> {
  const grande = Math.max(ancho, alto);
  const contexto = ImageManipulator.manipulate(uri);
  if (grande > LADO_DE_LA_FOTO) {
    contexto.resize(
      ancho >= alto ? { width: LADO_DE_LA_FOTO } : { height: LADO_DE_LA_FOTO },
    );
  }
  const imagen = await contexto.renderAsync();
  const guardada = await imagen.saveAsync({
    compress: 0.8,
    format: SaveFormat.JPEG,
  });
  return {
    uri: guardada.uri,
    nombre: `foto-${Date.now()}.jpg`,
    tipo: "image/jpeg",
  };
}

export async function tomarFoto(): Promise<FotoLista[] | "sin-permiso"> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) return "sin-permiso";
  const r = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (r.canceled) return [];
  return Promise.all(r.assets.map((a) => achicar(a.uri, a.width, a.height)));
}

export async function elegirFotos(
  cuantas: number,
): Promise<FotoLista[] | "sin-permiso"> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) return "sin-permiso";
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: cuantas,
    quality: 1,
  });
  if (r.canceled) return [];
  return Promise.all(
    r.assets.slice(0, cuantas).map((a) => achicar(a.uri, a.width, a.height)),
  );
}

/**
 * LA FOTO COMO PARTE DEL FORMULARIO. El `fetch` de Expo (SDK 58) NO acepta la
 * forma vieja de React Native (`{ uri, name, type }`): falla con «Unsupported
 * FormDataPart implementation» y la foto nunca sale del teléfono (pasó al
 * probarlo, 5 nov 2026). Acepta cualquier parte que sepa dar sus bytes, con
 * su nombre y su tipo: eso es esto.
 */
export function parteDeFoto(foto: FotoLista): Blob {
  return {
    name: foto.nombre,
    type: foto.tipo,
    bytes: () => new File(foto.uri).bytes(),
  } as unknown as Blob;
}
