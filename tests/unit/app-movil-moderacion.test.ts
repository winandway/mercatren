import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  claveDeRechazo,
  enviar,
  MOTIVOS,
  urlBloquear,
  urlBloqueos,
  urlDenunciar,
} from "../../app-movil/src/lib/moderacion";
import { TEXTOS } from "../../app-movil/src/lib/textos";
import { RUTA_DE_LA_PAGINA } from "@/lib/app-movil/legal";
import {
  estadoDeRechazo,
  esTipoDenunciable,
  estaOcultoParaLaApp,
  MOTIVOS_DE_DENUNCIA,
  sinOcultos,
  type OcultosParaLaApp,
} from "@/lib/moderacion/reglas";

/**
 * ══ DENUNCIAR Y BLOQUEAR EN LA APP NATIVA (6 nov 2026) ══
 *
 * Google Play (política UGC) pide, a toda app con contenido de usuarios, un
 * sistema DENTRO de la app para denunciarlo y para bloquear a quien lo
 * publica. En Mercatren cualquiera abre su tienda y sube productos con la
 * cámara. Esto se pone en rojo si: una puerta deja denunciar o bloquear sin
 * sesión, la persona sale del cuerpo y no de la sesión, el catálogo o la ficha
 * dejan de esconder lo bloqueado o lo denunciado, la ficha pierde sus tres
 * puntos, falta un texto en algún idioma, o se puede subir un producto sin
 * tienda.
 */
const leer = (r: string) => readFileSync(r, "utf-8");
const RUTAS = {
  denunciar: "src/app/datos/app/mi/denunciar/route.ts",
  bloquear: "src/app/datos/app/mi/bloquear/route.ts",
  bloqueos: "src/app/datos/app/mi/bloqueos/route.ts",
};

describe("las puertas privadas del servidor", () => {
  for (const [nombre, ruta] of Object.entries(RUTAS)) {
    const c = leer(ruta);

    it(`${nombre}: sin sesión no se hace nada, y antes de mirar el cuerpo`, () => {
      expect(c).toMatch(/obtenerUsuario\(\)/);
      expect(c).toMatch(/motivo: "sesion" \}, 401\)/);
      const iSesion = c.lastIndexOf('motivo: "sesion"');
      const iCuerpo = c.lastIndexOf("esquema.safeParse");
      expect(iSesion).toBeGreaterThan(-1);
      expect(iSesion).toBeLessThan(iCuerpo);
    });

    it(`${nombre}: privada y sin caché`, () => {
      expect(c).toContain("private, no-store");
      expect(c).toContain('export const dynamic = "force-dynamic"');
    });

    it(`${nombre}: la persona sale de la sesión, nunca del cuerpo`, () => {
      expect(c).not.toMatch(/usuarioId:\s*cuerpo/);
      expect(c).not.toMatch(/cuerpo\.data\.usuario/);
    });
  }

  it("denunciar y bloquear validan con zod y usan el MISMO núcleo que la web", () => {
    for (const r of [RUTAS.denunciar, RUTAS.bloquear]) {
      const c = leer(r);
      expect(c).toMatch(/z\.enum\(TIPOS_DENUNCIABLES\)/);
    }
    expect(leer(RUTAS.denunciar)).toMatch(/z\.enum\(MOTIVOS_DE_DENUNCIA\)/);
    expect(leer(RUTAS.denunciar)).toContain("denunciarComo(usuario.id");
    expect(leer(RUTAS.bloquear)).toContain("bloquearComo(usuario.id");
    const web = leer("src/lib/moderacion/acciones.ts");
    expect(web).toContain("denunciarComo(");
    expect(web).toContain("bloquearComo(");
    // El archivo "use server" solo exporta funciones async.
    expect(web).not.toMatch(/export const|export type|export \{/);
  });

  it("cada denuncia sigue avisando al equipo y quedando en su tabla", () => {
    const n = leer("src/lib/moderacion/nucleo.ts");
    expect(n).toContain("correoAvisoAlEquipo");
    expect(n).toContain(".insert(denunciasContenido)");
    expect(n).toContain("seOcultaPorDenuncias(abiertas)");
  });

  it("productos y tiendas tienen como autor al dueño de la tienda", () => {
    const n = leer("src/lib/moderacion/nucleo.ts");
    expect(n).toMatch(/autorId: tiendas\.propietarioId/);
  });
});

describe("las reglas", () => {
  it("producto y tienda son tipos denunciables; un pedido no", () => {
    expect(esTipoDenunciable("producto")).toBe(true);
    expect(esTipoDenunciable("tienda")).toBe(true);
    expect(esTipoDenunciable("comentario")).toBe(true);
    expect(esTipoDenunciable("pedido")).toBe(false);
  });

  it("cada rechazo tiene su estado HTTP", () => {
    expect(estadoDeRechazo("sesion")).toBe(401);
    expect(estadoDeRechazo("propio")).toBe(403);
    expect(estadoDeRechazo("invalido")).toBe(404);
    expect(estadoDeRechazo("fallo")).toBe(500);
  });

  it("lo bloqueado y lo denunciado se esconde; lo demás se queda", () => {
    const ocultos: OcultosParaLaApp = {
      productos: new Set(["p-malo"]),
      tiendasDenunciadas: new Set(["tienda-denunciada"]),
      tiendasBloqueadas: new Set(["tienda-bloqueada"]),
    };
    const lista = [
      { id: "p1", tienda: { slug: "buena" } },
      { id: "p-malo", tienda: { slug: "buena" } },
      { id: "p2", tienda: { slug: "tienda-denunciada" } },
      { id: "p3", tienda: { slug: "tienda-bloqueada" } },
    ];
    expect(sinOcultos(lista, ocultos).map((p) => p.id)).toEqual(["p1"]);
    expect(estaOcultoParaLaApp(lista[0]!, ocultos)).toBe(false);
    // Sin nada que esconder, la lista pasa entera.
    const vacio: OcultosParaLaApp = {
      productos: new Set(),
      tiendasDenunciadas: new Set(),
      tiendasBloqueadas: new Set(),
    };
    expect(sinOcultos(lista, vacio)).toHaveLength(4);
  });
});

describe("el catálogo y la ficha esconden lo bloqueado y lo denunciado", () => {
  const catalogo = leer("src/app/datos/app/v1/catalogo/route.ts");
  const ficha = leer("src/app/datos/app/v1/producto/[slug]/route.ts");

  it("el catálogo (y la búsqueda, que es el mismo) filtra la lista y los promocionados", () => {
    expect(catalogo).toContain("ocultosParaLaApp(await quienMira(peticion))");
    expect(catalogo).toMatch(/sinOcultos\(/);
    expect(catalogo).toMatch(/estaOcultoParaLaApp\(p, ocultos\)/);
    expect(catalogo).toContain("tiendasBloqueadas.has(filtros.data.tienda)");
  });

  it("la ficha da 404 si el producto o su tienda están ocultos para quien mira", () => {
    expect(ficha).toContain("ocultosParaLaApp(await quienMira(peticion))");
    expect(ficha).toMatch(/estaOcultoParaLaApp\(/);
    expect(ficha).toMatch(/respuestaDeError\("no_existe", 404\)/);
  });

  it("sin cookie no se lee ningún bloqueo, y se oculta con tres denuncias", () => {
    const p = leer("src/lib/moderacion/para-la-app.ts");
    expect(p).toMatch(
      /if \(!peticion\.headers\.get\("cookie"\)\) return null;/,
    );
    expect(p).toMatch(/if \(!usuarioId\) return new Set\(\)/);
    expect(p).toContain("bloqueos_usuario");
    expect(p).toContain("DENUNCIAS_PARA_OCULTAR");
    expect(p).toMatch(/eq\(denunciasContenido\.estado, "abierta"\)/);
  });

  it("las rutas públicas siguen sin llevar sesión: solo la cookie decide", () => {
    // Quien trae cookie nunca se guarda en el borde (regla de cache-del-borde).
    expect(leer("src/lib/trafico/cache-del-borde.ts")).toContain(
      "/datos/app/v1/:ruta*",
    );
  });
});

describe("la app: denunciar y bloquear en la ficha", () => {
  const ficha = leer("app-movil/src/app/producto/[slug].tsx");

  it("la ficha tiene el menú de tres puntos con las tres opciones", () => {
    expect(ficha).toContain("<MenuTresPuntos");
    expect(ficha).toContain('"reportProduct"');
    expect(ficha).toContain('"reportStore"');
    expect(ficha).toContain('"blockSeller"');
    expect(ficha).toContain("<HojaDenuncia");
  });

  it("sin sesión lleva a entrar, y bloquear pide confirmación y explica", () => {
    expect(ficha).toContain('router.push("/entrar")');
    expect(ficha).toContain('"reportNeedsSignIn"');
    expect(ficha).toContain('"blockTitle"');
    expect(ficha).toContain('"blockExplain"');
    expect(ficha).toContain('style: "destructive"');
  });

  it("la ficha y el catálogo mandan la sesión para que el servidor esconda lo bloqueado", () => {
    expect(ficha).toContain("cabeceraDeSesion()");
    expect(leer("app-movil/src/hooks/use-catalogo.ts")).toContain(
      "cabeceraDeSesion()",
    );
  });

  it("la hoja tiene los motivos, confirma y da las gracias", () => {
    const h = leer("app-movil/src/components/hoja-denuncia.tsx");
    expect(h).toContain("MOTIVOS.map");
    expect(h).toContain('"reportThanks"');
    expect(h).toContain("urlDenunciar(");
  });

  it("el menú espera a cerrarse antes de abrir la alerta o la hoja (iPhone las perdía)", () => {
    expect(leer("app-movil/src/components/menu-tres-puntos.tsx")).toMatch(
      /setTimeout\(o\.alTocar, \d+\)/,
    );
  });

  it("Cuenta tiene «Vendedores bloqueados» y desde ahí se desbloquea", () => {
    expect(leer("app-movil/src/app/(tabs)/cuenta.tsx")).toContain(
      'router.push("/bloqueados")',
    );
    const b = leer("app-movil/src/app/bloqueados.tsx");
    expect(b).toContain('"unblock"');
    expect(b).toContain("urlBloqueos(");
    expect(leer("app-movil/src/app/_layout.tsx")).toContain(
      'name="bloqueados"',
    );
  });
});

describe("los motivos y las direcciones", () => {
  it("la app ofrece EXACTAMENTE los motivos del servidor", () => {
    expect(MOTIVOS.map((m) => m.motivo).sort()).toEqual(
      [...MOTIVOS_DE_DENUNCIA].sort(),
    );
  });

  it("las direcciones son privadas, sin /api, con país e idioma", () => {
    for (const url of [
      urlDenunciar("US", "en"),
      urlBloquear("US", "es"),
      urlBloqueos("US", "en"),
    ]) {
      expect(url).toContain("/datos/app/mi/");
      expect(url).not.toContain("/api/");
      expect(url).toMatch(/pais=US&idioma=(en|es)$/);
    }
  });

  it("cada rechazo del servidor se traduce a su texto", () => {
    expect(claveDeRechazo("sesion")).toBe("reportNeedsSignIn");
    expect(claveDeRechazo("propio")).toBe("reportOwn");
    expect(claveDeRechazo("invalido")).toBe("reportGone");
    expect(claveDeRechazo("otra cosa")).toBe("reportFailed");
  });

  it("enviar: bien, sin sesión (401) y sin conexión", async () => {
    const responde = (estado: number, cuerpo: unknown) =>
      (async () =>
        new Response(JSON.stringify(cuerpo), {
          status: estado,
        })) as typeof fetch;
    expect(await enviar("u", {}, {}, responde(200, { ok: true }))).toEqual({
      ok: true,
    });
    expect(
      await enviar("u", {}, {}, responde(401, { ok: false, motivo: "sesion" })),
    ).toEqual({ ok: false, clave: "reportNeedsSignIn" });
    expect(
      await enviar("u", {}, {}, (async () => {
        throw new Error("sin red");
      }) as typeof fetch),
    ).toEqual({ ok: false, clave: "reportFailed" });
  });
});

describe("los textos, en los dos idiomas", () => {
  const CLAVES = [
    "reportProduct",
    "reportStore",
    "blockSeller",
    "reportWhy",
    "reportSend",
    "reportThanks",
    "reportNeedsSignIn",
    "reportOwn",
    "reportGone",
    "reportFailed",
    "reasonSpam",
    "reasonOffensive",
    "reasonSexual",
    "reasonHate",
    "reasonFraud",
    "reasonOther",
    "blockTitle",
    "blockExplain",
    "blockDone",
    "blockedSellers",
    "blockedNone",
    "unblock",
    "unblockDone",
  ] as const;

  it("cada texto existe en inglés y en español, y no son iguales", () => {
    for (const k of CLAVES) {
      expect(TEXTOS.en[k], `en.${k}`).toBeTruthy();
      expect(TEXTOS.es[k], `es.${k}`).toBeTruthy();
      expect(TEXTOS.en[k]).not.toBe(TEXTOS.es[k]);
    }
  });

  it("cada motivo de la hoja tiene su texto", () => {
    for (const m of MOTIVOS) {
      expect(TEXTOS.en[m.clave]).toBeTruthy();
      expect(TEXTOS.es[m.clave]).toBeTruthy();
    }
  });

  it("la explicación de bloquear dice qué pasa, en cada idioma", () => {
    expect(TEXTOS.es.blockExplain).toMatch(/Dejarás de ver/);
    expect(TEXTOS.en.blockExplain).toMatch(/You will stop seeing/);
  });
});

describe("para subir un producto hay que tener tienda y haber aceptado los términos", () => {
  it("la pantalla de nuevo producto manda a entrar o a crear la tienda", () => {
    const n = leer("app-movil/src/app/nuevo-producto.tsx");
    expect(n).toContain('<Redirect href="/entrar" />');
    expect(n).toContain('<Redirect href="/crear-tienda" />');
    expect(n).toContain("useMiTienda(");
  });

  it("el servidor lo exige otra vez: sin tienda, 403", () => {
    const r = leer("src/app/datos/app/mi/productos/route.ts");
    expect(r).toContain('respuestaDeError("sin_tienda", 403)');
  });

  it("el alta de la tienda obliga a aceptar los términos, en la app y en el servidor", () => {
    expect(leer("app-movil/src/lib/tienda.ts")).toContain(
      'if (!aceptaTerminos) return "faltaTerminos"',
    );
    expect(leer("src/lib/tiendas/alta.ts")).toMatch(
      /datos\.aceptaTerminos !== "on"/,
    );
  });
});

describe("«Help» lleva a la página de ayuda nueva", () => {
  it("la ayuda va a /support y Cuenta la enseña", () => {
    expect(RUTA_DE_LA_PAGINA.ayuda).toBe("support");
    const c = leer("app-movil/src/app/(tabs)/cuenta.tsx");
    expect(c).toMatch(/clave: "ayuda", ruta: "ayuda"/);
  });
});
