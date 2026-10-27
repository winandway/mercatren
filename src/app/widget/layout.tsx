import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../globals.css";

/**
 * EL MARCO DEL WIDGET (27 oct 2026).
 *
 * Next 16.4 exige que toda página tenga un layout raíz con `<html>` y
 * `<body>`, y `/widget/form` vive fuera de `[locale]` a propósito: se dibuja
 * dentro del iframe de otra página, sin encabezado ni pie de Mercatren. Sin
 * este archivo la compilación se cae («doesn't have a root layout»).
 *
 * Fuera de los buscadores: es un formulario incrustado, no una página.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LayoutWidget({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white">{children}</body>
    </html>
  );
}
