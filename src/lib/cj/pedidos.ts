import "server-only";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { llamarCj, cjConfigurado } from "@/lib/cj/cliente";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pedidos,
  pedidosProveedor,
  productos,
} from "@/lib/db/schema";

/**
 * COMPRARLE AL PROVEEDOR LO QUE UN CLIENTE NOS COMPRÓ.
 *
 * ══ POR QUÉ NO SE PAGA SOLO, Y POR QUÉ IGUAL VALE LA PENA ══
 *
 * Comprobado en la documentación de CJ el 16 ago 2026: **su API no puede
 * cobrar una tarjeta guardada.** Sus formas de pago son `payBalance`,
 * `payBalanceV2` y `payType=2`, y las tres descuentan del saldo de la
 * billetera — que solo se recarga por Payoneer o transferencia, con tres días
 * de espera. No existe tokenización de tarjeta.
 *
 * Pero con `payType=1` CJ devuelve un **enlace de pago** (`cjPayUrl`). Y ahí
 * está la salida: todo lo pesado se automatiza —crear el pedido con la
 * dirección del comprador, sus renglones, sus cantidades— y lo único humano es
 * abrir ese enlace y pagar con tarjeta. Diez segundos, sin buscar el producto,
 * sin copiar direcciones, sin equivocarse de variante y **sin cargar
 * billetera**.
 *
 * La diferencia con «comprar a mano» no es de matiz: a mano hay que encontrar
 * el producto entre miles, transcribir una dirección —que es donde se pierden
 * los paquetes— y elegir la variante correcta. Aquí eso ya está hecho.
 *
 * ══ SE PIDE POR SKU, NO POR VARIANTE ══
 *
 * La API acepta `vid` o `sku`, y exige al menos uno. Guardamos el SKU de CJ al
 * importar, así que se pide por ahí y no hace falta una tabla más de variantes
 * del proveedor.
 *
 * ══ ESTO NUNCA TUMBA UNA VENTA ══
 *
 * Si CJ no contesta, el pedido de nuestro cliente sigue pagado y entregado a
 * su suerte: se anota el error, se ve en el panel y se reintenta. Un fallo del
 * proveedor no puede deshacer un cobro que ya ocurrió.
 */

/** Lo que CJ devuelve al crear un pedido. */
type RespuestaPedidoCj = {
  orderId?: string;
  orderNumber?: string;
  cjPayUrl?: string;
  orderAmount?: number | string;
  orderStatus?: string;
};

export type ResultadoCompra =
  | { ok: true; id: string; urlPago: string | null; externoId: string | null }
  | { ok: false; motivo: string };

/** Dólares a centavos enteros, sin perder el centavo en coma flotante. */
function aCentavos(valor: number | string | undefined): number | null {
  if (valor === undefined || valor === null) return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Math.round(Number((n * 100).toPrecision(12)));
}

/**
 * El transporte que se le pide a CJ.
 *
 * Va como constante y no adivinando: si el nombre no existe, CJ rechaza el
 * pedido entero, y su mensaje se enseña tal cual para poder corregirlo en un
 * minuto en vez de a ciegas. Se ajusta cuando las compras de prueba digan cuál
 * usa de verdad el almacén de Estados Unidos.
 */
const TRANSPORTE = "USPS+";

/** Desde dónde despacha. El almacén de EE. UU. es el que hace el plazo corto. */
const DESDE = "US";

/**
 * Crea en CJ la compra que corresponde a un pedido nuestro.
 *
 * Es idempotente por `pedidoId`: si ya hay una compra viva para ese pedido no
 * se crea otra. Sin eso, dos clics seguidos —o un reintento— comprarían el
 * producto dos veces, y eso es dinero de verdad saliendo dos veces.
 */
export async function comprarAlProveedor(
  pedidoId: string,
): Promise<ResultadoCompra> {
  if (!cjConfigurado()) {
    return { ok: false, motivo: "Falta CJ_API_KEY en el panel del sitio." };
  }

  const db = getDb();

  const [yaHay] = await db
    .select({ id: pedidosProveedor.id, estado: pedidosProveedor.estado })
    .from(pedidosProveedor)
    .where(eq(pedidosProveedor.pedidoId, pedidoId))
    .limit(1);

  if (yaHay && yaHay.estado !== "con_error") {
    return {
      ok: false,
      motivo: "Este pedido ya se le compró al proveedor.",
    };
  }

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      /* La entrega va como JSON en una sola columna desde el primer pedido.
         Se lee con cuidado: un pedido viejo puede no traer todos los campos. */
      entrega: pedidos.direccionEntrega,
      telefono: pedidos.telefonoContacto,
      pais: pedidos.paisDestino,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .limit(1);

  if (!pedido) return { ok: false, motivo: "Ese pedido no existe." };

  const entrega = (pedido.entrega ?? {}) as Partial<{
    nombre: string;
    pais: string;
    ciudad: string;
    direccion: string;
    direccion2?: string | null;
    estado?: string | null;
    codigoPostal?: string | null;
    referencia: string | null;
  }>;

  /**
   * SIN DIRECCIÓN NO SE COMPRA, Y SE DICE CUÁL FALTA.
   *
   * El checkout de hoy está hecho para el retiro en depósito de Venezuela y
   * deja la calle opcional. Mandarle a CJ un pedido sin calle es pagar por un
   * paquete que no llega a ninguna parte — y eso no se recupera.
   */
  /* El estado y el código postal entran en la lista de lo que falta: sin
     estado CJ rechaza el pedido, y sin código postal el transportista entrega
     a ciegas. Antes ni se miraban porque no existían en el formulario. */
  const faltan = [
    !entrega.nombre && "el nombre de quien recibe",
    !entrega.direccion && "la dirección",
    !entrega.estado && "el estado",
    !entrega.codigoPostal && "el código postal",
    !entrega.ciudad && "la ciudad",
  ].filter(Boolean);

  if (faltan.length > 0) {
    return {
      ok: false,
      motivo: `A este pedido le falta ${faltan.join(", ")}. No se puede despachar así.`,
    };
  }

  /* Solo los renglones que surte CJ: un pedido podría mezclar, y lo de
     Venezuela lo despacha su propio comercio. */
  const renglones = await db
    .select({
      sku: productos.sku,
      titulo: productos.tituloEs,
      cantidad: itemsPedido.cantidad,
    })
    .from(itemsPedido)
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .where(eq(itemsPedido.pedidoId, pedidoId));

  const delProveedor = renglones.filter((r) => r.sku);
  if (delProveedor.length === 0) {
    return {
      ok: false,
      motivo: "Este pedido no tiene productos del proveedor.",
    };
  }

  const id = `prov-${nanoid(12)}`;
  const ahora = new Date();

  /**
   * `payType: 1` ES LA CLAVE DE TODO ESTO.
   *
   * Con 2 (saldo) haría falta billetera cargada. Con 3 el pedido se crea sin
   * pagar y sin enlace, y habría que buscarlo a mano en el panel de CJ. Con 1
   * nos devuelve la dirección de pago, que es justo lo que convierte esto en
   * un botón.
   */
  const respuesta = await llamarCj<RespuestaPedidoCj>(
    "/shopping/order/createOrderV3",
    {
      metodo: "POST",
      cuerpo: {
        /* NUESTRO número de pedido: es lo que permite atar su pedido con el
           nuestro cuando haya que reclamar algo semanas después. */
        orderNumber: pedido.numero,
        shippingCountryCode: "US",
        shippingCountry: pedido.pais || entrega.pais || "United States",
        /**
         * EL ESTADO, DE VERDAD (18 ago 2026).
         *
         * Hasta hoy iba `entrega.referencia` —una casilla prestada que va
         * vacía— porque el checkout no tenía dónde pedirlo. Y
         * `shippingProvince` es OBLIGATORIO en la API de CJ: el pedido se
         * habría rechazado aunque el comprador pagara.
         *
         * Ahora sale del formulario, elegido de una lista, en código de dos
         * letras — que es lo que CJ compara contra su tabla.
         */
        shippingProvince: entrega.estado || entrega.referencia || "",
        shippingZip: entrega.codigoPostal || "",
        shippingCity: entrega.ciudad!,
        shippingAddress: entrega.direccion!,
        shippingAddress2: entrega.direccion2 || "",
        shippingCustomerName: entrega.nombre!,
        shippingPhone: pedido.telefono || "",
        logisticName: TRANSPORTE,
        fromCountryCode: DESDE,
        payType: 1,
        products: delProveedor.map((r) => ({
          sku: r.sku,
          quantity: Math.max(1, Math.round(Number(r.cantidad))),
        })),
      },
    },
  );

  if (!respuesta.ok) {
    /* El fallo se GUARDA, no solo se devuelve: un pedido que no se pudo
       comprar tiene que verse en el panel, o el comprador se queda esperando
       una caja que nadie pidió y nadie se entera. */
    await db
      .insert(pedidosProveedor)
      .values({
        id,
        pedidoId,
        proveedor: FUENTE_CJ,
        estado: "con_error",
        ultimoError: respuesta.motivo.slice(0, 300),
        creadoEn: ahora,
        actualizadoEn: ahora,
      })
      .onConflictDoNothing()
      .catch(() => undefined);

    return { ok: false, motivo: respuesta.motivo };
  }

  const datos = respuesta.datos ?? {};
  const urlPago = datos.cjPayUrl?.trim() || null;

  await db.insert(pedidosProveedor).values({
    id,
    pedidoId,
    proveedor: FUENTE_CJ,
    estado: "por_pagar",
    externoId: datos.orderId ?? null,
    externoNumero: datos.orderNumber ?? null,
    urlPago,
    costoCentavos: aCentavos(datos.orderAmount),
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* El aviso va después de guardar y en su propio try: si el correo falla, la
     compra ya está creada y el enlace vive en el panel. */
  try {
    const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
    const { SITIO } = await import("@/lib/sitio");
    const costo = aCentavos(datos.orderAmount);

    await correoAvisoAlEquipo({
      asunto: `Pagar al proveedor · ${pedido.numero}`,
      lineas: [
        `${pedido.numero} · ${delProveedor.length} producto(s)${costo !== null ? ` · ${(costo / 100).toFixed(2)} USD` : ""}`,
        urlPago
          ? "Toca el botón, paga con tarjeta y CJ despacha. No hace falta saldo."
          : "CJ no devolvió enlace de pago. Hay que abrirlo en su panel.",
      ],
      url: urlPago ?? `${SITIO.url}/es/panel/proveedor`,
      boton: urlPago ? "Pagar este pedido" : "Ver en el panel",
    });
  } catch (fallo) {
    console.error("[cj] compra creada; el aviso no salio:", fallo);
  }

  return { ok: true, id, urlPago, externoId: datos.orderId ?? null };
}

/**
 * ¿Este pedido lo surte el proveedor de Estados Unidos?
 *
 * Se pregunta ANTES de intentar la compra para no llamar a CJ por cada venta
 * venezolana — que son la mayoría — y para que un fallo de red no aparezca en
 * el registro de pedidos que no tienen nada que ver con él.
 */
export async function esDeEstadosUnidos(pedidoId: string): Promise<boolean> {
  const { tiendas } = await import("@/lib/db/schema");
  const db = getDb();

  const [fila] = await db
    .select({ pais: tiendas.paisOrigen })
    .from(itemsPedido)
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(eq(itemsPedido.pedidoId, pedidoId))
    .limit(1)
    .catch(() => []);

  /* En mayúsculas y sin espacios: el país se escribe a mano en el panel, y un
     « us » con espacio dejaría sin despachar una venta de verdad. */
  return (fila?.pais ?? "").trim().toUpperCase() === "US";
}
