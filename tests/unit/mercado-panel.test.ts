import { beforeEach, describe, expect, it, vi } from "vitest";

const tarro = new Map<string, string>();
const esSoporte = vi.fn(async () => true);

/* El archivo es `server-only` a propósito —lee cookies y comprueba el rol— y
   ese paquete se niega a cargar en el entorno de las pruebas, que simula un
   navegador. Se neutraliza SOLO aquí: así se prueba la función de verdad en
   vez de una copia, que es la lección de `cj-precio.test.ts` (una copia
   siempre pasa en verde porque mide lo que escribió la prueba). */
vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) =>
      tarro.has(n) ? { name: n, value: tarro.get(n) } : undefined,
    set: (n: string, v: string) => tarro.set(n, v),
    delete: (n: string) => tarro.delete(n),
  }),
}));

vi.mock("@/lib/autorizacion", () => ({
  esSoporteDeVerdad: () => esSoporte(),
}));

/* `cache` de React necesita un contexto de petición que aquí no existe. */
vi.mock("react", async () => {
  const real = await vi.importActual<typeof import("react")>("react");
  return { ...real, cache: (f: unknown) => f };
});

const { guardarMercadoDelPanel, hayQueAvisarDelMercado, mercadoDelPanel } =
  await import("@/lib/mercado/panel");
const { mercadoPorCodigo, MERCADO_PRINCIPAL } =
  await import("@/lib/mercado/mercados");

beforeEach(() => {
  tarro.clear();
  esSoporte.mockResolvedValue(true);
});

describe("el mercado del panel vive en la sesión, no en la dirección", () => {
  it("sin haber elegido nada, se mira el mercado principal", () => {
    return expect(mercadoDelPanel()).resolves.toMatchObject({
      codigo: MERCADO_PRINCIPAL.codigo,
    });
  });

  it("guardar Chile hace que el panel mire Chile", async () => {
    await guardarMercadoDelPanel("CL");
    await expect(mercadoDelPanel()).resolves.toMatchObject({ codigo: "CL" });
  });

  it("volver al principal BORRA la cookie, no escribe «US»", async () => {
    /* Dos formas de significar lo mismo es como se acaban leyendo distinto en
       dos pantallas. Quien nunca tocó el selector y quien volvió al principal
       tienen exactamente el mismo estado. */
    await guardarMercadoDelPanel("CL");
    await guardarMercadoDelPanel(null);
    expect([...tarro.keys()]).toEqual([]);

    await guardarMercadoDelPanel("US");
    expect([...tarro.keys()]).toEqual([]);
  });
});

describe("el muro: quien no es soporte no cambia de país", () => {
  it("a quien NO es soporte no se le respeta la cookie", async () => {
    await guardarMercadoDelPanel("CL");
    esSoporte.mockResolvedValue(false);

    /* Se comprueba al LEER y no solo al escribir: a una cuenta a la que le
       bajen el rol se le deja de respetar en el acto, sin esperar a que la
       cookie caduque. */
    await expect(mercadoDelPanel()).resolves.toMatchObject({
      codigo: MERCADO_PRINCIPAL.codigo,
    });
  });

  it("un código inventado en la cookie cae en el principal", async () => {
    tarro.set("mercatren_panel_mercado", "XX");
    await expect(mercadoDelPanel()).resolves.toMatchObject({
      codigo: MERCADO_PRINCIPAL.codigo,
    });
  });

  it("si algo falla, se cae hacia el mercado principal", async () => {
    esSoporte.mockRejectedValue(new Error("sin sesión"));
    /* Hacia el principal y no hacia un país vacío: el principal tiene datos,
       así que un fallo se nota; en blanco parecería que se perdió todo. */
    await expect(mercadoDelPanel()).resolves.toMatchObject({
      codigo: MERCADO_PRINCIPAL.codigo,
    });
  });
});

describe("la franja de aviso", () => {
  it("no sale en el mercado principal", () => {
    expect(hayQueAvisarDelMercado(MERCADO_PRINCIPAL)).toBe(false);
  });

  it("sale en cualquier otro", () => {
    /* Lo peligroso no es cambiar de país: es olvidar que lo cambiaste. Quien
       vea «0 ventas» creyendo estar en el principal pensará que se cayó algo. */
    expect(hayQueAvisarDelMercado(mercadoPorCodigo("CL"))).toBe(true);
  });
});
