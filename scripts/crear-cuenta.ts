/**
 * Crea una cuenta de acceso al panel.
 *
 * Mercatren es un servicio para muchos comercios: los que lleguen se registran
 * solos. Este script es para las dos excepciones:
 *
 *   1. Las cuentas del equipo de Mercatren (soporte, validador).
 *   2. El comercio piloto, que viene de otro sistema y hay que dar de alta a
 *      mano junto con su tienda.
 *
 * REGLA DE LA CASA: toda cuenta nuestra dentro del sistema lleva la palabra
 * "Soporte" en el nombre visible, para que el cliente sepa de un vistazo quien
 * tiene permisos sobre su negocio. El script no deja pasar otra cosa.
 *
 * Uso (con el servidor levantado en otra terminal):
 *
 *   npm run dev
 *
 *   # equipo de Mercatren
 *   CLAVE='…' npm run cuenta:crear -- "Soporte Windoce" soporte@windoce.com
 *
 *   # comercio (queda como dueno de esa tienda)
 *   CLAVE='…' npm run cuenta:crear -- --rol=vendedor \
 *     --tienda=tienda-bley-ferreteria "Bley Ferretería" correo@delcomercio.com
 *
 * La contraseña NUNCA se escribe en el repositorio ni queda en un archivo:
 * viaja por la variable de entorno y se usa una sola vez.
 */
import { spawnSync } from "node:child_process";

import {
  CORREO_CONTACTO,
  CORREO_REMITENTE,
} from "../src/lib/correo/direcciones.ts";

const argumentos = process.argv.slice(2);
const opciones = new Map<string, string>();
const sueltos: string[] = [];

for (const argumento of argumentos) {
  const par = argumento.match(/^--([^=]+)=(.*)$/);
  if (par) opciones.set(par[1], par[2]);
  else sueltos.push(argumento);
}

const [nombre, correo] = sueltos;
const rol = opciones.get("rol") ?? "soporte";
const tiendaId = opciones.get("tienda");
const clave = process.env.CLAVE;
const servidor = process.env.SERVIDOR ?? "http://localhost:3000";

const ROLES = ["soporte", "validador", "vendedor"];

function salir(mensaje: string): never {
  console.error(`\n✗ ${mensaje}\n`);
  process.exit(1);
}

function sql(consulta: string) {
  const salida = spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "mercatren",
      "--local",
      "--command",
      consulta,
    ],
    { encoding: "utf-8" },
  );
  if (salida.status !== 0) salir(`Fallo la consulta:\n${salida.stderr}`);
  return salida.stdout;
}

function comillas(valor: string) {
  return `'${valor.replace(/'/g, "''")}'`;
}

if (!nombre || !correo) {
  salir(
    "Faltan datos. Ejemplo:\n  CLAVE='…' npm run cuenta:crear -- \"Soporte Windoce\" soporte@windoce.com",
  );
}

if (!ROLES.includes(rol)) {
  salir(`Rol desconocido: "${rol}". Usa uno de: ${ROLES.join(", ")}.`);
}

if (rol !== "vendedor" && !/soporte/i.test(nombre)) {
  salir(
    `El nombre visible de una cuenta nuestra debe contener la palabra "Soporte". Recibido: "${nombre}".`,
  );
}

/**
 * Nuestras cuentas van SIEMPRE a un buzon que existe y recibe de verdad.
 *
 * Si se crea una cuenta con una direccion inventada y algun dia hay que
 * recuperar la contrasena, el correo se va al vacio y esa cuenta queda
 * perdida. Y eso no se descubre en la oficina: se descubre en la calle, en
 * medio de una demostracion, cuando ya no hay nada que hacer.
 *
 * El buzon bueno es CORREO_CONTACTO (src/lib/correo/direcciones.ts), que hoy
 * es hola@mercatren.com y RECIBE de verdad.
 *
 * ══ OJO CON EL CANDADO DE ABAJO (arreglado el 17 ago 2026) ══
 *
 * Habia una segunda comprobacion que rechazaba el dominio @mercatren.com
 * entero, escrita cuando ese dominio solo enviaba y el contacto vivia en
 * windoce.com. El 12 de agosto el contacto se mudo a hola@mercatren.com... y
 * nadie toco este candado.
 *
 * Resultado: el script quedo IMPOSIBLE de satisfacer. Exigia hola@mercatren.com
 * y a renglon seguido rechazaba ese mismo dominio, asi que no se podia crear
 * ni una sola cuenta del equipo. No dio la cara hasta que hizo falta crear una.
 *
 * Ahora se rechaza SOLO la direccion que de verdad no recibe (el remitente del
 * sistema), no el dominio completo. Y sale de la constante, no escrita a mano:
 * si manana el remitente cambia, este candado se entera solo.
 */
if (rol !== "vendedor" && correo !== CORREO_CONTACTO) {
  salir(
    `Las cuentas nuestras se crean con un buzon que recibe de verdad.\n` +
      `  Recibido:  ${correo}\n` +
      `  Tiene que ser: ${CORREO_CONTACTO}\n\n` +
      `Si esa cuenta pierde la contrasena, el correo de recuperacion tiene que\n` +
      `llegar a alguien. Una direccion inventada deja la cuenta perdida.`,
  );
}

/* El remitente del sistema SOLO envia: una cuenta ahi jamas podria recuperar
   su contrasena. Se saca de CORREO_REMITENTE («Mercatren <avisos@...>») en vez
   de escribirlo a mano, para que no se quede viejo como se quedo el candado
   anterior. */
const SOLO_ENVIA = (
  CORREO_REMITENTE.match(/<([^>]+)>/)?.[1] ?? CORREO_REMITENTE
)
  .trim()
  .toLowerCase();

if (correo.toLowerCase() === SOLO_ENVIA) {
  salir(
    `${SOLO_ENVIA} solo ENVIA los avisos del sistema; no recibe.\n` +
      `Una cuenta ahi no podria recuperar nunca su contrasena.`,
  );
}

if (rol === "vendedor" && !tiendaId) {
  salir(
    "Una cuenta de comercio necesita su tienda: agrega --tienda=<id de la tienda>.",
  );
}

if (!clave || clave.length < 10) {
  salir("Falta la variable CLAVE, o tiene menos de 10 caracteres.");
}

const respuesta = await fetch(`${servidor}/datos/auth/sign-up/email`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    // El sistema de cuentas rechaza las peticiones sin origen, para que nadie
    // pueda registrar usuarios desde otro sitio.
    origin: servidor,
  },
  body: JSON.stringify({ name: nombre, email: correo, password: clave }),
});

if (!respuesta.ok) {
  const detalle = await respuesta.text();
  salir(
    `El servidor rechazó el registro (${respuesta.status}).\n${detalle}\n` +
      `¿Está corriendo "npm run dev" en ${servidor}?`,
  );
}

console.log(`Cuenta creada: ${correo}`);

// El rol no se puede mandar desde el formulario a proposito: se asigna aqui.
sql(
  `UPDATE user SET rol = ${comillas(rol)} WHERE email = ${comillas(correo)};`,
);
console.log(`Rol "${rol}" asignado.`);

if (rol === "vendedor" && tiendaId) {
  sql(
    `UPDATE tiendas SET propietario_id = (SELECT id FROM user WHERE email = ${comillas(correo)}) WHERE id = ${comillas(tiendaId)};`,
  );
  console.log(`Cuenta vinculada al comercio "${tiendaId}".`);
}

console.log(`\nYa puede entrar en ${servidor}/es/entrar`);
