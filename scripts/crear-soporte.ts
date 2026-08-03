/**
 * Crea la cuenta de Soporte que abre el panel de administración.
 *
 * REGLA DE LA CASA: toda cuenta nuestra dentro del sistema de un cliente lleva
 * la palabra "Soporte" en el nombre visible, para que el dueño sepa de un
 * vistazo quién tiene permisos sobre su negocio. Este script no deja pasar un
 * nombre que no la lleve.
 *
 * Uso (con el servidor levantado en otra terminal):
 *
 *   npm run dev
 *   CLAVE='tu-contraseña-larga' npm run soporte:crear -- "Soporte Windoce" soporte@windoce.com
 *
 * La contraseña NUNCA se escribe en el repositorio ni queda en un archivo:
 * viaja por la variable de entorno y se usa una sola vez.
 */
import { spawnSync } from "node:child_process";

const [nombre, correo] = process.argv.slice(2);
const clave = process.env.CLAVE;
const servidor = process.env.SERVIDOR ?? "http://localhost:3000";

function salir(mensaje: string): never {
  console.error(`\n✗ ${mensaje}\n`);
  process.exit(1);
}

if (!nombre || !correo) {
  salir(
    "Faltan datos. Ejemplo:\n  CLAVE='…' npm run soporte:crear -- \"Soporte Windoce\" soporte@windoce.com",
  );
}

if (!/soporte/i.test(nombre)) {
  salir(
    `El nombre visible debe contener la palabra "Soporte". Recibido: "${nombre}".`,
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

// El rol no se puede mandar desde el formulario a propósito. Se asigna aquí,
// directo en la base de esta computadora.
const sql = `UPDATE user SET rol = 'soporte' WHERE email = '${correo.replace(/'/g, "''")}';`;

const actualizacion = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "mercatren", "--local", "--command", sql],
  { encoding: "utf-8" },
);

if (actualizacion.status !== 0) {
  salir(
    `La cuenta se creó pero no se pudo asignar el rol.\n${actualizacion.stderr}`,
  );
}

console.log(
  `Rol "soporte" asignado. Ya puedes entrar en ${servidor}/es/entrar`,
);
