/**
 * Genera los iconos de la aplicacion y la imagen que se ve al compartir el
 * enlace, a partir del logo oficial que esta en public/logo_mercatren.
 *
 * Se corre a mano cuando cambia el logo:  npm run iconos
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const RAIZ = process.cwd();
const MARCA = path.join(RAIZ, "public", "logo_mercatren");
const PUBLICO = path.join(RAIZ, "public");
const APP = path.join(RAIZ, "src", "app");

const AZUL = "#10263A";

async function generar() {
  const iconoApp = await readFile(path.join(MARCA, "mercatren-icono-app.svg"));

  // Iconos cuadrados de la aplicacion instalable.
  for (const tamano of [192, 512]) {
    await sharp(iconoApp, { density: 384 })
      .resize(tamano, tamano, { fit: "contain" })
      .png()
      .toFile(path.join(PUBLICO, `icon-${tamano}.png`));
  }

  // Version "maskable": Android le recorta las esquinas, asi que el dibujo
  // tiene que quedar mas chico y con fondo hasta el borde.
  const interior = await sharp(iconoApp, { density: 384 })
    .resize(340, 340, { fit: "contain", background: AZUL })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: AZUL,
    },
  })
    .composite([{ input: interior, gravity: "center" }])
    .png()
    .toFile(path.join(PUBLICO, "icon-maskable-512.png"));

  // Favicon de la pestana y icono de iPhone.
  await sharp(iconoApp, { density: 384 })
    .resize(64, 64)
    .png()
    .toFile(path.join(APP, "icon.png"));

  await sharp(iconoApp, { density: 384 })
    .resize(180, 180)
    .png()
    .toFile(path.join(APP, "apple-icon.png"));

  // Tarjeta que se ve al compartir el enlace en WhatsApp, Facebook o X.
  const logoAncho = 760;
  const logo = await sharp(
    await readFile(
      path.join(MARCA, "mercatren-isologotipo-horizontal-com-oscuro.svg"),
    ),
    { density: 300 },
  )
    .resize({ width: logoAncho })
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: AZUL },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(PUBLICO, "og.png"));

  await writeFile(
    path.join(PUBLICO, "LEEME-iconos.txt"),
    "Los archivos icon-*.png y og.png se generan solos con `npm run iconos`.\n" +
      "No los edites a mano: el original es el logo de public/logo_mercatren.\n",
  );

  console.log("Iconos y tarjeta social generados.");
}

await mkdir(PUBLICO, { recursive: true });
await generar();
