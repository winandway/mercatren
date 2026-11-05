/**
 * La alarma de consumo de Mercatren: una vuelta, lista para correr cada hora.
 *
 * Pide a Cloudflare, con el wrangler de esta máquina, las filas leídas y
 * escritas de la base en 24 h y el tamaño de la base y del cubo, y las pone en
 * verde, aviso o emergencia (`src/lib/consumo/umbrales.ts`). Solo lee: no toca
 * la base ni el cubo.
 *
 * Uso:
 *   node scripts/consumo-base.ts
 * Sale con 0 en verde, 1 en aviso y 2 en emergencia, para que quien lo corre
 * (el gerente de cada hora) sepa si tiene que avisar.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { evaluar } from "../src/lib/consumo/umbrales.ts";

const CUENTA = "4d9e131f2c18bc10ac4700d689d5556c";
const BASE = "site-mercatren-db";
const CUBO = "site-mercatren";

function wrangler(args: string[]): string {
  return execFileSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: CUENTA },
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/** El primer bloque JSON de la salida (wrangler escribe más cosas antes). */
function json(texto: string): Record<string, unknown> {
  const desde = texto.indexOf("{");
  const hasta = texto.lastIndexOf("}");
  return JSON.parse(texto.slice(desde, hasta + 1)) as Record<string, unknown>;
}

/**
 * El tamaño del cubo, sumando sus archivos. La cifra de «bucket info» se
 * recalcula de a ratos y mientras tanto vuelve «0 B» (medido el 5 nov 2026):
 * una alarma que lee eso cree que el cubo está vacío. Si la lista no se puede
 * leer, o pasa de 100 páginas, vale NaN y la alarma lo marca en aviso.
 */
async function tamanoDelCubo(): Promise<number> {
  try {
    const toml = readFileSync(
      join(homedir(), ".wrangler", "config", "default.toml"),
      "utf8",
    );
    const token = /^oauth_token\s*=\s*"(.*)"/m.exec(toml)?.[1];
    if (!token) return Number.NaN;
    const raiz = `https://api.cloudflare.com/client/v4/accounts/${CUENTA}/r2/buckets/${CUBO}/objects`;
    let total = 0;
    let cursor = "";
    for (let pagina = 0; pagina < 100; pagina++) {
      const r = await fetch(
        `${raiz}?per_page=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      const j = (await r.json()) as {
        success: boolean;
        result: { size: number }[];
        result_info?: { is_truncated?: boolean; cursor?: string };
      };
      if (!j.success) return Number.NaN;
      for (const o of j.result) total += o.size;
      if (!j.result_info?.is_truncated) return total;
      cursor = j.result_info.cursor ?? "";
    }
    return Number.NaN;
  } catch {
    return Number.NaN;
  }
}

const base = json(wrangler(["d1", "info", BASE, "--json"]));

const medida = {
  filasLeidas24h: Number(base.rows_read_24h),
  filasEscritas24h: Number(base.rows_written_24h),
  baseBytes: Number(base.database_size),
  cuboBytes: await tamanoDelCubo(),
};
const { nivel, detalle } = evaluar(medida);

const millones = (n: number) => (n / 1_000_000).toFixed(1);
console.log(
  JSON.stringify({ momento: new Date().toISOString(), nivel, medida, detalle }),
);
console.log(
  `Mercatren, consumo en ${nivel.toUpperCase()}: ${millones(medida.filasLeidas24h)} M filas leídas y ${millones(medida.filasEscritas24h)} M escritas en 24 h; base ${millones(medida.baseBytes)} MB; cubo ${millones(medida.cuboBytes)} MB.`,
);
process.exit(nivel === "verde" ? 0 : nivel === "aviso" ? 1 : 2);
