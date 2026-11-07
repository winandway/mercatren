import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import {
  cuerpoDeAyuda,
  enviarAyuda,
  URL_BANDEJA_SOPORTE,
} from "@/lib/soporte/bandeja";

/**
 * EL FORMULARIO DE AYUDA VA A LA BANDEJA DE SOPORTE (1 nov 2026).
 *
 * Plan mixto de Richard: en la web se ve el correo de Mercatren, y el
 * formulario manda el mensaje a la bandeja única de soporte de Windoce, con
 * la etiqueta de Mercatren. Lo escrito no se borra hasta que la bandeja
 * confirma.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");
const CAMPOS = {
  nombre: " Ana ",
  email: "ana@ejemplo.com ",
  asunto: "Pedido",
  mensaje: " ¿Dónde está? ",
};

describe("el cuerpo que recibe la bandeja", () => {
  it("lleva la etiqueta de Mercatren, el idioma y la trampa vacía", () => {
    expect(cuerpoDeAyuda(CAMPOS, "es")).toEqual({
      app: "mercatren",
      nombre: "Ana",
      email: "ana@ejemplo.com",
      asunto: "Pedido",
      mensaje: "¿Dónde está?",
      idioma: "es",
      sitio_web: "",
    });
    expect(cuerpoDeAyuda(CAMPOS, "en").idioma).toBe("en");
    expect(cuerpoDeAyuda(CAMPOS, "fr").idioma).toBe("es");
  });
});

describe("solo es «enviado» si la bandeja lo confirma", () => {
  const respuesta = (status: number, cuerpo: unknown = { ok: true }) =>
    vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));

  it("manda un POST con JSON a la bandeja", async () => {
    const pedir = respuesta(200);
    expect(
      await enviarAyuda(CAMPOS, "en", pedir as unknown as typeof fetch),
    ).toEqual({ ok: true });
    const [url, opciones] = pedir.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(URL_BANDEJA_SOPORTE);
    expect(opciones.method).toBe("POST");
    expect(JSON.parse(String(opciones.body)).app).toBe("mercatren");
  });

  it("los fallos no se dan por enviados", async () => {
    const enviar = (p: unknown) => enviarAyuda(CAMPOS, "es", p as typeof fetch);
    expect(await enviar(respuesta(429))).toEqual({
      ok: false,
      motivo: "demasiados",
    });
    expect(await enviar(respuesta(500))).toEqual({
      ok: false,
      motivo: "fallo",
    });
    expect(await enviar(respuesta(200, { ok: false }))).toEqual({
      ok: false,
      motivo: "fallo",
    });
    const sinRed = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    /* Si la bandeja no contesta, es un fallo nuestro, no «sin conexión». */
    expect(await enviar(sinRed)).toEqual({ ok: false, motivo: "fallo" });
    vi.stubGlobal("navigator", { onLine: false });
    expect(await enviar(sinRed)).toEqual({ ok: false, motivo: "sinConexion" });
    vi.unstubAllGlobals();
  });

  it("el formulario borra el borrador SOLO con la confirmación", () => {
    const form = leer("src/components/ayuda/formulario-ayuda.tsx");
    expect(form).toContain("<FormularioPersistente");
    expect(form).toMatch(/if \(r\.ok\) \{\s*olvidarBorrador\(LLAVE\);/);
    expect(form.split("olvidarBorrador(").length - 1).toBe(1);
  });
});

describe("lo que ve el público", () => {
  it("el contacto a la vista sigue siendo el de Mercatren", () => {
    expect(CORREO_CONTACTO.endsWith("@mercatren.com")).toBe(true);
    expect(leer("src/components/ayuda/formulario-ayuda.tsx")).not.toMatch(
      /@windoce\.com/,
    );
  });

  it("la política del navegador deja hablar con la bandeja", () => {
    expect(leer("next.config.ts")).toMatch(
      /connect-src[^"]*https:\/\/soporte-windoce\.sitios\.dev/,
    );
  });

  it("la página de ayuda lleva el formulario", () => {
    expect(leer("src/app/[locale]/(tienda)/(docs)/support/page.tsx")).toContain(
      "<FormularioAyuda />",
    );
  });
});
