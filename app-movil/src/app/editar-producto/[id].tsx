import { useLocalSearchParams } from "expo-router";

import { FormularioProducto } from "@/components/formulario-producto";

/** EDITAR UN PRODUCTO YA SUBIDO: el mismo formulario, con lo guardado. */
export default function EditarProducto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FormularioProducto id={id} />;
}
