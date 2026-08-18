import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import mensajes from "../../messages/es.json";

/**
 * EL FORMULARIO QUE NO PIERDE LO ESCRITO.
 *
 * Esto nació de un comercio real —MEGAYES, que vende motos— que pasó días
 * volviendo a escribir el mismo producto porque cada intento le vaciaba el
 * formulario. Lo que se prueba aquí es que eso no puede repetirse.
 *
 * Y hay una prueba que vale por todas: **la contraseña nunca puede acabar
 * guardada en el navegador**. Si esa se pone roja no se ajusta la prueba, se
 * arregla el código.
 */

function Envuelto({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="es" messages={mensajes}>
      {children}
    </NextIntlClientProvider>
  );
}

/** Un formulario cualquiera, con las casillas que se ven en el panel. */
function Ficha({ llave = "prueba" }: { llave?: string }) {
  return (
    <Envuelto>
      <FormularioPersistente llave={llave}>
        <input type="hidden" name="id" defaultValue="prod-123" />
        <label>
          Nombre
          <input name="tituloEs" defaultValue="" />
        </label>
        <label>
          Descripción
          <textarea name="descripcionEs" defaultValue="" />
        </label>
        <label>
          Clave
          <input name="clave" type="password" autoComplete="new-password" />
        </label>
        <label>
          Ciudad
          <select name="ciudad" defaultValue="">
            <option value="">Sin ciudad</option>
            <option value="maracaibo">Maracaibo</option>
          </select>
        </label>
        <label>
          Controla existencias
          <input name="controla" type="checkbox" defaultChecked />
        </label>
      </FormularioPersistente>
    </Envuelto>
  );
}

const LLAVE_REAL = "mercatren:borrador:prueba";

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("guardar lo que se escribe", () => {
  it("apunta el texto en el navegador", async () => {
    const persona = userEvent.setup();
    const { getByLabelText } = render(<Ficha />);

    await persona.type(getByLabelText("Nombre"), "Moto Bera BR200");

    await waitFor(() => {
      const guardado = window.localStorage.getItem(LLAVE_REAL);
      expect(guardado).toContain("Moto Bera BR200");
    });
  });

  it("NUNCA guarda la contraseña", async () => {
    /* Quedaría en claro en el disco, sobreviviendo a la sesión, en una
       computadora que puede ser prestada. */
    const persona = userEvent.setup();
    const { getByLabelText } = render(<Ficha />);

    await persona.type(getByLabelText("Nombre"), "Moto");
    await persona.type(getByLabelText("Clave"), "MiClaveSecreta2026");

    await waitFor(() =>
      expect(window.localStorage.getItem(LLAVE_REAL)).toContain("Moto"),
    );
    expect(window.localStorage.getItem(LLAVE_REAL)).not.toContain(
      "MiClaveSecreta2026",
    );
  });

  it("NUNCA guarda los identificadores que pone el servidor", async () => {
    /* Restituir uno viejo mandaría a guardar contra OTRO producto. */
    const persona = userEvent.setup();
    const { getByLabelText } = render(<Ficha />);

    await persona.type(getByLabelText("Nombre"), "Moto");

    await waitFor(() =>
      expect(window.localStorage.getItem(LLAVE_REAL)).toContain("Moto"),
    );
    expect(window.localStorage.getItem(LLAVE_REAL)).not.toContain("prod-123");
  });
});

describe("restituir al volver", () => {
  it("devuelve texto, lista y casilla de marcar", async () => {
    window.localStorage.setItem(
      LLAVE_REAL,
      JSON.stringify({
        campos: {
          tituloEs: "Moto Bera BR200",
          descripcionEs: "Motor 200cc",
          ciudad: "maracaibo",
          controla: "",
        },
        guardadoEn: Date.now(),
      }),
    );

    const { getByLabelText } = render(<Ficha />);

    await waitFor(() =>
      expect(getByLabelText("Nombre")).toHaveValue("Moto Bera BR200"),
    );
    expect(getByLabelText("Descripción")).toHaveValue("Motor 200cc");
    expect(getByLabelText("Ciudad")).toHaveValue("maracaibo");
    /* La casilla estaba marcada por defecto y él la desmarcó: tiene que volver
       desmarcada. Si no, se le devuelve una decisión que no tomó. */
    expect(getByLabelText("Controla existencias")).not.toBeChecked();
  });

  it("avisa de que lo recuperó y deja empezar de nuevo", async () => {
    window.localStorage.setItem(
      LLAVE_REAL,
      JSON.stringify({
        campos: { tituloEs: "Moto Bera" },
        guardadoEn: Date.now(),
      }),
    );

    const persona = userEvent.setup();
    const { findByText, getByRole, getByLabelText } = render(<Ficha />);

    /* Restituir en silencio hace creer que el sistema se inventó unos datos. */
    await findByText("Recuperamos lo que estabas escribiendo.");

    await persona.click(getByRole("button", { name: "Empezar de nuevo" }));
    expect(getByLabelText("Nombre")).toHaveValue("");
    expect(window.localStorage.getItem(LLAVE_REAL)).toBeNull();
  });

  it("no restituye un borrador de hace más de un día", async () => {
    window.localStorage.setItem(
      LLAVE_REAL,
      JSON.stringify({
        campos: { tituloEs: "Moto vieja" },
        guardadoEn: Date.now() - 25 * 60 * 60 * 1000,
      }),
    );

    const { getByLabelText, queryByText } = render(<Ficha />);
    expect(getByLabelText("Nombre")).toHaveValue("");
    expect(queryByText("Recuperamos lo que estabas escribiendo.")).toBeNull();
  });

  it("un borrador ilegible no tumba el formulario", () => {
    window.localStorage.setItem(LLAVE_REAL, "{ esto no es json");
    const { getByLabelText } = render(<Ficha />);
    expect(getByLabelText("Nombre")).toHaveValue("");
  });

  it("el borrador de un formulario no se cuela en otro", async () => {
    window.localStorage.setItem(
      "mercatren:borrador:moto-a",
      JSON.stringify({
        campos: { tituloEs: "Moto A" },
        guardadoEn: Date.now(),
      }),
    );

    const { getByLabelText } = render(<Ficha llave="moto-b" />);
    expect(getByLabelText("Nombre")).toHaveValue("");
  });
});

describe("olvidar el borrador", () => {
  it("lo borra del navegador", () => {
    window.localStorage.setItem(LLAVE_REAL, "lo que sea");
    olvidarBorrador("prueba");
    expect(window.localStorage.getItem(LLAVE_REAL)).toBeNull();
  });
});

/**
 * UN FORMULARIO CUYAS CASILLAS LLEGAN DESPUÉS.
 *
 * Es el caso del checkout: pregunta al servidor a qué país va el pedido y,
 * solo cuando contesta, dibuja la dirección de Estados Unidos. Se simula con
 * un estado que cambia tras el montaje.
 */
function ConCasillasTardias({ llave = "tardias" }: { llave?: string }) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setListo(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <Envuelto>
      <FormularioPersistente llave={llave}>
        <label>
          Nombre
          <input name="nombre" defaultValue="" />
        </label>
        {listo ? (
          <>
            <label>
              Dirección
              <input name="direccion" defaultValue="" />
            </label>
            <label>
              Estado
              <select name="estado" defaultValue="">
                <option value="">Elige</option>
                <option value="MI">Michigan</option>
              </select>
            </label>
          </>
        ) : null}
      </FormularioPersistente>
    </Envuelto>
  );
}

describe("las casillas que aparecen tarde también se recuperan", () => {
  it("rellena la dirección aunque llegue después del montaje", async () => {
    /**
     * EL FALLO QUE ESTO EVITA (18 ago 2026): la restitución corría UNA sola
     * vez, y en el checkout las casillas de Estados Unidos todavía no
     * existían — llegan cuando el servidor dice a qué país va el pedido. Se
     * perdía la dirección entera, y encima el aviso decía «recuperamos lo que
     * estabas escribiendo» con el formulario en blanco.
     */
    window.localStorage.setItem(
      "mercatren:borrador:tardias",
      JSON.stringify({
        campos: { nombre: "Ana", direccion: "500 Main St", estado: "MI" },
        guardadoEn: Date.now(),
      }),
    );

    const { container } = render(<ConCasillasTardias />);

    await waitFor(() => {
      const direccion =
        container.querySelector<HTMLInputElement>('[name="direccion"]');
      expect(direccion?.value).toBe("500 Main St");
    });

    const estado = container.querySelector(
      '[name="estado"]',
    ) as HTMLSelectElement | null;
    expect(estado?.value).toBe("MI");
  });

  it("NO pisa lo que la persona ya escribió", async () => {
    /* La segunda pasada solo toca casillas vacías. Si rellenara todas, cada
       vez que el formulario cambia de forma se borraría lo recién escrito —
       que es justo el problema que este componente vino a resolver. */
    window.localStorage.setItem(
      "mercatren:borrador:tardias",
      JSON.stringify({
        campos: { nombre: "Del borrador", direccion: "500 Main St" },
        guardadoEn: Date.now(),
      }),
    );

    const { container } = render(<ConCasillasTardias />);
    const nombre = container.querySelector<HTMLInputElement>('[name="nombre"]');

    await waitFor(() => expect(nombre?.value).toBe("Del borrador"));

    /* La persona lo cambia mientras aparecen las casillas nuevas. */
    if (nombre) nombre.value = "Escrito a mano";

    await waitFor(() => {
      expect(
        container.querySelector<HTMLInputElement>('[name="direccion"]')?.value,
      ).toBe("500 Main St");
    });
    expect(nombre?.value).toBe("Escrito a mano");
  });
});
