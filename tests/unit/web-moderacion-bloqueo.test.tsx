import { fireEvent, render, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import mensajes from "../../messages/es.json";

vi.mock("@/lib/moderacion/acciones", () => ({
  bloquearAutor: vi.fn(async () => ({ ok: true })),
  denunciarContenido: vi.fn(async () => ({ ok: true, oculto: false })),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

import { MenuModeracion } from "@/components/moderacion/menu-moderacion";
import { LLAVE_BLOQUEADOS } from "@/lib/moderacion/estilo-bloqueados";

/**
 * Revisión del 8 nov 2026: bloquear desde una opinión o un video dejaba en la
 * pestaña la lista vieja, y las tarjetas del vendedor seguían a la vista.
 */
describe("cualquier bloqueo olvida la lista guardada de bloqueados", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(`${LLAVE_BLOQUEADOS}:cuenta-1`, "[]");
    sessionStorage.setItem("otra-cosa", "se queda");
  });

  it("bloquear desde una opinión borra la lista y no toca lo demás", async () => {
    const { getByRole } = render(
      <NextIntlClientProvider locale="es" messages={mensajes}>
        <MenuModeracion tipo="opinion" id="op-1" />
      </NextIntlClientProvider>,
    );
    fireEvent.click(getByRole("button", { name: "Más opciones" }));
    fireEvent.click(getByRole("menuitem", { name: "Bloquear a esta persona" }));
    await waitFor(() =>
      expect(sessionStorage.getItem(`${LLAVE_BLOQUEADOS}:cuenta-1`)).toBeNull(),
    );
    expect(sessionStorage.getItem("otra-cosa")).toBe("se queda");
  });
});
