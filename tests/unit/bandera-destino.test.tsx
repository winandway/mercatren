import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  BanderaDestino,
  BanderaDeLaTienda,
} from "@/components/catalogo/bandera-destino";

/**
 * LA BANDERITA DE ESTADOS UNIDOS EN LAS TARJETAS.
 *
 * ══ LO QUE ESTA PRUEBA PROTEGE ══
 *
 * Que se marque **la excepción y no lo normal**. La mayoría del catálogo se
 * entrega en Venezuela; si un día alguien le pone bandera también a eso, la
 * portada se convierte en un mar de banderas y el sello deja de significar
 * nada — que es justo lo contrario de para lo que existe.
 */
describe("la banderita que dice dónde se entrega", () => {
  it("un producto de Estados Unidos la lleva", () => {
    render(<BanderaDestino paisOrigen="US" etiqueta="EE. UU." />);
    expect(screen.getByText("EE. UU.")).toBeInTheDocument();
  });

  it("un producto de Venezuela NO lleva nada", () => {
    /* Lo normal no se marca. Y la tarjeta ya dice debajo del precio en qué
       ciudad se retira, así que no se pierde ninguna información. */
    const { container } = render(
      <BanderaDestino paisOrigen="VE" etiqueta="EE. UU." />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("una tienda sin país declarado tampoco la lleva", () => {
    /* Los comercios de siempre no tienen el campo puesto. Ante la duda, se
       entrega en Venezuela: es de donde despachan todos menos el catálogo
       nuevo, y ponerle bandera de Estados Unidos a un tubo de PVC de Caracas
       sería prometerle al comprador una entrega que nadie va a hacer. */
    const { container } = render(
      <BanderaDestino paisOrigen={null} etiqueta="EE. UU." />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("da igual cómo esté escrito el país", () => {
    /* Las tiendas se cargaron por vías distintas y el dato llega como venga. */
    for (const escrito of ["us", " US ", "Us"]) {
      const { container } = render(
        <BanderaDestino paisOrigen={escrito} etiqueta="EE. UU." />,
      );
      expect(container, escrito).not.toBeEmptyDOMElement();
    }
  });

  it("la bandera de la ficha de la tienda sigue la misma regla", () => {
    const usa = render(<BanderaDeLaTienda paisOrigen="US" />);
    expect(usa.container.querySelector("svg")).not.toBeNull();

    const venezuela = render(<BanderaDeLaTienda paisOrigen="VE" />);
    expect(venezuela.container).toBeEmptyDOMElement();
  });

  it("es un dibujo, no un emoji", () => {
    /* El emoji de bandera no se dibuja en Windows: sale como dos letras en un
       recuadro. Media clientela de Estados Unidos vería un cuadro roto en cada
       tarjeta del catálogo nuevo. */
    const { container } = render(
      <BanderaDestino paisOrigen="US" etiqueta="EE. UU." />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
