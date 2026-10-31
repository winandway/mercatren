// Adjunta la última compilación válida a la versión y la manda a revisión de
// Apple (31 oct 2026). La versión queda en WAITING_FOR_REVIEW.
// Uso: node tienda-apps/app-store/enviar-revision.mjs
// Modelo: tumbite/scripts/tiendas/enviar-revision-ios.mjs.
import { asc } from "./asc.mjs";
import { APP_ID } from "./ids.mjs";

const [version] = (
  await asc("GET", `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS`)
).data;
const estado = version.attributes.appStoreState;
if (
  estado !== "PREPARE_FOR_SUBMISSION" &&
  estado !== "DEVELOPER_REJECTED" &&
  estado !== "REJECTED"
) {
  console.log(
    `La versión ${version.attributes.versionString} ya está en «${estado}»: no se envía otra vez.`,
  );
  process.exit(0);
}

/* La compilación: la última VÁLIDA cuya versión coincide con la de la tienda. */
let build = (await asc("GET", `/v1/appStoreVersions/${version.id}/build`)).data;
if (!build) {
  const builds = (
    await asc(
      "GET",
      `/v1/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=5`,
    )
  ).data;
  build = builds[0];
  if (!build)
    throw new Error("No hay ninguna compilación VÁLIDA para adjuntar.");
  await asc("PATCH", `/v1/appStoreVersions/${version.id}/relationships/build`, {
    data: { type: "builds", id: build.id },
  });
}

const abiertas = (
  await asc(
    "GET",
    `/v1/reviewSubmissions?filter[app]=${APP_ID}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`,
  )
).data;
const entrega =
  abiertas[0] ??
  (
    await asc("POST", "/v1/reviewSubmissions", {
      data: {
        type: "reviewSubmissions",
        attributes: { platform: "IOS" },
        relationships: { app: { data: { type: "apps", id: APP_ID } } },
      },
    })
  ).data;
const items = (await asc("GET", `/v1/reviewSubmissions/${entrega.id}/items`))
  .data;
if (!items.length) {
  await asc("POST", "/v1/reviewSubmissionItems", {
    data: {
      type: "reviewSubmissionItems",
      relationships: {
        reviewSubmission: {
          data: { type: "reviewSubmissions", id: entrega.id },
        },
        appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
      },
    },
  });
}
await asc("PATCH", `/v1/reviewSubmissions/${entrega.id}`, {
  data: {
    type: "reviewSubmissions",
    id: entrega.id,
    attributes: { submitted: true },
  },
});

const despues = (await asc("GET", `/v1/appStoreVersions/${version.id}`)).data;
console.log(
  `Enviada a revisión: versión ${despues.attributes.versionString} → ${despues.attributes.appStoreState}`,
);
