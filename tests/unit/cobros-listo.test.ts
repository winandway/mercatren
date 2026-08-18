import { describe, expect, it } from "vitest";

import { REQUISITOS, revisarCobroPorEnlace } from "@/lib/cobros/listo";

const TODAS = new Set(REQUISITOS.map((r) => r.clave));

function sin(...claves: string[]) {
  const s = new Set(TODAS);
  for (const c of claves) s.delete(c);
  return s;
}

describe("¿se puede cobrar por enlace?", () => {
  it("con todo puesto, sí y sin avisos", () => {
    const v = revisarCobroPorEnlace(TODAS);
    expect(v.puedeCobrar).toBe(true);
    expect(v.bloqueantes).toEqual([]);
    expect(v.avisos).toEqual([]);
  });

  it("sin la clave PÚBLICA de Stripe NO se puede cobrar", () => {
    /**
     * Es el olvido más traicionero de todos: la página carga, el botón está,
     * y el formulario de tarjeta simplemente no aparece — sin un solo mensaje
     * de error. Antes esta variable no la comprobaba nadie en el panel.
     */
    const v = revisarCobroPorEnlace(sin("STRIPE_CLAVE_PUBLICA"));
    expect(v.puedeCobrar).toBe(false);
    expect(v.bloqueantes.map((r) => r.clave)).toEqual(["STRIPE_CLAVE_PUBLICA"]);
  });

  it("sin la clave secreta tampoco", () => {
    expect(revisarCobroPorEnlace(sin("STRIPE_SECRET_KEY")).puedeCobrar).toBe(
      false,
    );
  });
});

describe("lo que recorta el servicio pero no lo tumba", () => {
  it("sin el secreto del webhook se cobra igual, pero avisa", () => {
    /* El pago SÍ ocurre; lo que falla es que se acredite solo. La
       conciliación al abrir la página lo rescata, así que no bloquea — pero
       deja el cobro colgando hasta que alguien mire. */
    const v = revisarCobroPorEnlace(sin("STRIPE_WEBHOOK_SECRET"));
    expect(v.puedeCobrar).toBe(true);
    expect(v.avisos.map((r) => r.clave)).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("sin el correo de Zelle se cobra con tarjeta igual", () => {
    const v = revisarCobroPorEnlace(sin("ZELLE_CORREO_RECEPTOR"));
    expect(v.puedeCobrar).toBe(true);
    expect(v.avisos.map((r) => r.clave)).toContain("ZELLE_CORREO_RECEPTOR");
  });

  it("sin el correo, el enlace no llega — pero el cobro funciona", () => {
    /* El comercio puede pasarle el enlace por WhatsApp. Molesto, no fatal. */
    const v = revisarCobroPorEnlace(sin("CLOUDFLARE_EMAIL_TOKEN"));
    expect(v.puedeCobrar).toBe(true);
    expect(v.avisos.map((r) => r.clave)).toContain("CLOUDFLARE_EMAIL_TOKEN");
  });

  it("faltando todo, se listan los bloqueantes y los avisos por separado", () => {
    /* Mezclarlos en una sola lista hace que «no llega el correo» se lea igual
       de grave que «no se puede cobrar», y entonces no se distingue qué hay
       que arreglar antes de la prueba. */
    const v = revisarCobroPorEnlace(new Set());
    expect(v.puedeCobrar).toBe(false);
    expect(v.bloqueantes).toHaveLength(2);
    expect(v.avisos).toHaveLength(3);
  });
});

describe("lo que esta pantalla NO puede hacer", () => {
  it("solo recibe NOMBRES de variables, nunca valores", () => {
    /* La firma es un `Set<string>` de claves. Si algún día alguien le pasara
       los valores para «enseñar el correo de Zelle», esta pantalla —que el
       equipo abre desde cualquier sitio— filtraría datos de cobro. */
    const v = revisarCobroPorEnlace(new Set(["STRIPE_SECRET_KEY"]));
    const texto = JSON.stringify(v);
    expect(texto).not.toContain("sk_");
    expect(texto).not.toContain("@");
  });
});
