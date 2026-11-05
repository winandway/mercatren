import type { ClaveDeTexto } from "./textos";

/**
 * La dirección de entrega del pago, pura (la prueba el sitio). Las reglas
 * finas (estado de EE. UU. válido, código postal) las pone el servidor con la
 * MISMA validación de la web; esto solo evita mandar algo que de seguro falla.
 */
export type DatosEntrega = {
  nombre: string;
  telefono: string;
  direccion: string;
  direccion2: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
};

export function faltaEnEntrega(d: DatosEntrega): ClaveDeTexto | null {
  if (d.nombre.trim().length < 2) return "faltaNombre";
  if (d.telefono.replace(/\D/g, "").length < 7) return "faltaTelefono";
  if (d.direccion.trim().length < 4) return "faltaDireccion";
  if (d.ciudad.trim().length < 2) return "faltaCiudad";
  if (!/^[A-Za-z]{2}$/.test(d.estado.trim())) return "faltaEstado";
  if (!/^\d{5}(-\d{4})?$/.test(d.codigoPostal.trim()))
    return "faltaCodigoPostal";
  return null;
}

/** La entrega como la espera el servidor (`esquemaEntrega` de la web). */
export function entregaParaElPedido(d: DatosEntrega) {
  return {
    nombre: d.nombre.trim(),
    telefono: d.telefono.trim(),
    ciudad: d.ciudad.trim(),
    pais: "US",
    direccion: d.direccion.trim(),
    direccion2: d.direccion2.trim() || undefined,
    estado: d.estado.trim().toUpperCase(),
    codigoPostal: d.codigoPostal.trim(),
  };
}
