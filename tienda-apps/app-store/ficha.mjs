// La ficha de Mercatren en App Store Connect, por la API (31 oct 2026).
// Carga categorías, nombre y subtítulo por idioma, privacidad, edad, copyright,
// descripción, palabras clave, ayuda, derechos de contenido y los datos para el
// revisor de Apple. Uso: node tienda-apps/app-store/ficha.mjs
// Modelo: tumbite/scripts/tiendas/fichas-app-store.mjs.
import fs from "node:fs";
import os from "node:os";
import { join } from "node:path";

import { asc, token } from "./asc.mjs";
import { APP_ID } from "./ids.mjs";

/* La cuenta de prueba para los revisores: la misma que Google Play, creada por
   Richard el 27 oct 2026. Vive FUERA del repositorio. */
const revisor = Object.fromEntries(
  fs
    .readFileSync(
      join(os.homedir(), ".config", "mercatren", "revisores-google-play.txt"),
      "utf8",
    )
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [
      l.slice(0, l.indexOf("=")),
      l.slice(l.indexOf("=") + 1).trim(),
    ]),
);

/* Los textos salen de la ficha de Google Play (tienda-apps/google-play/FICHA.md),
   SIN la búsqueda por foto: está apagada desde el 29 oct 2026 (Mercatren en
   pausa, ver AUDITORIA-GASTOS.md), y una función que no responde es motivo de
   rechazo. */
const TEXTOS = {
  "en-US": {
    name: "Mercatren: Shop U.S. Stores",
    subtitle: "Shop U.S. stores in one place",
    privacyPolicyUrl: "https://mercatren.com/en/privacidad",
    supportUrl: "https://mercatren.com/en/ayuda",
    promotionalText:
      "Shop thousands of products from U.S. stores, delivered to your door.",
    keywords:
      "shopping,stores,marketplace,deals,online,USA,locker,Miami,sell,bilingual",
    description: `Mercatren brings independent stores and thousands of products together in one place. Browse, compare, and check out securely with your card. Every order is sold and invoiced by Mercatren LLC, a U.S. company based in Michigan.

WHAT YOU CAN DO
• Browse thousands of products in electronics, home, fashion, beauty, pets, and more.
• Discover stores through short videos.
• See the full price up front, with shipping included where it applies. No surprises at checkout.
• Pay securely with your credit or debit card.
• Follow every order from payment to delivery, with the tracking number right in your account.
• Get your own Miami locker address to receive purchases from other online stores.
• Open your own store and start selling, with the same account.

WHY MERCATREN
• One account to shop, track orders, use your locker, and sell.
• Clear prices and a documented record of every purchase.
• Fully bilingual: use the app in English or Spanish.
• A real team behind it. Questions? Write to hola@mercatren.com.

YOUR DATA, YOUR CHOICE
You can delete your account at any time, right from the app (Account → More account options → Delete my account) or at mercatren.com/delete-account.

Mercatren LLC · Novi, Michigan, USA`,
  },
  "es-MX": {
    name: "Mercatren: tiendas de EE. UU.",
    subtitle: "Tiendas de EE. UU. en un lugar",
    privacyPolicyUrl: "https://mercatren.com/es/privacidad",
    supportUrl: "https://mercatren.com/es/ayuda",
    promotionalText:
      "Compra miles de productos de tiendas de EE. UU. y recíbelos en tu puerta.",
    keywords:
      "compras,tiendas,ofertas,mercado,EE.UU.,casillero,Miami,vender,envío,bilingüe",
    description: `Mercatren reúne tiendas independientes y miles de productos en un solo lugar. Mira, compara y paga con tu tarjeta de forma segura. Cada pedido lo vende y lo factura Mercatren LLC, una empresa de Estados Unidos con sede en Michigan.

LO QUE PUEDES HACER
• Ver miles de productos de electrónica, hogar, moda, belleza, mascotas y más.
• Descubrir tiendas en videos cortos.
• Ver el precio completo desde el principio, con el envío incluido donde aplica. Sin sorpresas al pagar.
• Pagar de forma segura con tu tarjeta de crédito o débito.
• Seguir cada pedido desde el pago hasta la entrega, con el número de guía en tu cuenta.
• Tener tu propia dirección de casillero en Miami para recibir compras de otras tiendas en línea.
• Abrir tu propia tienda y empezar a vender, con la misma cuenta.

POR QUÉ MERCATREN
• Una sola cuenta para comprar, seguir tus pedidos, usar tu casillero y vender.
• Precios claros y un registro documentado de cada compra.
• Totalmente bilingüe: usa la app en español o en inglés.
• Un equipo real detrás. ¿Preguntas? Escríbenos a hola@mercatren.com.

TUS DATOS, TU DECISIÓN
Puedes borrar tu cuenta cuando quieras, desde la app (Cuenta → Más opciones de la cuenta → Borrar mi cuenta) o en mercatren.com/delete-account.

Mercatren LLC · Novi, Michigan, EE. UU.`,
  },
};

const [info] = (await asc("GET", `/v1/apps/${APP_ID}/appInfos`)).data;
await asc("PATCH", `/v1/appInfos/${info.id}`, {
  data: {
    type: "appInfos",
    id: info.id,
    relationships: {
      primaryCategory: { data: { type: "appCategories", id: "SHOPPING" } },
      secondaryCategory: { data: { type: "appCategories", id: "BUSINESS" } },
    },
  },
});

const infoLocs = (
  await asc("GET", `/v1/appInfos/${info.id}/appInfoLocalizations`)
).data;
for (const [locale, t] of Object.entries(TEXTOS)) {
  const attrs = {
    name: t.name,
    subtitle: t.subtitle,
    privacyPolicyUrl: t.privacyPolicyUrl,
  };
  const ya = infoLocs.find((l) => l.attributes.locale === locale);
  if (ya) {
    await asc("PATCH", `/v1/appInfoLocalizations/${ya.id}`, {
      data: { type: "appInfoLocalizations", id: ya.id, attributes: attrs },
    });
  } else {
    await asc("POST", "/v1/appInfoLocalizations", {
      data: {
        type: "appInfoLocalizations",
        attributes: { locale, ...attrs },
        relationships: { appInfo: { data: { type: "appInfos", id: info.id } } },
      },
    });
  }
}

/* La edad: sin nulos (booleanos o NONE). Los comercios publican sus productos,
   videos y preguntas: contenido de los usuarios. Lo demás, nada. */
const edad = (await asc("GET", `/v1/appInfos/${info.id}/ageRatingDeclaration`))
  .data;
const BOOLEANOS = new Set([
  "advertising",
  "gambling",
  "lootBox",
  "healthOrWellnessTopics",
  "messagingAndChat",
  "parentalControls",
  "ageAssurance",
  "socialMedia",
  "socialMediaAgeRestricted",
  "unrestrictedWebAccess",
  "userGeneratedContent",
]);
const OMITIR = new Set([
  "kidsAgeBand",
  "gracRatingClassificationNumber",
  "developerAgeRatingInfoUrl",
]);
const respuestas = Object.fromEntries(
  Object.keys(edad.attributes)
    .filter(
      (k) =>
        !OMITIR.has(k) &&
        !k.startsWith("ageRatingOverride") &&
        k !== "koreaAgeRatingOverride",
    )
    .map((k) => [k, BOOLEANOS.has(k) ? false : "NONE"]),
);
respuestas.userGeneratedContent = true;
await asc("PATCH", `/v1/ageRatingDeclarations/${edad.id}`, {
  data: { type: "ageRatingDeclarations", id: edad.id, attributes: respuestas },
});

const [version] = (
  await asc("GET", `/v1/apps/${APP_ID}/appStoreVersions?filter[platform]=IOS`)
).data;
await asc("PATCH", `/v1/appStoreVersions/${version.id}`, {
  data: {
    type: "appStoreVersions",
    id: version.id,
    attributes: { copyright: "2026 Mercatren LLC" },
  },
});

const verLocs = (
  await asc(
    "GET",
    `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`,
  )
).data;
for (const [locale, t] of Object.entries(TEXTOS)) {
  const attrs = {
    description: t.description.slice(0, 4000),
    promotionalText: t.promotionalText.slice(0, 170),
    keywords: t.keywords.slice(0, 100),
    supportUrl: t.supportUrl,
    marketingUrl: "https://mercatren.com",
  };
  const ya = verLocs.find((l) => l.attributes.locale === locale);
  if (ya) {
    await asc("PATCH", `/v1/appStoreVersionLocalizations/${ya.id}`, {
      data: {
        type: "appStoreVersionLocalizations",
        id: ya.id,
        attributes: attrs,
      },
    });
  } else {
    await asc("POST", "/v1/appStoreVersionLocalizations", {
      data: {
        type: "appStoreVersionLocalizations",
        attributes: { locale, ...attrs },
        relationships: {
          appStoreVersion: {
            data: { type: "appStoreVersions", id: version.id },
          },
        },
      },
    });
  }
}

/* Los datos para el revisor. El contacto es el titular de la cuenta de
   desarrollador (nombre legal, como lo pide Apple) y el teléfono de la
   empresa, de ~/.config/tumbite/empresa-windoce.md. */
const revision = {
  contactFirstName: "Pedro",
  contactLastName: "Llerena",
  contactEmail: "go@windoce.com",
  contactPhone: "+1 408 415 1033",
  demoAccountName: revisor.correo ?? "",
  demoAccountPassword: revisor.contrasena ?? "",
  demoAccountRequired: true,
  notes:
    "Mercatren is a U.S. online marketplace: independent stores list their products, and every order is sold and invoiced by Mercatren LLC (Michigan). The app shows mercatren.com with native navigation (Home, Search, Cart, Account tabs), pull to refresh, swipe back and an offline screen. Sign in with the review account above (Account tab → Sign in). You can browse the catalog, add products to the cart, open a store of your own and delete the account (Account → the three-dot menu “More account options” → Delete my account). Note: checkout for items fulfilled by our current supplier is temporarily paused while we onboard a new U.S. supplier, so those product pages show 'Coming soon' instead of the buy button. Card payments run on Stripe. Support: go@windoce.com.",
};
const det = await fetch(
  `https://api.appstoreconnect.apple.com/v1/appStoreVersions/${version.id}/appStoreReviewDetail`,
  { headers: { authorization: `Bearer ${token()}` } },
).then((r) => (r.status === 200 ? r.json() : null));
if (det?.data) {
  await asc("PATCH", `/v1/appStoreReviewDetails/${det.data.id}`, {
    data: {
      type: "appStoreReviewDetails",
      id: det.data.id,
      attributes: revision,
    },
  });
} else {
  await asc("POST", "/v1/appStoreReviewDetails", {
    data: {
      type: "appStoreReviewDetails",
      attributes: revision,
      relationships: {
        appStoreVersion: { data: { type: "appStoreVersions", id: version.id } },
      },
    },
  });
}

/* Derechos de contenido: la app no muestra contenido de terceros con derechos
   que requieran licencia (los productos los publican sus propios comercios). */
await asc("PATCH", `/v1/apps/${APP_ID}`, {
  data: {
    type: "apps",
    id: APP_ID,
    attributes: {
      contentRightsDeclaration: "DOES_NOT_USE_THIRD_PARTY_CONTENT",
    },
  },
});

console.log(
  `ficha cargada: versión ${version.attributes.versionString} (${version.attributes.appStoreState}), en-US y es-MX, categoría, edad, copyright, revisión y derechos`,
);
