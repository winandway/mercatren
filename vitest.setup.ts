import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Deja el DOM limpio entre pruebas para que una no ensucie a la siguiente.
afterEach(() => {
  cleanup();
});
