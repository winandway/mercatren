// Sube las capturas del iPhone a App Store Connect (31 oct 2026): 1320×2868,
// el tamaño de 6,9" (APP_IPHONE_67), tomadas de la app de verdad en el
// simulador. Están en tienda-apps/app-store/capturas/<idioma>/.
// Uso: node tienda-apps/app-store/capturas.mjs
// Modelo: tumbite/scripts/tiendas/capturas-app-store.mjs.
import crypto from "node:crypto";
import fs from "node:fs";
import { join } from "node:path";

import { asc } from "./asc.mjs";
import { APP_ID } from "./ids.mjs";

const CARPETA = join(import.meta.dirname, "capturas");

async function subir(setId, archivo) {
  const datos = fs.readFileSync(archivo);
  const res = await asc("POST", "/v1/appScreenshots", {
    data: {
      type: "appScreenshots",
      attributes: {
        fileName: archivo.split("/").at(-1),
        fileSize: datos.length,
      },
      relationships: {
        appScreenshotSet: { data: { type: "appScreenshotSets", id: setId } },
      },
    },
  });
  for (const op of res.data.attributes.uploadOperations) {
    const r = await fetch(op.url, {
      method: op.method,
      headers: Object.fromEntries(
        op.requestHeaders.map((h) => [h.name, h.value]),
      ),
      body: datos.subarray(op.offset, op.offset + op.length),
    });
    if (!r.ok) throw new Error(`subida ${r.status}`);
  }
  await asc("PATCH", `/v1/appScreenshots/${res.data.id}`, {
    data: {
      type: "appScreenshots",
      id: res.data.id,
      attributes: {
        uploaded: true,
        sourceFileChecksum: crypto
          .createHash("md5")
          .update(datos)
          .digest("hex"),
      },
    },
  });
}

const [version] = (
  await asc("GET", `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS`)
).data;
const locs = (
  await asc(
    "GET",
    `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`,
  )
).data;
for (const loc of locs) {
  const dir = join(CARPETA, loc.attributes.locale);
  if (!fs.existsSync(dir)) continue;
  const archivos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .sort()
    .slice(0, 10);
  const sets = (
    await asc(
      "GET",
      `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`,
    )
  ).data;
  const viejo = sets.find(
    (x) => x.attributes.screenshotDisplayType === "APP_IPHONE_67",
  );
  if (viejo) await asc("DELETE", `/v1/appScreenshotSets/${viejo.id}`);
  const set = await asc("POST", "/v1/appScreenshotSets", {
    data: {
      type: "appScreenshotSets",
      attributes: { screenshotDisplayType: "APP_IPHONE_67" },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: "appStoreVersionLocalizations", id: loc.id },
        },
      },
    },
  });
  for (const f of archivos) await subir(set.data.id, join(dir, f));
  console.log(`${loc.attributes.locale}: ${archivos.length} capturas`);
}
