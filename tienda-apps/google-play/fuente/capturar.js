/**
 * CAPTURAS DEL SITIO PARA LA FICHA DE GOOGLE PLAY
 *
 * Abre mercatren.com con Chromium (Playwright) en modo celular o tableta y
 * guarda la parte de arriba de cada pantalla, sin marco, en alta resolución.
 * Solo LEE el sitio público: lo único que «toca» es el carrito, que vive en
 * el navegador.
 *
 * Uso (desde cualquier carpeta; Playwright se toma del proyecto):
 *   node capturar.js                      → todo (teléfono y tableta, en y es)
 *   node capturar.js telefono 02 05       → solo esas pantallas del teléfono
 *   node capturar.js tableta              → solo la tableta
 *
 * Salida: ../capturas-originales/<dispositivo>-<idioma>-<nn>-<nombre>.png
 */
const path = require("path");
const {
  chromium,
} = require("/Users/windocellc/Mercatren.com/node_modules/playwright-core");

const SITIO = "https://mercatren.com";
const SALIDA = path.join(__dirname, "..", "capturas-originales");

const DISPOSITIVOS = {
  telefono: {
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    isMobile: true,
    hasTouch: true,
  },
  tableta: {
    viewport: { width: 834, height: 1194 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    isMobile: true,
    hasTouch: true,
  },
};

/* El producto de la ficha y los del carrito: fotos limpias y títulos cortos. */
const FICHA = "metal-planter-box-with-trellis-330369";
const CARRITO = [
  "metal-planter-box-with-trellis-330369",
  "vanity-chair-with-butterfly-back-swivel-accent-chair-dining-370753",
  "bamboo-folding-edge-table-with-movable-storage-foldable-tabl-444098",
];
const VIDEO = "samples-nlrdyc";
const CUADRO_VIDEO = 8.7;

const TEXTOS = {
  en: {
    todo: /^\s*All\s*$/,
    agregar: /Add to cart/,
    comercios: "Merchants on Mercatren",
    casillero: "This is what you fill in at the store",
    plazo: "Arrives in 2 to 5 business days",
    busqueda: "chair",
  },
  es: {
    todo: /^\s*Todo\s*$/,
    agregar: /Agregar al carrito/,
    comercios: "Comercios en Mercatren",
    casillero: "Así se llena en la tienda",
    plazo: "Llega en 2 a 5 días hábiles",
    busqueda: "silla",
  },
};

async function esperarCarga(page, extra = 1500) {
  await page
    .waitForLoadState("networkidle", { timeout: 60000 })
    .catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  /* Las fotos perezosas: se fuerzan a cargar y se espera a que terminen. */
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    imgs.forEach((i) => (i.loading = "eager"));
    await Promise.all(
      imgs
        .filter((i) => !i.complete)
        .map(
          (i) =>
            new Promise((r) => {
              i.onload = i.onerror = r;
              setTimeout(r, 8000);
            }),
        ),
    );
  });
  await page.waitForTimeout(extra);
}

/** Lleva un texto visible justo debajo de la cabecera fija (140 px). */
async function subirHasta(page, texto, margen = 16) {
  await page.evaluate(
    ({ texto, margen }) => {
      const el = Array.from(document.querySelectorAll("h1,h2,h3,p,span,div,a"))
        .filter(
          (e) => e.childElementCount === 0 && e.textContent.trim() === texto,
        )
        .find((e) => e.getBoundingClientRect().height > 0);
      if (!el) throw new Error("No encontré: " + texto);
      const cabecera = document.querySelector("header");
      const alto = cabecera ? cabecera.getBoundingClientRect().height : 0;
      window.scrollTo(
        0,
        el.getBoundingClientRect().top + window.scrollY - alto - margen,
      );
    },
    { texto, margen },
  );
}

/** Esconde la línea del plazo de entrega: en la ficha de la tienda no van plazos. */
async function esconderPlazo(page, texto) {
  await page.evaluate((texto) => {
    for (const e of document.querySelectorAll("p,li,div,span")) {
      if (e.textContent.trim() === texto) e.style.display = "none";
    }
  }, texto);
}

const PANTALLAS = {
  "01-portada": async (page, l) => {
    await page.goto(`${SITIO}/${l}`, { waitUntil: "load", timeout: 90000 });
    await esperarCarga(page);
  },
  "02-ficha": async (page, l, t, disp) => {
    await page.goto(`${SITIO}/${l}/producto/${FICHA}`, {
      waitUntil: "load",
      timeout: 90000,
    });
    await esperarCarga(page);
    await esconderPlazo(page, t.plazo);
    /* Se baja lo justo para que se vean la foto, el precio y el botón. */
    if (disp === "telefono") await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(600);
  },
  "03-departamentos": async (page, l, t) => {
    await page.goto(`${SITIO}/${l}`, { waitUntil: "load", timeout: 90000 });
    await esperarCarga(page, 500);
    await page.getByRole("button", { name: t.todo }).first().click();
    await page.waitForTimeout(1500);
  },
  "04-busqueda": async (page, l, t, disp) => {
    await page.goto(`${SITIO}/${l}/catalogo?q=${t.busqueda}`, {
      waitUntil: "load",
      timeout: 120000,
    });
    await esperarCarga(page);
    if (disp === "telefono") {
      await page.evaluate(() => {
        const campo = document.querySelector(
          'main input[type="search"], main input',
        );
        const alto = document
          .querySelector("header")
          .getBoundingClientRect().height;
        window.scrollTo(
          0,
          campo.getBoundingClientRect().top + window.scrollY - alto - 16,
        );
      });
      await esperarCarga(page, 1200);
    }
  },
  "05-video": async (page, l) => {
    await page.goto(`${SITIO}/${l}/video/${VIDEO}`, {
      waitUntil: "load",
      timeout: 90000,
    });
    await esperarCarga(page, 500);
    await page.waitForFunction(
      () => {
        const v = document.querySelector("video");
        return v && v.readyState >= 3;
      },
      null,
      { timeout: 30000 },
    );
    /* El segundo 8,7 es el cuadro más nítido (medido con detección de bordes). */
    await page.evaluate(async (t) => {
      const v = document.querySelector("video");
      v.pause();
      await new Promise((r) => {
        v.onseeked = r;
        v.currentTime = t;
        setTimeout(r, 4000);
      });
    }, CUADRO_VIDEO);
    await page.waitForTimeout(800);
  },
  "06-tiendas": async (page, l, t) => {
    /* La portada sigue cargando productos al bajar (carga infinita, con un
       escuchador de scroll) y empuja la sección de comercios. En una pestaña
       aparte se corta solo el pedido de «más productos», para que la sección
       se quede quieta. */
    const p = await page.context().newPage();
    await p.route(/\/datos\/catalogo\?/, (ruta) => ruta.abort());
    await p.goto(`${SITIO}/${l}`, { waitUntil: "load", timeout: 90000 });
    await esperarCarga(p, 500);
    /* Además, hay secciones que se arman al acercarse: se vuelve a subir
       hasta que el título se queda quieto debajo de la cabecera. */
    for (let i = 0; i < 10; i++) {
      await subirHasta(p, t.comercios);
      await esperarCarga(p, 1500);
      const arriba = await p.evaluate((texto) => {
        const el = Array.from(document.querySelectorAll("h2")).find(
          (e) => e.textContent.trim() === texto,
        );
        return el ? Math.round(el.getBoundingClientRect().top) : -1;
      }, t.comercios);
      if (arriba >= 145 && arriba <= 170) break;
    }
    return p;
  },
  "07-carrito": async (page, l, t) => {
    const vacio = await page.evaluate(() => true);
    if (vacio && !page.__carritoLleno) {
      for (const s of CARRITO) {
        await page.goto(`${SITIO}/${l}/producto/${s}`, {
          waitUntil: "load",
          timeout: 90000,
        });
        await page.getByRole("button", { name: t.agregar }).first().click();
        await page.waitForTimeout(1500);
      }
      page.__carritoLleno = true;
    }
    await page.goto(`${SITIO}/${l}/carrito`, {
      waitUntil: "load",
      timeout: 90000,
    });
    await esperarCarga(page);
  },
  "08-casillero": async (page, l, t) => {
    await page.goto(`${SITIO}/${l}/casillero`, {
      waitUntil: "load",
      timeout: 90000,
    });
    await esperarCarga(page, 500);
    await subirHasta(page, t.casillero);
    await esperarCarga(page, 800);
  },
};

const TABLETA = (
  process.env.TABLETA || "01-portada,04-busqueda,06-tiendas,07-carrito"
).split(",");

(async () => {
  const args = process.argv.slice(2);
  const quien = args.find((a) => DISPOSITIVOS[a]);
  const solo = args.filter((a) => /^\d\d$/.test(a));
  const browser = await chromium.launch();
  for (const disp of quien ? [quien] : Object.keys(DISPOSITIVOS)) {
    for (const l of ["en", "es"]) {
      /* Sin el trabajador de la app instalable: así cada captura sale fresca
         del sitio y los pedidos de red se pueden cortar donde haga falta. */
      const ctx = await browser.newContext({
        ...DISPOSITIVOS[disp],
        locale: l === "en" ? "en-US" : "es-US",
        serviceWorkers: "block",
      });
      const page = await ctx.newPage();
      const lista = disp === "tableta" ? TABLETA : Object.keys(PANTALLAS);
      for (const nombre of lista) {
        if (solo.length && !solo.includes(nombre.slice(0, 2))) continue;
        const archivo = path.join(SALIDA, `${disp}-${l}-${nombre}.png`);
        try {
          const otra = await PANTALLAS[nombre](page, l, TEXTOS[l], disp);
          await (otra || page).screenshot({ path: archivo });
          if (otra) await otra.close();
          console.log("ok", archivo);
        } catch (e) {
          console.log("FALLÓ", disp, l, nombre, e.message.slice(0, 200));
        }
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
