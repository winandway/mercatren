"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { productos } from "@/lib/db/schema";
import { esDepartamentoReal } from "@/lib/cj/rubros";
import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";
import { plazaDelMercado } from "@/lib/cj/plazas";
import { tiendaDelRubro } from "@/lib/cj/guardar";

/**
 * AGREGAR UN PRODUCTO DE CJ AL CATÁLOGO DE ESTADOS UNIDOS.
 *
 * ══ CUELGA DE UNA TIENDA INTERNA NUESTRA ══
 *
 * `productos.tiendaId` es obligatorio, y eso resulta ser lo correcto aquí: en
 * Estados Unidos **Mercatren LLC es quien vende y factura**, no un tercero. El
 * producto cuelga de una tienda nuestra con `paisOrigen: "US"`, y de ahí sale
 * su destino sin necesidad de una columna nueva.
 *
 * Es además lo que Merchant Center necesita: un solo vendedor responsable, con
 * una política de envío y una de devoluciones. Un mercado de terceros habría
 * que demostrarlo tienda por tienda.
 *
 * ══ SE GUARDA DE DÓNDE VINO ══
 *
 * `fuenteId` = `cj` y `externoId` = el id del producto en CJ. La pareja
 * (tienda, externoId) ya es única en el esquema, así que volver a agregar el
 * mismo producto **actualiza** en vez de duplicar — igual que el importador de
 * catálogo que ya existe. Sin eso, la segunda pasada llenaría el catálogo de
 * copias.
 *
 * ══ SE PUBLICA AL AGREGARLO, Y CAE EN SU DEPARTAMENTO ══
 *
 * Antes entraba en borrador. La intención era buena —una ficha de dos líneas en
 * inglés es media suspensión en Merchant Center— pero en borrador **no se ve en
 * la tienda**, y entonces el catálogo se arma a ciegas: veinte productos
 * elegidos y una tienda que sigue vacía.
 *
 * El departamento se calcula de la categoría que ya trae CJ (ver
 * `cj/departamento.ts`) y se ve en la tarjeta antes de pulsar el botón, para
 * corregir ahí el que caiga mal y no en una revisión de trescientos.
 *
 * Lo de Merchant Center sigue pendiente y se atiende donde de verdad está: en
 * el archivo que se le manda a Google, no en la tienda. Falta la descripción
 * propia y el título en español.
 */

import { guardarProducto } from "@/lib/cj/guardar-producto";

type Resultado = { ok: boolean; mensaje: string };

export async function agregarProductoDeCj(
  formulario: FormData,
): Promise<Resultado> {
  const quien = await exigirEquipoInterno()
    .then(() => true)
    .catch(() => false);

  if (!quien) {
    return { ok: false, mensaje: "Esta parte es solo para el equipo." };
  }

  const { obtenerUsuario } = await import("@/lib/autorizacion");
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: "Hace falta una sesión." };

  const externoId = String(formulario.get("id") ?? "").trim();
  const nombre = String(formulario.get("nombre") ?? "").trim();
  const imagen = String(formulario.get("imagen") ?? "").trim();
  const sku = String(formulario.get("sku") ?? "").trim();
  const costoCentavos = Number(formulario.get("costo") ?? 0);
  const existencias = Number(formulario.get("existencias") ?? 0);

  /**
   * EL DEPARTAMENTO SE COMPRUEBA CONTRA LA LISTA, no se guarda tal cual.
   *
   * Llega calculado desde la pantalla —para que se vea antes de pulsar— pero
   * `productos.categoria_id` tiene una llave foránea: un slug que no exista
   * haría fallar el guardado entero. Se compara contra la lista real y, si no
   * está, el producto entra sin departamento en vez de no entrar.
   */
  const pedido = String(formulario.get("departamento") ?? "").trim();
  const departamento = DEPARTAMENTOS.some((d) => d.slug === pedido)
    ? pedido
    : null;

  if (
    !externoId ||
    !nombre ||
    !Number.isFinite(costoCentavos) ||
    costoCentavos <= 0
  ) {
    return { ok: false, mensaje: "Ese producto llegó incompleto de CJ." };
  }

  /**
   * ══ LA PLAZA LA DECIDE EL SELECTOR DEL PANEL (27 ago 2026) ══
   *
   * Con el selector en Chile, el producto entra a mercatren.cl con precio en
   * pesos; en Colombia, a .com.co. Es el mismo botón de siempre — el equipo
   * no aprende nada nuevo, y la pantalla dice a dónde va ANTES de pulsar.
   */
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const plaza = plazaDelMercado(await mercadoDelPanel());

  try {
    return await guardarProducto({
      plaza,
      propietarioId: usuario.id,
      externoId,
      nombre,
      imagen,
      sku,
      costoCentavos,
      existencias,
      departamento,
    });
  } catch (fallo) {
    /**
     * ══ EL MOTIVO SE DICE, NO SE ESCONDE ══
     *
     * Sin esto, un fallo de la base sale como «Error del servidor» y hay que
     * adivinar entre la llave foránea, una columna que falta y un permiso.
     * Ya se perdió una noche así con el botón de agregar.
     *
     * Aquí se puede enseñar entero porque esta pantalla es **solo del equipo
     * interno**: no hay un comprador del otro lado a quien filtrarle nada.
     */
    console.error("[cj] no se pudo guardar el producto:", fallo);
    const motivo = fallo instanceof Error ? fallo.message : String(fallo);
    return { ok: false, mensaje: `No se pudo guardar: ${motivo}` };
  }
}

/**
 * REPARTIR EN SUS TIENDAS LO QUE YA ESTÁ CARGADO.
 *
 * Los productos que entraron antes de que existieran las tiendas por rubro
 * cuelgan todos de la general. Esto los mueve a la que les toca, creando cada
 * tienda a su paso.
 *
 * ══ MUEVE, NO COPIA NI BORRA ══
 *
 * Se cambia la tienda del producto y nada más: **conserva su dirección web, sus
 * fotos, su precio y su historial**. Un producto que ya está en Google no puede
 * cambiar de dirección sin perder lo que tenía.
 *
 * ══ SE PUEDE VOLVER A PULSAR ══
 *
 * Solo mira los que siguen en la general, así que repetirlo no hace nada. Un
 * botón que hay que pulsar una sola vez y exactamente una es un botón que
 * alguien va a pulsar dos veces.
 */
export async function repartirCatalogoUs(): Promise<{
  ok: boolean;
  mensaje: string;
  movidos?: number;
  sinRubro?: number;
}> {
  const permitido = await exigirEquipoInterno()
    .then(() => true)
    .catch(() => false);

  if (!permitido) {
    return { ok: false, mensaje: "Esta parte es solo para el equipo." };
  }

  const { obtenerUsuario } = await import("@/lib/autorizacion");
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: "Hace falta una sesión." };

  /* La plaza del selector: con el panel en Chile se reparte la general
     chilena entre sus rubros, no la americana. */
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const plaza = plazaDelMercado(await mercadoDelPanel());

  try {
    const db = getDb();

    const pendientes = await db
      .select({ id: productos.id, categoriaId: productos.categoriaId })
      .from(productos)
      .where(eq(productos.tiendaId, plaza.tiendaGeneral.id));

    let movidos = 0;
    let sinRubro = 0;

    for (const p of pendientes) {
      /* El departamento se guarda como `dep-<slug>`; se le quita el prefijo
         para volver al slug, que es lo que conoce `tiendaDeRubro`. */
      const departamento = p.categoriaId?.startsWith("dep-")
        ? p.categoriaId.slice(4)
        : null;

      if (!departamento || !esDepartamentoReal(departamento)) {
        sinRubro += 1;
        continue;
      }

      const destino = await tiendaDelRubro(departamento, usuario.id, plaza);
      if (destino === plaza.tiendaGeneral.id) {
        sinRubro += 1;
        continue;
      }

      await db
        .update(productos)
        .set({ tiendaId: destino, actualizadoEn: new Date() })
        .where(eq(productos.id, p.id));

      movidos += 1;
    }

    revalidatePath("/[locale]/panel", "layout");
    revalidatePath("/[locale]", "layout");

    return {
      ok: true,
      mensaje: `Repartidos ${movidos}. ${sinRubro} se quedaron en la tienda general por no tener departamento reconocido.`,
      movidos,
      sinRubro,
    };
  } catch (fallo) {
    console.error("[cj] no se pudo repartir el catálogo:", fallo);
    const motivo = fallo instanceof Error ? fallo.message : String(fallo);
    return { ok: false, mensaje: `No se pudo repartir: ${motivo}` };
  }
}
