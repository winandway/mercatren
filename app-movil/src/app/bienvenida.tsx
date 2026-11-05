import { ElegirPais } from "@/components/elegir-pais";

/**
 * La primera vez: elegir el país. Al elegirlo, la guarda de `_layout.tsx` cierra
 * esta pantalla y abre la tienda sola.
 */
export default function Bienvenida() {
  return <ElegirPais />;
}
