import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { alSalirseALaRed, servidor } from "./tests/msw/servidor";

/**
 * EL CANDADO DE LA RED.
 *
 * Se levanta antes de la primera prueba y se cierra al final. Con
 * `onUnhandledRequest: "error"`, cualquier prueba que intente hablar con un
 * servicio de verdad —Stripe, el correo, el servidor de fotos de un comercio—
 * falla en el acto y dice a dónde iba.
 *
 * Sin esto, una prueba puede cobrar dinero de verdad o mandarle un correo a una
 * persona real, y solo se descubre cuando llega la factura.
 */
beforeAll(() => {
  servidor.listen({ onUnhandledRequest: alSalirseALaRed });
});

// Deja el DOM limpio entre pruebas para que una no ensucie a la siguiente.
// Y las simulaciones que una prueba haya agregado no se le quedan a la siguiente.
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
});

afterAll(() => {
  servidor.close();
});
