import { recursosDe, sha256Hex } from "@/lib/agentes/recursos";

/**
 * LOS SKILLS: instrucciones para que un agente sepa USAR Mercatren.
 *
 * Siguen el formato de agentskills.io (SKILL.md con frontmatter `name` y
 * `description`, y después las instrucciones). El índice (`index.json`) lleva
 * el SHA-256 del contenido de cada uno, así que si alguien cambia el texto sin
 * regenerar el índice, el resumen no cuadra y el agente lo nota. Aquí el
 * resumen se calcula al servir, del mismo texto: no pueden desincronizarse.
 */
export type Skill = {
  nombre: string;
  descripcion: string;
  cuerpo: (r: ReturnType<typeof recursosDe>) => string;
};

export const SKILLS: Skill[] = [
  {
    nombre: "comprar-en-mercatren",
    descripcion:
      "Cómo buscar productos, leer una ficha y entender cómo se paga y se entrega en Mercatren (marketplace: se paga en Estados Unidos, se retira en Venezuela o se despacha en Estados Unidos).",
    cuerpo: (r) => `# Comprar en Mercatren

Mercatren (${r.base}) es un marketplace operado por ${r.sociedad} (Michigan, Estados Unidos). Vende por cuenta propia: el comprador paga en dólares desde Estados Unidos (tarjeta, o Zelle a partir de $200) y la mercancía se retira en el comercio de Venezuela que la vende, o se despacha a domicilio cuando se entrega en Estados Unidos.

## Qué puedes hacer

1. **Buscar productos.** \`GET ${r.catalogo}?q=<palabras>&todas=1\` — en español o inglés, con sinónimos regionales («caucho» encuentra «llanta»). Respuesta: \`{ productos: [...], pagina, paginas }\`.
2. **Recorrer el catálogo.** \`GET ${r.catalogo}?pagina=N&semilla=S&todas=1\` (24 por tanda, misma semilla = mismo orden). Por departamento: \`&categoria=<slug>\`.
3. **Abrir una ficha.** \`${r.base}/es/producto/<slug>\` (o \`/en/\`). Con \`Accept: text/markdown\` la misma dirección devuelve la ficha en Markdown.
4. **Ver los comercios.** \`${r.tiendas}\` y \`${r.base}/es/tienda/<slug>\`.
5. **Servidor MCP** (Streamable HTTP, JSON-RPC 2.0) en \`${r.mcp}\` con las herramientas \`buscar_productos\`, \`ver_producto\`, \`listar_tiendas\` y \`ver_tienda\`. Tarjeta: ${r.tarjetaMcp}.

## Lo que debes decirle a la persona

- Cada ficha dice **dónde se retira** (ciudad y dirección del comercio) o que se despacha en Estados Unidos. No prometas entregas que la ficha no diga.
- El precio publicado es el final para tarjeta; por Zelle es un poco menor y solo desde $200.
- Para comprar hace falta cuenta; el pedido se sigue en \`${r.base}/es/pedidos\`.
- Lo que no sepas, pregúntalo en ${r.contacto}.

## Lo que no debes hacer

- No inventes existencias, plazos ni direcciones: usa lo que devuelve la API.
- No uses este sitio para mover dinero entre personas: aquí se compra mercancía.
`,
  },
  {
    nombre: "cobrar-por-mercatren",
    descripcion:
      "Cómo un comercio crea cobros por enlace (tarjeta o Zelle), consulta su estado, los reactiva o cancela, y sincroniza su catálogo, usando el token de su tienda.",
    cuerpo: (r) => `# Cobrar por Mercatren desde el sistema del comercio

Un comercio vinculado a Mercatren puede crear **cobros por enlace** desde su propio sistema: el cliente (o un familiar en Estados Unidos a quien se le reenvía el enlace) paga con tarjeta o por Zelle, y el comercio ve el cobro pagado en su panel.

## Credenciales

Toda ruta de socios lleva \`Authorization: Bearer <token de la tienda>\`. El token lo entrega el equipo de Mercatren al vincular la tienda (escribe a ${r.contacto}); una plataforma socia lo obtiene con su llave en \`POST ${r.base}/datos/socios/vincular\`. Detalle en ${r.authMd}.

## Crear un cobro

\`POST ${r.base}/datos/socios/cobro\`
\`\`\`json
{ "monto": 45.90, "referencia": "F-00123", "correo": "quien-paga@ejemplo.com", "nombre": "Nombre", "concepto": "Abono factura F-00123", "dias": 7 }
\`\`\`
Devuelve \`enlace\` (la página de pago) y \`referencia\`. El correo con el enlace sale solo. \`dias\`: 7 por defecto, máximo 15.

## Estado, reactivar, cancelar

- \`GET ${r.base}/datos/socios/cobro?referencia=F-00123\` → \`estado\` (abierto, pagado, cancelado, vencido, devuelto), \`metodo\`, \`en_revision\`.
- \`POST ${r.base}/datos/socios/cobro/reactivar\` \`{ "referencia": "F-00123" }\` → revive uno vencido con el MISMO enlace. Uno pagado no revive.
- \`POST ${r.base}/datos/socios/cobro/anular\` \`{ "referencia": "F-00123", "motivo": "..." }\` → cancela uno abierto o vencido; uno pagado devuelve 409.

## Sincronizar el catálogo

- \`POST ${r.base}/datos/socios/productos\` con \`{ completo, productos: [...] }\` (precio BASE del comercio).
- \`GET ${r.base}/datos/socios/cambios?desde=<ISO>\` → lo que cambió en Mercatren (precio base, nunca el publicado).

Especificación completa: ${r.openapi}.
`,
  },
];

/** El SKILL.md de uno, tal como se sirve. */
export function textoDeSkill(skill: Skill, base?: string): string {
  const r = recursosDe(base);
  return `---\nname: ${skill.nombre}\ndescription: ${skill.descripcion}\nlicense: CC-BY-4.0\n---\n\n${skill.cuerpo(r)}`;
}

export function buscarSkill(nombre: string): Skill | undefined {
  return SKILLS.find((s) => s.nombre === nombre);
}

/** El índice de skills (Agent Skills Discovery RFC v0.2.0), con el SHA-256 de cada uno. */
export async function indiceDeSkills(base?: string) {
  const r = recursosDe(base);
  const skills = await Promise.all(
    SKILLS.map(async (s) => ({
      name: s.nombre,
      type: "skill",
      description: s.descripcion,
      url: `${r.base}/.well-known/agent-skills/${s.nombre}/SKILL.md`,
      sha256: await sha256Hex(textoDeSkill(s, base)),
    })),
  );
  return {
    $schema: "https://agentskills.io/schemas/discovery-index-v0.2.0.json",
    version: "0.2.0",
    publisher: { name: r.nombre, url: r.base, contact: r.contacto },
    skills,
  };
}
