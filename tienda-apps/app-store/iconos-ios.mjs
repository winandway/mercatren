import { createRequire } from "node:module";
const require = createRequire("/Users/windocellc/Mercatren.com/package.json");
const sharp = require("sharp");
const fs = require("node:fs");
const raiz = "/Users/windocellc/Mercatren.com";
const svg = fs.readFileSync(
  `${raiz}/public/logo_mercatren/mercatren-icono-app.svg`,
);
// El ícono de Apple: 1024, sin transparencia (Apple lo rechaza con canal alfa).
await sharp(svg, { density: 600 })
  .resize(1024, 1024)
  .flatten({ background: "#10263A" })
  .removeAlpha()
  .png()
  .toFile(
    `${raiz}/app-ios/Mercatren/Assets.xcassets/AppIcon.appiconset/icono-1024.png`,
  );
// El logo de la pantalla de arranque, sobre el azul de la marca.
const vertical = fs.readFileSync(
  `${raiz}/public/logo_mercatren/mercatren-isologotipo-vertical-oscuro.svg`,
);
await sharp(vertical, { density: 300 })
  .resize({ width: 660 })
  .png()
  .toFile(`${raiz}/app-ios/Mercatren/Assets.xcassets/Logo.imageset/logo.png`);
console.log("listo");
