import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  abiertoDentroDeUnaApp,
  appQueLoAbrio,
} from "@/lib/navegador/dentro-de-app";

/**
 * ABRIR EL ENLACE DE COBRO DESDE WHATSAPP ESCONDE LOS BANCOS.
 *
 * Lo reportó el dueño: «cuando ese link se envía por WhatsApp y uno lo abre, no
 * salen los bancos. ¿Por qué? No lo sé».
 *
 * La causa no es nuestra ni de Stripe: dentro de una app la página corre en un
 * navegador de mentira (*webview*) que **no puede abrir la ventana del banco
 * para identificarse**, así que Stripe directamente no ofrece ese método. Desde
 * el lado del comercio la página se ve completa, y nadie entiende nada.
 */
describe("reconocer el navegador que va dentro de una app", () => {
  it("WhatsApp, que es por donde se manda el enlace", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 WhatsApp/2.24.10.85";
    expect(abiertoDentroDeUnaApp(ua)).toBe(true);
    expect(appQueLoAbrio(ua)).toBe("WhatsApp");
  });

  it("Instagram, Facebook y Messenger también", () => {
    expect(abiertoDentroDeUnaApp("Mozilla/5.0 (iPhone) Instagram 300.0")).toBe(
      true,
    );
    expect(
      abiertoDentroDeUnaApp("Mozilla/5.0 (iPhone) [FBAN/FBIOS;FBAV/460.0]"),
    ).toBe(true);
    expect(appQueLoAbrio("Mozilla/5.0 [FBAN/FBIOS]")).toBe("Facebook");
  });

  it("UN NAVEGADOR DE VERDAD NO, aunque sea de móvil", () => {
    /* Este es el caso que importa no equivocar: casi todos los navegadores de
       móvil llevan «Safari» o «Chrome» en su identificación, **incluidos los
       webviews**. Si se dedujera «no es Chrome, luego es un webview», el aviso
       le saldría a media clientela — y un aviso que sale cuando no hace falta
       se aprende a ignorar. */
    expect(
      abiertoDentroDeUnaApp(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) AppleWebKit/605.1.15 CriOS/126.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
    expect(
      abiertoDentroDeUnaApp(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
    expect(
      abiertoDentroDeUnaApp("Mozilla/5.0 (Macintosh) Safari/605.1.15"),
    ).toBe(false);
  });

  it("sin identificación no se inventa nada", () => {
    /* Ante la duda, NO se avisa: enseñar el aviso a quien está en Chrome es
       mandarlo a copiar un enlace que ya tiene abierto. */
    expect(abiertoDentroDeUnaApp(null)).toBe(false);
    expect(abiertoDentroDeUnaApp("")).toBe(false);
    expect(appQueLoAbrio(null)).toBeNull();
  });

  it("una app que no se reconoce por nombre igual avisa", () => {
    /* WeChat no se nombra en el aviso, pero el problema es el mismo. Mejor un
       «estás dentro de una aplicación» sin nombre que ningún aviso. */
    const ua = "Mozilla/5.0 (iPhone) MicroMessenger/8.0";
    expect(abiertoDentroDeUnaApp(ua)).toBe(true);
    expect(appQueLoAbrio(ua)).toBeNull();
  });
});

describe("el aviso está enchufado en la página de cobro", () => {
  const pagina = readFileSync(
    "src/app/[locale]/cobro/[enlace]/page.tsx",
    "utf8",
  );

  it("la página mira el navegador", () => {
    expect(
      pagina,
      "se quitó el aviso: quien abra el cobro desde WhatsApp no verá los bancos y no sabrá por qué",
    ).toContain("abiertoDentroDeUnaApp(ua)");
  });

  it("y va ANTES de los métodos de pago", () => {
    /* Quien ya eligió tarjeta porque era lo único que veía no vuelve a subir a
       leer un aviso. */
    expect(pagina.indexOf("AvisoNavegador")).toBeLessThan(
      pagina.indexOf("<MetodosDeCobro"),
    );
  });
});
