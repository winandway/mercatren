/**
 * PASAR UNA LISTA DE CORREOS POR EL FILTRO DE VERDAD.
 *
 *   npx tsx scripts/probar-correos.ts
 *   npx tsx scripts/probar-correos.ts otro@correo.com mas@correo.com
 *
 * Usa las MISMAS funciones que el registro —las listas y la consulta de DNS—,
 * así que lo que sale aquí es exactamente lo que le pasaría a alguien
 * escribiendo ese correo en el formulario.
 *
 * No toca la base: solo dice el veredicto. El registro de rechazos vive en el
 * sitio, no en este script.
 */

import { dominioRecibeCorreo } from "../src/lib/validacion/dns-correo";
import { revisarPorLista } from "../src/lib/validacion/correo-real";

/** Los doce del encargo: los nueve primeros se bloquean, los tres últimos pasan. */
const POR_DEFECTO = [
  "test@test.com",
  "cliente@ejemplo.com",
  "user@example.org",
  "correo@dominio.com",
  "root@localhost",
  "spam@mailinator.com",
  "b@yopmail.com",
  "asdf@asdfghjkl123456789.com",
  "nada@nodominio.zzz",
  "real@gmail.com",
  "real@hotmail.com",
  "real@yahoo.com",
];

const MOTIVO: Record<string, string> = {
  correoDeEjemplo: "dominio de ejemplo",
  correoTemporal: "correo temporal",
  correoSinServidor: "sin servidor de correo (DNS)",
  correoMalEscrito: "mal escrito",
};

async function main() {
  const correos = process.argv.slice(2).length
    ? process.argv.slice(2)
    : POR_DEFECTO;

  console.log("");
  console.log("  CORREO                              VEREDICTO   MOTIVO");
  console.log("  " + "─".repeat(72));

  for (const correo of correos) {
    const porLista = revisarPorLista(correo);

    let bloqueado = !porLista.ok;
    let motivo = porLista.ok ? "" : MOTIVO[porLista.motivo];
    let porDns = "";

    if (porLista.ok) {
      const dns = await dominioRecibeCorreo(porLista.dominio);
      porDns = dns;
      if (dns === "no_existe") {
        bloqueado = true;
        motivo = MOTIVO.correoSinServidor!;
      } else if (dns === "no_se_pudo") {
        /* La regla que manda: si el DNS falla o tarda, se deja pasar. */
        motivo = "el DNS no contesto — se deja pasar";
      }
    }

    const sello = bloqueado ? "BLOQUEADO" : "PASA     ";
    console.log(
      `  ${correo.padEnd(36)}${sello}  ${motivo}${porDns && !motivo ? `(${porDns})` : ""}`,
    );
  }

  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
