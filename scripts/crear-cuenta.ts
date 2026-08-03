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
