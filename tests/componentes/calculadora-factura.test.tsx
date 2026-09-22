import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import es from "../../messages/es.json";

/**
 * ══ EL CASO DE LA FACTURA DE SEIS MIL (21 sep 2026) ══
 *
 * Richard estaba emitiendo una factura de **$6.483,77** con **dos laptops
 * iguales** y la pantalla le falló dos veces a la vez:
 *
 *  1. Escribió `6.483,77` y el sistema entendió **$6,48** — hacía
 *     `replace(",", ".")` y `parseFloat` cortaba en el segundo punto. Sin
 *     avisar: siguió con la cuenta entera hecha con seis dólares y medio.
 *  2. No había forma de decir «van DOS»: el producto se marcaba una vez y el
 *     cuadre decidía solo cuántas unidades poner. Sus palabras: «no me da la
 *     opción de agregar la otra computadora».
 *
 * Se prueba la pantalla entera, escribiendo como escribió él.
 */
vi.mock("@/components/panel/facturar/cobrar-lo-cuadrado", () => ({
  CobrarLoCuadrado: () => null,
}));
vi.mock("@/components/panel/facturar/buscador-de-comercio", () => ({
  BuscadorDeComercio: () => null,
}));

const { CalculadoraFactura } =
  await import("@/components/panel/facturar/calculadora-factura");

const LAPTOP = {
  id: "laptop",
  titulo: "LAPTOP ASUS V3607VP-IS79",
  precioCentavos: 303_847,
};
const PRODUCTOS = [
  LAPTOP,
  { id: "morral", titulo: "MORRAL RAZER ROGUE", precioCentavos: 19_063 },
  {
    id: "guante",
    titulo: "Guante tejido con puntos de PVC",
    precioCentavos: 245,
  },
];

function pintar() {
  return render(
    <NextIntlClientProvider locale="es" messages={es}>
      <CalculadoraFactura
        productos={PRODUCTOS}
        idioma="es"
        comisionPuntosBase={600}
        tiendaId="t1"
        zelleLimites={{ minimoCentavos: 20_000, maximoCentavos: 500_000 }}
      />
    </NextIntlClientProvider>,
  );
}

describe("la calculadora de facturas", () => {
  it("«6.483,77» son seis mil cuatrocientos, no seis con cuarenta y ocho", async () => {
    const persona = userEvent.setup();
    pintar();
    await persona.type(
      screen.getByLabelText(/monto de la factura/i),
      "6.483,77",
    );
    await persona.click(screen.getByRole("checkbox", { name: /LAPTOP/i }));

    /* Con el monto bien leído, el cuadre pone DOS laptops solo, y las dos
       suman el monto escrito (con $6,48 ponía cero). */
    const fila = await screen.findByRole("row", { name: /LAPTOP/i });
    expect(fila).toHaveTextContent(/\b2\b/);
    expect(fila).toHaveTextContent("$6,483.77");
  });

  it("se puede decir CUÁNTAS unidades van, y se respetan", async () => {
    const persona = userEvent.setup();
    pintar();
    await persona.type(
      screen.getByLabelText(/monto de la factura/i),
      "6483.77",
    );
    await persona.click(screen.getByRole("checkbox", { name: /LAPTOP/i }));

    const cantidad = screen.getByLabelText(/cuántas unidades de LAPTOP/i);
    await persona.clear(cantidad);
    await persona.type(cantidad, "2");

    const fila = await screen.findByRole("row", { name: /LAPTOP/i });
    expect(fila).toHaveTextContent(/\b2\b/);
    /* Y las dos laptops suman EXACTO el monto: $3.241,885 cada una, con el
       precio de lista tachado al lado. Richard: «ajusta tú misma los precios
       de la laptop y ya está». Antes decía «faltan $406,83». */
    expect(fila).toHaveTextContent("$6,483.77");
    expect(fila).toHaveTextContent("$3,241.885");
    expect(fila).toHaveTextContent("$3,038.47");
    expect(screen.getByText(/ajustamos el precio/i)).toBeInTheDocument();
    expect(screen.queryByText(/faltan/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("si las unidades ya suman exacto, no se ajusta nada ni se dice", async () => {
    const persona = userEvent.setup();
    pintar();
    await persona.type(
      screen.getByLabelText(/monto de la factura/i),
      "6076.94",
    );
    await persona.click(screen.getByRole("checkbox", { name: /LAPTOP/i }));
    const fila = await screen.findByRole("row", { name: /LAPTOP/i });
    expect(fila).toHaveTextContent("$3,038.47");
    expect(fila).not.toHaveTextContent("$3,241");
    expect(screen.queryByText(/ajustamos el precio/i)).not.toBeInTheDocument();
  });

  it("el selector de cantidad solo sale del producto marcado", async () => {
    const persona = userEvent.setup();
    pintar();
    expect(
      screen.queryByLabelText(/cuántas unidades/i),
    ).not.toBeInTheDocument();
    await persona.click(screen.getByRole("checkbox", { name: /LAPTOP/i }));
    expect(screen.getAllByLabelText(/cuántas unidades/i)).toHaveLength(1);
  });
});
