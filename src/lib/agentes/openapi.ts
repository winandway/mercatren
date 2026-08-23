import { recursosDe } from "@/lib/agentes/recursos";

/**
 * LA ESPECIFICACIÓN OPENAPI DE LO QUE SE PUEDE LLAMAR EN MERCATREN.
 *
 * Describe lo que YA existe y como de verdad se comporta (sale de las propias
 * rutas y de su documentación de cabecera, no de memoria): el catálogo público,
 * el buscador, el servidor MCP, la salud, y la API de socios con la que un
 * comercio cobra por enlace y sincroniza su catálogo desde su propio sistema.
 *
 * Los esquemas marcan `additionalProperties: true` donde la respuesta trae
 * más campos de los que aquí se prometen: describir de menos es honesto;
 * prometer un campo que no está es lo que rompe integraciones.
 */
export function openapiDeMercatren(base?: string) {
  const r = recursosDe(base);
  return {
    openapi: "3.1.0",
    info: {
      title: "Mercatren API",
      version: "1.0.0",
      summary:
        "Catálogo público, búsqueda, servidor MCP y la API de socios para cobrar por enlace y sincronizar catálogos.",
      description: `Mercatren es un marketplace operado por ${r.sociedad} (Michigan, Estados Unidos): compradores en Estados Unidos pagan con tarjeta o Zelle y la mercancía se retira en comercios de Venezuela o se despacha en Estados Unidos. Las rutas públicas no necesitan credenciales. Las rutas de socios usan un token de tienda (Bearer) que entrega el equipo de Mercatren al vincular la tienda.`,
      contact: { name: "Mercatren", email: r.contacto, url: r.comoFunciona },
      termsOfService: `${r.base}/es/terminos`,
    },
    servers: [{ url: r.base }],
    externalDocs: { description: "Documentación", url: r.docs },
    tags: [
      { name: "catalogo", description: "Lectura pública del catálogo." },
      { name: "agentes", description: "Servidor MCP y salud." },
      {
        name: "socios",
        description: "API para comercios y plataformas socias. Requiere token.",
      },
    ],
    components: {
      securitySchemes: {
        tokenDeTienda: {
          type: "http",
          scheme: "bearer",
          description:
            "Token de la tienda. Lo entrega el equipo de Mercatren al vincular la tienda (o la ruta /datos/socios/vincular con la llave de socio). Ver /auth.md.",
        },
        llaveDeSocio: {
          type: "http",
          scheme: "bearer",
          description:
            "Llave de una plataforma socia, acordada con el equipo de Mercatren.",
        },
      },
      schemas: {
        ProductoLista: {
          type: "object",
          additionalProperties: true,
          properties: {
            id: { type: "string" },
            slug: {
              type: "string",
              description: "La ficha vive en /{es|en}/producto/{slug}.",
            },
            tituloEs: { type: "string" },
            tituloEn: { type: ["string", "null"] },
            precioCentavos: {
              type: "integer",
              description: "Precio publicado, en centavos de la moneda.",
            },
            moneda: { type: "string", example: "USD" },
            existencias: { type: "number" },
            marca: { type: ["string", "null"] },
            tiendaNombre: { type: "string" },
            tiendaSlug: { type: "string" },
            tiendaPais: {
              type: ["string", "null"],
              description:
                "VE: se retira en Venezuela. US: se despacha en Estados Unidos.",
            },
            imagenUrl: { type: ["string", "null"] },
          },
        },
        Tanda: {
          type: "object",
          properties: {
            productos: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductoLista" },
            },
            pagina: { type: "integer" },
            paginas: { type: "integer" },
          },
        },
        CobroNuevo: {
          type: "object",
          required: ["monto", "referencia", "correo"],
          properties: {
            monto: {
              type: "number",
              description:
                "En dólares (45.90). También se acepta monto_centavos.",
            },
            referencia: {
              type: "string",
              description:
                "La referencia de la factura del comercio. Es lo que aparece en la conciliación.",
            },
            correo: {
              type: "string",
              format: "email",
              description:
                "A quién se le manda el enlace. Puede ser un tercero que paga por el cliente.",
            },
            nombre: { type: "string" },
            concepto: { type: "string", maxLength: 300 },
            dias: {
              type: "integer",
              minimum: 1,
              maximum: 15,
              default: 7,
              description: "Vigencia del enlace. Más de 15 se recorta a 15.",
            },
            modo: {
              type: "string",
              enum: ["comercio", "solo_mercatren"],
              description:
                "solo_mercatren: la página de pago no nombra al comercio.",
            },
            referencia_deuda: { type: "string", maxLength: 120 },
            deudor: {
              type: "string",
              description: "No sale a ninguna pantalla; rastro interno.",
            },
          },
        },
        Cobro: {
          type: "object",
          additionalProperties: true,
          properties: {
            referencia: { type: "string" },
            enlace: {
              type: "string",
              format: "uri",
              description: "La página donde se paga con tarjeta o Zelle.",
            },
            monto_centavos: { type: "integer" },
            estado: {
              type: "string",
              enum: ["abierto", "pagado", "cancelado", "vencido", "devuelto"],
            },
            metodo: {
              type: ["string", "null"],
              enum: ["tarjeta", "zelle", null],
            },
            en_revision: {
              type: "boolean",
              description: "Hay una captura de Zelle esperando validación.",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description:
                "Una clave corta en minúsculas, p. ej. peticion_invalida.",
            },
          },
          additionalProperties: true,
        },
      },
    },
    paths: {
      "/datos/catalogo": {
        get: {
          tags: ["catalogo"],
          summary:
            "Productos publicados, por tandas de 24, en el orden de la portada.",
          parameters: [
            {
              name: "pagina",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              name: "semilla",
              in: "query",
              schema: { type: "integer" },
              description: "Misma semilla = mismo orden entre tandas.",
            },
            {
              name: "todas",
              in: "query",
              schema: { type: "string", enum: ["1"] },
              description: "1 = sin el filtro de ciudad del visitante.",
            },
            {
              name: "categoria",
              in: "query",
              schema: { type: "string" },
              description: "Slug de departamento o categoría.",
            },
            {
              name: "q",
              in: "query",
              schema: { type: "string" },
              description:
                "Búsqueda por palabras, en español o inglés (con sinónimos).",
            },
            {
              name: "limite",
              in: "query",
              schema: { type: "integer", minimum: 4, maximum: 24 },
            },
          ],
          responses: {
            "200": {
              description: "La tanda.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Tanda" },
                },
              },
            },
          },
        },
      },
      "/datos/buscar": {
        get: {
          tags: ["catalogo"],
          summary:
            "Sugerencias mientras se escribe: productos y comercios que calzan.",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2 },
            },
          ],
          responses: {
            "200": {
              description: "Sugerencias.",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
      "/datos/google": {
        get: {
          tags: ["catalogo"],
          summary:
            "El catálogo entregable en Estados Unidos, en formato Google Shopping (RSS/XML).",
          responses: { "200": { description: "XML." } },
        },
      },
      "/datos/salud": {
        get: {
          tags: ["agentes"],
          summary: "Estado del servicio.",
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      servicio: { type: "string" },
                      hora: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/datos/mcp": {
        post: {
          tags: ["agentes"],
          summary:
            "Servidor MCP (Streamable HTTP, JSON-RPC 2.0). Herramientas de solo lectura sobre el catálogo.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          responses: {
            "200": { description: "Respuesta JSON-RPC." },
            "202": { description: "Notificación aceptada." },
          },
        },
      },
      "/datos/socios/vincular": {
        get: {
          tags: ["socios"],
          summary: "Describe la vinculación y las rutas disponibles.",
          responses: { "200": { description: "Información." } },
        },
        post: {
          tags: ["socios"],
          security: [{ llaveDeSocio: [] }],
          summary:
            "Vincula la tienda de una plataforma socia y devuelve el token de esa tienda.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["externo_id", "nombre"],
                  properties: {
                    externo_id: { type: "string" },
                    nombre: { type: "string", maxLength: 120 },
                    slug_existente: {
                      type: ["string", "null"],
                      description:
                        "La tienda que YA existe aquí; sin esto se crea una nueva.",
                    },
                  },
                  additionalProperties: true,
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Token de la tienda y cuántos productos ya hay aquí.",
            },
            "400": { description: "Petición inválida (dice qué campo)." },
            "401": { description: "Llave ausente o inválida." },
            "503": { description: "La vinculación no está configurada." },
          },
        },
      },
      "/datos/socios/cobro": {
        post: {
          tags: ["socios"],
          security: [{ tokenDeTienda: [] }],
          summary:
            "Crea un cobro por enlace: sale el correo con la página de pago (tarjeta o Zelle desde $200).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CobroNuevo" },
              },
            },
          },
          responses: {
            "200": {
              description: "El cobro, con su enlace.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Cobro" },
                },
              },
            },
            "400": {
              description: "Campo inválido.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": { description: "Token ausente o inválido." },
          },
        },
        get: {
          tags: ["socios"],
          security: [{ tokenDeTienda: [] }],
          summary:
            "Estado de un cobro, por id o por referencia. Permite marcar pagada la factura en el sistema del comercio.",
          parameters: [
            { name: "referencia", in: "query", schema: { type: "string" } },
            { name: "id", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "El cobro.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Cobro" },
                },
              },
            },
            "404": { description: "No existe o no es de esta tienda." },
          },
        },
      },
      "/datos/socios/cobro/reactivar": {
        post: {
          tags: ["socios"],
          security: [{ tokenDeTienda: [] }],
          summary:
            "Revive un cobro vencido conservando referencia y enlace. Uno pagado no revive.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["referencia"],
                  properties: {
                    referencia: { type: "string" },
                    dias: { type: "integer", minimum: 1, maximum: 15 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Reactivado." },
            "409": { description: "No reactivable (pagado o cancelado)." },
          },
        },
      },
      "/datos/socios/cobro/anular": {
        post: {
          tags: ["socios"],
          security: [{ tokenDeTienda: [] }],
          summary:
            "Cancela un cobro abierto o vencido. Uno pagado no se cancela (409).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["referencia"],
                  properties: {
                    referencia: { type: "string" },
                    motivo: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Cancelado (o ya estaba cancelado)." },
            "404": { description: "No existe o no es de esta tienda." },
            "409": { description: "Está pagado." },
          },
        },
      },
      "/datos/socios/productos": {
        post: {
          tags: ["socios"],
          security: [{ tokenDeTienda: [] }],
          summary:
            "Empuja el catálogo del comercio hacia Mercatren (entero o solo lo que cambió).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    completo: {
                      type: "boolean",
                      default: false,
                      description:
                        "true = viene el catálogo entero; solo así se retira lo ausente.",
                    },
                    productos: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: true,
                        properties: {
                          externo_id: { type: "string" },
                          title_es: { type: "string" },
                          title_en: { type: ["string", "null"] },
                          price: {
                            type: "number",
                            description:
                              "Precio BASE del comercio, en dólares.",
                          },
                          status: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Resumen: nuevos, actualizados, de baja, retirados, sin precio.",
            },
            "401": { description: "Token ausente o inválido." },
          },
        },
      },
      "/datos/socios/cambios": {
        get: {
          tags: ["socios"],
          security: [{ tokenDeTienda: [] }],
          summary:
            "Qué cambió en Mercatren desde una fecha (sin `desde`, el catálogo entero).",
          parameters: [
            {
              name: "desde",
              in: "query",
              schema: { type: "string", format: "date-time" },
            },
          ],
          responses: {
            "200": {
              description:
                "Los productos (precio BASE, nunca el publicado) y `completo`.",
            },
            "400": { description: "desde_invalido" },
          },
        },
      },
    },
  } as const;
}
