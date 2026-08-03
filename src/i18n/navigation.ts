import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Enlaces y navegacion que conservan el idioma actual.
 * Usar SIEMPRE este Link en vez del de next/link dentro de las paginas.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
