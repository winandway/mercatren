import { router } from "expo-router";

import { ElegirPais } from "@/components/elegir-pais";

/** «Cambiar de país» desde la cuenta: la misma pantalla, y vuelve atrás. */
export default function CambiarPais() {
  return <ElegirPais alElegir={() => router.back()} />;
}
