import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { Precio } from "@/components/ui/precio";

function renderizarConIdioma(nodo: React.ReactNode, idioma: "es" | "en") {
  return render(
    <NextIntlClientProvider locale={idioma} messages={{}}>
      {nodo}
    </NextIntlClientProvider>,
  );
}

describe("Precio", () => {
  it("muestra los centavos como precio", () => {
    renderizarConIdioma(<Precio centavos={4599} />, "es");
    expect(screen.getByText("$45.99")).toBeInTheDocument();
  });

  it("funciona igual en ingles", () => {
    renderizarConIdioma(<Precio centavos={4599} />, "en");
    expect(screen.getByText("$45.99")).toBeInTheDocument();
  });
});
