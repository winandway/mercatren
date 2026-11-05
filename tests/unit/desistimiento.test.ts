import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DIAS_PARA_DESISTIR,
  motivoParaNoDesistir,
  puedeDesistir,
  venceElPlazo,
} from "@/lib/pedidos/desistimiento";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

/**
 * «DESISTIR DEL CONTRATO AQUÍ» (5 nov 2026, España: TRLGDCU arts. 102 a 108 y
 * directiva 2023/2673, art. 11 bis). Lo que no puede pasar sin que esto se
 * ponga en rojo:
 * - que el plazo no sea de 14 días desde la entrega, o que no se pueda desistir
 *   antes de recibir;
 * - que salga en un pedido de otro país (allí rigen otras políticas);
 * - que falten los dos pasos con su nombre («Desistir del contrato aquí» y
 *   «Confirmar desistimiento») o el acuse con la fecha y la hora;
 * - que el dueño salga de lo que manda el teléfono y no de la sesión;
 * - que un pedido de otro país lea la base solo por mirarlo.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");

const base = {
  mercado: "ES",
  estado: "pagado",
  entregadoEn: null as Date | null,
  desistidoEn: null as Date | null,
};
const DIA = 24 * 60 * 60 * 1000;

describe("el plazo", () => {
  it("son 14 días naturales desde la entrega", () => {
    expect(DIAS_PARA_DESISTIR).toBe(14);
    const entrega = new Date("2026-11-01T10:00:00Z");
    expect(venceElPlazo(entrega)!.toISOString()).toBe(
      "2026-11-15T10:00:00.000Z",
    );
    const p = { ...base, entregadoEn: entrega, estado: "entregado" };
    expect(puedeDesistir(p, new Date(entrega.getTime() + 14 * DIA))).toBe(true);
    expect(
      motivoParaNoDesistir(p, new Date(entrega.getTime() + 15 * DIA)),
    ).toBe("fuera_de_plazo");
  });

  it("se puede desistir antes de recibir el pedido", () => {
    expect(puedeDesistir({ ...base, estado: "enviado" })).toBe(true);
    expect(venceElPlazo(null)).toBeNull();
  });

  it("solo en España, y solo con un contrato vivo", () => {
    expect(motivoParaNoDesistir({ ...base, mercado: "US" })).toBe("no_aplica");
    expect(motivoParaNoDesistir({ ...base, mercado: "VE" })).toBe("no_aplica");
    expect(motivoParaNoDesistir({ ...base, estado: "pendiente_pago" })).toBe(
      "no_aplica",
    );
    expect(motivoParaNoDesistir({ ...base, estado: "cancelado" })).toBe(
      "no_aplica",
    );
    expect(motivoParaNoDesistir({ ...base, estado: "reembolsado" })).toBe(
      "no_aplica",
    );
    expect(motivoParaNoDesistir({ ...base, desistidoEn: new Date() })).toBe(
      "ya_desistio",
    );
    expect(puedeDesistir({ ...base, mercado: " es " })).toBe(true);
  });
});

describe("los dos pasos y el acuse, con su nombre", () => {
  it("«Desistir del contrato aquí» y «Confirmar desistimiento», en los dos idiomas", () => {
    expect(es.desistimiento.boton).toBe("Desistir del contrato aquí");
    expect(es.desistimiento.confirmar).toBe("Confirmar desistimiento");
    expect(en.desistimiento.boton).toBe("Withdraw from contract here");
    expect(en.desistimiento.confirmar).toBe("Confirm withdrawal");
    const app = leer("app-movil/src/lib/textos.ts");
    expect(app).toContain('desistirBoton: "Desistir del contrato aquí"');
    expect(app).toContain('desistirConfirmar: "Confirmar desistimiento"');
  });

  it("el acuse lleva la fecha y la hora, en hora de España", () => {
    const correos = leer("src/lib/correo/correos.ts");
    expect(correos).toContain(
      "export async function correoAcuseDesistimiento(",
    );
    expect(correos).toContain('timeZone: "Europe/Madrid"');
    expect(es.correos.desistimiento.recibido).toContain("hora de España");
  });
});

describe("una sola acción, y el dueño sale de la sesión", () => {
  const accion = leer("src/lib/pedidos/acciones-desistimiento.ts");

  it("busca el pedido por el dueño de la sesión y guarda un aviso por pedido", () => {
    expect(accion).toContain("const usuario = await obtenerUsuario();");
    expect(accion).toContain("eq(pedidos.clienteId, usuario.id)");
    expect(accion).toContain("yaEstaba: true");
    expect(leer("src/lib/db/schema.ts")).toMatch(
      /desistimientos[\s\S]{0,400}pedidoId: text\("pedido_id"\)\s*\.notNull\(\)\s*\.unique\(\)/,
    );
  });

  it("la web y la app usan la misma acción", () => {
    expect(leer("src/components/pedido/desistir.tsx")).toContain(
      "await desistirDelPedido(numero, { idioma })",
    );
    const ruta = leer(
      "src/app/datos/app/mi/pedidos/[numero]/desistir/route.ts",
    );
    expect(ruta).toContain("await desistirDelPedido(numero, {");
    expect(ruta).toContain('"Cache-Control": "private, no-store"');
  });

  it("fuera de España, mirar un pedido no lee la base", () => {
    const consultas = leer("src/lib/pedidos/desistimiento-consultas.ts");
    const corte = consultas.indexOf("return null;");
    const lectura = consultas.indexOf("getDb()");
    expect(corte).toBeGreaterThan(-1);
    expect(corte).toBeLessThan(lectura);
  });
});
