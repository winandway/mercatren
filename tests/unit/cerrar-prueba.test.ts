import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * CERRAR UNA COMPRA O UNA VENTA QUE FUE UNA PRUEBA (4 sep 2026).
 *
 * El dueño llevaba días recibiendo el mismo correo del vigilante cada seis
 * horas por compras que son pruebas SUYAS, pagadas con su propia tarjeta:
 * «no nos interesa devolver el dinero… queremos que quede ya cerrado».
 *
 * «Descartar» no callaba nada: deja la compra en `con_error`, y ese estado
 * TAMBIÉN alerta — por eso el correo volvía. El único estado que el vigilante
 * no mira es `cerrado`, y hasta hoy ninguna acción lo usaba.
 *
 * Estas garantías viven pegadas a la base, así que el candado mira la FORMA
 * de los archivos: lo que, si se pierde, o vuelve el correo eterno o cierra
 * en silencio la compra de un cliente de verdad.
 */
describe("cerrar como prueba", () => {
  const acciones = readFileSync("src/lib/cj/proveedor-acciones.ts", "utf8");
  const pantalla = readFileSync(
    "src/components/panel/pedidos-proveedor.tsx",
    "utf8",
  );
  const hechos = readFileSync("src/lib/vigilante/hechos.ts", "utf8");
  /* El esquema se lee como TEXTO, no se importa: importarlo arrastra la tabla
     entera del proyecto a la medición de cobertura y tumba el umbral por un
     archivo que estas pruebas no ejercitan. */
  const esquema = readFileSync("src/lib/db/schema.ts", "utf8");

  it("el estado `cerrado` existe y es el que el vigilante NO mira", () => {
    expect(esquema).toContain("ESTADOS_PEDIDO_PROVEEDOR");
    const desde = esquema.indexOf("ESTADOS_PEDIDO_PROVEEDOR = [");
    const lista = esquema.slice(desde, esquema.indexOf("] as const;", desde));
    expect(lista).toContain('"cerrado"');
    /* El vigilante cuenta por estado. Si algún día `cerrado` entrara en una de
       esas dos consultas, este botón dejaría de servir para lo que se hizo. */
    expect(hechos).not.toContain('eq(pedidosProveedor.estado, "cerrado")');
  });

  it("NO cierra lo pagado ni lo enviado: solo `por_pagar` y `con_error`", () => {
    /* Ahí ya salió dinero o mercancía. Taparlo dejaría a un comprador
       esperando una caja sin que nadie lo vea en ninguna pantalla. */
    const bloque = acciones.slice(
      acciones.indexOf("export async function cerrarCompraComoPrueba"),
      acciones.indexOf("export async function cerrarVentaSinCompra"),
    );
    expect(bloque).toContain(
      'inArray(pedidosProveedor.estado, ["por_pagar", "con_error"])',
    );
    expect(bloque).not.toContain('"pagado"');
    expect(bloque).not.toContain('"enviado"');
    /* Y si el UPDATE no cambió ninguna fila, se dice: un «listo» sobre una
       compra ya pagada haría creer que se cerró algo que sigue vivo. */
    expect(bloque).toContain("cambiadas.length === 0");
  });

  it("cerrar una venta NO toca el pedido ni el cobro", () => {
    /* Es una prueba del equipo: no hay dinero que devolver —es su propia
       tarjeta— y el pedido del comprador se queda exactamente como está. Lo
       único que se hace es sacarla de la cola con una fila `cerrado`. */
    const bloque = acciones.slice(
      acciones.indexOf("export async function cerrarVentaSinCompra"),
    );
    expect(bloque).toContain('estado: "cerrado"');
    expect(bloque).not.toContain(".update(pedidos)");
    expect(bloque).not.toContain(".delete(");
  });

  it("EL CORREO DEL COMPRADOR VA AL LADO DEL BOTÓN, en las dos listas", () => {
    /* La MT-000013 era de una clienta de verdad. Cerrar la compra de alguien
       así lo deja pagando algo que nunca llega, y desde esta pantalla no habría
       forma de notarlo: son todos números de pedido parecidos. */
    expect(acciones).toContain("correoComprador");
    const veces = pantalla.split("compradorDesconocido").length - 1;
    expect(veces).toBe(2);
    expect(pantalla).toContain("cerrarCompraComoPrueba(compra.id)");
    expect(pantalla).toContain("cerrarVentaSinCompra(venta.id)");
  });

  it("el botón sale en las TRES situaciones que alertan, no solo en una", () => {
    /* Primero quedó dentro del recuadro de «por pagar sin enlace», que es una
       sola de las tres. Las que mandan el correo son: por pagar con enlace,
       por pagar sin él, y con error. */
    expect(pantalla).toContain("{porPagar || conError ?");
  });

  it("avisa antes de cerrar, en los dos casos", () => {
    /* Es irreversible desde la pantalla y el motivo queda escrito con el
       nombre de quien lo hizo. Un clic de más no puede cerrar una venta. */
    expect(pantalla).toContain('window.confirm(t("cerrarPruebaConfirmar"))');
    expect(pantalla).toContain('window.confirm(t("cerrarVentaConfirmar"))');
  });
});
