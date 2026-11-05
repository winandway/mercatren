import {
  contextoDe,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { camposDeEntrega, listaDeEstados } from "@/lib/destino/direccion";

/**
 * CÓMO SE ENTREGA EN CADA PAÍS, PARA LA APP (5 nov 2026, Fase 5).
 *
 * La MISMA fuente que la web (`destino/direccion.ts`): si se despacha a una
 * dirección o se retira en una ciudad (Venezuela), qué casillas se piden y la
 * lista de estados, provincias, regiones o departamentos. Así la app dibuja
 * el formulario de cada país sin una regla propia, y el servidor vuelve a
 * revisar todo al crear el pedido. Sin base de datos: listas fijas.
 */
export function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const destino = contexto.mercado.codigo as Parameters<
    typeof camposDeEntrega
  >[0];
  return respuestaPublica({
    ok: true,
    entrega: {
      pais: destino,
      forma: contexto.mercado.retiroEnCiudad ? "retiro" : "envio",
      campos: camposDeEntrega(destino)
        .filter((c) => c.nombre !== "nombre" && c.nombre !== "telefono")
        .map((c) => ({ nombre: c.nombre, obligatorio: c.obligatorio })),
      estados: listaDeEstados(destino),
    },
  });
}
