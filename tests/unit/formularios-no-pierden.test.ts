// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { ponerValor } from "@/components/ui/formulario-persistente";
import {
  LLAVE_CUENTA,
  llaveDeBorrador,
  olvidarTodosLosBorradores,
  ponerCuentaDelNavegador,
} from "@/lib/formularios/borrador";

/**
 * ══ NINGÚN FORMULARIO PIERDE LO ESCRITO (regla global, 20 sep 2026) ══
 *
 * Todo `<form>` del sitio pasa por `FormularioPersistente`, salvo los de esta
 * lista, cada uno con su motivo. Un formulario nuevo que no lo use y no esté
 * aquí pone este candado en rojo.
 */
const NO_APLICA: Record<string, string> = {
  "src/app/[locale]/panel/casilleros/page.tsx":
    "filtro de búsqueda, no guarda datos",
  "src/app/[locale]/panel/productos/page.tsx":
    "filtro de búsqueda, no guarda datos",
  "src/components/casillero/asignar-huerfano.tsx":
    "un solo código que se elige de una lista",
  "src/components/casillero/calculadora-envio.tsx":
    "calculadora: no guarda nada",
  "src/components/casillero/estado-casillero.tsx":
    "solo botones, sin casillas para escribir",
  "src/components/catalogo/controles-catalogo.tsx":
    "orden y filtros del catálogo",
  "src/components/cobro/pagar-cobro.tsx": "solo botones de pago",
  "src/components/cobro/pagar-con-transferencia.tsx":
    "un número de referencia del banco y un archivo",
  "src/components/cobro/pagar-con-wire.tsx":
    "un número de referencia del banco y un archivo",
  "src/components/cobro/pagar-con-zelle.tsx": "un código de Zelle y un archivo",
  "src/components/cuenta/cambiar-clave.tsx":
    "solo contraseñas: nunca se guardan",
  "src/components/cuenta/formulario-entrar.tsx":
    "correo y contraseña: el navegador ya recuerda el correo",
  "src/components/cuenta/pedir-enlace-clave.tsx": "un solo correo",
  "src/components/cuenta/poner-clave-nueva.tsx":
    "solo contraseñas: nunca se guardan",
  "src/components/layout/buscador.tsx": "buscador",
  "src/components/pago/formulario-comprobante.tsx":
    "un código opcional y la foto del comprobante",
  "src/components/pago/pago-tarjeta.tsx": "datos de tarjeta: nunca se guardan",
  "src/components/panel/asistente/burbuja.tsx":
    "chat: el mensaje sale al pulsar enviar",
  "src/components/panel/aviso-de-pagos.tsx": "solo un botón",
  "src/components/panel/cj/buscador.tsx": "buscador",
  "src/components/panel/cj/importar-masivo.tsx":
    "dos números de una herramienta interna de CJ, retirado",
  "src/components/panel/credito/panel-creditos.tsx": "solo un botón",
  "src/components/panel/facturas/adjuntar-factura.tsx": "solo un archivo",
  "src/components/panel/lista-tiques.tsx": "filtro de búsqueda",
  "src/components/panel/pedidos-proveedor.tsx":
    "un número opcional y un archivo",
  "src/components/panel/probar-correo.tsx": "un solo correo de prueba",
  "src/components/panel/sincronizar-catalogo.tsx":
    "dirección y llave de un sistema: llegan pegadas",
  "src/components/panel/tasas-del-dolar.tsx":
    "dos números por país, vienen puestos de la base",
  "src/components/panel/videos/acciones-video.tsx": "solo botones",
  "src/components/panel/videos/subir-video.tsx": "solo un archivo de video",
  "src/components/panel/zelle-cobros.tsx":
    "un monto por ajuste, viene puesto de la base",
  "src/components/panel/zelle/controles.tsx": "un solo dato de revisión",
  "src/components/secciones/subidor-movil.tsx": "solo un archivo de video",
  "src/components/videos/acciones-social.tsx": "solo botones",
};

const raiz = join(__dirname, "..", "..");

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return n.endsWith(".tsx") ? [ruta] : [];
  });
}

const conFormulario = archivos(join(raiz, "src"))
  .map((r) => ({ ruta: relative(raiz, r), codigo: readFileSync(r, "utf8") }))
  .filter((a) => /<form\b/.test(a.codigo))
  /* La pieza misma dibuja el <form> de todos. */
  .filter((a) => a.ruta !== "src/components/ui/formulario-persistente.tsx");

describe("todo formulario del sitio guarda lo escrito", () => {
  it("hay formularios que revisar (el candado no está ciego)", () => {
    expect(conFormulario.length).toBeGreaterThanOrEqual(35);
  });

  it.each(
    conFormulario
      .filter((a) => !(a.ruta in NO_APLICA))
      .map((a) => [a.ruta, a.codigo]),
  )("%s usa FormularioPersistente", (_ruta, codigo) => {
    expect(codigo).toMatch(/<FormularioPersistente\b/);
  });

  it("la lista de excepciones no tiene archivos que ya no existen", () => {
    const existentes = new Set(conFormulario.map((a) => a.ruta));
    for (const ruta of Object.keys(NO_APLICA)) {
      expect(existentes.has(ruta), ruta).toBe(true);
    }
  });
});

describe("cada borrador es de su dueño", () => {
  it("la llave lleva la cuenta", () => {
    expect(llaveDeBorrador("producto", "u1")).not.toBe(
      llaveDeBorrador("producto", "u2"),
    );
    window.localStorage.clear();
    expect(llaveDeBorrador("producto")).toContain(":invitado:");
  });

  it("al salir no queda ni un borrador", () => {
    window.localStorage.clear();
    window.localStorage.setItem(llaveDeBorrador("a", "u1"), "{}");
    window.localStorage.setItem(llaveDeBorrador("b", "invitado"), "{}");
    window.localStorage.setItem(LLAVE_CUENTA, "u1");
    window.localStorage.setItem("otra-cosa", "x");
    olvidarTodosLosBorradores();
    expect(window.localStorage.getItem(llaveDeBorrador("a", "u1"))).toBeNull();
    expect(
      window.localStorage.getItem(llaveDeBorrador("b", "invitado")),
    ).toBeNull();
    expect(window.localStorage.getItem(LLAVE_CUENTA)).toBeNull();
    expect(window.localStorage.getItem("otra-cosa")).toBe("x");
  });

  it("al entrar se borran los de otra cuenta y lo de invitado pasa a la suya", () => {
    window.localStorage.clear();
    window.localStorage.setItem(llaveDeBorrador("a", "otro"), "de-otro");
    window.localStorage.setItem(llaveDeBorrador("checkout", "invitado"), "mio");
    ponerCuentaDelNavegador("u1");
    expect(
      window.localStorage.getItem(llaveDeBorrador("a", "otro")),
    ).toBeNull();
    expect(window.localStorage.getItem(llaveDeBorrador("checkout", "u1"))).toBe(
      "mio",
    );
    expect(llaveDeBorrador("checkout")).toBe(llaveDeBorrador("checkout", "u1"));
  });
});

describe("restituye también las casillas controladas por React", () => {
  it("pone el valor por el setter nativo", () => {
    const campo = document.createElement("input");
    let visto = "";
    Object.defineProperty(campo, "value", {
      configurable: true,
      get: () => visto,
      set: () => {
        throw new Error("el setter propio de la casilla no debe usarse");
      },
    });
    /* El setter del prototipo escribe el valor de verdad. */
    ponerValor(campo, "hola");
    delete (campo as unknown as Record<string, unknown>).value;
    visto = campo.value;
    expect(visto).toBe("hola");
  });
});
