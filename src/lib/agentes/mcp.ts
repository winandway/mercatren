import { z } from "zod";

import {
  PROTOCOLO_MCP,
  PROTOCOLOS_MCP_ADMITIDOS,
  VERSION_AGENTES,
} from "@/lib/agentes/recursos";

/**
 * EL SERVIDOR MCP DE MERCATREN — de SOLO LECTURA, y a propósito.
 *
 * Habla JSON-RPC 2.0 sobre HTTP (transporte Streamable HTTP sin SSE: cada POST
 * es una petición y una respuesta). Expone cuatro herramientas sobre el
 * catálogo público: buscar productos, ver una ficha, listar comercios y ver un
 * comercio. Nada que escriba, nada que cobre, nada que necesite sesión: un
 * agente con esto puede ayudar a una persona a ENCONTRAR, que es lo que hoy le
 * falta al sitio de cara a las máquinas. Comprar sigue pasando en el sitio,
 * con cuenta y con las reglas de siempre.
 *
 * La lógica del protocolo es pura (recibe el cuerpo y un juego de servicios)
 * para poder probarla sin base de datos; la ruta `/datos/mcp` le enchufa las
 * consultas reales.
 */
export type ProductoMcp = {
  slug: string;
  titulo: string;
  precio: string;
  tienda: string;
  tiendaSlug: string;
  pais: string | null;
  url: string;
  imagen: string | null;
};

export type FichaMcp = ProductoMcp & {
  descripcion: string | null;
  marca: string | null;
  categoria: string | null;
  existencias: number | null;
  seRetiraEn: string | null;
  direccion: string | null;
};

export type TiendaMcp = {
  slug: string;
  nombre: string;
  ciudad: string | null;
  pais: string | null;
  productos: number;
  url: string;
};

export type ServiciosMcp = {
  buscarProductos(
    consulta: string,
    pagina: number,
  ): Promise<{ productos: ProductoMcp[]; pagina: number; paginas: number }>;
  verProducto(slug: string): Promise<FichaMcp | null>;
  listarTiendas(): Promise<TiendaMcp[]>;
  verTienda(
    slug: string,
  ): Promise<{
    tienda: TiendaMcp & {
      descripcion: string | null;
      direccion: string | null;
    };
    productos: ProductoMcp[];
  } | null>;
};

export const HERRAMIENTAS_MCP = [
  {
    name: "buscar_productos",
    title: "Buscar productos",
    description:
      "Busca productos publicados en Mercatren por palabras, en español o inglés (con sinónimos regionales: «caucho» encuentra «llanta»). Devuelve título, precio, comercio, país de entrega y enlace a la ficha.",
    inputSchema: {
      type: "object",
      properties: {
        consulta: {
          type: "string",
          description:
            "Palabras a buscar, p. ej. «bicicleta» o «lámina de zinc».",
        },
        pagina: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "Tanda de 12 resultados.",
        },
      },
      required: ["consulta"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "ver_producto",
    title: "Ver un producto",
    description:
      "La ficha de un producto por su slug (el último tramo de la dirección /producto/<slug>): precio, comercio, dónde se retira o si se despacha en Estados Unidos, descripción y fotos.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Slug del producto, p. ej. «campus».",
        },
      },
      required: ["slug"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "listar_tiendas",
    title: "Listar comercios",
    description:
      "Los comercios activos en Mercatren con su ciudad, país de entrega y cuántos productos tienen.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "ver_tienda",
    title: "Ver un comercio",
    description:
      "La ficha de un comercio por su slug (/tienda/<slug>): descripción, ciudad, dirección y sus productos.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Slug del comercio, p. ej. «maxium».",
        },
      },
      required: ["slug"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
] as const;

const Peticion = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.unknown().optional(),
});

type Respuesta = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function error(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): Respuesta {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

function ok(id: string | number | null, result: unknown): Respuesta {
  return { jsonrpc: "2.0", id, result };
}

function textoDeProductos(productos: ProductoMcp[]): string {
  if (productos.length === 0) return "No hay productos que calcen.";
  return productos
    .map(
      (p) =>
        `- **${p.titulo}** — ${p.precio} · ${p.tienda}${p.pais === "US" ? " · se despacha en Estados Unidos" : ""} · ${p.url}`,
    )
    .join("\n");
}

async function llamarHerramienta(
  nombre: string,
  args: unknown,
  s: ServiciosMcp,
): Promise<{ texto: string; datos: unknown; esError?: boolean }> {
  switch (nombre) {
    case "buscar_productos": {
      const a = z
        .object({
          consulta: z.string().trim().min(1).max(200),
          pagina: z.number().int().min(1).max(200).optional(),
        })
        .safeParse(args ?? {});
      if (!a.success)
        return {
          texto: "Hace falta `consulta` (texto).",
          datos: { error: "parametros_invalidos" },
          esError: true,
        };
      const r = await s.buscarProductos(a.data.consulta, a.data.pagina ?? 1);
      return {
        texto: `${r.productos.length} resultados (tanda ${r.pagina} de ${r.paginas}) para «${a.data.consulta}»:\n\n${textoDeProductos(r.productos)}`,
        datos: r,
      };
    }
    case "ver_producto": {
      const a = z
        .object({ slug: z.string().trim().min(1).max(200) })
        .safeParse(args ?? {});
      if (!a.success)
        return {
          texto: "Hace falta `slug`.",
          datos: { error: "parametros_invalidos" },
          esError: true,
        };
      const f = await s.verProducto(a.data.slug);
      if (!f)
        return {
          texto: `No existe ningún producto con slug «${a.data.slug}».`,
          datos: { error: "no_existe" },
          esError: true,
        };
      const lineas = [
        `# ${f.titulo}`,
        `**Precio:** ${f.precio}`,
        `**Vendido por:** ${f.tienda} (${f.url.replace(/\/producto\/.*$/, "")}/tienda/${f.tiendaSlug})`,
        f.pais === "US"
          ? "**Entrega:** se despacha a domicilio en Estados Unidos, envío incluido en el precio."
          : `**Se retira en:** ${f.seRetiraEn ?? "el comercio (pregunta la dirección antes de pagar)"}${f.direccion ? ` — ${f.direccion}` : ""}`,
        f.marca ? `**Marca:** ${f.marca}` : null,
        f.categoria ? `**Categoría:** ${f.categoria}` : null,
        f.existencias !== null ? `**Existencias:** ${f.existencias}` : null,
        f.descripcion ? `\n${f.descripcion}` : null,
        `\nFicha: ${f.url}`,
      ].filter(Boolean);
      return { texto: lineas.join("\n"), datos: f };
    }
    case "listar_tiendas": {
      const tiendas = await s.listarTiendas();
      const texto = tiendas.length
        ? tiendas
            .map(
              (t) =>
                `- **${t.nombre}** — ${t.ciudad ?? "sin ciudad"}${t.pais === "US" ? " (Estados Unidos)" : ""} · ${t.productos} productos · ${t.url}`,
            )
            .join("\n")
        : "No hay comercios activos.";
      return { texto, datos: { tiendas } };
    }
    case "ver_tienda": {
      const a = z
        .object({ slug: z.string().trim().min(1).max(200) })
        .safeParse(args ?? {});
      if (!a.success)
        return {
          texto: "Hace falta `slug`.",
          datos: { error: "parametros_invalidos" },
          esError: true,
        };
      const r = await s.verTienda(a.data.slug);
      if (!r)
        return {
          texto: `No existe ningún comercio con slug «${a.data.slug}».`,
          datos: { error: "no_existe" },
          esError: true,
        };
      const t = r.tienda;
      const texto = [
        `# ${t.nombre}`,
        t.ciudad
          ? `**Ciudad:** ${t.ciudad}${t.pais === "US" ? " (Estados Unidos)" : ""}`
          : null,
        t.direccion ? `**Dirección:** ${t.direccion}` : null,
        t.descripcion ? `\n${t.descripcion}` : null,
        `\n**Productos (${t.productos}):**\n${textoDeProductos(r.productos)}`,
        `\nTienda: ${t.url}`,
      ]
        .filter(Boolean)
        .join("\n");
      return { texto, datos: r };
    }
    default:
      return {
        texto: `No existe la herramienta «${nombre}».`,
        datos: { error: "herramienta_desconocida" },
        esError: true,
      };
  }
}

/**
 * Atiende UN mensaje JSON-RPC. Devuelve `null` cuando no corresponde responder
 * (notificaciones), que el transporte traduce a un 202 vacío.
 */
export async function atenderMensajeMcp(
  mensaje: unknown,
  s: ServiciosMcp,
): Promise<Respuesta | null> {
  const p = Peticion.safeParse(mensaje);
  if (!p.success) {
    const id = (mensaje as { id?: string | number | null } | null)?.id ?? null;
    return error(
      id,
      -32600,
      'Petición inválida: hace falta jsonrpc "2.0" y method.',
    );
  }
  const { id = null, method, params } = p.data;
  const esNotificacion =
    method.startsWith("notifications/") || id === null || id === undefined;

  try {
    switch (method) {
      case "initialize": {
        const pedido = (params as { protocolVersion?: string } | undefined)
          ?.protocolVersion;
        const version =
          pedido && PROTOCOLOS_MCP_ADMITIDOS.includes(pedido)
            ? pedido
            : PROTOCOLO_MCP;
        return ok(id, {
          protocolVersion: version,
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: "mercatren",
            title: "Mercatren",
            version: VERSION_AGENTES,
          },
          instructions:
            "Catálogo de Mercatren en solo lectura. Usa buscar_productos para encontrar, ver_producto para la ficha (precio, comercio, dónde se retira o si se despacha en Estados Unidos), listar_tiendas y ver_tienda para los comercios. No inventes existencias ni plazos: usa lo que devuelven las herramientas.",
        });
      }
      case "ping":
        return ok(id, {});
      case "tools/list":
        return ok(id, { tools: HERRAMIENTAS_MCP });
      case "tools/call": {
        const c = z
          .object({ name: z.string(), arguments: z.unknown().optional() })
          .safeParse(params ?? {});
        if (!c.success) return error(id, -32602, "Hace falta params.name.");
        const r = await llamarHerramienta(c.data.name, c.data.arguments, s);
        return ok(id, {
          content: [{ type: "text", text: r.texto }],
          structuredContent: r.datos,
          ...(r.esError ? { isError: true } : {}),
        });
      }
      case "resources/list":
        return ok(id, { resources: [] });
      case "prompts/list":
        return ok(id, { prompts: [] });
      default:
        if (esNotificacion) return null;
        return error(id, -32601, `Método no admitido: ${method}`);
    }
  } catch (e) {
    console.error("[mcp] fallo atendiendo", method, e);
    if (esNotificacion) return null;
    return error(id, -32603, "Error interno del servidor.");
  }
}

/** Atiende el cuerpo entero de un POST (un mensaje o un lote). */
export async function atenderMcp(
  cuerpo: unknown,
  s: ServiciosMcp,
): Promise<{ estado: number; respuesta: unknown | null }> {
  if (Array.isArray(cuerpo)) {
    const respuestas = (
      await Promise.all(cuerpo.map((m) => atenderMensajeMcp(m, s)))
    ).filter((r): r is Respuesta => r !== null);
    return respuestas.length
      ? { estado: 200, respuesta: respuestas }
      : { estado: 202, respuesta: null };
  }
  const r = await atenderMensajeMcp(cuerpo, s);
  return r ? { estado: 200, respuesta: r } : { estado: 202, respuesta: null };
}
