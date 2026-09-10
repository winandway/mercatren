import { describe, expect, it } from "vitest";

import {
  codigoValido,
  digitoLuhn,
  extraerCodigo,
  generarCodigoCasillero,
  normalizarCodigo,
  PREFIJO_CASILLERO,
} from "@/lib/casillero/codigo";
import {
  ESTADOS_EN_BODEGA,
  puedeTransicionar,
  transicionesDesde,
} from "@/lib/casillero/estados";
import { resolverMatch, UMBRAL_AUTO } from "@/lib/casillero/matching";
import {
  pesoFacturableLb,
  pesoVolumetricoLb,
  redondearLb,
} from "@/lib/casillero/peso";
import { similitudNombres } from "@/lib/casillero/texto";
import { detectarCarrier, normalizarTracking } from "@/lib/casillero/tracking";

/**
 * ══ EL DOMINIO DEL CASILLERO (9 sep 2026) ══
 *
 * Paquetería de Estados Unidos a Sudamérica con dirección propia en Miami.
 * El problema central: **la compra es silenciosa**. La caja llega y nadie
 * vio esa compra. Todo esto existe para saber de quién es en treinta
 * segundos, sin equivocarse de cliente.
 */

describe("el código de casillero", () => {
  it("tiene largo fijo y verificador que cuadra", () => {
    const primero = generarCodigoCasillero(0);
    expect(primero).toBe("BW-100008"); // 8 es el Luhn de 10000
    expect(codigoValido(primero)).toBe(true);
    /* Cinco dígitos siempre: el operario los lee de un vistazo. */
    for (const s of [0, 1, 500, 89_999]) {
      expect(generarCodigoCasillero(s)).toMatch(/^BW-\d{6}$/);
    }
  });

  it("UN DÍGITO MAL LEÍDO FALLA, no cae en otro cliente", () => {
    /* Es la razón entera del verificador: asignar mal es peor que no
       asignar. Lo segundo es una cola; lo primero es la caja de una
       persona en manos de otra, y nadie se entera hasta el reclamo. */
    const bueno = generarCodigoCasillero(4_281); // BW-142815 o similar
    expect(codigoValido(bueno)).toBe(true);
    const base = bueno.slice(3, 8);
    const verificador = Number(bueno.slice(8));
    for (let d = 0; d <= 9; d++) {
      if (d === verificador) continue;
      expect(codigoValido(`BW-${base}${d}`), `verificador ${d}`).toBe(false);
    }
  });

  it("lo lee escrito de cualquier forma, y lo devuelve canónico", () => {
    const c = generarCodigoCasillero(42);
    const base = c.slice(3);
    for (const forma of [
      `BW ${base}`,
      `BW.${base}`,
      `bw${base}`,
      `BW-${base}`,
    ]) {
      expect(normalizarCodigo(forma), forma).toBe(c);
    }
  });

  it("lo encuentra dentro del texto de una etiqueta escaneada", () => {
    const c = generarCodigoCasillero(7);
    const etiqueta = `SHIP TO:\nJUAN PEREZ ${c}\n14329 SW 142ND ST\n${c}\nMIAMI FL 33186`;
    expect(extraerCodigo(etiqueta)).toBe(c);
    /* Y sin código válido no inventa uno. */
    expect(extraerCodigo("SHIP TO: JUAN PEREZ\nMIAMI FL 33186")).toBeNull();
    expect(extraerCodigo("BW-123456")).toBeNull(); // verificador que no cuadra
  });

  it("se niega a emitir fuera del rango en vez de repetir un código", () => {
    expect(() => generarCodigoCasillero(90_000)).toThrow(/rango/i);
    expect(() => generarCodigoCasillero(-1)).toThrow(/inválida/i);
    expect(() => digitoLuhn("12a45")).toThrow(/no numérica/i);
  });
});

describe("la guía del transportista", () => {
  it("se compara normalizada: el cliente la copia con espacios", () => {
    expect(normalizarTracking("1Z 999 AA1 01 2345 6784")).toBe(
      "1Z999AA10123456784",
    );
    expect(normalizarTracking("tba-123456789")).toBe("TBA123456789");
  });

  it("reconoce a cada transportista por su patrón", () => {
    expect(detectarCarrier("1Z999AA10123456784")).toBe("ups");
    expect(detectarCarrier("TBA123456789")).toBe("amazon");
    expect(detectarCarrier("9400111899223197428490")).toBe("usps");
    expect(detectarCarrier("123456789012")).toBe("fedex");
    expect(detectarCarrier("hola")).toBe("otro");
  });
});

describe("el peso que se cobra", () => {
  it("EL CASO DE LA CAJA DE 24×18×12: 31,23 lb exactas", () => {
    /* El número del que se discute con el cliente. Se cobra 31,3 o 32
       según el modo, y por eso el modo es explícito. */
    const medidas = { largoIn: 24, anchoIn: 18, altoIn: 12 };
    expect(pesoVolumetricoLb(medidas, { modo: "exacto" })).toBe(31.23);
    expect(pesoVolumetricoLb(medidas, { modo: "decima" })).toBe(31.3);
    expect(pesoVolumetricoLb(medidas, { modo: "libra" })).toBe(32);
  });

  it("manda el mayor entre lo que pesa y lo que ocupa", () => {
    const almohadas = { largoIn: 24, anchoIn: 18, altoIn: 12 };
    /* Pesa 3 libras y ocupa 31: se cobra lo que ocupa. */
    expect(pesoFacturableLb(3, almohadas, { modo: "decima" })).toBe(31.3);
    /* Un teléfono pesa poco y ocupa poco: manda el mínimo facturable. */
    expect(pesoFacturableLb(0.4, { largoIn: 6, anchoIn: 4, altoIn: 2 })).toBe(
      1,
    );
    /* Un ladrillo pesa más de lo que ocupa: manda el real. */
    expect(pesoFacturableLb(40, almohadas, { modo: "decima" })).toBe(40);
  });

  it("no redondea dos veces: eso subiría el cobro sin motivo", () => {
    const m = { largoIn: 24, anchoIn: 18, altoIn: 12 };
    /* Si el volumétrico se redondeara a 31.3 y después otra vez, el
       resultado sería el mismo aquí — pero con otras medidas sube un
       escalón que el cliente no puede explicarse. */
    expect(pesoFacturableLb(0, m, { modo: "libra" })).toBe(32);
    /* El modo «decima» SUBE siempre: 31,00001 lb se cobran como 31,1. Lo
       que el épsilon evita es que 31,3 exactas suban a 31,4 por un error
       binario de la coma flotante, no que suba lo que de verdad pasó. */
    expect(redondearLb(31.0000001, "decima")).toBe(31.1);
    expect(redondearLb(31.3, "decima")).toBe(31.3);
    expect(redondearLb(31.0, "decima")).toBe(31);
  });

  it("sin medidas se cobra el real, y una medida en cero no inventa volumen", () => {
    expect(pesoFacturableLb(12.4, null, { modo: "decima" })).toBe(12.4);
    expect(pesoVolumetricoLb({ largoIn: 0, anchoIn: 18, altoIn: 12 })).toBe(0);
  });
});

describe("los nombres se parecen, pero no prueban nada", () => {
  it("aguanta erratas del lector y el orden invertido", () => {
    expect(similitudNombres("JUAN PEREZ", "Juan Pérez")).toBe(1);
    expect(similitudNombres("PEREZ JUAN", "JUAN PEREZ GOMEZ")).toBeGreaterThan(
      0.7,
    );
    expect(
      similitudNombres("RODRIGUFZ MARIA", "RODRIGUEZ MARIA"),
    ).toBeGreaterThan(0.8);
    expect(similitudNombres("JUAN PEREZ", "CARLOS GOMEZ")).toBeLessThan(0.4);
  });
});

describe("el ciclo de vida del paquete", () => {
  it("solo deja las transiciones que existen en la bodega de verdad", () => {
    expect(puedeTransicionar("recibido", "asignado")).toBe(true);
    expect(puedeTransicionar("huerfano", "asignado")).toBe(true);
    /* Un paquete entregado no vuelve a la bodega, y uno recibido no se
       despacha sin pasar por asignado y declarado. */
    expect(puedeTransicionar("entregado", "en_bodega")).toBe(false);
    expect(puedeTransicionar("recibido", "despachado")).toBe(false);
    expect(transicionesDesde("entregado")).toEqual([]);
  });

  it("los estados «en bodega» son los que cuentan para el inventario", () => {
    expect(ESTADOS_EN_BODEGA).toContain("huerfano");
    expect(ESTADOS_EN_BODEGA).toContain("retenido");
    expect(ESTADOS_EN_BODEGA).not.toContain("despachado");
    expect(ESTADOS_EN_BODEGA).not.toContain("entregado");
  });
});

describe("de quién es esta caja", () => {
  const casilleros = [
    {
      id: "c1",
      codigo: generarCodigoCasillero(1),
      clienteId: "u1",
      nombreLegal: "JUAN PEREZ",
    },
    {
      id: "c2",
      codigo: generarCodigoCasillero(2),
      clienteId: "u2",
      nombreLegal: "MARIA GOMEZ",
    },
  ];

  it("LOS CUATRO CASOS DE RECEPCIÓN", () => {
    /* 1 · La guía de una prealerta abierta → solo, 100. */
    const uno = resolverMatch(
      { tracking: "1Z999AA10123456784" },
      {
        casilleros,
        prealertas: [
          { id: "p1", casilleroId: "c1", tracking: "1Z 999 AA1 01 2345 6784" },
        ],
      },
    );
    expect(uno.automatico).toBe(true);
    expect(uno.mejor?.score).toBe(100);
    expect(uno.mejor?.prealertaId).toBe("p1");

    /* 2 · Anunciada por el transportista → solo, 95. */
    const dos = resolverMatch(
      { tracking: "TBA123456789" },
      {
        casilleros,
        prealertas: [],
        inbounds: [{ tracking: "TBA123456789", casilleroId: "c2" }],
      },
    );
    expect(dos.automatico).toBe(true);
    expect(dos.mejor?.score).toBe(95);

    /* 3 · Código válido en el texto de la etiqueta → solo, 90. */
    const tres = resolverMatch(
      { textoOcr: `SHIP TO: ALGUIEN ${casilleros[0]!.codigo} MIAMI FL` },
      { casilleros, prealertas: [] },
    );
    expect(tres.automatico).toBe(true);
    expect(tres.mejor?.score).toBe(UMBRAL_AUTO);

    /* 4 · Una guía desconocida sin pistas → huérfano. */
    const cuatro = resolverMatch(
      { tracking: "999999999999" },
      { casilleros, prealertas: [] },
    );
    expect(cuatro.mejor).toBeNull();
    expect(cuatro.automatico).toBe(false);
    expect(cuatro.candidatos).toEqual([]);
  });

  it("NUNCA se auto-asigna por parecido de nombre, por alto que sea", () => {
    /* Hay homónimos y familias que comparten apellido y ciudad. */
    const r = resolverMatch(
      { textoOcr: "SHIP TO JUAN PEREZ MIAMI FL" },
      { casilleros, prealertas: [] },
    );
    expect(r.mejor?.metodo).toBe("nombre");
    expect(r.mejor?.score).toBeLessThan(UMBRAL_AUTO);
    expect(r.automatico).toBe(false);
  });

  it("EL MISMO TRACKING EN DOS PREALERTAS NO SE ASIGNA SOLO", () => {
    /* Alguien copió mal la guía. Con dos clientes empatados en la cima,
       elegir uno es elegir al azar. */
    const r = resolverMatch(
      { tracking: "1Z999AA10123456784" },
      {
        casilleros,
        prealertas: [
          { id: "p1", casilleroId: "c1", tracking: "1Z999AA10123456784" },
          { id: "p2", casilleroId: "c2", tracking: "1Z999AA10123456784" },
        ],
      },
    );
    expect(r.mejor?.score).toBe(100);
    expect(r.automatico).toBe(false);
    expect(r.candidatos).toHaveLength(2);
  });

  it("a un casillero SUSPENDIDO no se le asigna solo, ni con prueba", () => {
    const r = resolverMatch(
      { tracking: "1Z999AA10123456784" },
      {
        casilleros: [{ ...casilleros[0]!, suspendido: true }],
        prealertas: [
          { id: "p1", casilleroId: "c1", tracking: "1Z999AA10123456784" },
        ],
      },
    );
    expect(r.mejor?.score).toBe(100);
    expect(r.automatico).toBe(false);
  });

  it("un cliente con varias pistas sale UNA vez, con la más fuerte", () => {
    const r = resolverMatch(
      {
        tracking: "1Z999AA10123456784",
        textoOcr: `JUAN PEREZ ${casilleros[0]!.codigo}`,
      },
      {
        casilleros,
        prealertas: [
          { id: "p1", casilleroId: "c1", tracking: "1Z999AA10123456784" },
        ],
      },
    );
    expect(r.candidatos.filter((c) => c.casilleroId === "c1")).toHaveLength(1);
    expect(r.mejor?.metodo).toBe("prealerta");
    expect(r.automatico).toBe(true);
  });
});
