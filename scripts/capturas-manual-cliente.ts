import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium, type Page } from "playwright";

import { armarHtml } from "../src/lib/correo/plantilla";

/**
 * LAS CAPTURAS DEL MANUAL DEL CLIENTE, SACADAS DEL SITIO DE VERDAD.
 *
 * ══ POR QUÉ NO SE DIBUJAN A MANO ══
 *
 * Un manual con pantallas inventadas envejece a la primera semana y, peor,
 * enseña algo que no existe: la persona busca un botón que dibujó un diseñador
 * y no lo encuentra. Estas salen del `npm run dev` con un cobro sembrado, así
 * que son exactamente lo que va a ver el cliente.
 *
 * ══ EN TAMAÑO DE TELÉFONO, A PROPÓSITO ══
 *
 * Quien recibe un enlace de cobro por correo lo abre en el celular. Enseñarle
 * la versión de escritorio es enseñarle otra pantalla.
 *
 * Antes de correrlo: `npm run dev` y el cobro de demostración en la base.
 */
const CARPETA = resolve("scripts/plantillas/capturas");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ENLACE = process.env.ENLACE_DEMO ?? "manualdemostracion01";

/** El teléfono más común. Nada de anchos raros que no existen. */
const TELEFONO = { width: 390, height: 844 };

/** Recorta la tarjeta del cobro, sin el encabezado de la tienda.
 *
 *  El manual habla de UNA cosa —pagar—, y el menú de la tienda alrededor solo
 *  invita a perderse. */
/**
 * OCULTA LO QUE SOLO PASA EN MI MÁQUINA.
 *
 * En local no hay claves de Stripe, así que la página avisa de que «el pago con
 * tarjeta no está disponible». **En producción sí está configurado**, y el
 * cliente nunca ve ese aviso. Dejarlo en el manual sería enseñarle un fallo que
 * no existe y espantarlo antes de pagar.
 *
 * Esto NO dibuja nada que no exista: solo quita un aviso propio del entorno de
 * desarrollo para que la captura se parezca a la realidad, que es justo lo que
 * un manual tiene que hacer.
 */
async function quitarAvisosDeLocal(pagina: Page) {
  await pagina.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll("p, div"))) {
      const t = el.textContent ?? "";
      /* Nunca se esconde algo que contenga un botón: en el primer intento el
         filtro se llevó por delante las opciones de pago y la captura salió
         sin ellas. */
      if (el.querySelector("button")) continue;
      if (/no está disponible en este momento/i.test(t) && t.length < 200) {
        (el as HTMLElement).style.display = "none";
      }
    }
  });
}

async function recortarTarjeta(pagina: Page, nombre: string) {
  await quitarAvisosDeLocal(pagina);
  const tarjeta = pagina.locator("main .rounded-2xl, main .rounded-xl").first();
  const objetivo = (await tarjeta.count()) > 0 ? tarjeta : pagina.locator("main");
  await objetivo.screenshot({ path: `${CARPETA}/${nombre}.png` });
  console.log(`  ✓ ${nombre}.png`);
}

async function main() {
  await mkdir(CARPETA, { recursive: true });

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: TELEFONO,
    deviceScaleFactor: 2, // que se lea bien impreso
    locale: "es-VE",
  });
  const pagina = await contexto.newPage();

  console.log("1· El correo que le llega");
  const correo = armarHtml({
    asunto: "Ferremateriales Bley C.A te pasó un cobro",
    previo: "Son $65.00. Puedes pagarlo con tarjeta o por Zelle.",
    saludo: "Hola,",
    titulo: "Ferremateriales Bley C.A te pasó un cobro",
    parrafos: [
      "Puedes pagarlo desde donde estés, con tarjeta o por Zelle.",
      "El enlace vence en 48 horas.",
    ],
    datos: [
      { etiqueta: "Comercio", valor: "Ferremateriales Bley C.A" },
      { etiqueta: "Factura", valor: "F-00123" },
      { etiqueta: "Monto", valor: "$65.00" },
    ],
    boton: { texto: "Pagar ahora", url: "#" },
    motivo: "Recibes este correo porque un comercio te pasó un cobro.",
    contacto: "¿Dudas? Escríbenos.",
  });
  const archivoCorreo = `${CARPETA}/correo.html`;
  await writeFile(archivoCorreo, correo, "utf8");
  await pagina.goto(pathToFileURL(archivoCorreo).href, { waitUntil: "load" });
  await pagina.screenshot({ path: `${CARPETA}/paso1-correo.png`, fullPage: true });
  console.log("  ✓ paso1-correo.png");

  console.log("2· La página de pago");
  await pagina.goto(`${BASE}/es/cobro/${ENLACE}`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1200);
  await recortarTarjeta(pagina, "paso2-pagina");

  console.log("3· Por Zelle");
  const zelle = pagina.locator("button", { hasText: /Zelle/i }).first();
  if (await zelle.count()) {
    await zelle.click();
    /* El detalle de Zelle —la referencia y la subida del comprobante— llega
       después, así que se espera a que aparezca en vez de contar segundos. */
    await pagina
      .getByText(/Mercatren F-|referencia|comprobante|captura/i)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => console.log("  (el detalle de Zelle no llegó a dibujarse)"));
    await quitarAvisosDeLocal(pagina);
    await pagina.locator("main").last().screenshot({
      path: `${CARPETA}/paso3-zelle.png`,
    });
    console.log("  ✓ paso3-zelle.png");
  } else {
    console.log("  (sin opción de Zelle en este cobro)");
  }

  await navegador.close();
  console.log(`\nListo. Están en ${CARPETA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
