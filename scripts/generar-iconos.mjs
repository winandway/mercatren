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
  //
  // ══ UNA POR PAIS (17 ago 2026) ══
  //
  // Al compartir mercatren.cl salia la tarjeta con el logotipo «Mercatren.com»
  // dibujado dentro. El texto de la tarjeta ya decia Chile, pero la IMAGEN
  // seguia diciendo otro dominio — y la imagen es lo primero que se mira.
  //
  // EL LOGOTIPO NO SE INVENTA. El «.com» del logo oficial son TRAZOS, no
  // texto: no hay forma honesta de convertirlo en «.cl» sin dibujar letras a
  // ojo, y un logotipo con letras inventadas es peor que no tenerlo. Para los
  // demas paises se usa el logo oficial SIN dominio —que es un archivo de
  // marca de verdad— y el dominio va debajo, como texto de la tarjeta.
  //
  // Eso no es alterar la marca: es una tarjeta de difusion, no el logotipo.
  const AZUL_TEXTO = "#FFFFFF";

  async function tarjeta(archivoLogo, dominio, salida) {
    const logo = await sharp(await readFile(path.join(MARCA, archivoLogo)), {
      density: 300,
    })
      .resize({ width: dominio ? 640 : 760 })
      .png()
      .toBuffer();

    const capas = [{ input: logo, gravity: "center" }];

    if (dominio) {
      /* El dominio en texto, centrado bajo el logo. Se dibuja como SVG para
         que salga nitido a cualquier tamaño, no como imagen escalada. */
      const alto = 120;
      const rotulo = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${alto}">
           <text x="600" y="78" text-anchor="middle"
                 font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
                 font-size="64" font-weight="600" fill="${AZUL_TEXTO}"
                 letter-spacing="1">${dominio}</text>
         </svg>`,
      );
      capas.push({ input: rotulo, top: 380, left: 0 });
    }

    await sharp({
      create: { width: 1200, height: 630, channels: 4, background: AZUL },
    })
      .composite(capas)
      .png()
      .toFile(path.join(PUBLICO, salida));
  }

  // El principal conserva su logotipo con «.com» dibujado, tal cual estaba.
  await tarjeta(
    "mercatren-isologotipo-horizontal-com-oscuro.svg",
    null,
    "og.png",
  );

  // Los demás países: logo oficial sin dominio + el suyo escrito debajo.
  for (const [archivo, dominio] of [
    ["og-cl.png", "mercatren.cl"],
    ["og-co.png", "mercatren.com.co"],
  ]) {
    await tarjeta(
      "mercatren-isologotipo-horizontal-oscuro.svg",
      dominio,
      archivo,
    );
  }

  await writeFile(
    path.join(PUBLICO, "LEEME-iconos.txt"),
    "Los archivos icon-*.png y og.png se generan solos con `npm run iconos`.\n" +
      "No los edites a mano: el original es el logo de public/logo_mercatren.\n",
  );

  console.log("Iconos y tarjeta social generados.");
}

await mkdir(PUBLICO, { recursive: true });
await generar();
