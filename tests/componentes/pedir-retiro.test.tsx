import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import es from "../../messages/es.json";

/**
 * EL FORMULARIO DE COBRO DEL COMERCIO, con Zelle y su tope.
 *
 * Se prueba el comportamiento real —elegir Zelle, escribir un monto, ver el
 * aviso— y no solo que el texto exista en algún archivo. El tope es lo que
 * protege la cuenta del banco de Windoce, LLC, de donde cobran todos los
 * comercios: si el aviso deja de salir, la gente intenta montos que el
 * servidor va a rechazar y abandona a mitad de camino.
 *
 * La acción del servidor se sustituye: aquí se prueba la pantalla, no la
 * base de datos. El rechazo de verdad vive en `pedirRetiro` y tiene su
 * propia prueba en `tests/unit/retiro-zelle.test.ts`.
 */
vi.mock("@/lib/retiros/acciones", () => ({
  pedirRetiro: vi.fn(async () => ({ ok: false, mensaje: "" })),
}));

const { PedirRetiro } = await import("@/components/panel/retiros/pedir-retiro");

/** El aviso de verdad, no el texto de ayuda de la opción Zelle. */
const AVISO_DEL_TOPE = /Por Zelle se puede enviar hasta/i;

function montar() {
  return render(
    <NextIntlClientProvider locale="es" messages={es}>
      <PedirRetiro
        disponibleCentavos={2_428_375}
        disponibleTexto="$24,283.75"
        comercios={[{ id: "otra", nombre: "Otra Ferretería" }]}
        tiendaId="tienda-bley-ferreteria"
      />
    </NextIntlClientProvider>,
  );
}

async function abrirFormulario() {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole("button", { name: /cobrar|retirar/i }));
  return usuario;
}

describe("pedir el cobro", () => {
  it("ofrece las cuatro formas, incluida Zelle", async () => {
    await abrirFormulario();

    for (const forma of ["comercio", "zelle", "ach", "wire"]) {
      expect(
        document.querySelector(`input[name="forma"][value="${forma}"]`),
        `falta la forma ${forma}`,
      ).not.toBeNull();
    }
  });

  it("al elegir Zelle pide el correo, no la cuenta ni la ruta", async () => {
    const usuario = await abrirFormulario();
    await usuario.click(
      document.querySelector('input[value="zelle"]') as HTMLElement,
    );

    expect(document.querySelector('input[name="zelleDestino"]')).not.toBeNull();
    // Pedirle la ruta ACH a quien cobra por Zelle no tiene sentido.
    expect(document.querySelector('input[name="ruta"]')).toBeNull();
    expect(document.querySelector('input[name="cuenta"]')).toBeNull();
  });

  it("avisa del tope mientras escribe, no al enviar", async () => {
    const usuario = await abrirFormulario();
    await usuario.click(
      document.querySelector('input[value="zelle"]') as HTMLElement,
    );

    const monto = screen.getByPlaceholderText("0.00");
    await usuario.type(monto, "600");

    // El texto del AVISO, no el de ayuda de la opción — que también dice
    // "hasta $500" y haría pasar la prueba sin que el aviso exista.
    expect(screen.getByText(AVISO_DEL_TOPE)).toBeInTheDocument();
    // Y ofrece la salida, en vez de dejar a la persona atascada.
    expect(
      screen.getByRole("button", { name: /cambiar a ach/i }),
    ).toBeInTheDocument();
  });

  it("justo en el tope no avisa nada", async () => {
    const usuario = await abrirFormulario();
    await usuario.click(
      document.querySelector('input[value="zelle"]') as HTMLElement,
    );

    await usuario.type(screen.getByPlaceholderText("0.00"), "500");

    expect(screen.queryByText(AVISO_DEL_TOPE)).not.toBeInTheDocument();
  });

  it("el tope NO limita las otras formas de cobrar", async () => {
    const usuario = await abrirFormulario();
    // ACH viene elegido de fábrica; un monto grande no debe avisar nada.
    await usuario.type(screen.getByPlaceholderText("0.00"), "5000");

    expect(screen.queryByText(AVISO_DEL_TOPE)).not.toBeInTheDocument();
  });
});
