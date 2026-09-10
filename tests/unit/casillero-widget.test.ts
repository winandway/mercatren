import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  dominioAutorizado,
  nuevaClavePublica,
  SEGUNDOS_MINIMOS,
  TOPE_POR_VENTANA,
  VENTANA_MS,
} from "@/lib/casillero/widget-puro";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ EL WIDGET ES LA PUERTA MÁS EXPUESTA (9 sep 2026) ══
 *
 * Crea casilleros sin sesión y desde otro dominio: es la única entrada que
 * escribe en la base sin que nadie se identifique. Cuatro cerrojos, y estas
 * pruebas fijan el que se rompe en silencio.
 */
describe("el dominio autorizado", () => {
  it("acepta el dominio y sus subdominios", () => {
    expect(dominioAutorizado("https://ejemplo.com", "ejemplo.com")).toBe(true);
    expect(dominioAutorizado("https://www.ejemplo.com", "ejemplo.com")).toBe(
      true,
    );
    expect(dominioAutorizado("https://tienda.ejemplo.com", "ejemplo.com")).toBe(
      true,
    );
    expect(dominioAutorizado("https://ejemplo.com", "www.ejemplo.com")).toBe(
      true,
    );
  });

  it("NO SE DEJA ENGAÑAR POR UN PARECIDO: es el fallo que se cuela solo", () => {
    /* Con un `endsWith` a secas, «ejemplo.com.malo.net» pasa: termina en
       algo que contiene el dominio. Con el punto delante, no. */
    expect(
      dominioAutorizado("https://ejemplo.com.malo.net", "ejemplo.com"),
    ).toBe(false);
    expect(dominioAutorizado("https://noesejemplo.com", "ejemplo.com")).toBe(
      false,
    );
    expect(dominioAutorizado("https://malo.net", "ejemplo.com")).toBe(false);
  });

  it("sin Origin, o con basura, no pasa", () => {
    expect(dominioAutorizado(null, "ejemplo.com")).toBe(false);
    expect(dominioAutorizado("", "ejemplo.com")).toBe(false);
    expect(dominioAutorizado("no-es-una-url", "ejemplo.com")).toBe(false);
  });
});

describe("los cerrojos del alta pública", () => {
  it("la clave tiene forma propia y no se repite", () => {
    const a = nuevaClavePublica();
    expect(a).toMatch(/^pk_[A-Za-z0-9]{20,}$/);
    expect(a).not.toBe(nuevaClavePublica());
  });

  it("el límite es por ventana de tiempo, no un contador que solo sube", () => {
    /* Sin ventana, una oficina entera detrás de la misma salida a internet
       queda bloqueada para siempre después del quinto compañero. */
    expect(TOPE_POR_VENTANA).toBeGreaterThan(0);
    expect(VENTANA_MS).toBeGreaterThan(60_000);
    const w = leer("src/lib/casillero/widget.ts");
    expect(w).toContain("ventanaDesde: ahora");
    expect(w).toContain("fila.ventanaDesde < desde");
  });

  it("UN FALLO DEL CONTADOR CIERRA LA PUERTA, no la abre", () => {
    /* Corregido el 9 sep 2026 tras una revisión de seguridad. «Dejar pasar
       si el contador falla» vale para una pantalla de entrada, donde detrás
       siguen la contraseña y el rol. Aquí no: este es el ÚNICO cerrojo que
       un robot no puede saltarse, y los otros tres son justo los que ya
       burló quien llegue hasta acá. Cerrar cuesta poco: quien quiere su
       casillero lo crea en mercatren.com, que no depende de esta tabla. */
    const w = leer("src/lib/casillero/widget.ts");
    const desde = w.indexOf("} catch (fallo) {", w.indexOf("seLePaso"));
    const captura = w.slice(desde, w.indexOf("\n  }", desde));
    expect(captura).toContain("return true");
    expect(captura).not.toContain("return false");
  });

  it("la IP se guarda como huella, nunca en claro", () => {
    const w = leer("src/lib/casillero/widget.ts");
    expect(w).toContain('crypto.subtle.digest("SHA-256"');
    expect(w).not.toMatch(/ip:\s*ip\b/);
  });

  it("hay tiempo mínimo de llenado: un robot lo hace en menos", () => {
    expect(SEGUNDOS_MINIMOS).toBeGreaterThanOrEqual(2);
  });
});

/**
 * ══ EL WIDGET NO PUEDE ENTREGAR EL CASILLERO DE OTRO (9 sep 2026) ══
 *
 * La primera versión devolvía el código y la dirección en la respuesta, y
 * decía si el correo ya tenía cuenta. Con eso, cualquiera escribía el
 * correo de otra persona y se llevaba SU código: lo único que hace falta
 * para mandar cajas a su nombre o para reclamar las suyas.
 */
describe("el alta pública no filtra nada", () => {
  const ruta = leer("src/app/datos/widget/route.ts");

  it("la respuesta NUNCA lleva el código ni la dirección", () => {
    const cuerpo = ruta.slice(ruta.indexOf("export async function POST"));
    expect(cuerpo).not.toContain("lineasDeEtiqueta");
    expect(cuerpo).not.toContain("yaExistia");
    /* Se mira lo que sale por `Response.json`, que es lo único que ve quien
       llama. El código sí se usa dentro —para mandarlo al buzón—, y eso es
       justo lo correcto. */
    const respuestas = [...cuerpo.matchAll(/Response\.json\(([\s\S]*?)\)/g)]
      .map((m) => m[1] ?? "")
      .join(" | ");
    expect(respuestas).not.toContain("codigo");
    expect(respuestas).not.toContain("lineas");
    /* Una sola respuesta de éxito, la misma para todos los casos. */
    expect(cuerpo).toContain('mensaje: "revisa-tu-correo"');
  });

  it("con un correo que YA tiene cuenta, no se toca esa cuenta", () => {
    const cuerpo = ruta.slice(
      ruta.indexOf("if (cuenta) {"),
      ruta.indexOf("const usuarioId = nanoid()"),
    );
    expect(cuerpo).not.toContain("crearCasillero");
    expect(cuerpo).not.toContain("update(user)");
    expect(cuerpo).toContain("avisarQueYaTieneCuenta");
    expect(cuerpo).toContain("return recibido()");
  });

  it("la dirección viaja al buzón, que es la prueba de quién es el dueño", () => {
    expect(ruta).toContain("mandarDireccionPorCorreo");
    const correo = leer("src/lib/casillero/correo-casillero.ts");
    expect(correo).toContain("lineasDeEtiqueta");
  });
});
