import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ENTREGA_US,
  entregaParaElPedido,
  faltaEnEntrega,
  type ConfigEntrega,
  type DatosEntrega,
} from "../../app-movil/src/lib/pago";
import { GET as entregaDelPais } from "@/app/datos/app/v1/entrega/route";
import { esquemaEntrega } from "@/lib/pedidos/esquemas";

/**
 * CADA PAÍS ENTREGA DISTINTO, TAMBIÉN EN LA APP (5 nov 2026, Fase 5).
 *
 * Lo que no puede pasar sin que esto se ponga en rojo:
 * - que la app le pida una dirección a quien retira en Venezuela;
 * - que deje pasar una provincia o un código postal de España que no cuadran;
 * - que un país apagado compre por la puerta de la app (el interruptor se
 *   mira en el SERVIDOR, no solo en la pantalla);
 * - que el pedido de la app quede anotado en el mercado del dominio
 *   (mercatren.com = Estados Unidos) en vez del país que eligió la persona,
 *   que es lo que pasaba: un pedido de Venezuela salía como «US».
 */
const leer = (r: string) => readFileSync(r, "utf-8");

async function configDe(pais: string): Promise<ConfigEntrega> {
  const r = entregaDelPais(
    new Request(`https://mercatren.com/datos/app/v1/entrega?pais=${pais}`),
  );
  const cuerpo = (await r.json()) as { ok: boolean; entrega: ConfigEntrega };
  expect(cuerpo.ok).toBe(true);
  return cuerpo.entrega;
}

const vacio: DatosEntrega = {
  nombre: "Ana Pérez",
  telefono: "+1 305 555 0100",
  direccion: "",
  direccion2: "",
  ciudad: "",
  estado: "",
  codigoPostal: "",
};

describe("qué pide cada país, según el servidor", () => {
  it("Venezuela se retira: solo la ciudad (y nombre y teléfono)", async () => {
    const ve = await configDe("VE");
    expect(ve.forma).toBe("retiro");
    expect(ve.campos.map((c) => c.nombre)).toEqual(["ciudad"]);
    expect(ve.estados).toBeNull();
  });

  it("Estados Unidos y España se despachan, con su lista de estados o provincias", async () => {
    const us = await configDe("US");
    expect(us.forma).toBe("envio");
    expect(us.estados?.some((e) => e.codigo === "FL")).toBe(true);
    const es = await configDe("ES");
    expect(es.forma).toBe("envio");
    expect(es.estados?.find((e) => e.codigo === "28")?.nombre).toBe("Madrid");
  });

  it("las provincias de España salen en orden alfabético de España", async () => {
    const nombres = (await configDe("ES")).estados!.map((e) => e.nombre);
    expect(nombres).toEqual(
      [...nombres].sort((a, b) => a.localeCompare(b, "es")),
    );
    /* Lo que pasaba: Cáceres, Cádiz y Córdoba salían después de Cuenca. */
    expect(nombres.indexOf("Cáceres")).toBeLessThan(nombres.indexOf("Cuenca"));
  });

  it("lo que la app usa mientras llega la respuesta es lo mismo que dice el servidor", async () => {
    const us = await configDe("US");
    expect(us.campos).toEqual(ENTREGA_US.campos);
  });

  it("un país que no existe no se contesta", async () => {
    const r = entregaDelPais(
      new Request("https://mercatren.com/datos/app/v1/entrega?pais=XX"),
    );
    expect(r.status).toBe(400);
  });
});

describe("Venezuela: retiro en la ciudad", () => {
  it("no pide dirección, ni estado, ni código postal", async () => {
    const ve = await configDe("VE");
    expect(faltaEnEntrega(vacio, ve)).toBe("faltaCiudad");
    expect(faltaEnEntrega({ ...vacio, ciudad: "Maracaibo" }, ve)).toBeNull();
  });

  it("al servidor solo viajan quién, su teléfono y su ciudad", async () => {
    const ve = await configDe("VE");
    const e = entregaParaElPedido(
      { ...vacio, ciudad: " Maracaibo ", direccion: "no debe viajar" },
      ve,
    );
    expect(e).toEqual({
      nombre: "Ana Pérez",
      telefono: "+1 305 555 0100",
      ciudad: "Maracaibo",
    });
    expect(esquemaEntrega.safeParse(e).success).toBe(true);
  });
});

describe("España: la provincia de la lista y el código postal que la empieza", () => {
  const madrid: DatosEntrega = {
    ...vacio,
    direccion: "Calle Mayor 1",
    ciudad: "Madrid",
    estado: "28",
    codigoPostal: "28013",
  };

  it("una dirección completa y coherente pasa", async () => {
    const es = await configDe("ES");
    expect(faltaEnEntrega(madrid, es)).toBeNull();
    const e = entregaParaElPedido(madrid, es);
    expect(e).toMatchObject({ estado: "28", codigoPostal: "28013" });
    expect(esquemaEntrega.safeParse(e).success).toBe(true);
  });

  it("una provincia inventada no pasa", async () => {
    const es = await configDe("ES");
    expect(faltaEnEntrega({ ...madrid, estado: "99" }, es)).toBe("faltaEstado");
  });

  it("un código postal de otra provincia, o mal escrito, no pasa", async () => {
    const es = await configDe("ES");
    expect(faltaEnEntrega({ ...madrid, codigoPostal: "08001" }, es)).toBe(
      "faltaCodigoPostal",
    );
    expect(faltaEnEntrega({ ...madrid, codigoPostal: "2801" }, es)).toBe(
      "faltaCodigoPostal",
    );
    expect(faltaEnEntrega({ ...madrid, codigoPostal: "" }, es)).toBe(
      "faltaCodigoPostal",
    );
  });
});

describe("Estados Unidos, como siempre", () => {
  it("el estado de dos letras y el código postal de cinco cifras", async () => {
    const us = await configDe("US");
    const casa: DatosEntrega = {
      ...vacio,
      direccion: "100 Main St",
      ciudad: "Miami",
      estado: "fl",
      codigoPostal: "33101",
    };
    expect(faltaEnEntrega(casa, us)).toBeNull();
    expect(faltaEnEntrega({ ...casa, estado: "XX" }, us)).toBe("faltaEstado");
    expect(entregaParaElPedido(casa, us).estado).toBe("FL");
  });
});

describe("la puerta de compra de la app respeta el país", () => {
  const ruta = leer("src/app/datos/app/mi/pedido/route.ts");
  const accion = leer("src/lib/pedidos/acciones.ts");

  it("un país apagado no compra por la app (el equipo sí, para probarlo)", () => {
    const interruptor = ruta.indexOf("!enLaApp(contexto.mercado.codigo)");
    const pedido = ruta.indexOf("await crearPedido(");
    expect(interruptor).toBeGreaterThan(-1);
    expect(interruptor).toBeLessThan(pedido);
    expect(ruta).toContain('respuestaDeError("pais_apagado", 403)');
    expect(ruta).toContain("!(await esEquipoInterno().catch(() => false))");
  });

  it("el pedido queda en el país que eligió la persona, no en el del dominio", () => {
    expect(ruta).toContain(
      "{ idioma: contexto.idioma, pais: contexto.mercado.codigo }",
    );
    expect(accion).toContain(
      "const mercadoDeLaCompra = mercadoPedido ?? (await mercadoActual());",
    );
  });

  it("y lo que compra tiene que ser de ese país", () => {
    expect(accion).toContain(
      "if (opciones.pais && mercadoPedido?.codigo !== destinoDelPedido)",
    );
    /* Solo el código, resuelto contra la lista cerrada: esta acción también
       la puede llamar un navegador. */
    expect(accion).toContain("MERCADOS.find((m) => m.codigo ===");
  });

  it("el país del pedido nunca queda en blanco", () => {
    expect(accion).toContain(
      "pais: entrega.pais?.trim() || nombreDelPais(destinoDelPedido),",
    );
  });

  it("el borrador del pago es de cada país (la dirección de Madrid no se cuela en Venezuela)", () => {
    expect(leer("app-movil/src/app/pagar.tsx")).toContain("`pagar-${pais}`");
  });

  it("la app explica el país apagado, no un «algo salió mal»", () => {
    expect(leer("app-movil/src/app/pagar.tsx")).toContain(
      'if (r.status === 403) return setError({ clave: "paisApagado" });',
    );
  });
});
