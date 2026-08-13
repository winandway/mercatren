import { nanoid } from "nanoid";

import { idDeConversacion } from "@/lib/asistente/sesion";
import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { subirImagen } from "@/lib/subidas";

/**
 * LAS IMÁGENES QUE SE LE MANDAN AL ASISTENTE.
 *
 * ══ POR QUÉ SE SUBEN AQUÍ Y NO SE LE MANDAN AL AGENTE ══
 *
 * El agente recibe TEXTO: su endpoint acepta `{ mensaje }` y nada más. Así que
 * la imagen se guarda en nuestro almacenamiento y lo que viaja en el mensaje es
 * su dirección, que el agente puede abrir.
 *
 * Si algún día su API acepta la imagen directamente, se cambia el sitio donde
 * se manda y esta ruta se queda igual: el archivo tiene que estar en algún lado
 * de todos modos, aunque solo sea para poder mirarlo después.
 *
 * ══ LA DIRECCIÓN ES PÚBLICA, Y ES DELIBERADO ══
 *
 * Va a `asistente/...`, que NO está en `MEDIA_PRIVADOS`. Tiene que ser así: el
 * agente corre en otro servidor y sin sesión nuestra, y una dirección que exija
 * sesión no la puede abrir — la imagen no serviría de nada.
 *
 * Lo que la protege es que el nombre es un `nanoid()` que nadie adivina, y que
 * quien la sube ya decidió enseñársela a un tercero. Aun así: **aquí no se
 * suben comprobantes de pago ni documentos de comercios**, que tienen su propio
 * camino privado.
 */
export async function POST(peticion: Request) {
  const usuario = await obtenerUsuario();
  if (!usuario || !(await esEquipoInterno())) {
    return Response.json({ motivo: "sin_permiso" }, { status: 403 });
  }

  const id = idDeConversacion(usuario.id);
  if (!id) return Response.json({ motivo: "sin_permiso" }, { status: 403 });

  let formulario: FormData;
  try {
    formulario = await peticion.formData();
  } catch {
    return Response.json({ motivo: "cuerpo_invalido" }, { status: 400 });
  }

  /* `subirImagen` comprueba tipo y tamaño en el SERVIDOR. Lo que valide el
     navegador es comodidad, no defensa. */
  const subida = await subirImagen(formulario.get("imagen"), `asistente/${id}`);
  if (!subida.ok) {
    return Response.json({ motivo: subida.mensaje }, { status: 400 });
  }

  /* Se devuelve la dirección completa: es lo que va dentro del mensaje, y el
     agente la abre desde otro servidor. */
  const origen = new URL(peticion.url).origin;
  return Response.json({
    url: `${origen}/media/${subida.clave}`,
    clave: subida.clave,
    /* Un identificador corto para nombrarla en el mensaje sin pegar la
       dirección entera en la burbuja. */
    nombre: nanoid(6),
  });
}
