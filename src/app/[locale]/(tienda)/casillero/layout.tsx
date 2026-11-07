import type { Metadata } from "next";

import { CASILLERO_ABIERTO } from "@/lib/casillero/abierto";

/* Con el casillero cerrado (7 nov 2026), ninguna de sus páginas se le
   ofrece a Google: solo dicen que no está disponible. */
export const metadata: Metadata = CASILLERO_ABIERTO
  ? {}
  : { robots: { index: false, follow: true } };

export default function LayoutCasillero({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
