/**
 * COMPONE LAS IMÁGENES FINALES DE LA FICHA DE GOOGLE PLAY
 *
 * Toma las capturas de ../capturas-originales, los textos de textos.json y
 * la plantilla.html, y deja en ../ (la carpeta google-play):
 *   icono-512.png · grafico-destacado-en/es.png · telefono-en/es-01..08.png ·
 *   tableta-en/es-01..04.png
 * Después corre:  python3 finalizar.py   (quita el canal alfa y verifica medidas)
 *
 * Uso:  node componer.js            → todo
 *       node componer.js telefono   → solo un grupo (telefono|tableta|destacado|icono)
 */
const fs = require("fs");
const path = require("path");
const {
  chromium,
} = require("/Users/windocellc/Mercatren.com/node_modules/playwright-core");

const AQUI = __dirname;
const SALIDA = path.join(AQUI, "..");
const ORIGINALES = path.join(SALIDA, "capturas-originales");
const LOGOS = "/Users/windocellc/Mercatren.com/public/logo_mercatren";
const PLANTILLA = "file://" + path.join(AQUI, "plantilla.html");
const TEXTOS = JSON.parse(
  fs.readFileSync(path.join(AQUI, "textos.json"), "utf8"),
);

/** El logo horizontal para fondo azul, sin su rectángulo de fondo. */
const LOGO_SVG = fs
  .readFileSync(
    path.join(LOGOS, "mercatren-isologotipo-horizontal-com-oscuro.svg"),
    "utf8",
  )
  .replace(/<rect[^>]*\/>/, "")
  .replace(/\s(width|height)="[^"]*"/g, "");

/** Solo el tren (rayas, vagón, ruedas y riel) del ícono de la app. */
const TREN = (() => {
  const svg = fs.readFileSync(
    path.join(LOGOS, "mercatren-icono-app.svg"),
    "utf8",
  );
  return svg.slice(
    svg.indexOf(">", svg.indexOf("<g")) + 1,
    svg.lastIndexOf("</g>"),
  );
})();

function datosDeCaptura(archivo) {
  const buf = fs.readFileSync(archivo);
  return {
    url: "data:image/png;base64," + buf.toString("base64"),
    ancho: buf.readUInt32BE(16),
    alto: buf.readUInt32BE(20),
  };
}

/** Mira la captura para pintar la barra de estado y la rayita de gestos a juego. */
async function colores(page, url) {
  return page.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const px = g.getImageData(Math.round(c.width / 2), 3, 1, 1).data;
    const lum = (r, gg, b) => 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    const abajo = g.getImageData(
      Math.round(c.width * 0.3),
      c.height - 60,
      Math.round(c.width * 0.4),
      40,
    ).data;
    let s = 0;
    for (let i = 0; i < abajo.length; i += 4)
      s += lum(abajo[i], abajo[i + 1], abajo[i + 2]);
    const lumAbajo = s / (abajo.length / 4);
    return {
      barraColor: `rgb(${px[0]},${px[1]},${px[2]})`,
      barraTexto: lum(px[0], px[1], px[2]) < 140 ? "#FFFFFF" : "#10263A",
      gestoColor:
        lumAbajo > 140 ? "rgba(16,38,58,.38)" : "rgba(255,255,255,.62)",
    };
  }, url);
}

async function sacar(browser, ancho, alto, datos, archivo) {
  const page = await browser.newPage({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 1,
  });
  await page.goto(PLANTILLA, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (datos.captura) Object.assign(datos, await colores(page, datos.captura));
  await page.evaluate((d) => window.pintar(d), datos);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((i) => i.decode().catch(() => {})),
    );
  });
  const geist = await page.evaluate(() =>
    document.fonts.check('800 40px "Geist"'),
  );
  if (!geist)
    console.log("  aviso: Geist no cargó, se usó la letra de respaldo");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: archivo,
    clip: { x: 0, y: 0, width: ancho, height: alto },
  });
  await page.close();
  console.log("ok", path.basename(archivo));
}

(async () => {
  const grupo = process.argv[2];
  const browser = await chromium.launch();

  if (!grupo || grupo === "icono") {
    /* El tren mide 94 × 65,5 en sus coordenadas (centro 48 ; 54,25). Se
       escala a ~64 % del ancho para que el redondeo de Google no lo toque. */
    const escala = 3.5;
    await sacar(
      browser,
      512,
      512,
      {
        modo: "icono",
        tren: TREN,
        escala,
        tx: 256 - 48 * escala,
        ty: 256 - 54.25 * escala,
      },
      path.join(SALIDA, "icono-512.png"),
    );
  }

  for (const l of ["en", "es"]) {
    if (!grupo || grupo === "telefono") {
      for (const [i, item] of TEXTOS.telefono.entries()) {
        const cap = datosDeCaptura(
          path.join(ORIGINALES, `telefono-${l}-${item.captura}.png`),
        );
        await sacar(
          browser,
          1080,
          1920,
          {
            modo: "telefono",
            fondo: item.fondo,
            logo: !!item.logo,
            logoSvg: LOGO_SVG,
            titulo: item[l].titulo,
            linea: item[l].linea,
            captura: cap.url,
            ancho: cap.ancho,
            alto: cap.alto,
          },
          path.join(
            SALIDA,
            `telefono-${l}-${String(i + 1).padStart(2, "0")}.png`,
          ),
        );
      }
    }
    if (!grupo || grupo === "tableta") {
      for (const [i, item] of TEXTOS.tableta.entries()) {
        const textos = TEXTOS.telefono.find((t) => t.captura === item.copiaDe)[
          l
        ];
        const cap = datosDeCaptura(
          path.join(ORIGINALES, `tableta-${l}-${item.captura}.png`),
        );
        await sacar(
          browser,
          1080,
          1920,
          {
            modo: "tableta",
            fondo: item.fondo,
            logo: !!item.logo,
            logoSvg: LOGO_SVG,
            titulo: textos.titulo,
            linea: textos.linea,
            captura: cap.url,
            ancho: cap.ancho,
            alto: cap.alto,
          },
          path.join(
            SALIDA,
            `tableta-${l}-${String(i + 1).padStart(2, "0")}.png`,
          ),
        );
      }
    }
    if (!grupo || grupo === "destacado") {
      const a = datosDeCaptura(
        path.join(ORIGINALES, `telefono-${l}-01-portada.png`),
      );
      const b = datosDeCaptura(
        path.join(ORIGINALES, `telefono-${l}-02-ficha.png`),
      );
      await sacar(
        browser,
        1024,
        500,
        {
          modo: "destacado",
          logoSvg: LOGO_SVG,
          titulo: TEXTOS.destacado[l].titulo,
          linea: TEXTOS.destacado[l].linea,
          captura: a.url,
          captura2: b.url,
          ancho: a.ancho,
          alto: a.alto,
        },
        path.join(SALIDA, `grafico-destacado-${l}.png`),
      );
    }
  }
  await browser.close();
})();
