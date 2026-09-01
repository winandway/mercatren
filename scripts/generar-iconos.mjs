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

  // ══ LA BANDERA Y EL NOMBRE DEL PAIS, ARRIBA (31 ago 2026) ══
  //
  // Lo pidio el dueño con el cuadro rojo dibujado sobre la captura de
  // WhatsApp: las tres tarjetas se ven iguales de lejos —el mismo fondo
  // azul— y la gente cree que le compartieron el link de Estados Unidos.
  // La bandera con el nombre, arriba del logo, lo dice sin leer.
  //
  // Las tres banderas son GEOMETRIA (franjas, un canton, estrellas): se
  // dibujan exactas en SVG, sin inventar ningun trazo.
  function estrella(cx, cy, r, relleno) {
    const puntos = [];
    for (let i = 0; i < 10; i++) {
      const radio = i % 2 === 0 ? r : r * 0.382;
      const angulo = -Math.PI / 2 + (i * Math.PI) / 5;
      puntos.push(
        `${(cx + radio * Math.cos(angulo)).toFixed(2)},${(cy + radio * Math.sin(angulo)).toFixed(2)}`,
      );
    }
    return `<polygon points="${puntos.join(" ")}" fill="${relleno}"/>`;
  }

  function banderaSvg(pais, W, H) {
    if (pais === "co") {
      // Amarillo la mitad, azul un cuarto, rojo un cuarto.
      return `<rect width="${W}" height="${H / 2}" fill="#FCD116"/>
        <rect y="${H / 2}" width="${W}" height="${H / 4}" fill="#003893"/>
        <rect y="${(3 * H) / 4}" width="${W}" height="${H / 4}" fill="#CE1126"/>`;
    }
    if (pais === "cl") {
      // Canton azul con su estrella, blanco al lado, rojo abajo.
      const canton = H / 2;
      return `<rect width="${W}" height="${H / 2}" fill="#FFFFFF"/>
        <rect y="${H / 2}" width="${W}" height="${H / 2}" fill="#D52B1E"/>
        <rect width="${canton}" height="${canton}" fill="#0039A6"/>
        ${estrella(canton / 2, canton / 2, canton * 0.3, "#FFFFFF")}`;
    }
    // Estados Unidos: 13 franjas y el canton con sus 50 estrellas.
    const franja = H / 13;
    const cantonW = W * 0.4;
    const cantonH = franja * 7;
    let svg = "";
    for (let i = 0; i < 13; i++) {
      svg += `<rect y="${(i * franja).toFixed(2)}" width="${W}" height="${(franja + 0.5).toFixed(2)}" fill="${i % 2 === 0 ? "#B22234" : "#FFFFFF"}"/>`;
    }
    svg += `<rect width="${cantonW}" height="${cantonH}" fill="#3C3B6E"/>`;
    for (let fila = 0; fila < 9; fila++) {
      const enFila = fila % 2 === 0 ? 6 : 5;
      for (let col = 0; col < enFila; col++) {
        const cx = ((col + (fila % 2 === 0 ? 0.5 : 1)) * cantonW) / 6;
        const cy = ((fila + 0.5) * cantonH) / 9;
        svg += estrella(cx, cy, cantonH / 22, "#FFFFFF");
      }
    }
    return svg;
  }

  function capaPais(pais, nombre) {
    const W = 138;
    const H = 92;
    // El ancho del nombre, estimado: 64px seminegrita ≈ 36px por letra.
    const anchoTexto = nombre.length * 36;
    const total = W + 30 + anchoTexto;
    const x = Math.round((1200 - total) / 2);
    /* El clip se evalua DESPUES del translate, asi que su rect va en 0,0 —
       en el espacio ya trasladado. Con las coordenadas absolutas recortaba
       todo y la bandera salia vacia. */
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="140">
      <defs><clipPath id="b"><rect width="${W}" height="${H}" rx="10"/></clipPath></defs>
      <g transform="translate(${x},24)"><g clip-path="url(#b)">${banderaSvg(pais, W, H)}</g></g>
      <rect x="${x}" y="24" width="${W}" height="${H}" rx="10" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="2"/>
      <text x="${x + W + 30}" y="94" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
            font-size="64" font-weight="600" fill="${AZUL_TEXTO}" letter-spacing="1">${nombre}</text>
    </svg>`;
    return Buffer.from(svg);
  }

  async function tarjeta(archivoLogo, dominio, salida, pais, nombrePais) {
    const logo = await sharp(await readFile(path.join(MARCA, archivoLogo)), {
      density: 300,
    })
      .resize({ width: dominio ? 640 : 760 })
      .png()
      .toBuffer();

    const capas = [{ input: logo, gravity: "center" }];

    if (pais && nombrePais) {
      capas.push({ input: capaPais(pais, nombrePais), top: 60, left: 0 });
    }

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

  // El principal conserva su logotipo con «.com» dibujado, y arriba lleva
  // su bandera igual que los demas: si solo la llevaran Chile y Colombia,
  // el de Estados Unidos pareceria «el generico» en vez de el suyo.
  await tarjeta(
    "mercatren-isologotipo-horizontal-com-oscuro.svg",
    null,
    "og.png",
    "us",
    "Estados Unidos",
  );

  // Los demás países: bandera y nombre arriba, logo oficial sin dominio, y
  // el dominio escrito debajo.
  for (const [archivo, dominio, pais, nombre] of [
    ["og-cl.png", "mercatren.cl", "cl", "Chile"],
    ["og-co.png", "mercatren.com.co", "co", "Colombia"],
  ]) {
    await tarjeta(
      "mercatren-isologotipo-horizontal-oscuro.svg",
      dominio,
      archivo,
      pais,
      nombre,
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
