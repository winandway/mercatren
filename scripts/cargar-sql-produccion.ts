/**
 * Manda un archivo SQL a la base del sitio publicado, por HTTP.
 *
 * Sirve para lo que NO puede ir en schema.sql: datos que no entran al
 * repositorio (el historico de pagos, con nombres y correos reales) o cargas
 * de una sola vez que seria absurdo repetir en cada despliegue.
 *
 * EL TOKEN NUNCA SE ESCRIBE EN NINGUN ARCHIVO. Se pasa por variable de
 * entorno, se usa en memoria y se acaba con el proceso:
 *
 *   TOKEN_MERCATREN='...' npm run db:cargar -- .local/zelle-historico.sql
 *
 * Se detiene en la primera sentencia que falle y dice cual fue: mas vale una
 * carga a medias y sabida, que una carga a medias y silenciosa.
 */
import { readFileSync } from "node:fs";

const ENDPOINT = "https://yapanel.yadominios.com/api/hosting/db/query";
const SITIO = "mercatren";

const token = process.env.TOKEN_MERCATREN;
const archivo = process.argv[2];

if (!token) {
  console.error("Falta TOKEN_MERCATREN. Sale del panel: sitio → Ver token.");
  process.exit(1);
}
if (!archivo) {
  console.error(
    "Uso: TOKEN_MERCATREN='...' npm run db:cargar -- <archivo.sql>",
  );
  process.exit(1);
}

/**
 * Parte el archivo en sentencias.
 *
 * Va caracter por caracter siguiendo el estado de las comillas, porque los
 * datos reales traen puntos y coma dentro del texto ("Tubo 2x1; calibre 18")
 * y partir por ";" a lo bruto rompe la sentencia por la mitad. En SQL una
 * comilla dentro de un texto se escribe doble ('') y aqui se respeta.
 */
function sentencias(sql: string): string[] {
  const fuera: string[] = [];
  let actual = "";
  let enTexto = false;
  let enComentario = false;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];

    if (enComentario) {
      if (c === "\n") enComentario = false;
      else continue;
    }

    if (!enTexto && c === "-" && sql[i + 1] === "-") {
      enComentario = true;
      i++;
      continue;
    }

    if (c === "'") {
      // Dos comillas seguidas dentro de un texto son una comilla escapada.
      if (enTexto && sql[i + 1] === "'") {
        actual += "''";
        i++;
        continue;
      }
      enTexto = !enTexto;
    }

    if (c === ";" && !enTexto) {
      const limpia = actual.trim();
      if (limpia) fuera.push(limpia);
      actual = "";
      continue;
    }

    actual += c;
  }

  const resto = actual.trim();
  if (resto) fuera.push(resto);
  return fuera;
}

async function ejecutar(sql: string) {
  const respuesta = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sitio: SITIO, token, sql, params: [] }),
  });

  const cuerpo = await respuesta.text();
  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status}: ${cuerpo.slice(0, 300)}`);
  }

  const datos = JSON.parse(cuerpo);
  if (datos.error) throw new Error(String(datos.error).slice(0, 300));
  return datos;
}

const lista = sentencias(readFileSync(archivo, "utf8"));
console.log(`${lista.length} sentencias en ${archivo}`);

let escritas = 0;
for (const [i, sql] of lista.entries()) {
  try {
    const r = await ejecutar(sql);
    escritas += r.rowsWritten ?? 0;
    process.stdout.write(
      `\r  ${i + 1}/${lista.length} · ${escritas} filas escritas`,
    );
  } catch (e) {
    console.error(`\n\nSe detuvo en la sentencia ${i + 1}:`);
    console.error(sql.slice(0, 200) + (sql.length > 200 ? "…" : ""));
    console.error(`\n${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

console.log(`\nListo: ${escritas} filas escritas.`);
