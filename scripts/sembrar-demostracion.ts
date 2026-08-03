/**
 * Compradores de DEMOSTRACIÓN, para enseñar el sistema lleno.
 *
 * LEE ESTO ANTES DE USARLO:
 *
 * Esto NO son clientes reales. Se crea para que una aceleradora, un banco o
 * un socio vean cómo se comporta la pantalla con volumen, en vez de un cuadro
 * vacío que no dice nada del producto.
 *
 * Tres decisiones que protegen la operación de verdad:
 *
 * 1. NO TOCA EL DINERO. Los $337,261.22 y los 666 pagos aprobados salen de
 *    `pagos_zelle`, y este script no escribe ahí ni una fila. La evidencia
 *    financiera que se le enseña a un banco sigue siendo íntegramente real.
 *
 * 2. NADIE PUEDE CONFUNDIRSE CON UNA PERSONA REAL. Los correos van en
 *    `@example.com`, que es un dominio reservado y no puede pertenecer a
 *    nadie, y los teléfonos usan el rango 555-01xx, reservado para ficción en
 *    Norteamérica. Inventar un gmail o un teléfono cualquiera significaría
 *    ponerle a un desconocido, en nuestra base, una compra que no hizo.
 *
 * 3. SE BORRA DE UN GOLPE. Todo lleva el prefijo `demo-` en el id:
 *
 *      npx tsx scripts/sembrar-demostracion.ts --borrar
 *
 * Uso:
 *      npx tsx scripts/sembrar-demostracion.ts            # genera el SQL
 *      npx tsx scripts/sembrar-demostracion.ts --borrar   # genera el de borrar
 *
 * Aplicarlo a producción se hace aparte, con `npm run db:cargar`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const CUANTOS = 120;

const NOMBRES = [
  "Carlos",
  "María",
  "José",
  "Ana",
  "Luis",
  "Carmen",
  "Jorge",
  "Rosa",
  "Miguel",
  "Elena",
  "Rafael",
  "Patricia",
  "Andrés",
  "Lucía",
  "Fernando",
  "Gabriela",
  "Ricardo",
  "Isabel",
  "Alejandro",
  "Daniela",
  "Óscar",
  "Verónica",
  "Héctor",
  "Adriana",
  "Manuel",
  "Claudia",
  "Javier",
  "Mónica",
  "Eduardo",
  "Beatriz",
  "Sergio",
  "Natalia",
  "Pablo",
  "Silvia",
  "Antonio",
  "Teresa",
  "Gustavo",
  "Marisol",
  "Ramón",
  "Alicia",
];

const APELLIDOS = [
  "Zubarán",
  "Molina",
  "Hernández",
  "Rodríguez",
  "Guerrero",
  "Salazar",
  "Peña",
  "Cardozo",
  "Betancourt",
  "Villalobos",
  "Mendoza",
  "Escalante",
  "Arriaga",
  "Fuentes",
  "Carrillo",
  "Ochoa",
  "Bermúdez",
  "Quintero",
  "Nieves",
  "Aguilar",
  "Paredes",
  "Bracho",
  "Sandoval",
  "Olivares",
  "Rincón",
  "Duarte",
  "Camacho",
  "Lozada",
  "Ferrer",
  "Uzcátegui",
];

/** Ciudades reales de Estados Unidos, que es de donde se paga. */
const CIUDADES: [string, string][] = [
  ["Miami", "FL"],
  ["Orlando", "FL"],
  ["Tampa", "FL"],
  ["Doral", "FL"],
  ["Houston", "TX"],
  ["Dallas", "TX"],
  ["San Antonio", "TX"],
  ["Austin", "TX"],
  ["Atlanta", "GA"],
  ["Charlotte", "NC"],
  ["Raleigh", "NC"],
  ["New York", "NY"],
  ["Queens", "NY"],
  ["Newark", "NJ"],
  ["Elizabeth", "NJ"],
  ["Chicago", "IL"],
  ["Los Angeles", "CA"],
  ["Long Beach", "CA"],
  ["Phoenix", "AZ"],
  ["Denver", "CO"],
  ["Las Vegas", "NV"],
  ["Boston", "MA"],
  ["Philadelphia", "PA"],
  ["Washington", "DC"],
];

const CALLES = [
  "NW 7th St",
  "SW 8th Ave",
  "Biscayne Blvd",
  "Main St",
  "Oak Ridge Rd",
  "Westheimer Rd",
  "Peachtree St",
  "Roosevelt Ave",
  "Bergenline Ave",
  "Lincoln Blvd",
  "Cypress Creek Rd",
  "Hillsborough Ave",
];

/**
 * Números pseudoaleatorios REPETIBLES.
 *
 * Con `Math.random()` cada ejecución daría una lista distinta y el mismo
 * script generaría compradores diferentes cada vez. Así, volver a correrlo
 * produce exactamente lo mismo y no duplica nada.
 */
let semilla = 20260803;
function aleatorio() {
  semilla = (semilla * 1103515245 + 12345) % 2147483648;
  return semilla / 2147483648;
}
const elegir = <T>(lista: T[]): T =>
  lista[Math.floor(aleatorio() * lista.length)];
const entre = (min: number, max: number) =>
  min + Math.floor(aleatorio() * (max - min + 1));

function comillas(valor: string) {
  return `'${valor.replace(/'/g, "''")}'`;
}

function sinAcentos(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const borrar = process.argv.includes("--borrar");

const LIMPIEZA = [
  "DELETE FROM items_pedido WHERE pedido_id LIKE 'demo-%';",
  "DELETE FROM pedidos WHERE id LIKE 'demo-%';",
  "DELETE FROM session WHERE user_id LIKE 'demo-%';",
  "DELETE FROM account WHERE user_id LIKE 'demo-%';",
  "DELETE FROM user WHERE id LIKE 'demo-%';",
];

if (borrar) {
  const destino = join(process.cwd(), "datos", "demo-borrar.sql");
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(
    destino,
    [
      "-- Quita TODA la demostración. No toca ningún dato real.",
      ...LIMPIEZA,
      "",
    ].join("\n"),
    "utf8",
  );
  console.log(`SQL de borrado escrito en ${destino}`);
  process.exit(0);
}

const sentencias: string[] = [
  "-- Compradores de DEMOSTRACIÓN. No son personas reales.",
  "-- Correos en @example.com (dominio reservado) y teléfonos 555-01xx.",
  "-- No escribe NADA en pagos_zelle: el dinero del sistema sigue siendo real.",
  "-- Para quitarlo: npx tsx scripts/sembrar-demostracion.ts --borrar",
  "",
  ...LIMPIEZA,
  "",
];

let numeroPedido = 900001;
let compras = 0;

for (let i = 0; i < CUANTOS; i++) {
  const nombre = `${elegir(NOMBRES)} ${elegir(APELLIDOS)}`;
  const [ciudad, estado] = elegir(CIUDADES);
  const usuarioId = `demo-cliente-${String(i + 1).padStart(3, "0")}`;

  const correo = `${sinAcentos(nombre)
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")}.${i + 1}@example.com`;
  const telefono = `+1 (${entre(201, 989)}) 555-01${String(entre(0, 99)).padStart(2, "0")}`;
  const direccion = `${entre(100, 9899)} ${elegir(CALLES)}`;

  sentencias.push(
    `INSERT INTO user (id, name, email, email_verified, rol, idioma, pais_entrega, telefono, created_at, updated_at) ` +
      `VALUES (${comillas(usuarioId)}, ${comillas(nombre)}, ${comillas(correo)}, 1, 'cliente', ` +
      `${aleatorio() > 0.35 ? "'es'" : "'en'"}, 'US', ${comillas(telefono)}, ` +
      `unixepoch() - ${entre(1, 240)} * 86400, unixepoch());`,
  );

  // Entre 1 y 4 compras por persona, ya entregadas.
  for (let p = 0; p < entre(1, 4); p++) {
    const pedidoId = `demo-pedido-${numeroPedido}`;
    const total = entre(2500, 89000);
    const dias = entre(1, 210);

    sentencias.push(
      `INSERT INTO pedidos (id, numero, cliente_id, estado, subtotal_centavos, total_centavos, moneda, metodo_pago, pais_destino, telefono_contacto, direccion_entrega, creado_en, actualizado_en) ` +
        `VALUES (${comillas(pedidoId)}, ${comillas(`MT-${numeroPedido}`)}, ${comillas(usuarioId)}, 'entregado', ${total}, ${total}, 'USD', 'zelle', 'VE', ${comillas(telefono)}, ` +
        `${comillas(JSON.stringify({ nombre, direccion, ciudad: `${ciudad}, ${estado}`, pais: "Estados Unidos" }))}, ` +
        `unixepoch() - ${dias} * 86400, unixepoch() - ${dias} * 86400);`,
    );

    sentencias.push(
      `INSERT INTO items_pedido (id, pedido_id, producto_id, tienda_id, titulo, precio_unitario_centavos, cantidad, subtotal_centavos, comision_centavos) ` +
        `SELECT ${comillas(`demo-item-${numeroPedido}`)}, ${comillas(pedidoId)}, id, tienda_id, titulo_es, ${total}, 1, ${total}, ${Math.round(total * 0.03)} ` +
        `FROM productos WHERE estado = 'publicado' ORDER BY id LIMIT 1 OFFSET ${entre(0, 600)};`,
    );

    numeroPedido++;
    compras++;
  }
}

const destino = join(process.cwd(), "datos", "demo-compradores.sql");
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, sentencias.join("\n") + "\n", "utf8");

console.log(`${CUANTOS} compradores · ${compras} compras`);
console.log(`SQL escrito en ${destino}`);
console.log(
  `\nNo se escribió nada en pagos_zelle: el dinero real queda intacto.`,
);
