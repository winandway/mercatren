"use client";

import { useEffect } from "react";

/**
 * WEBMCP: las acciones del sitio, anunciadas al agente del NAVEGADOR.
 *
 * Si el navegador trae `navigator.modelContext` (la API WebMCP que está
 * probando Chrome), se le registran tres herramientas: buscar productos (por
 * la misma puerta que el buscador del sitio), abrir una ficha e ir a una
 * tienda. Si no la trae, no pasa nada: la función no existe y se sale. No toca
 * el carrito ni la sesión: un agente encuentra y navega; comprar sigue siendo
 * un acto de la persona.
 */
type ModelContext = {
  provideContext?: (ctx: { tools: unknown[] }) => unknown;
  registerTool?: (tool: unknown) => unknown;
};

export function WebMcp({ locale }: { locale: string }) {
  useEffect(() => {
    const mc = (navigator as unknown as { modelContext?: ModelContext })
      .modelContext;
    if (!mc) return;
    const tools = [
      {
        name: "buscar_productos",
        description:
          "Busca productos en Mercatren por palabras (español o inglés). Devuelve título, precio, comercio y dirección de la ficha.",
        inputSchema: {
          type: "object",
          properties: {
            consulta: {
              type: "string",
              description: "Qué buscar, p. ej. «bicicleta»",
            },
          },
          required: ["consulta"],
        },
        async execute({ consulta }: { consulta: string }) {
          const r = await fetch(
            `/datos/catalogo?q=${encodeURIComponent(consulta)}&todas=1&limite=12`,
          );
          const d = (await r.json()) as {
            productos?: {
              slug: string;
              tituloEs: string;
              tituloEn: string | null;
              precioCentavos: number;
              moneda: string;
              tiendaNombre: string;
              tiendaPais: string | null;
            }[];
          };
          return (d.productos ?? []).map((p) => ({
            titulo: (locale === "en" ? p.tituloEn : null) ?? p.tituloEs,
            precio: `${(p.precioCentavos / 100).toFixed(2)} ${p.moneda}`,
            comercio: p.tiendaNombre,
            entrega:
              p.tiendaPais === "US"
                ? "se despacha en Estados Unidos"
                : "se retira en el comercio (Venezuela)",
            url: `${location.origin}/${locale}/producto/${p.slug}`,
          }));
        },
      },
      {
        name: "abrir_producto",
        description: "Abre la ficha de un producto por su slug.",
        inputSchema: {
          type: "object",
          properties: { slug: { type: "string" } },
          required: ["slug"],
        },
        async execute({ slug }: { slug: string }) {
          location.assign(`/${locale}/producto/${encodeURIComponent(slug)}`);
          return { ok: true };
        },
      },
      {
        name: "ir_a_tienda",
        description: "Abre la tienda de un comercio por su slug.",
        inputSchema: {
          type: "object",
          properties: { slug: { type: "string" } },
          required: ["slug"],
        },
        async execute({ slug }: { slug: string }) {
          location.assign(`/${locale}/tienda/${encodeURIComponent(slug)}`);
          return { ok: true };
        },
      },
    ];
    try {
      if (typeof mc.provideContext === "function") mc.provideContext({ tools });
      else if (typeof mc.registerTool === "function")
        tools.forEach((t) => mc.registerTool!(t));
    } catch (e) {
      console.error("[webmcp] no se pudieron anunciar las herramientas:", e);
    }
  }, [locale]);
  return null;
}
