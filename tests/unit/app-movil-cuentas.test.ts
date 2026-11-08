import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PREFIJO_DE_GALLETAS,
  RUTA_AUTH,
  urlEscudo,
} from "../../app-movil/src/lib/api";
import {
  hayAlgoEscrito,
  leerBorrador,
  llaveDeBorrador,
  sinSensibles,
} from "../../app-movil/src/lib/borrador";
import {
  correoBienEscrito,
  faltaEnAlta,
  faltaEnEntrada,
  mensajeDeError,
} from "../../app-movil/src/lib/cuentas";
import {
  CABECERA_ESCUDO,
  cabeceraDelEscudo,
  leerMensajeDelEscudo,
} from "../../app-movil/src/lib/escudo";
import { paginaDelEscudo } from "@/lib/app-movil/escudo";
import { origenesDeLaApp } from "@/lib/app-movil/origenes";
import { paisDelAltaValido } from "@/lib/cuenta/pais-del-alta";
import { RUTA_AUTH as RUTA_AUTH_DEL_SITIO } from "@/lib/rutas";

/**
 * LAS CUENTAS DENTRO DE LA APP (5 nov 2026, Parte 3 del plan). Lo que no puede
 * pasar sin que esto se ponga en rojo: que la app no reconozca la sesión del
 * sitio (pasó: prefijo de galletas distinto), que un origen cualquiera pueda
 * usar las cuentas en producción, que se cree una cuenta con un país
 * inventado, que el borrador guarde una contraseña, o que la app entre sin el
 * escudo anti-robots cuando está configurado.
 */

const leer = (r: string) => readFileSync(r, "utf-8");
const APP = "app-movil/src";

function archivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? archivosDe(p) : [p];
  });
}

describe("la app y el sitio hablan de la misma sesión", () => {
  it("el prefijo de las galletas de la app es el del sitio", () => {
    const auth = leer("src/lib/auth.ts");
    const prefijo = auth.match(/cookiePrefix:\s*"([^"]+)"/)?.[1];
    expect(prefijo).toBe(PREFIJO_DE_GALLETAS);
    expect(leer(`${APP}/lib/auth-client.ts`)).toContain(
      "cookiePrefix: PREFIJO_DE_GALLETAS",
    );
  });

  it("la app llama a las cuentas en la misma ruta del sitio, nunca /api", () => {
    expect(RUTA_AUTH).toBe(RUTA_AUTH_DEL_SITIO);
    expect(RUTA_AUTH.startsWith("/api")).toBe(false);
  });

  it("la sesión se guarda cifrada en el llavero del teléfono", () => {
    const cliente = leer(`${APP}/lib/auth-client.ts`);
    expect(cliente).toContain("storage: SecureStore");
    expect(cliente).toContain(
      'import * as SecureStore from "expo-secure-store"',
    );
  });

  it("el servidor tiene el complemento de Expo y los orígenes de la app", () => {
    const auth = leer("src/lib/auth.ts");
    /* Expo primero y nextCookies SIEMPRE el último (8 nov 2026: en medio,
       el pase de un solo uso para pagar en la web). */
    expect(auth).toMatch(/plugins: \[\s*expo\(\),[\s\S]*nextCookies\(\),\s*\]/);
    expect(auth).toContain("...ORIGENES_DE_LA_APP");
  });
});

describe("quién puede usar las cuentas", () => {
  it("en producción solo la app de Mercatren; Expo Go nunca", () => {
    expect(origenesDeLaApp("production")).toEqual(["mercatren://"]);
    expect(origenesDeLaApp("production").some((o) => o.startsWith("exp"))).toBe(
      false,
    );
  });

  it("en desarrollo también Expo Go", () => {
    expect(origenesDeLaApp("development")).toContain("exp://");
  });
});

describe("el país de la cuenta", () => {
  it("solo un país de la lista cerrada; si no viene, se deja vacío", () => {
    expect(paisDelAltaValido("US")).toBe(true);
    expect(paisDelAltaValido("ES")).toBe(true);
    expect(paisDelAltaValido(undefined)).toBe(true);
    expect(paisDelAltaValido("XX")).toBe(false);
    expect(paisDelAltaValido("us")).toBe(false);
    expect(paisDelAltaValido(7)).toBe(false);
    expect(paisDelAltaValido("")).toBe(false);
  });

  it("la ruta de cuentas lo comprueba antes de crear nada", () => {
    const ruta = leer("src/app/datos/auth/[...all]/route.ts");
    const alta = ruta.indexOf('pathname.endsWith("/sign-up/email")');
    const pais = ruta.indexOf(
      "!paisDelAltaValido(await paisDelCuerpo(request))",
    );
    /* Y que sea uno de los que se ofrecen (interruptor del país, 5 nov 2026). */
    const permitido = ruta.indexOf("!paisDelAltaPermitido(", alta);
    expect(alta).toBeGreaterThan(-1);
    expect(pais).toBeGreaterThan(alta);
    expect(permitido).toBeGreaterThan(alta);
  });
});

describe("el formulario", () => {
  it("lo que falta, en orden", () => {
    expect(
      faltaEnAlta({ nombre: " ", correo: "a@b.co", clave: "x".repeat(10) }),
    ).toBe("faltaNombre");
    expect(
      faltaEnAlta({ nombre: "Ana", correo: "a@b", clave: "x".repeat(10) }),
    ).toBe("faltaCorreo");
    expect(
      faltaEnAlta({ nombre: "Ana", correo: "a@b.co", clave: "x".repeat(9) }),
    ).toBe("claveCorta");
    expect(
      faltaEnAlta({ nombre: "Ana", correo: "a@b.co", clave: "x".repeat(10) }),
    ).toBeNull();
    expect(faltaEnEntrada({ correo: "a@b.co", clave: "" })).toBe("faltaClave");
    expect(correoBienEscrito(" persona@dominio.com ")).toBe(true);
  });

  it("al entrar nunca se dice si el correo tiene cuenta", () => {
    expect(mensajeDeError("INVALID_EMAIL_OR_PASSWORD")).toBe(
      "errorCredenciales",
    );
    expect(mensajeDeError("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")).toBe(
      "errorYaExiste",
    );
    expect(mensajeDeError("ESCUDO")).toBe("errorEscudo");
    expect(mensajeDeError(undefined, 429)).toBe("errorDemasiados");
    expect(mensajeDeError("CUALQUIER_OTRA")).toBe("errorGeneral");
  });
});

describe("el borrador no pierde lo escrito y no guarda lo sensible", () => {
  it("la llave lleva el formulario y la cuenta", () => {
    expect(llaveDeBorrador("crear-cuenta", null)).toBe(
      "mercatren:borrador:crear-cuenta:sin-cuenta",
    );
    expect(llaveDeBorrador("tienda", "u1")).not.toBe(
      llaveDeBorrador("tienda", "u2"),
    );
  });

  it("nunca guarda contraseñas, códigos ni tarjetas", () => {
    expect(
      sinSensibles({
        nombre: "Ana",
        clave: "x",
        password: "y",
        codigo: "1",
        tarjeta: "4",
        cvv: "1",
      }),
    ).toEqual({ nombre: "Ana" });
    expect(leerBorrador('{"correo":"a@b.co","clave":"secreta"}')).toEqual({
      correo: "a@b.co",
    });
    /* El código postal no es un código secreto: se guarda. */
    expect(sinSensibles({ codigoPostal: "28013", codigo: "123456" })).toEqual({
      codigoPostal: "28013",
    });
    expect(leerBorrador("no es json")).toBeNull();
    expect(leerBorrador('{"nombre":"  "}')).toBeNull();
    expect(hayAlgoEscrito({ a: "", b: " " })).toBe(false);
  });

  it("todo formulario de la app usa el borrador (menos la búsqueda)", () => {
    for (const archivo of archivosDe(`${APP}/app`)) {
      const fuente = leer(archivo);
      /* La búsqueda no es un formulario, y la palabra para borrar la cuenta
         no se guarda a propósito: es una confirmación, no un dato. */
      if (
        archivo.endsWith("buscar.tsx") ||
        archivo.endsWith("borrar-cuenta.tsx")
      )
        continue;
      if (/<Campo\b|<CampoClave\b|<TextInput\b/.test(fuente)) {
        expect(fuente, archivo).toContain("useBorrador(");
      }
    }
  });

  it("ninguna contraseña sin el ojito: secureTextEntry solo en CampoClave", () => {
    for (const archivo of archivosDe(APP)) {
      if (archivo.endsWith("campo-clave.tsx")) continue;
      expect(leer(archivo), archivo).not.toContain("secureTextEntry");
    }
  });
});

describe("el escudo anti-robots dentro de la app", () => {
  it("la cabecera del pase es la misma que lee el servidor", () => {
    expect(leer("src/app/datos/auth/[...all]/route.ts")).toContain(
      `export const CABECERA_ESCUDO = "${CABECERA_ESCUDO}";`,
    );
  });

  it("sin pase no se manda; sin escudo configurado se manda sin cabecera", () => {
    expect(cabeceraDelEscudo({ tipo: "esperando" })).toBeNull();
    expect(cabeceraDelEscudo({ tipo: "error" })).toBeNull();
    expect(cabeceraDelEscudo({ tipo: "sin-escudo" })).toEqual({});
    expect(cabeceraDelEscudo({ tipo: "pase", pase: "abc" })).toEqual({
      "x-escudo": "abc",
    });
  });

  it("lee con cuidado lo que manda la página", () => {
    expect(leerMensajeDelEscudo('{"pase":"tok"}')).toEqual({
      tipo: "pase",
      pase: "tok",
    });
    expect(leerMensajeDelEscudo('{"sinEscudo":true}')).toEqual({
      tipo: "sin-escudo",
    });
    expect(leerMensajeDelEscudo('{"pase":null}')).toEqual({
      tipo: "esperando",
    });
    expect(leerMensajeDelEscudo("<script>")).toEqual({ tipo: "error" });
    expect(leerMensajeDelEscudo('{"pase":""}')).toEqual({ tipo: "error" });
  });

  it("la página dibuja Turnstile con la clave, o avisa que no hay escudo", () => {
    const con = paginaDelEscudo("clave-del-sitio", "es");
    expect(con).toContain('"clave":"clave-del-sitio"');
    expect(con).toContain("challenges.cloudflare.com/turnstile/v0/api.js");
    expect(con).toContain("ReactNativeWebView.postMessage");
    expect(paginaDelEscudo(undefined, "en")).toContain('"clave":null');
    expect(paginaDelEscudo("x</script><script>alert(1)", "en")).not.toContain(
      "</script><script>alert",
    );
  });

  it("la página vive en /datos/app/escudo, sin caché, y la app la pide ahí", () => {
    const ruta = leer("src/app/datos/app/escudo/route.ts");
    expect(ruta).toContain('"Cache-Control": "no-store"');
    expect(urlEscudo("es")).toBe(
      "https://mercatren.com/datos/app/escudo?idioma=es",
    );
    expect(leer(`${APP}/components/escudo.tsx`)).toContain(
      "source={{ uri: urlEscudo(idioma) }}",
    );
  });

  it("entrar y crear cuenta mandan el pase y piden otro después de cada intento", () => {
    for (const pantalla of ["entrar", "crear-cuenta"]) {
      const fuente = leer(`${APP}/app/${pantalla}.tsx`);
      expect(fuente, pantalla).toContain("cabeceraDelEscudo(escudo)");
      expect(fuente, pantalla).toContain("{ headers: cabeceras }");
      expect(fuente, pantalla).toContain("setVuelta((n) => n + 1)");
    }
  });
});

describe("se puede salir", () => {
  it("cerrar sesión avisa al servidor y, si falla, borra la sesión del teléfono igual", () => {
    const cliente = leer(`${APP}/lib/auth-client.ts`);
    expect(cliente).toContain("await authClient.signOut()");
    expect(cliente).toContain('["mercatren_cookie", "mercatren_session_data"]');
    expect(leer(`${APP}/app/(tabs)/cuenta.tsx`)).toContain("await salir()");
  });
});
