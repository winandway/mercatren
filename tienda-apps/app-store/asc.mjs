// Conexión a la API de App Store Connect para Mercatren (31 oct 2026). La llave
// es de la cuenta de Windoce LLC (sirve para todas sus apps) y vive FUERA del
// repositorio, en ~/.config/mercatren/apple-asc (carpeta 700, archivos 600).
// Modelo: tumbite/scripts/tiendas/asc.mjs (receta en tumbite/docs/PUBLICAR-EN-APPLE.md).
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import { join } from "node:path";

export const CARPETA_LLAVE = join(
  os.homedir(),
  ".config",
  "mercatren",
  "apple-asc",
);
export const leerLlave = (f) =>
  fs.readFileSync(join(CARPETA_LLAVE, f), "utf8").trim();
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");

export function token() {
  const n = Math.floor(Date.now() / 1000);
  const h = b64({ alg: "ES256", kid: leerLlave("key-id"), typ: "JWT" });
  const p = b64({
    iss: leerLlave("issuer-id"),
    iat: n,
    exp: n + 900,
    aud: "appstoreconnect-v1",
  });
  const s = crypto
    .sign("sha256", Buffer.from(`${h}.${p}`), {
      key: fs.readFileSync(join(CARPETA_LLAVE, "AuthKey.p8")),
      dsaEncoding: "ieee-p1363",
    })
    .toString("base64url");
  return `${h}.${p}.${s}`;
}

export async function asc(metodo, ruta, cuerpo) {
  const r = await fetch(`https://api.appstoreconnect.apple.com${ruta}`, {
    method: metodo,
    headers: {
      authorization: `Bearer ${token()}`,
      "content-type": "application/json",
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  const j = texto ? JSON.parse(texto) : null;
  if (r.status >= 400) {
    throw new Error(
      `${metodo} ${ruta} → ${r.status} ${JSON.stringify(j?.errors?.[0] ?? j)}`,
    );
  }
  return j;
}
