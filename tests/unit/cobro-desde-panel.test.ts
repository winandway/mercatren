import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { aCentavos } from "@/lib/retiros/monto";

/**
 * PEDIR UN COBRO DESDE EL PANEL, Y REENVIARLO A UN TERCERO.
 *
 * Hasta el 21 de agosto de 2026 el cobro por enlace existía **solo por API**,
 * así que solo lo tenía el único comercio que la integró. Los demás abrían la
 * pantalla, la veían vacía para siempre, y no había un botón para crear nada.
 */
describe("EL MONTO NO PUEDE PERDER EL PUNTO DECIMAL", () => {
  /**
   * Este es el fallo que casi se publica, y no lo atrapó ningún tipo: el campo
   * se había puesto como `tipo="soloNumeros"`, que **filtra el punto**. Quien
   * escribía 45.90 guardaba 4590 → **$4,590.00 cobrados por una factura de
   * cuarenta y cinco dólares**. Lo destapó llenar el formulario en pantalla.
   */
  it("45.90 son 4590 centavos, no 459000", () => {
    expect(aCentavos("45.90")).toBe(4590);
  });

  it("un entero sin punto sigue funcionando", () => {
    expect(aCentavos("100")).toBe(10_000);
  });

  it("la casilla del monto acepta decimales", () => {
    const ui = readFileSync("src/components/panel/pedir-cobro.tsx", "utf8");
    const monto = ui.slice(
      ui.indexOf('name="monto"') - 400,
      ui.indexOf('name="monto"') + 300,
    );

    expect(
      monto,
      "el monto volvió a un campo que filtra el punto: 45.90 se cobraría como 4590",
    ).toContain('inputMode="decimal"');
    expect(monto).not.toContain('tipo="soloNumeros"');
  });
});

describe("el enlace tiene que poder reenviarse", () => {
  it("la consulta trae el enlace, no solo la referencia", () => {
    /* Sin esto, el comercio veía su cobro en pantalla y **no tenía nada que
       copiar**: para mandárselo a alguien había que sacarlo de la base. */
    const consultas = readFileSync("src/lib/cobros/consultas.ts", "utf8");
    const lista = consultas.slice(
      consultas.indexOf("export async function listarEnlacesDeCobro"),
    );
    expect(lista).toContain("enlace: cobrosSolicitados.enlace");
  });

  it("reenviar NO genera un enlace nuevo", () => {
    /* La referencia y el enlace se conservan a propósito: en el extracto del
       banco tiene que seguir apareciendo el mismo número. Anular y recrear
       obligaría a cambiar la referencia, que es lo que ensucia la
       conciliación. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    const reenviar = pedir.slice(
      pedir.indexOf("export async function reenviarCobro"),
    );
    expect(reenviar).not.toContain("generarEnlace()");
    expect(reenviar).toContain("cobro.enlace");
  });

  it("uno pagado no se reenvía", () => {
    /* Mandarle a alguien el enlace de algo ya pagado es invitarlo a pagarlo
       dos veces. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    const reenviar = pedir.slice(
      pedir.indexOf("export async function reenviarCobro"),
    );
    expect(reenviar).toContain('estado === "pagado"');
    expect(reenviar).toContain('estado === "cancelado"');
  });

  it("el alcance va DENTRO de la búsqueda del cobro", () => {
    /* Si fuera después, alguien podría reenviar el enlace de un cobro de otro
       comercio escribiendo su id a mano. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    const reenviar = pedir.slice(
      pedir.indexOf("export async function reenviarCobro"),
    );
    const donde = reenviar.indexOf(".where(");
    const limite = reenviar.indexOf(".limit(1)");
    expect(reenviar.slice(donde, limite)).toContain("alcance.tiendaId");
  });
});

describe("el equipo no adivina de qué comercio es el cobro", () => {
  it("si no lo dice, no se crea", () => {
    /* Un cobro creado para el comercio equivocado le acredita el dinero a
       otro. Un comercio no elige: solo puede ser el suyo. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    expect(pedir).toContain("Elige de qué comercio es este cobro");
  });
});

describe("el correo del cobro no falla en silencio (21 sep 2026)", () => {
  /* Richard creó un cobro y no supo si el cliente recibió el correo: el
     fallo se quedaba en un console.error y la pantalla decía «también se lo
     mandamos por correo» de todas formas. */
  const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
  const boton = readFileSync(
    "src/components/panel/facturar/cobrar-lo-cuadrado.tsx",
    "utf8",
  );
  const consultas = readFileSync("src/lib/cobros/consultas.ts", "utf8");

  it("crear el cobro devuelve si el correo salió", () => {
    expect(pedir).toMatch(/correoEnviado = true/);
    expect(pedir).toMatch(/ok: true,\s*url,\s*correoEnviado,/);
  });

  it("y la pantalla lo dice cuando no salió, en vez de «también se lo mandamos»", () => {
    expect(boton).toMatch(/t\("correoNoSalio"\)/);
    expect(boton).toMatch(/setCorreoSalio\(r\.correoEnviado\)/);
  });

  it("la lista de enlaces de cobro no esconde un error de la base como lista vacía", () => {
    const desde = consultas.indexOf(
      "export async function listarEnlacesDeCobro",
    );
    const cuerpo = consultas.slice(desde, consultas.indexOf("\n}", desde));
    expect(cuerpo).not.toMatch(/\.catch\(\(\) => \[\]\)/);
  });
});

describe("por qué no sale Zelle, dicho a quien cobra (22 sep 2026)", () => {
  /* Richard pidió «transferencia o Zelle» en un cobro de $6.483,77, el
     enlace salió solo con transferencia y nadie le dijo que el tope de Zelle
     estaba en $1.000: tuvo que preguntarlo. */
  const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
  const consultas = readFileSync("src/lib/cobros/consultas.ts", "utf8");
  const boton = readFileSync(
    "src/components/panel/facturar/cobrar-lo-cuadrado.tsx",
    "utf8",
  );
  const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
  const en = JSON.parse(readFileSync("messages/en.json", "utf8"));

  it("el motivo se calcula al crear el cobro y viaja en el resultado", () => {
    expect(pedir).toMatch(/porQueNoSaleZelle/);
    expect(pedir).toMatch(/zelleNoSale,/);
    expect(consultas).toMatch(/export async function porQueNoSaleZelle/);
  });

  it("nunca se calcula si no se pidió Zelle", () => {
    expect(pedir).toMatch(/if \(peticion\.metodos!\.includes\("zelle"\)\)/);
  });

  it("y un fallo leyendo la configuración NO tumba el enlace ya creado", () => {
    const desde = pedir.indexOf("porQueNoSaleZelle");
    const alrededor = pedir.slice(desde - 400, desde + 600);
    expect(alrededor).toMatch(/try \{/);
    expect(alrededor).toMatch(/catch \(fallo\)/);
  });

  it("la pantalla lo dice, con los cuatro motivos en los dos idiomas", () => {
    expect(boton).toMatch(/zelleNoSale\.\$\{zelleNoSale\.motivo\}/);
    for (const m of [
      "sin_receptor",
      "no_habilitada",
      "monto_bajo",
      "monto_alto",
    ]) {
      expect(es.panel.calculadora.zelleNoSale[m]).toBeTruthy();
      expect(en.panel.calculadora.zelleNoSale[m]).toBeTruthy();
    }
    /* El del tope dice el número que hay que cambiar: sin él, el aviso
       manda a buscar. */
    expect(es.panel.calculadora.zelleNoSale.monto_alto).toContain("{maximo}");
    expect(en.panel.calculadora.zelleNoSale.monto_alto).toContain("{maximo}");
  });

  it("el motivo NUNCA sale por la página pública del cobro", () => {
    /* A quien paga no le importa y puede delatar al comercio: la página
       pública sigue recibiendo un sí/no. */
    const publica = readFileSync("src/lib/cobros/consultas.ts", "utf8");
    const desde = publica.indexOf("export async function zelleDelCobro");
    const cuerpo = publica.slice(desde, publica.indexOf("\n}", desde));
    expect(cuerpo).not.toMatch(/motivo: decision\.motivo/);
    expect(cuerpo).toMatch(/topeSuperado/);
  });
});
