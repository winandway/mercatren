import { describe, expect, it } from "vitest";

import {
  authMd,
  catalogoArd,
  catalogoDeApi,
  recursoProtegido,
  tarjetaMcp,
} from "@/lib/agentes/descubrimiento";
import {
  articuloAMarkdown,
  htmlAMarkdown,
  tokensAprox,
} from "@/lib/agentes/markdown";
import {
  atenderMcp,
  HERRAMIENTAS_MCP,
  type ServiciosMcp,
} from "@/lib/agentes/mcp";
import { openapiDeMercatren } from "@/lib/agentes/openapi";
import { recursosDe, sha256Hex } from "@/lib/agentes/recursos";
import { indiceDeSkills, SKILLS, textoDeSkill } from "@/lib/agentes/skills";

/**
 * LO QUE SE LE PUBLICA A LOS AGENTES: una sola lista de direcciones, documentos
 * que no se contradicen, un MCP que contesta bien y un Markdown legible.
 * Es lo que subió la nota de isitagentready.com de 33 (23 ago 2026).
 */
const BASE = "https://mercatren.com";

describe("los documentos de descubrimiento", () => {
  it("todos apuntan a las mismas direcciones (una sola fuente)", () => {
    const r = recursosDe(BASE);
    const cat = catalogoDeApi(BASE);
    expect(cat.linkset[0]!["service-desc"][0]!.href).toBe(r.openapi);
    expect(cat.linkset[0]!.status[0]!.href).toBe(r.salud);
    expect(cat.linkset[1]!.anchor).toBe(r.mcp);
    expect(tarjetaMcp(BASE).transport.endpoint).toBe(r.mcp);
    expect(catalogoArd(BASE).entries.map((e) => e.url)).toContain(r.mcp);
    expect(catalogoArd(BASE).entries.map((e) => e.url)).toContain(r.openapi);
    expect(recursoProtegido(BASE).resource_documentation).toBe(r.authMd);
  });

  it("el manifiesto ARD tiene la forma que pide la norma: urn:air:<dominio>:<espacio>:<nombre>, tipo IANA, una sola de url/data y consultas representativas", () => {
    for (const e of catalogoArd(BASE).entries) {
      expect(e.id).toMatch(/^urn:air:mercatren\.com:[a-z-]+:[a-z-]+$/);
      expect(e.type).toMatch(/^[a-z]+\/[\w.+-]+(;.*)?$/);
      expect("url" in e).toBe(true);
      expect(e.representativeQueries.length).toBeGreaterThanOrEqual(2);
      expect(e.representativeQueries.length).toBeLessThanOrEqual(5);
    }
  });

  it("la tarjeta MCP anuncia las mismas herramientas que sirve el servidor", () => {
    expect(tarjetaMcp(BASE).tools.map((t) => t.name)).toEqual(
      HERRAMIENTAS_MCP.map((h) => h.name),
    );
  });

  it("NO se inventa un servidor OAuth: el recurso protegido lo dice y auth.md explica cómo se consigue el token", () => {
    expect(recursoProtegido(BASE).authorization_servers).toEqual([]);
    expect(authMd(BASE)).toContain("No hay servidor OAuth/OIDC");
    expect(authMd(BASE)).toContain("hola@mercatren.com");
  });

  it("el OpenAPI describe las rutas que existen, con sus métodos", () => {
    const o = openapiDeMercatren(BASE);
    expect(o.openapi).toBe("3.1.0");
    expect(o.servers[0]!.url).toBe(BASE);
    for (const ruta of [
      "/datos/catalogo",
      "/datos/buscar",
      "/datos/salud",
      "/datos/mcp",
      "/datos/socios/cobro",
      "/datos/socios/cobro/reactivar",
      "/datos/socios/cobro/anular",
      "/datos/socios/productos",
      "/datos/socios/cambios",
      "/datos/socios/vincular",
    ]) {
      expect(o.paths, `falta ${ruta}`).toHaveProperty(ruta);
    }
    expect(o.paths["/datos/socios/cobro"].post.security).toEqual([
      { tokenDeTienda: [] },
    ]);
    expect(
      o.paths["/datos/catalogo"].get.parameters.map((p) => p.name),
    ).toContain("q");
  });
});

describe("los skills", () => {
  it("el índice lleva el SHA-256 del texto exacto que se sirve", async () => {
    const idx = await indiceDeSkills(BASE);
    expect(idx.skills).toHaveLength(SKILLS.length);
    for (const s of idx.skills) {
      const skill = SKILLS.find((k) => k.nombre === s.name)!;
      expect(s.sha256).toBe(await sha256Hex(textoDeSkill(skill, BASE)));
      expect(s.url).toBe(`${BASE}/.well-known/agent-skills/${s.name}/SKILL.md`);
    }
  });

  it("cada SKILL.md trae su frontmatter y habla de lo que existe", () => {
    for (const s of SKILLS) {
      const t = textoDeSkill(s, BASE);
      expect(t.startsWith(`---\nname: ${s.nombre}\n`)).toBe(true);
      expect(t).toContain(BASE);
    }
    expect(textoDeSkill(SKILLS[1]!, BASE)).toContain("/datos/socios/cobro");
  });
});

describe("el servidor MCP (protocolo)", () => {
  const servicios: ServiciosMcp = {
    async buscarProductos(consulta) {
      return {
        productos:
          consulta === "nada"
            ? []
            : [
                {
                  slug: "tee-pvc",
                  titulo: "TEE PVC",
                  precio: "$3.16",
                  tienda: "Bley",
                  tiendaSlug: "bley",
                  pais: "VE",
                  url: `${BASE}/es/producto/tee-pvc`,
                  imagen: null,
                },
              ],
        pagina: 1,
        paginas: 1,
      };
    },
    async verProducto(slug) {
      if (slug !== "tee-pvc") return null;
      return {
        slug,
        titulo: "TEE PVC",
        precio: "$3.16",
        tienda: "Bley",
        tiendaSlug: "bley",
        pais: "VE",
        url: `${BASE}/es/producto/tee-pvc`,
        imagen: null,
        descripcion: null,
        marca: null,
        categoria: "PVC",
        existencias: 4,
        seRetiraEn: "El Vigía",
        direccion: "Av. Bolívar",
      };
    },
    async listarTiendas() {
      return [
        {
          slug: "bley",
          nombre: "Bley",
          ciudad: "El Vigía",
          pais: "VE",
          productos: 622,
          url: `${BASE}/es/tienda/bley`,
        },
      ];
    },
    async verTienda() {
      return null;
    },
  };

  it("initialize contesta con la versión pedida si la conoce, y con la nuestra si no", async () => {
    const a = await atenderMcp(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26" },
      },
      servicios,
    );
    expect(a.estado).toBe(200);
    expect(
      (a.respuesta as { result: { protocolVersion: string } }).result
        .protocolVersion,
    ).toBe("2025-03-26");
    const b = await atenderMcp(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "1999-01-01" },
      },
      servicios,
    );
    expect(
      (b.respuesta as { result: { protocolVersion: string } }).result
        .protocolVersion,
    ).toBe("2025-06-18");
  });

  it("una notificación no se contesta (202), un método desconocido es -32601 y una petición mal armada -32600", async () => {
    expect(
      (
        await atenderMcp(
          { jsonrpc: "2.0", method: "notifications/initialized" },
          servicios,
        )
      ).estado,
    ).toBe(202);
    const r = await atenderMcp(
      { jsonrpc: "2.0", id: 2, method: "lo/que/sea" },
      servicios,
    );
    expect((r.respuesta as { error: { code: number } }).error.code).toBe(
      -32601,
    );
    const m = await atenderMcp({ hola: 1 }, servicios);
    expect((m.respuesta as { error: { code: number } }).error.code).toBe(
      -32600,
    );
  });

  it("tools/list anuncia las cuatro herramientas, todas de solo lectura", async () => {
    const r = await atenderMcp(
      { jsonrpc: "2.0", id: 3, method: "tools/list" },
      servicios,
    );
    const tools = (
      r.respuesta as {
        result: {
          tools: { name: string; annotations: { readOnlyHint: boolean } }[];
        };
      }
    ).result.tools;
    expect(tools.map((t) => t.name)).toEqual([
      "buscar_productos",
      "ver_producto",
      "listar_tiendas",
      "ver_tienda",
    ]);
    expect(tools.every((t) => t.annotations.readOnlyHint)).toBe(true);
  });

  it("tools/call devuelve texto y datos estructurados; lo que no existe va como isError, no como excepción", async () => {
    const r = await atenderMcp(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "ver_producto", arguments: { slug: "tee-pvc" } },
      },
      servicios,
    );
    const res = (
      r.respuesta as {
        result: {
          content: { text: string }[];
          structuredContent: { seRetiraEn: string };
        };
      }
    ).result;
    expect(res.content[0]!.text).toContain("Se retira en:** El Vigía");
    expect(res.structuredContent.seRetiraEn).toBe("El Vigía");
    const e = await atenderMcp(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "ver_producto", arguments: { slug: "x" } },
      },
      servicios,
    );
    expect(
      (e.respuesta as { result: { isError?: boolean } }).result.isError,
    ).toBe(true);
    const f = await atenderMcp(
      {
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: { name: "buscar_productos", arguments: {} },
      },
      servicios,
    );
    expect(
      (f.respuesta as { result: { isError?: boolean } }).result.isError,
    ).toBe(true);
  });

  it("un lote se contesta como lote", async () => {
    const r = await atenderMcp(
      [
        { jsonrpc: "2.0", id: 1, method: "ping" },
        { jsonrpc: "2.0", method: "notifications/x" },
      ],
      servicios,
    );
    expect(Array.isArray(r.respuesta)).toBe(true);
    expect((r.respuesta as unknown[]).length).toBe(1);
  });
});

describe("el Markdown para agentes", () => {
  it("convierte el HTML quedándose con el contenido: títulos, párrafos, listas, enlaces e imágenes", () => {
    const html = `<html><head><title>X | Mercatren</title><style>p{}</style></head><body><header><a href="/es">Mercatren</a></header><main><h1>Hola &amp; adi&oacute;s</h1><p>Un <strong>párrafo</strong> con <a href="/es/catalogo">enlace</a>.</p><ul><li>uno</li><li>dos</li></ul><img src="/media/f.webp" alt="Foto"><script>alert(1)</script></main><footer>pie</footer></body></html>`;
    const md = htmlAMarkdown(html, BASE);
    expect(md).toContain(
      "# Hola & adi&oacute;s".replace("&oacute;", "&oacute;"),
    ); // la entidad rara se deja tal cual
    expect(md).toContain("**párrafo**");
    expect(md).toContain("[enlace](https://mercatren.com/es/catalogo)");
    expect(md).toContain("- uno\n- dos");
    expect(md).toContain("![Foto](https://mercatren.com/media/f.webp)");
    expect(md).not.toContain("alert(1)");
    expect(md).not.toContain("pie");
    expect(md).not.toContain("| Mercatren");
  });

  it("si el <main> viene vacío por el streaming, usa el cuerpo entero", () => {
    const html = `<body><header>h</header><main><template id="B:1"></template></main><div hidden id="S:1"><h2>Contenido</h2><p>Texto largo de la página que de verdad importa y que React mandó después.</p></div><footer>f</footer></body>`;
    const md = htmlAMarkdown(html, BASE);
    expect(md).toContain("## Contenido");
    expect(md).toContain("Texto largo");
  });

  it("un artículo sale bloque por bloque, con su fuente", () => {
    const md = articuloAMarkdown(
      {
        slug: "nota",
        tipo: "novedad",
        titulo: "Título",
        resumen: "Resumen.",
        fecha: "2026-08-23",
        temas: [],
        cuerpo: [
          { tipo: "subtitulo", texto: "Sub" },
          { tipo: "lista", puntos: ["a", "b"] },
          { tipo: "imagen", src: "/blog/x.png", alt: "Alt" },
          { tipo: "tabla", encabezados: ["A", "B"], filas: [["1", "2"]] },
        ],
      },
      BASE,
      "es",
    );
    expect(md).toContain("# Título");
    expect(md).toContain("## Sub");
    expect(md).toContain("- a\n- b");
    expect(md).toContain("![Alt](https://mercatren.com/blog/x.png)");
    expect(md).toContain("| A | B |");
    expect(md).toContain("Fuente: https://mercatren.com/es/blog/nota");
  });

  it("los tokens se estiman a cuatro caracteres por token", () => {
    expect(tokensAprox("a".repeat(400))).toBe(100);
  });
});
