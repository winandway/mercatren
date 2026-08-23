import {
  PROTOCOLO_MCP,
  recursosDe,
  VERSION_AGENTES,
} from "@/lib/agentes/recursos";
import { HERRAMIENTAS_MCP } from "@/lib/agentes/mcp";

/**
 * LOS DOCUMENTOS DE DESCUBRIMIENTO, todos armados de la misma lista de
 * direcciones (`recursosDe`) para que no se contradigan.
 */

/** RFC 9727: /.well-known/api-catalog (application/linkset+json). */
export function catalogoDeApi(base?: string) {
  const r = recursosDe(base);
  return {
    linkset: [
      {
        anchor: `${r.base}/datos/`,
        "service-desc": [
          {
            href: r.openapi,
            type: "application/vnd.oai.openapi+json;version=3.1",
          },
        ],
        "service-doc": [{ href: r.docs, type: "text/html" }],
        "service-meta": [{ href: r.ard, type: "application/json" }],
        status: [{ href: r.salud, type: "application/json" }],
      },
      {
        anchor: r.mcp,
        "service-desc": [{ href: r.tarjetaMcp, type: "application/json" }],
        "service-doc": [
          {
            href: `${r.base}/.well-known/agent-skills/comprar-en-mercatren/SKILL.md`,
            type: "text/markdown",
          },
        ],
        status: [{ href: r.salud, type: "application/json" }],
      },
    ],
  };
}

/** SEP-1649: /.well-known/mcp/server-card.json */
export function tarjetaMcp(base?: string) {
  const r = recursosDe(base);
  return {
    $schema: "https://modelcontextprotocol.io/schemas/server-card.json",
    serverInfo: {
      name: "mercatren",
      title: "Mercatren",
      version: VERSION_AGENTES,
    },
    description: `Catálogo de Mercatren en solo lectura: buscar productos, leer una ficha, listar y ver comercios. Marketplace operado por ${r.sociedad}.`,
    protocolVersion: PROTOCOLO_MCP,
    transport: { type: "streamable-http", endpoint: r.mcp },
    authentication: { required: false },
    capabilities: { tools: { listChanged: false } },
    tools: HERRAMIENTAS_MCP.map((h) => ({
      name: h.name,
      description: h.description,
    })),
    documentation: r.docs,
    contact: r.contacto,
    homepage: r.base,
  };
}

/** RFC 9728: /.well-known/oauth-protected-resource — honesto: no hay servidor OAuth. */
export function recursoProtegido(base?: string) {
  const r = recursosDe(base);
  return {
    resource: `${r.base}/datos/socios`,
    resource_name: "Mercatren — API de socios",
    /* No hay servidor de autorización OAuth: el token lo entrega el equipo al
       vincular la tienda. Por eso la lista va vacía y el detalle está en auth.md. */
    authorization_servers: [],
    bearer_methods_supported: ["header"],
    scopes_supported: ["cobros", "catalogo"],
    resource_documentation: r.authMd,
    resource_policy_uri: `${r.base}/es/terminos`,
  };
}

/** auth.md (workos.com/auth-md): cómo se consigue acceso, en palabras normales. */
export function authMd(base?: string) {
  const r = recursosDe(base);
  return `# auth.md — Autenticación en Mercatren

## Resumen

- **Leer el catálogo no necesita credenciales.** \`${r.catalogo}\`, \`${r.buscar}\`, el servidor MCP \`${r.mcp}\` y las fichas en Markdown (\`Accept: text/markdown\`) son públicos.
- **La API de socios** (\`${r.base}/datos/socios/*\`: cobros por enlace y sincronización de catálogo) usa un **token de tienda** como \`Authorization: Bearer <token>\`.
- **No hay servidor OAuth/OIDC.** No se publican \`/.well-known/openid-configuration\` ni \`/.well-known/oauth-authorization-server\` porque no existen; publicarlos sería mentir. El recurso protegido sí se describe en ${r.recursoProtegido}.

## Cómo consigue un agente (o un comercio) su token

1. El comercio tiene que existir en Mercatren: se registra en ${r.vender} y crea su tienda.
2. El token de la tienda lo entrega el equipo de Mercatren al vincular la tienda con el sistema del comercio. Pídelo escribiendo a **${r.contacto}** con el nombre de la tienda y para qué se va a usar (cobros, catálogo o los dos).
3. Una **plataforma socia** (un sistema que opera muchas tiendas) obtiene el token de cada tienda con su llave de socio en \`POST ${r.base}/datos/socios/vincular\` (\`{ "externo_id", "nombre", "slug_existente" }\`).
4. Guarda el token en el servidor, nunca en el navegador. Se revoca desvinculando la tienda; para revocarlo o rotarlo, escribe a ${r.contacto}.

## Identidades y credenciales admitidas

| Tipo de identidad | Credencial | Alcance |
| --- | --- | --- |
| Tienda (comercio) | Token de tienda (Bearer) | Sus cobros y su catálogo, nunca los de otra tienda |
| Plataforma socia | Llave de socio (Bearer) | Vincular tiendas y obtener sus tokens |
| Comprador | Sesión en el sitio (cookie) | Su cuenta, su carrito y sus pedidos |

## Especificación y skills

- OpenAPI: ${r.openapi}
- Catálogo de la API (RFC 9727): ${r.catalogoApi}
- Skills: ${r.skills}
- Contacto: ${r.contacto}

---

# auth.md (English)

## Audience

AI agents and merchant systems that want to read the Mercatren catalog (no credentials needed) or use the partner API (payment links and catalog sync) on behalf of a store that exists on Mercatren.

## Registration

- **Public reads need no registration.** \`${r.catalogo}\`, \`${r.buscar}\`, the MCP server \`${r.mcp}\` and Markdown pages (\`Accept: text/markdown\`) are open.
- **A store (merchant) registers** at ${r.vender} and creates its store. Its API token is provisioned by the Mercatren team when the store is linked to the merchant's system: email **${r.contacto}** with the store name and the intended use (payments, catalog, or both).
- **A partner platform** (a system operating many stores) provisions store tokens with its partner key: \`POST ${r.base}/datos/socios/vincular\` with \`{ "externo_id", "nombre", "slug_existente" }\` returns the store token.
- There is no self-service, automated agent registration endpoint and **no OAuth/OIDC authorization server**; the protected resource metadata at ${r.recursoProtegido} lists no authorization servers on purpose.

## Credentials

- Type: **Bearer token** (store token or partner key), sent as \`Authorization: Bearer <token>\` on every request to \`${r.base}/datos/socios/*\`.
- Scope: a store token only reaches that store's payment links and catalog; a partner key only links stores.
- Storage: keep it server-side, never in a browser or a public repository.

## Supported methods

| Identity | Credential | Method |
| --- | --- | --- |
| Store (merchant) | Store token | \`Authorization: Bearer\` header |
| Partner platform | Partner key | \`Authorization: Bearer\` header, then \`POST /datos/socios/vincular\` |
| Shopper | Site session (cookie) | Sign in at ${r.base}/en/entrar |

## Revocation and rotation

Tokens are revoked by unlinking the store. To revoke or rotate a token, email ${r.contacto}.

## References

- OpenAPI: ${r.openapi}
- Protected resource metadata (RFC 9728): ${r.recursoProtegido}
- Skills: ${r.skills}
`;
}

/**
 * ARD (Agentic Resource Discovery): /.well-known/ai-catalog.json
 *
 * Con los nombres del esquema oficial (ai-catalog.schema.json): `host` con
 * `displayName` e `identifier` (did:web), y cada entrada con `identifier`
 * (urn:air:<dominio>:<espacio>:<nombre>), `displayName`, `type` (tipo IANA) y
 * exactamente UNA de `url` o `data`, más 2–5 `representativeQueries`. Medido el
 * 23 ago 2026: con `id` en vez de `identifier` el medidor daba «0 entradas
 * válidas».
 */
export function catalogoArd(base?: string) {
  const r = recursosDe(base);
  const dominio = new URL(r.base).hostname;
  const urn = (espacio: string, nombre: string) =>
    `urn:air:${dominio}:${espacio}:${nombre}`;
  return {
    specVersion: "1.0",
    host: {
      displayName: r.nombre,
      identifier: `did:web:${dominio}`,
      documentationUrl: r.docs,
      description: `Marketplace operado por ${r.sociedad}: se paga en Estados Unidos con tarjeta o Zelle y la mercancía se retira en comercios de Venezuela o se despacha en Estados Unidos.`,
    },
    entries: [
      {
        identifier: urn("mcp", "catalogo"),
        displayName: "Mercatren MCP (catálogo en solo lectura)",
        description:
          "Servidor MCP con herramientas para buscar productos, leer fichas y ver comercios. La tarjeta describe el transporte (Streamable HTTP) y el endpoint.",
        type: "application/mcp-server-card+json",
        url: r.tarjetaMcp,
        tags: ["mcp", "catalogo", "marketplace", "venezuela", "estados-unidos"],
        capabilities: [
          "buscar_productos",
          "ver_producto",
          "listar_tiendas",
          "ver_tienda",
        ],
        representativeQueries: [
          "busca bicicletas en Mercatren",
          "qué comercios venden en El Vigía",
          "cuánto cuesta la lámina de zinc de MAXIUM",
          "muéstrame los productos de Variedades COLOMBIA NEXT",
        ],
        version: VERSION_AGENTES,
      },
      {
        identifier: urn("openapi", "mercatren"),
        displayName: "Mercatren API (OpenAPI 3.1)",
        description:
          "Catálogo público, búsqueda, salud y la API de socios para cobrar por enlace y sincronizar catálogos.",
        type: "application/vnd.oai.openapi+json",
        url: r.openapi,
        tags: ["openapi", "api", "cobros", "catalogo"],
        representativeQueries: [
          "crea un cobro por enlace de $45.90 con referencia F-00123",
          "qué estado tiene el cobro F-00123",
          "lista los productos publicados",
        ],
        version: VERSION_AGENTES,
      },
      {
        identifier: urn("skills", "indice"),
        displayName: "Skills para agentes",
        description:
          "Instrucciones para comprar en Mercatren y para cobrar por Mercatren desde el sistema de un comercio.",
        type: "application/json",
        url: r.skills,
        tags: ["skills", "agentskills"],
        representativeQueries: [
          "cómo se compra en Mercatren",
          "cómo cobra un comercio por enlace",
        ],
      },
      {
        identifier: urn("feed", "google-shopping"),
        displayName: "Catálogo entregable en Estados Unidos (Google Shopping)",
        description:
          "RSS/XML con los productos que se despachan en Estados Unidos, con precio y enlace.",
        type: "application/rss+xml",
        url: r.feedGoogle,
        tags: ["feed", "google-shopping", "estados-unidos"],
        representativeQueries: [
          "productos con envío gratis a Estados Unidos",
          "feed de productos de Mercatren",
        ],
      },
      {
        identifier: urn("texto", "llms"),
        displayName: "llms.txt",
        description:
          "Resumen del sitio para asistentes: qué es, cómo funciona, comercios y enlaces.",
        type: "text/plain",
        url: r.llms,
        tags: ["llms-txt"],
        representativeQueries: ["qué es Mercatren", "cómo funciona Mercatren"],
      },
      {
        identifier: urn("texto", "sitemap"),
        displayName: "Mapa del sitio",
        description:
          "Todas las páginas públicas, comercios y productos, en los dos idiomas.",
        type: "application/xml",
        url: r.sitemap,
        tags: ["sitemap"],
        representativeQueries: [
          "lista de páginas de Mercatren",
          "todas las fichas de producto y comercios publicados",
        ],
      },
    ],
  };
}
