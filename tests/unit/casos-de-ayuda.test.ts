import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  crearLimite,
  esquemaCaso,
  esquemaRespuestaGerente,
  nuevoCodigo,
  numeroDeCaso,
  secretoValido,
  ticketParaGerente,
} from "@/lib/soporte/casos";

/**
 * LOS CASOS DE AYUDA Y LA PUERTA DEL GERENTE DE CORREO (1 nov 2026).
 *
 * La persona abre un caso en Ayuda y lo sigue como un chat; el gerente de
 * correo de Richard lo lee y lo contesta por `/datos/gerente/tickets`, con el
 * contrato de Divoox. Lo que no puede romperse: la puerta cerrada sin el
 * secreto, nada de correo ni de la llave del chat hacia afuera, y lo escrito
 * que no se pierde.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");

describe("el número y la llave de cada caso", () => {
  it("el número sale del id: ocho caracteres en mayúsculas, siempre el mismo", () => {
    const id = "3f2b9c1a-7d4e-4f1a-9b2c-0e1d2c3b4a59";
    expect(numeroDeCaso(id)).toBe("3F2B9C1A");
    expect(numeroDeCaso(id)).toBe(numeroDeCaso(id));
  });

  it("la llave del chat es larga y distinta cada vez", () => {
    const a = nuevoCodigo();
    expect(a).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(nuevoCodigo()).not.toBe(a);
  });
});

describe("lo que se acepta", () => {
  const caso = {
    nombre: "Ana",
    email: "ANA@Ejemplo.com",
    asunto: "Pedido",
    mensaje: "Hola",
  };

  it("un caso normal pasa, con el correo en minúsculas", () => {
    const r = esquemaCaso.safeParse(caso);
    expect(r.success).toBe(true);
    expect(r.success && r.data.email).toBe("ana@ejemplo.com");
  });

  it("la trampa para robots llena lo rechaza", () => {
    expect(
      esquemaCaso.safeParse({ ...caso, sitio_web: "http://spam" }).success,
    ).toBe(false);
    expect(esquemaCaso.safeParse({ ...caso, mensaje: "  " }).success).toBe(
      false,
    );
  });

  it("la respuesta del gerente: texto, plantilla P1…P9 y cerrar", () => {
    expect(esquemaRespuestaGerente.parse({ texto: "Listo" })).toEqual({
      texto: "Listo",
      cerrar: false,
    });
    expect(
      esquemaRespuestaGerente.safeParse({ texto: "x", plantilla: "P9" })
        .success,
    ).toBe(true);
    expect(
      esquemaRespuestaGerente.safeParse({ texto: "x", plantilla: "P0" })
        .success,
    ).toBe(false);
    expect(
      esquemaRespuestaGerente.safeParse({ texto: "x", plantilla: "P10" })
        .success,
    ).toBe(false);
    expect(esquemaRespuestaGerente.safeParse({ texto: " " }).success).toBe(
      false,
    );
  });
});

describe("cada caso, como lo pide el contrato", () => {
  const t = ticketParaGerente(
    {
      id: "abcd1234-0000",
      nombre: "Ana",
      idioma: "fr",
      asunto: "Pedido",
      estado: "abierto",
      creadoEn: new Date("2026-11-01T10:00:00Z"),
    },
    [
      {
        casoId: "abcd1234-0000",
        autor: "soporte",
        texto: "Hola Ana",
        creadoEn: new Date("2026-11-01T11:00:00Z"),
      },
      {
        casoId: "abcd1234-0000",
        autor: "cliente",
        texto: "¿Dónde está?",
        creadoEn: new Date("2026-11-01T10:00:00Z"),
      },
      {
        casoId: "otro",
        autor: "cliente",
        texto: "No es suyo",
        creadoEn: new Date("2026-11-01T10:00:00Z"),
      },
    ],
  );

  it("lleva lo del contrato y nada de correo, llave del chat, pagos ni direcciones", () => {
    expect(Object.keys(t).sort()).toEqual(
      [
        "app",
        "asunto",
        "cliente_nombre",
        "creado",
        "estado",
        "id",
        "idioma",
        "mensajes",
        "numero",
      ].sort(),
    );
    expect(JSON.stringify(t)).not.toMatch(
      /email|correo|codigo|direccion|pago/i,
    );
    expect(t.app).toBe("mercatren");
    expect(t.numero).toBe("ABCD1234");
    expect(t.idioma).toBe("es");
  });

  it("el chat va en orden y solo con los mensajes de ESE caso", () => {
    expect(t.mensajes).toEqual([
      {
        de: "cliente",
        fecha: "2026-11-01T10:00:00.000Z",
        texto: "¿Dónde está?",
        adjuntos: [],
      },
      {
        de: "soporte",
        fecha: "2026-11-01T11:00:00.000Z",
        texto: "Hola Ana",
        adjuntos: [],
      },
    ]);
  });
});

describe("la puerta del gerente", () => {
  it("solo con el secreto exacto, y sin secreto cargado no pasa nadie", async () => {
    expect(await secretoValido("Bearer s3creto-largo", "s3creto-largo")).toBe(
      true,
    );
    expect(await secretoValido("Bearer otro", "s3creto-largo")).toBe(false);
    expect(await secretoValido("s3creto-largo", "s3creto-largo")).toBe(false);
    expect(await secretoValido(null, "s3creto-largo")).toBe(false);
    expect(await secretoValido("Bearer ", "")).toBe(false);
    expect(await secretoValido("Bearer algo", undefined)).toBe(false);
  });

  it("30 intentos por minuto, y la ventana se renueva", () => {
    const limite = crearLimite(30, 60_000);
    for (let i = 0; i < 30; i++) expect(limite("ip:/x", 1_000)).toBe(true);
    expect(limite("ip:/x", 1_000)).toBe(false);
    expect(limite("otra:/x", 1_000)).toBe(true);
    expect(limite("ip:/x", 62_000)).toBe(true);
  });

  it("las dos rutas viven en /datos (nunca /api) y miran la puerta ANTES de trabajar", () => {
    for (const [ruta, trabajo] of [
      ["src/app/datos/gerente/tickets/route.ts", "ticketsParaGerente("],
      [
        "src/app/datos/gerente/tickets/[id]/responder/route.ts",
        "respuestaDeSoporte(",
      ],
    ] as const) {
      const texto = leer(ruta);
      const puerta = texto.indexOf("await revisarPuerta(peticion)");
      expect(puerta, ruta).toBeGreaterThan(-1);
      expect(texto.indexOf(trabajo), ruta).toBeGreaterThan(puerta);
    }
  });

  it("la lista del gerente no le pide a la base ni el correo ni la llave del chat", () => {
    const consultas = leer("src/lib/soporte/casos-consultas.ts");
    const bloque = consultas.slice(
      consultas.indexOf("export async function ticketsParaGerente"),
    );
    const hastaElFin = bloque.slice(
      0,
      bloque.indexOf("export async function respuestaDeSoporte"),
    );
    expect(hastaElFin).not.toMatch(/casosAyuda\.(email|codigo)/);
  });
});

describe("lo escrito no se pierde", () => {
  it("el chat guarda el borrador y lo borra SOLO si el mensaje quedó guardado", () => {
    const chat = leer("src/components/ayuda/chat-del-caso.tsx");
    expect(chat).toContain("<FormularioPersistente");
    expect(chat).toMatch(/if \(r\.ok\) \{\s*olvidarBorrador\(llave\);/);
  });

  it("el formulario abre el caso en la base y solo si la base falla va a la bandeja", () => {
    const form = leer("src/components/ayuda/formulario-ayuda.tsx");
    const abrir = form.indexOf("await abrirCasoAyuda(campos)");
    const bandeja = form.indexOf("await enviarAyuda(campos, idioma)");
    expect(abrir).toBeGreaterThan(-1);
    expect(bandeja).toBeGreaterThan(abrir);
    expect(form).toMatch(/caso\.ok \|\| caso\.motivo !== "base"/);
  });

  it("el archivo «use server» solo exporta funciones async", () => {
    const acciones = leer("src/lib/soporte/acciones-ayuda.ts");
    const exportes = acciones.match(/^export [^\n]+/gm) ?? [];
    expect(exportes.length).toBeGreaterThan(0);
    for (const e of exportes) expect(e).toMatch(/^export async function /);
  });
});
