import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

/* «abrir-pedido» canjea el pase con Better Auth; aquí no se canjea ninguno
   (las pruebas no llevan pase), así que la sesión no hace falta. */
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn(() => {
    throw new Error("sin pase no se llama a Better Auth");
  }),
}));

import {
  paisesEnOrden,
  paisMarcado,
  type Pais,
} from "../../app-movil/src/lib/api";
import {
  metodosDeRespaldo,
  metodosLeidos,
  precioZelleDesdePublicado,
  siguientePaso,
  totalZelleEstimado,
} from "../../app-movil/src/lib/pago";
import { GET as abrirPedido } from "@/app/datos/app/abrir-pedido/route";
import { GET as paisesDeLaApp } from "@/app/datos/app/v1/paises/route";
import {
  enlaceDePagoEnLaWeb,
  metodoPermitidoEnLaApp,
  metodosDeLaApp,
  origenDeLaWebDelPais,
  PAIS_POR_DEFECTO_EN_LA_APP,
  rutaDelPedido,
  TARJETA_EN_LA_APP_PARA_EL_PUBLICO,
} from "@/lib/app-movil/cobro-en-la-app";
import { baseDesdePublicado, precioZelleCentavos } from "@/lib/dinero";
import { enLaApp } from "@/lib/mercado/interruptores";

/**
 * VENEZUELA EN LA APP, Y NADA COBRA SIN PROBAR (8 nov 2026).
 *
 * Lo que no puede pasar sin que esto se ponga en rojo:
 * - que la hoja de tarjeta de la app se le ofrezca (o se le acepte, por la
 *   puerta del servidor) al público antes de la prueba 9;
 * - que el pedido de Zelle hecho en la app no lleve a la página de pago de
 *   la web de su país (mercatren.com.ve), o que la app abra cualquier
 *   dirección que le llegue;
 * - que el enlace de «abrir-pedido» pueda mandar a otro sitio;
 * - que la página de pago del pedido le dé un 404 a quien llega sin sesión;
 * - que el total estimado de Zelle en la app se separe del de la web;
 * - que la bienvenida deje de abrir con Venezuela marcada.
 */
const leer = (r: string) => readFileSync(r, "utf-8");

describe("la tarjeta de la app, apagada para el público hasta la prueba 9", () => {
  it("el interruptor está apagado", () => {
    expect(TARJETA_EN_LA_APP_PARA_EL_PUBLICO).toBe(false);
  });

  it("el público paga con Zelle (en la web); el equipo además con la hoja", () => {
    expect(metodosDeLaApp("VE")).toEqual(["zelle"]);
    expect(metodosDeLaApp(" ve ", { esEquipo: false })).toEqual(["zelle"]);
    expect(metodosDeLaApp("VE", { esEquipo: true })).toEqual([
      "tarjeta",
      "zelle",
    ]);
    expect(metodoPermitidoEnLaApp("tarjeta", "VE")).toBe(false);
    expect(metodoPermitidoEnLaApp("tarjeta", "US")).toBe(false);
    expect(metodoPermitidoEnLaApp("zelle", "VE")).toBe(true);
  });

  it("Zelle solo donde Zelle existe (red de bancos de EE. UU.)", () => {
    expect(metodosDeLaApp("CL")).toEqual([]);
    expect(metodosDeLaApp("CO")).toEqual([]);
    expect(metodosDeLaApp("ES")).toEqual([]);
    expect(metodosDeLaApp("ES", { esEquipo: true })).toEqual(["tarjeta"]);
  });

  it("la puerta del pedido mira el método ANTES de crear nada", () => {
    const ruta = leer("src/app/datos/app/mi/pedido/route.ts");
    const mira = ruta.indexOf("metodoPermitidoEnLaApp(metodo");
    const crea = ruta.indexOf("await crearPedido(");
    expect(mira).toBeGreaterThan(-1);
    expect(mira).toBeLessThan(crea);
    /* La app 2.0.0 no manda método: para ella es tarjeta (y se rechaza). */
    expect(ruta).toContain('cuerpo.data.metodoPago ?? "tarjeta"');
    expect(ruta).toContain(
      'metodoPago: metodo === "zelle" ? "zelle" : "stripe"',
    );
    /* Zelle vuelve con el enlace a la página de pago, sin intento de Stripe. */
    const zelle = ruta.indexOf('if (metodo === "zelle")');
    expect(zelle).toBeGreaterThan(crea);
    expect(zelle).toBeLessThan(ruta.indexOf("await crearIntentoDePago("));
    expect(ruta).toContain("pagoEnLaWeb: await enlaceParaPagarEnLaWeb(");
  });

  it("«pagar» desde Mis pedidos solo da la hoja si la tarjeta está permitida", () => {
    const ruta = leer("src/app/datos/app/mi/pagar/route.ts");
    expect(ruta).toContain(
      'metodoPermitidoEnLaApp("tarjeta", pedido.mercado, { esEquipo })',
    );
    expect(ruta.indexOf("if (!hoja)")).toBeLessThan(
      ruta.indexOf("await crearIntentoDePago("),
    );
    /* Y solo SU pedido. */
    expect(ruta).toContain("eq(pedidos.clienteId, usuario.id)");
  });

  it("los métodos que ve la app los decide el servidor", () => {
    const ruta = leer("src/app/datos/app/mi/metodos/route.ts");
    expect(ruta).toContain(
      "metodosDeLaApp(contexto.mercado.codigo, { esEquipo })",
    );
    /* Mientras llega la respuesta, nunca la tarjeta por adivinar. */
    expect(metodosDeRespaldo("VE")).toEqual(["zelle"]);
    expect(metodosDeRespaldo("CL")).toEqual([]);
    expect(metodosLeidos(["tarjeta", "zelle", "bitcoin"])).toEqual([
      "tarjeta",
      "zelle",
    ]);
    expect(metodosLeidos(null)).toEqual([]);
  });

  it("la pantalla de pagar manda el método y abre la web cuando toca", () => {
    const pantalla = leer("app-movil/src/app/pagar.tsx");
    expect(pantalla).toContain("metodoPago: metodo,");
    expect(pantalla).toContain('if (paso.tipo === "web")');
    expect(pantalla).toContain("WebBrowser.openBrowserAsync(destino)");
    expect(leer("app-movil/src/app/mis-pedidos.tsx")).toContain(
      "WebBrowser.openBrowserAsync(paso.url)",
    );
  });
});

describe("el pago en la web del país", () => {
  it("en producción, la web del país; en desarrollo, la misma máquina", () => {
    expect(
      origenDeLaWebDelPais(
        "https://mercatren.com/datos/app/mi/pedido?pais=VE",
        "mercatren.com.ve",
      ),
    ).toBe("https://mercatren.com.ve");
    expect(
      origenDeLaWebDelPais(
        "http://10.0.2.2:3000/datos/app/mi/pedido",
        "mercatren.com.ve",
      ),
    ).toBe("http://10.0.2.2:3000");
    expect(
      origenDeLaWebDelPais("http://ve.localhost:3000/x", "mercatren.com.ve"),
    ).toBe("http://ve.localhost:3000");
  });

  it("el enlace lleva el pase de un solo uso; sin pase, la página del pedido", () => {
    const con = enlaceDePagoEnLaWeb({
      origen: "https://mercatren.com.ve",
      idioma: "es",
      numero: "MT-000123",
      pase: "abc",
    });
    expect(con).toBe(
      "https://mercatren.com.ve/datos/app/abrir-pedido?n=MT-000123&idioma=es&t=abc",
    );
    expect(
      enlaceDePagoEnLaWeb({
        origen: "https://mercatren.com.ve",
        idioma: "en",
        numero: "MT-000123",
      }),
    ).toBe("https://mercatren.com.ve/en/pedido/MT-000123");
    expect(
      enlaceDePagoEnLaWeb({
        origen: "https://mercatren.com.ve",
        idioma: "es",
        numero: "../x",
      }),
    ).toBeNull();
  });

  it("«abrir-pedido» solo manda a un pedido de este mismo dominio", async () => {
    expect(rutaDelPedido("MT-000001", "en")).toBe("/en/pedido/MT-000001");
    expect(rutaDelPedido("//otro.com", "es")).toBeNull();
    expect(rutaDelPedido("MT-1", "es")).toBeNull();

    const bueno = await abrirPedido(
      new Request(
        "https://mercatren.com.ve/datos/app/abrir-pedido?n=MT-000001&idioma=es",
      ),
    );
    expect(bueno.status).toBe(303);
    expect(bueno.headers.get("Location")).toBe(
      "https://mercatren.com.ve/es/pedido/MT-000001",
    );
    expect(bueno.headers.get("Cache-Control")).toContain("no-store");

    const malo = await abrirPedido(
      new Request(
        "https://mercatren.com.ve/datos/app/abrir-pedido?n=https://otro.com&idioma=es",
      ),
    );
    expect(malo.headers.get("Location")).toBe("https://mercatren.com.ve/");
  });

  it("el pase: un solo uso, con hash, y solo lo emite el servidor", () => {
    const auth = leer("src/lib/auth.ts");
    expect(auth).toContain('storeToken: "hashed"');
    expect(auth).toContain("disableClientRequest: true");
    expect(auth).toContain("expiresIn: 5");
  });

  it("la página del pedido, sin sesión, manda a entrar y vuelve (no 404)", () => {
    const pagina = leer("src/app/[locale]/(tienda)/pedido/[numero]/page.tsx");
    const sinSesion = pagina.indexOf("if (!(await obtenerUsuario()");
    expect(sinSesion).toBeGreaterThan(-1);
    expect(sinSesion).toBeLessThan(pagina.indexOf("await conciliarPedido("));
    expect(pagina).toContain("/entrar?destino=");
  });

  it("la app solo abre direcciones de Mercatren", () => {
    expect(
      siguientePaso({
        pagoEnLaWeb: "https://mercatren.com.ve/es/pedido/MT-000001",
      }),
    ).toEqual({
      tipo: "web",
      url: "https://mercatren.com.ve/es/pedido/MT-000001",
    });
    expect(
      siguientePaso({ pagoEnLaWeb: "https://mercatren.com.ve.evil.com/x" }),
    ).toEqual({ tipo: "sinPago" });
    expect(siguientePaso({ pagoEnLaWeb: "javascript:alert(1)" })).toEqual({
      tipo: "sinPago",
    });
    expect(
      siguientePaso({ pago: { clientSecret: "s", clavePublica: "p" } }),
    ).toEqual({ tipo: "hoja", clientSecret: "s", clavePublica: "p" });
    expect(siguientePaso(null)).toEqual({ tipo: "sinPago" });
  });
});

describe("el total estimado de Zelle en la app es el de la web", () => {
  it("la misma cuenta que `precioZelleCentavos(baseDesdePublicado(…))`", () => {
    for (let p = 0; p <= 60_000; p += 37) {
      expect(precioZelleDesdePublicado(p), String(p)).toBe(
        precioZelleCentavos(baseDesdePublicado(p)),
      );
    }
  });

  it("suma por cantidad", () => {
    const lineas = [
      { precio: { centavos: 245 }, cantidad: 3 },
      { precio: { centavos: 10_000 }, cantidad: 1 },
    ];
    expect(totalZelleEstimado(lineas)).toBe(
      precioZelleDesdePublicado(245) * 3 + precioZelleDesdePublicado(10_000),
    );
  });
});

describe("la bienvenida abre con Venezuela", () => {
  const paises: Pais[] = [
    { codigo: "US", nombre: "EE. UU.", moneda: "USD", encendido: true },
    { codigo: "VE", nombre: "Venezuela", moneda: "USD", encendido: true },
    { codigo: "CL", nombre: "Chile", moneda: "CLP", encendido: false },
  ];

  it("Venezuela está encendida y es el país por defecto", async () => {
    expect(PAIS_POR_DEFECTO_EN_LA_APP).toBe("VE");
    expect(enLaApp("VE")).toBe(true);
    const r = paisesDeLaApp(
      new Request("https://mercatren.com/datos/app/v1/paises?idioma=es"),
    );
    const cuerpo = (await r.json()) as {
      porDefecto: string | null;
      paises: Pais[];
    };
    expect(cuerpo.porDefecto).toBe("VE");
    expect(cuerpo.paises.find((p) => p.codigo === "VE")?.encendido).toBe(true);
  });

  it("sale primero y ya marcado; quien ya eligió conserva el suyo", () => {
    expect(paisesEnOrden(paises, "VE").map((p) => p.codigo)).toEqual([
      "VE",
      "US",
      "CL",
    ]);
    expect(paisMarcado(null, paises, "VE")).toBe("VE");
    expect(paisMarcado("US", paises, "VE")).toBe("US");
    /* Un país por defecto apagado no se marca ni se sube. */
    expect(paisMarcado(null, paises, "CL")).toBeNull();
    expect(paisesEnOrden(paises, "CL")[0]!.codigo).toBe("US");
  });

  it("un país sin productos dice «Muy pronto», no queda en blanco", () => {
    const portada = leer("app-movil/src/components/portada-vender.tsx");
    expect(portada).toContain('texto(idioma, "muyProntoProductos")');
    expect(leer("app-movil/src/app/(tabs)/index.tsx")).toContain(
      "alVaciar={<PortadaVender",
    );
  });
});
