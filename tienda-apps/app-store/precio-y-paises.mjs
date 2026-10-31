// Gratis y solo en Estados Unidos (31 oct 2026): el .com vende y entrega solo
// allí, igual que en Google Play. Uso: node tienda-apps/app-store/precio-y-paises.mjs
import { asc } from "./asc.mjs";
import { APP_ID } from "./ids.mjs";

/* La versión de la tienda tiene que decir lo mismo que la compilación. */
const [version] = (
  await asc("GET", `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS`)
).data;
if (version.attributes.versionString !== "1.0.0") {
  await asc("PATCH", `/v1/appStoreVersions/${version.id}`, {
    data: {
      type: "appStoreVersions",
      id: version.id,
      attributes: { versionString: "1.0.0" },
    },
  });
}

/* Precio: gratis, con Estados Unidos como país base. */
const puntos = await asc(
  "GET",
  `/v1/apps/${APP_ID}/appPricePoints?filter[territory]=USA&limit=200`,
);
const gratis = puntos.data.find(
  (p) => Number(p.attributes.customerPrice) === 0,
);
if (!gratis) throw new Error("No se encontró el precio gratis para USA");
try {
  await asc("POST", "/v1/appPriceSchedules", {
    data: {
      type: "appPriceSchedules",
      relationships: {
        app: { data: { type: "apps", id: APP_ID } },
        baseTerritory: { data: { type: "territories", id: "USA" } },
        manualPrices: { data: [{ type: "appPrices", id: "${precio}" }] },
      },
    },
    included: [
      {
        type: "appPrices",
        id: "${precio}",
        attributes: { startDate: null },
        relationships: {
          appPricePoint: { data: { type: "appPricePoints", id: gratis.id } },
        },
      },
    ],
  });
  console.log("precio: gratis");
} catch (e) {
  console.log("precio:", String(e).slice(0, 200));
}

/* Países: solo Estados Unidos. Apple exige nombrar TODOS los territorios,
   cada uno con disponible sí o no (la receta lo avisa). */
const territorios = (await asc("GET", "/v1/territories?limit=200")).data.map(
  (t) => t.id,
);
try {
  await asc("POST", "/v2/appAvailabilities", {
    data: {
      type: "appAvailabilities",
      attributes: { availableInNewTerritories: false },
      relationships: {
        app: { data: { type: "apps", id: APP_ID } },
        territoryAvailabilities: {
          data: territorios.map((t) => ({
            type: "territoryAvailabilities",
            id: "${" + t + "}",
          })),
        },
      },
    },
    included: territorios.map((t) => ({
      type: "territoryAvailabilities",
      id: "${" + t + "}",
      attributes: { available: t === "USA" },
      relationships: { territory: { data: { type: "territories", id: t } } },
    })),
  });
  console.log(
    `países: solo Estados Unidos (de ${territorios.length} territorios)`,
  );
} catch (e) {
  console.log("países:", String(e));
}
