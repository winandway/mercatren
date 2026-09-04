"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  facturasProveedor,
  pedidos,
  pedidosProveedor,
  renglonesProveedor,
  user,
} from "@/lib/db/schema";
import { idDeRegistro, revisar } from "@/lib/validacion/acciones";

/**
 * LA COLA DE «HAY QUE PAGARLE AL PROVEEDOR».
 *
 * Solo el equipo interno: aquí se ven enlaces que cobran de NUESTRA tarjeta y
 * el costo real de la mercancía — que es exactamente el número que un
 * comprador no debe ver nunca.
 */

type Resultado = { ok: boolean; mensaje: string };

export type CompraAlProveedor = {
  id: string;
  pedidoId: string;
  numero: string;
  estado: string;
  urlPago: string | null;
  costoCentavos: number | null;
  externoNumero: string | null;
  guia: string | null;
  ultimoError: string | null;
  creadoEn: Date | null;
  /** De quién es la venta. Va al lado del botón de cerrar: una prueba del
   *  equipo se cierra sin más; la de un cliente de verdad, jamás. */
  correoComprador: string | null;
  /** Qué se le pidió exactamente, con la variante elegida de cada renglón. */
  renglones: RenglonComprado[];
  /** La factura del proveedor, si ya se archivó. Es lo que respalda el costo. */
  factura: { numero: string | null; clave: string } | null;
};

/**
 * UN RENGLÓN DE LO QUE SE LE PIDIÓ AL PROVEEDOR.
 *
 * Se enseña ANTES de pagar porque, cuando un producto de CJ tiene tallas o
 * colores, **el comprador nunca eligió**: nuestra ficha lo publica como una
 * sola cosa. La elige el sistema, y quien va a pagar tiene que poder verlo y
 * cancelar si el color no era ese. Mandar la talla equivocada es una
 * devolución, y una devolución de un producto de $8 la pagamos nosotros.
 */
export type RenglonComprado = {
  id: string;
  titulo: string | null;
  varianteNombre: string | null;
  cantidad: number;
  varianteAutomatica: boolean;
  variantesTotales: number | null;
};

/** Lo que hay pendiente de comprar o de pagar, lo más viejo primero. */
export async function listarComprasAlProveedor(
  limite = 50,
): Promise<CompraAlProveedor[]> {
  try {
    await exigirEquipoInterno();
  } catch {
    return [];
  }

  const db = getDb();

  const filas = await db
    .select({
      id: pedidosProveedor.id,
      pedidoId: pedidosProveedor.pedidoId,
      numero: pedidos.numero,
      estado: pedidosProveedor.estado,
      urlPago: pedidosProveedor.urlPago,
      costoCentavos: pedidosProveedor.costoCentavos,
      externoNumero: pedidosProveedor.externoNumero,
      guia: pedidosProveedor.guia,
      ultimoError: pedidosProveedor.ultimoError,
      creadoEn: pedidosProveedor.creadoEn,
      /* DE QUIÉN ES ESTA COMPRA (4 sep 2026). Va al lado del botón de
         cerrar: una prueba del equipo se cierra sin más, la de un cliente
         de verdad lo dejaría pagando algo que nunca llega. Pantalla solo
         del equipo interno. */
      correoComprador: user.email,
    })
    .from(pedidosProveedor)
    .innerJoin(pedidos, eq(pedidos.id, pedidosProveedor.pedidoId))
    .leftJoin(user, eq(user.id, pedidos.clienteId))
    .orderBy(desc(pedidosProveedor.creadoEn))
    .limit(limite)
    .catch(() => []);

  if (filas.length === 0) return [];

  /* Una sola consulta para todos los renglones, no una por compra: con la cola
     llena serían cincuenta viajes a la base para pintar una pantalla. */
  const renglones = await db
    .select({
      id: renglonesProveedor.id,
      pedidoProveedorId: renglonesProveedor.pedidoProveedorId,
      titulo: renglonesProveedor.titulo,
      varianteNombre: renglonesProveedor.varianteNombre,
      cantidad: renglonesProveedor.cantidad,
      varianteAutomatica: renglonesProveedor.varianteAutomatica,
      variantesTotales: renglonesProveedor.variantesTotales,
    })
    .from(renglonesProveedor)
    .where(
      inArray(
        renglonesProveedor.pedidoProveedorId,
        filas.map((f) => f.id),
      ),
    )
    /* La tabla es nueva: una base todavía sin ella no puede tumbar la cola de
       pagos, que es lo único imprescindible de esta pantalla. */
    .catch(() => []);

  /* Las facturas ya archivadas, en una sola consulta como los renglones. */
  const facturas = await db
    .select({
      pedidoProveedorId: facturasProveedor.pedidoProveedorId,
      numero: facturasProveedor.numero,
      clave: facturasProveedor.clave,
    })
    .from(facturasProveedor)
    .where(
      inArray(
        facturasProveedor.pedidoProveedorId,
        filas.map((f) => f.id),
      ),
    )
    /* Tabla nueva: una base que todavía no la tenga no puede tumbar la cola de
       pagos, que es lo único imprescindible de esta pantalla. */
    .catch(() => []);

  return filas.map((f) => ({
    ...f,
    factura: facturas.find((x) => x.pedidoProveedorId === f.id)
      ? {
          numero:
            facturas.find((x) => x.pedidoProveedorId === f.id)?.numero ?? null,
          clave: facturas.find((x) => x.pedidoProveedorId === f.id)!.clave,
        }
      : null,
    renglones: renglones
      .filter((r) => r.pedidoProveedorId === f.id)
      .map(({ pedidoProveedorId: _, ...resto }) => resto),
  }));
}

/**
 * Las ventas ya pagadas por el cliente que TODAVÍA no se le compraron al
 * proveedor.
 *
 * Es la lista que de verdad importa: cada fila aquí es un comprador que pagó y
 * está esperando una caja que nadie ha pedido.
 */
export async function ventasSinComprar(): Promise<
  Array<{
    id: string;
    numero: string;
    totalCentavos: number;
    moneda: string;
    correoComprador: string | null;
  }>
> {
  try {
    await exigirEquipoInterno();
  } catch {
    return [];
  }

  const db = getDb();
  const { itemsPedido, productos, tiendas } = await import("@/lib/db/schema");

  /* Solo lo de Estados Unidos: lo de Venezuela lo despacha su comercio. */
  const candidatos = await db
    .selectDistinct({
      id: pedidos.id,
      numero: pedidos.numero,
      totalCentavos: pedidos.totalCentavos,
      moneda: pedidos.moneda,
      correoComprador: user.email,
    })
    .from(pedidos)
    .innerJoin(itemsPedido, eq(itemsPedido.pedidoId, pedidos.id))
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(user, eq(user.id, pedidos.clienteId))
    .where(
      and(
        inArray(pedidos.estado, ["pagado", "enviado"]),
        /* EL FILTRO DE PAÍS NO ES DECORATIVO: sin él, cada venta venezolana
           aparecería aquí como «hay que comprársela al proveedor», y alguien
           terminaría pagándole a CJ un producto que la ferretería ya despachó
           de su propio depósito. */
        eq(tiendas.paisOrigen, "US"),
      ),
    )
    .orderBy(desc(pedidos.creadoEn))
    .limit(100)
    .catch(() => []);

  if (candidatos.length === 0) return [];

  const yaComprados = new Set(
    (
      await db
        .select({ pedidoId: pedidosProveedor.pedidoId })
        .from(pedidosProveedor)
        .where(
          inArray(
            pedidosProveedor.pedidoId,
            candidatos.map((c) => c.id),
          ),
        )
        .catch(() => [])
    ).map((f) => f.pedidoId),
  );

  return candidatos.filter((c) => !yaComprados.has(c.id));
}

/**
 * QUÉ VARIANTES HAY, PARA ELEGIR ANTES DE COMPRAR.
 *
 * El panel llama a esto **primero**. Sin este paso la talla se elegía sola y
 * solo se veía después, con el pedido ya creado en CJ y sin forma de cambiarla.
 */
export async function variantesDeLaVenta(pedidoId: string) {
  try {
    await exigirEquipoInterno();
  } catch {
    return [];
  }

  const revisado = revisar(idDeRegistro, pedidoId);
  if (!revisado.ok) return [];

  const { variantesParaElegir } = await import("@/lib/cj/pedidos");
  return variantesParaElegir(revisado.datos);
}

/**
 * Dispara la compra al proveedor de un pedido.
 *
 * `elegidas` es `{ productoId: vid }` con lo que una persona eligió en el
 * panel. Manda sobre la elección automática — ver `cj/variantes.ts`.
 */
export async function comprarPedidoAlProveedor(
  pedidoId: string,
  elegidas?: Record<string, string>,
): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, pedidoId);
  if (!revisado.ok) return { ok: false, mensaje: "Ese pedido no existe." };

  const { comprarAlProveedor } = await import("@/lib/cj/pedidos");
  const r = await comprarAlProveedor(revisado.datos, elegidas);

  revalidatePath("/[locale]/panel/proveedor", "page");

  /* El mensaje dice cómo QUEDÓ, no cómo empezó: «no devolvió enlace» al
     lado de un pedido pagado con el saldo enseña a desconfiar del panel. */
  return r.ok
    ? {
        ok: true,
        mensaje: r.pagado
          ? "Pedido en el proveedor y PAGADO con el saldo. CJ despacha."
          : r.urlPago
            ? "Pedido creado en el proveedor. Ya puedes pagarlo."
            : "Pedido en el proveedor, por pagar: el saldo no alcanzó o CJ no dio enlace. Ábrelo en su panel.",
      }
    : { ok: false, mensaje: r.motivo };
}

/**
 * COMPROBAR EN EL PROVEEDOR CÓMO VA UNA COMPRA QUE YA EXISTE.
 *
 * Trae el costo real, **el envío**, el estado y la guía, y los guarda. Es lo
 * que se puede hacer cuando CJ creó el pedido pero no devolvió el enlace de
 * pago: volver a crearlo sería un SEGUNDO pedido, o sea pagar dos veces.
 */
export async function comprobarEnProveedor(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const db = getDb();

  const [fila] = await db
    .select({
      id: pedidosProveedor.id,
      numero: pedidos.numero,
      estado: pedidosProveedor.estado,
    })
    .from(pedidosProveedor)
    .innerJoin(pedidos, eq(pedidos.id, pedidosProveedor.pedidoId))
    .where(eq(pedidosProveedor.id, revisado.datos))
    .limit(1);

  if (!fila) return { ok: false, mensaje: "Esa compra no existe." };

  const { comoVaEnCj } = await import("@/lib/cj/pedidos");
  const r = await comoVaEnCj(fila.numero);

  if (!r.ok) return { ok: false, mensaje: r.motivo };

  /* Solo se escribe lo que CJ mandó de verdad: un `null` suyo no borra lo que
     ya teníamos. El costo de un pedido no se pierde porque una consulta viniera
     a medias. */
  const cambios: Record<string, unknown> = { actualizadoEn: new Date() };
  if (r.datos.costoCentavos !== null)
    cambios.costoCentavos = r.datos.costoCentavos;
  if (r.datos.guia) cambios.guia = r.datos.guia;
  if (r.datos.transportista) cambios.transportista = r.datos.transportista;

  await db
    .update(pedidosProveedor)
    .set(cambios)
    .where(eq(pedidosProveedor.id, fila.id));

  revalidatePath("/[locale]/panel/proveedor", "page");

  /* El envío se DICE aunque no se guarde: es el número que decide si la venta
     gana o pierde dinero, porque hoy entra como cero al fijar el precio. */
  const envio =
    r.datos.envioCentavos !== null
      ? ` · envío $${(r.datos.envioCentavos / 100).toFixed(2)}`
      : "";

  return {
    ok: true,
    mensaje: `El proveedor dice: ${r.datos.estado ?? "sin estado"}${envio}${
      r.datos.guia ? ` · guía ${r.datos.guia}` : ""
    }`,
  };
}

/**
 * DESCARTAR UNA COMPRA PARA PODER VOLVER A PEDIRLA.
 *
 * ══ POR QUÉ HACE FALTA (18 ago 2026) ══
 *
 * MT-000004 se creó en CJ con una talla **sin existencia en su almacén de
 * Estados Unidos**, y ahí no hay arreglo posible: el pedido se puede enviar a
 * preparación pero **la pantalla del pago lo rechaza**, una y otra vez. Desde
 * fuera parece un bucle.
 *
 * El candado de idempotencia —que está bien y protege dinero— impide volver a
 * pedirlo mientras la fila esté en «Por pagar». Esto la marca como fallida, con
 * el motivo escrito, para que se pueda pedir de nuevo con una talla que sí
 * tenga existencia.
 *
 * ══ NO BORRA NADA EN CJ, Y POR ESO AVISA ══
 *
 * Solo toca NUESTRO registro. El pedido sigue vivo allá hasta que alguien lo
 * cancele en su panel; si no se cancela y aquí se vuelve a pedir, quedan **dos
 * pedidos del mismo producto**. Por eso el aviso de la pantalla lo dice antes.
 */
/**
 * PAGAR CON EL SALDO DESDE EL PANEL (1 sep 2026).
 *
 * Para las compras «por pagar» sin enlace —las adoptadas y las que quedaron
 * atrapadas antes—: confirma el pedido en CJ si hace falta y lo cobra del
 * saldo. Es el botón que convierte «ábrelo en su panel y págalo ahí» en un
 * clic aquí.
 */
export async function pagarConSaldoDesdePanel(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const db = getDb();
  const [fila] = await db
    .select({
      id: pedidosProveedor.id,
      numero: pedidos.numero,
      estado: pedidosProveedor.estado,
    })
    .from(pedidosProveedor)
    .innerJoin(pedidos, eq(pedidos.id, pedidosProveedor.pedidoId))
    .where(eq(pedidosProveedor.id, revisado.datos))
    .limit(1);

  if (!fila) return { ok: false, mensaje: "Esa compra no existe." };
  if (fila.estado !== "por_pagar") {
    return {
      ok: false,
      mensaje: `Esta compra está «${fila.estado}», no por pagar.`,
    };
  }

  const { confirmarYPagarEnCj } = await import("@/lib/cj/pedidos");
  const r = await confirmarYPagarEnCj(db, fila.id, fila.numero);

  revalidatePath("/[locale]/panel/proveedor", "page");

  return r.pagado
    ? { ok: true, mensaje: "Pagado con el saldo de CJ. CJ despacha." }
    : { ok: false, mensaje: r.motivo ?? "El pago con saldo no salió." };
}

export async function descartarCompra(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const usuario = await obtenerUsuario();

  /* ══ PRIMERO SE BORRA EN CJ (1 sep 2026) ══
     Descartar solo aquí dejaba el pedido vivo allá: al «volver a pedir», la
     adopción encontraba el MISMO pedido atascado y no se avanzaba nunca.
     CJ deja borrar solo lo CREATED/IN_CART; si se niega, NO se descarta y
     se dice por qué — descartar aquí lo que allá sigue vivo es peor. */
  let notaCj = "";
  const [conCj] = await getDb()
    .select({ externoId: pedidosProveedor.externoId })
    .from(pedidosProveedor)
    .where(eq(pedidosProveedor.id, revisado.datos))
    .limit(1);
  if (conCj?.externoId) {
    const { llamarCj } = await import("@/lib/cj/cliente");
    const borrado = await llamarCj<unknown>(
      `/shopping/order/deleteOrder?orderId=${encodeURIComponent(conCj.externoId)}`,
      { metodo: "DELETE" },
    ).catch(() => ({ ok: false as const, motivo: "no contestó" }));
    /* Si CJ se niega a borrarlo (2 sep 2026: «Order delete fail»), la compra
       se cierra AQUÍ igual, con el motivo escrito. Dejar al dueño atrapado
       con un pedido que ni se paga ni se descarta es peor que un pedido sin
       pagar dormido en CJ: allá nunca se cobra, y si algún día se vuelve a
       pedir ESTE mismo número, la adopción lo encuentra antes de crear otro. */
    if (!borrado.ok) {
      notaCj = ` CJ no dejó borrarlo allá (${borrado.motivo}): queda sin pagar en su panel, no se cobra.`;
    }
  }

  /* `pagado` NO se descarta: si ya salió dinero, marcarla como fallida haría
     que alguien la volviera a pedir y a pagar. */
  const cambiadas = await getDb()
    .update(pedidosProveedor)
    .set({
      estado: "con_error",
      /* El motivo se escribe AQUÍ, no llega del navegador. Es un registro
         interno de la base —queda para siempre al lado de la compra— y lo que
         manda un cliente no puede acabar escrito en él tal cual. */
      ultimoError:
        `Descartada por ${usuario?.name ?? "el equipo"} para volver a pedirla.${notaCj}`.slice(
          0,
          300,
        ),
      urlPago: null,
      actualizadoEn: new Date(),
    })
    .where(
      and(
        eq(pedidosProveedor.id, revisado.datos),
        eq(pedidosProveedor.estado, "por_pagar"),
      ),
    )
    .returning({ id: pedidosProveedor.id });

  revalidatePath("/[locale]/panel/proveedor", "page");

  return cambiadas.length > 0
    ? { ok: true, mensaje: "Descartada. Ya puedes volver a pedirla." }
    : { ok: false, mensaje: "Solo se puede descartar una compra por pagar." };
}

/**
 * «Ya lo pagué»: lo marca quien abrió el enlace y pagó.
 *
 * Se guarda QUIÉN y CUÁNDO, igual que los retiros: el pago ocurre fuera del
 * sistema, en la pasarela del proveedor, así que lo único que podemos dejar es
 * la constancia de quién dice haberlo hecho.
 */
export async function marcarCompraPagada(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const usuario = await obtenerUsuario();
  const db = getDb();

  /* `por_pagar` va DENTRO del WHERE: dos clics seguidos no reescriben la fecha
     ni el autor del primero, que es el dato que sirve para auditar. */
  const cambiadas = await db
    .update(pedidosProveedor)
    .set({
      estado: "pagado",
      pagadoEn: new Date(),
      pagadoPorId: usuario?.id ?? null,
      actualizadoEn: new Date(),
    })
    .where(eq(pedidosProveedor.id, revisado.datos))
    .returning({ id: pedidosProveedor.id });

  revalidatePath("/[locale]/panel/proveedor", "page");

  return cambiadas.length > 0
    ? { ok: true, mensaje: "Marcado como pagado." }
    : { ok: false, mensaje: "Esa compra no existe." };
}

/**
 * ARCHIVAR LA FACTURA DEL PROVEEDOR.
 *
 * ══ POR QUÉ ESTE ARCHIVO Y NO EL PANEL DE CJ ══
 *
 * En una venta de Estados Unidos el vendedor es Mercatren LLC, así que **no
 * hay orden de compra a ningún comercio**: nadie se factura a sí mismo. Lo
 * único que respalda el costo de esa mercancía es la factura de quien de
 * verdad la vendió — el proveedor.
 *
 * Sin ella, el asiento del mes tiene el ingreso bruto y un costo sin papel
 * detrás. Eso no se arregla el día que lo pidan: los paneles de los
 * proveedores archivan sus documentos, cambian de dirección y cierran cuentas.
 * El día que haya que enseñarlo, o está en nuestro bucket o no está.
 *
 * ══ SOLO EL EQUIPO, Y SE GUARDA QUIÉN ══
 *
 * Un documento contable sin autor no defiende a nadie, igual que en los
 * retiros y en las pruebas de entrega.
 */
export async function archivarFacturaDelProveedor(
  _previo: unknown,
  datos: FormData,
): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, String(datos.get("compraId") ?? ""));
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const db = getDb();

  const [compra] = await db
    .select({ id: pedidosProveedor.id })
    .from(pedidosProveedor)
    .where(eq(pedidosProveedor.id, revisado.datos))
    .limit(1);

  if (!compra) return { ok: false, mensaje: "Esa compra no existe." };

  /* SI YA TIENE UNA, NO SE PISA. Reemplazarla en silencio dejaría el bucket
     con un archivo huérfano y el asiento respaldado por otro documento sin que
     nadie se entere. Corregir una factura archivada es un acto deliberado. */
  const [yaTiene] = await db
    .select({ clave: facturasProveedor.clave })
    .from(facturasProveedor)
    .where(eq(facturasProveedor.pedidoProveedorId, compra.id))
    .limit(1)
    .catch(() => []);

  if (yaTiene) {
    return {
      ok: false,
      mensaje: "Esa compra ya tiene su factura archivada.",
    };
  }

  const { subirDocumento } = await import("@/lib/subidas");
  const subida = await subirDocumento(
    datos.get("archivo"),
    `facturas-proveedor/${compra.id}`,
  );

  if (!subida.ok) return { ok: false, mensaje: subida.mensaje };

  const usuario = await obtenerUsuario();
  const numero = String(datos.get("numero") ?? "").trim();

  await db.insert(facturasProveedor).values({
    pedidoProveedorId: compra.id,
    /* El número es opcional a propósito: no todos los proveedores lo dan, y
       exigirlo dejaría la factura sin archivar por un campo que no existe. */
    numero: numero || null,
    clave: subida.clave,
    subidaPor: usuario?.id ?? null,
    subidaEn: new Date(),
  });

  revalidatePath("/[locale]/panel/proveedor", "page");
  return { ok: true, mensaje: "Factura archivada." };
}

/**
 * CERRAR UNA COMPRA QUE NO SE VA A PAGAR (4 sep 2026).
 *
 * ══ POR QUÉ HACÍA FALTA ══
 *
 * El dueño recibía el correo del vigilante cada seis horas por tres compras
 * que eran **pruebas suyas, pagadas con su propia tarjeta**: no hay a quién
 * devolverle nada y no se van a despachar. Sus palabras: «no nos interesa
 * continuar con esto… queremos que quede ya cerrado. Estoy mamado de que el
 * bot me mande mensaje de esto».
 *
 * «Descartar y volver a pedir» NO servía: deja la compra en `con_error`, y
 * ese estado **también alerta** — el correo seguía llegando igual. El estado
 * `cerrado` ya existía en el esquema («se resolvió por fuera») y no tenía
 * ningún botón que lo usara.
 *
 * ══ CERRAR NO ES BORRAR, Y NO DEVUELVE UN CENTAVO ══
 *
 * La fila se queda con su motivo y su autor: el día que alguien pregunte por
 * esa venta, ahí está. Y **no toca el cobro**: si hubiera que devolverle
 * dinero a alguien, eso es una devolución y tiene su propio camino. Por eso
 * la pantalla enseña el correo del comprador al lado del botón — cerrar la
 * compra de un cliente de verdad lo dejaría pagando algo que nunca llega.
 */
export async function cerrarCompraComoPrueba(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const usuario = await obtenerUsuario();

  /* Se intenta borrar en CJ para que no quede un pedido dormido en su panel.
     Si CJ se niega, se cierra AQUÍ igual y se dice: un pedido sin pagar allá
     no cobra nada, y dejar esto abierto de nuestro lado es lo que molesta. */
  let notaCj = "";
  const [conCj] = await getDb()
    .select({ externoId: pedidosProveedor.externoId })
    .from(pedidosProveedor)
    .where(eq(pedidosProveedor.id, revisado.datos))
    .limit(1);
  if (conCj?.externoId) {
    const { llamarCj } = await import("@/lib/cj/cliente");
    const borrado = await llamarCj<unknown>(
      `/shopping/order/deleteOrder?orderId=${encodeURIComponent(conCj.externoId)}`,
      { metodo: "DELETE" },
    ).catch(() => ({ ok: false as const, motivo: "no contestó" }));
    if (!borrado.ok) {
      notaCj = ` En CJ quedó sin pagar (${borrado.motivo}); ahí no se cobra nada.`;
    }
  }

  /* `pagado` y `enviado` NO se cierran: ahí ya salió dinero o mercancía, y
     taparlo dejaría al comprador esperando sin que nadie lo vea. */
  const cambiadas = await getDb()
    .update(pedidosProveedor)
    .set({
      estado: "cerrado",
      ultimoError:
        `Cerrada por ${usuario?.name ?? "el equipo"}: fue una prueba, no se compra ni se devuelve.${notaCj}`.slice(
          0,
          300,
        ),
      urlPago: null,
      actualizadoEn: new Date(),
    })
    .where(
      and(
        eq(pedidosProveedor.id, revisado.datos),
        inArray(pedidosProveedor.estado, ["por_pagar", "con_error"]),
      ),
    )
    .returning({ id: pedidosProveedor.id })
    .catch(() => []);

  if (cambiadas.length === 0) {
    return {
      ok: false,
      mensaje:
        "Esa compra ya está pagada o enviada: no se puede cerrar como prueba.",
    };
  }

  revalidatePath("/[locale]/panel/proveedor", "page");
  return { ok: true, mensaje: `Cerrada.${notaCj}` };
}

/**
 * CERRAR UNA VENTA QUE NO SE LE VA A COMPRAR AL PROVEEDOR (4 sep 2026).
 *
 * El vigilante avisa en rojo de toda venta pagada de CJ que no tenga pedido
 * al proveedor. Con una prueba del equipo eso es un rojo eterno: nadie va a
 * comprar nada y el aviso vuelve cada seis horas.
 *
 * Se cierra dejando la constancia donde el sistema la busca: **una fila de
 * compra en estado `cerrado`**, con su motivo. Así sale de la cola y del
 * correo sin tocar el pedido ni el cobro — el rastro de la venta se queda
 * intacto, que es lo que hay que poder enseñar si alguien pregunta.
 */
export async function cerrarVentaSinCompra(
  pedidoId: string,
): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, pedidoId);
  if (!revisado.ok) return { ok: false, mensaje: "Ese pedido no existe." };

  const db = getDb();
  const usuario = await obtenerUsuario();

  const [pedido] = await db
    .select({ id: pedidos.id, numero: pedidos.numero })
    .from(pedidos)
    .where(eq(pedidos.id, revisado.datos))
    .limit(1);
  if (!pedido) return { ok: false, mensaje: "Ese pedido no existe." };

  /* Si ya hay una compra viva para este pedido, esto no aplica: el camino es
     cerrar ESA compra, no crear otra fila. */
  const [yaHay] = await db
    .select({ id: pedidosProveedor.id })
    .from(pedidosProveedor)
    .where(eq(pedidosProveedor.pedidoId, pedido.id))
    .limit(1);
  if (yaHay) {
    return {
      ok: false,
      mensaje: "Ese pedido ya tiene una compra: ciérrala desde su tarjeta.",
    };
  }

  const ahora = new Date();
  await db.insert(pedidosProveedor).values({
    id: nanoid(),
    pedidoId: pedido.id,
    proveedor: "cj",
    estado: "cerrado",
    ultimoError:
      `Cerrada por ${usuario?.name ?? "el equipo"}: fue una prueba, no se le compra al proveedor.`.slice(
        0,
        300,
      ),
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  revalidatePath("/[locale]/panel/proveedor", "page");
  return { ok: true, mensaje: `${pedido.numero} cerrada.` };
}
