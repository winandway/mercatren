import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import es from "../../messages/es.json";

/**
 * EL FORMULARIO DE COBRO DEL COMERCIO, con su país.
 *
 * ══ LO QUE MOTIVÓ ESTAS PRUEBAS (10 ago 2026) ══
 *
 * El formulario se escribió cuando el único destino era Estados Unidos:
 * titular, banco, cuenta y **número de ruta**. Un comercio de Colombia entró,
 * eligió «wire», y no encontró dónde poner su Bancolombia. Se quedó bloqueado
 * una tarde entera mientras del otro lado nadie sabía qué contestarle.
 *
 * Se prueba el comportamiento real —elegir el país, ver cambiar las casillas—
 * y no solo que un texto exista en un archivo.
 *
 * La acción del servidor se sustituye: aquí se prueba la pantalla. La
 * validación de verdad vive en `pedirRetiro` y se apoya en las reglas puras de
 * `src/lib/retiros/paises.ts`, que tienen sus propias pruebas.
 */
vi.mock("@/lib/retiros/acciones", () => ({
  pedirRetiro: vi.fn(async () => ({ ok: false, mensaje: "" })),
}));

const { PedirRetiro } = await import("@/components/panel/retiros/pedir-retiro");

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

/** Las casillas del país se dibujan con su id, no con `name`. */
const casilla = (id: string) => document.getElementById(id);

describe("pedir el cobro", () => {
  it("ofrece tres formas, y Zelle NO es una de ellas", async () => {
    /* Mercury no hace Zelle: solo ACH dentro de Estados Unidos y wire para
       afuera. Mientras estuvo en la lista, un comercio podía pedirlo y quien
       iba al banco no lo podía ejecutar. */
    await abrirFormulario();

    for (const forma of ["comercio", "ach", "wire"]) {
      expect(
        document.querySelector(`input[name="forma"][value="${forma}"]`),
        `falta la forma ${forma}`,
      ).not.toBeNull();
    }

    expect(
      document.querySelector('input[name="forma"][value="zelle"]'),
    ).toBeNull();
  });
});

describe("el país decide qué se pregunta", () => {
  it("arranca en Estados Unidos y pide el número de ruta", async () => {
    await abrirFormulario();

    expect(casilla("ruta")).not.toBeNull();
    // Allá no hace falta el documento del titular.
    expect(casilla("documento")).toBeNull();
  });

  it("al elegir Colombia desaparece la ruta y aparece lo que sí pide", async () => {
    /* Esta es LA prueba: es exactamente lo que el comercio no pudo hacer. */
    const usuario = await abrirFormulario();

    await usuario.selectOptions(screen.getByLabelText(/país/i), "CO");

    expect(casilla("tipoCuenta")).not.toBeNull();
    expect(casilla("documento")).not.toBeNull();
    expect(casilla("swift")).not.toBeNull();
    expect(casilla("ruta")).toBeNull();
  });

  it("México pide CLABE", async () => {
    const usuario = await abrirFormulario();
    await usuario.selectOptions(screen.getByLabelText(/país/i), "MX");

    expect(casilla("clabe")).not.toBeNull();
    expect(casilla("ruta")).toBeNull();
  });

  it("España y Rumanía piden IBAN", async () => {
    const usuario = await abrirFormulario();

    for (const codigo of ["ES", "RO"]) {
      await usuario.selectOptions(screen.getByLabelText(/país/i), codigo);
      expect(casilla("iban"), `falta el IBAN en ${codigo}`).not.toBeNull();
    }
  });

  it("los doce países están en la lista", async () => {
    await abrirFormulario();

    const opciones = Array.from(
      (screen.getByLabelText(/país/i) as unknown as HTMLSelectElement).options,
    ).map((o) => o.value);

    expect(opciones).toHaveLength(12);
    for (const c of ["US", "CO", "VE", "MX", "BR", "AR", "ES", "RO"]) {
      expect(opciones).toContain(c);
    }
  });

  it("cambiar de país borra lo escrito", async () => {
    /* Arrastrar una CLABE al formulario de Colombia solo confunde a quien
       después va al banco con esos datos en la mano. */
    const usuario = await abrirFormulario();

    await usuario.selectOptions(screen.getByLabelText(/país/i), "MX");
    await usuario.type(casilla("clabe") as HTMLElement, "012345678901234567");
    expect((casilla("clabe") as HTMLInputElement).value).toBe(
      "012345678901234567",
    );

    await usuario.selectOptions(screen.getByLabelText(/país/i), "CO");
    await usuario.selectOptions(screen.getByLabelText(/país/i), "MX");

    expect((casilla("clabe") as HTMLInputElement).value).toBe("");
  });

  it("dice por qué vía va a salir el dinero", async () => {
    /* Se busca la frase exacta del aviso del país, no un "wire" suelto: la
       opción de la forma de pago también dice "wire" y haría pasar la prueba
       sin que el aviso exista. */
    const usuario = await abrirFormulario();

    expect(
      screen.getByText(es.panel.retiros.viaAch),
      "falta el aviso de que Estados Unidos va por ACH",
    ).toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText(/país/i), "CO");

    expect(
      screen.getByText(es.panel.retiros.viaWire),
      "falta el aviso de que Colombia va por wire",
    ).toBeInTheDocument();
    expect(screen.queryByText(es.panel.retiros.viaAch)).not.toBeInTheDocument();
  });
});

describe("el traspaso entre comercios no pide banco", () => {
  it("al elegirlo desaparecen las casillas bancarias", async () => {
    const usuario = await abrirFormulario();

    await usuario.click(
      document.querySelector('input[value="comercio"]') as HTMLElement,
    );

    expect(casilla("ruta")).toBeNull();
    expect(screen.queryByLabelText(/país/i)).not.toBeInTheDocument();
  });
});
