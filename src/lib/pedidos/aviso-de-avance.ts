import "server-only";

/**
 * EL CLIENTE SE ENTERA POR CORREO, NO ENTRANDO A MIRAR.
 *
 * ══ POR QUÉ ESTÁ EN SU PROPIO ARCHIVO (21 sep 2026) ══
 *
 * El aviso de «ya va en camino» tiene que salir por dos puertas: cuando el
 * comercio pulsa el botón en el panel, y cuando el proveedor da la guía y el
 * reloj despacha el pedido solo. Si cada puerta armara su propio correo,
 * tarde o temprano una de las dos mandaría el que no era — y el que no era
 * es el de Venezuela, que le dice a alguien de Miami que pase a retirar su
 * compra con la cédula.
 *
 * Un solo sitio decide qué correo sale. Las dos puertas llaman aquí.
 *
 * ══ EL AVISO NUNCA DESHACE EL AVANCE ══
 *
 * Si el correo falla, el pedido queda movido igual y el estado se ve en la
 * pantalla. Pero el fallo se anota: un correo que no sale en silencio es
 * exactamente lo que deja a un comprador esperando sin saber nada.
 */
export type PedidoParaAvisar = {
  id: string;
  numero: string;
  clienteId: string | null;
  totalCentavos: number;
  /** El país donde se hizo la venta: decide retiro o entrega a domicilio. */
  mercado: string | null;
};

export async function avisarAvanceAlCliente(
  pedido: PedidoParaAvisar,
  nuevoEstado: "enviado" | "entregado",
): Promise<{ avisado: boolean; motivo?: string }> {
  try {
    /* UN PEDIDO SIN CUENTA NO TIENE A QUIÉN AVISAR, y eso no es un fallo:
       los cobros por enlace se pagan sin registrarse. Se dice y se sigue. */
    if (!pedido.clienteId) {
      return { avisado: false, motivo: "el pedido no tiene cuenta asociada" };
    }
    const { contactoDeUsuario } = await import("@/lib/correo/contactos");
    const cliente = await contactoDeUsuario(pedido.clienteId);
    if (!cliente) return { avisado: false, motivo: "sin correo del cliente" };

    const datos = {
      numero: pedido.numero,
      totalCentavos: pedido.totalCentavos,
    };

    if (nuevoEstado === "entregado") {
      const { correoPedidoEntregado } = await import("@/lib/correo/correos");
      await correoPedidoEntregado(cliente, datos);
      return { avisado: true };
    }

    const { formaDeEntrega } = await import("@/lib/pedidos/como-se-entrega");

    if (formaDeEntrega(pedido.mercado) === "retiro") {
      const { puntosDeRetiro, lineasDeRetiro } =
        await import("@/lib/pedidos/retiro");
      const { correoPedidoListo } = await import("@/lib/correo/correos");
      const puntos = lineasDeRetiro(await puntosDeRetiro(pedido.id));
      await correoPedidoListo(cliente, datos, puntos);
      return { avisado: true };
    }

    /* Se despacha a una dirección: «ya va en camino», con la guía si el
       proveedor ya la dio. Sin guía el correo sale igual — «ya salió» vale
       por sí solo y evita el silencio de los días de tránsito. */
    const { guiaDelPedido } = await import("@/lib/pedidos/guia");
    const { correoPedidoEnviado } = await import("@/lib/correo/correos");
    await correoPedidoEnviado(
      cliente,
      { ...datos, seDespacha: true },
      await guiaDelPedido(pedido.id),
    );
    return { avisado: true };
  } catch (e) {
    console.error("[pedido] avanzado; aviso al cliente fallido:", e);
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError(
        "pedidos/aviso-de-avance",
        e,
        `El aviso de «${nuevoEstado}» del pedido ${pedido.numero} no salió`,
      );
    } catch {
      /* Si ni el registro del fallo se puede escribir, queda el console. */
    }
    return {
      avisado: false,
      motivo: e instanceof Error ? e.message : String(e),
    };
  }
}
