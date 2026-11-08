import {
  contextoDe,
  paisParaApp,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { PAIS_POR_DEFECTO_EN_LA_APP } from "@/lib/app-movil/cobro-en-la-app";
import { enLaApp } from "@/lib/mercado/interruptores";
import { MERCADOS } from "@/lib/mercado/mercados";

/**
 * Los países, para la pantalla de bienvenida de la app: nombre, moneda y si
 * ya se puede comprar ahí (`encendido`). Sin base de datos: sale de la lista
 * cerrada de mercados. Ver `lib/app-movil/datos.ts`.
 *
 * `porDefecto` (8 nov 2026): el país que la bienvenida deja marcado a quien
 * todavía no eligió ninguno (Venezuela, el único con productos). Solo si está
 * encendido; la app 2.0.0 no lo lee y no le cambia nada.
 */
export function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  return respuestaPublica({
    ok: true,
    paises: MERCADOS.map((m) => paisParaApp(m, contexto.idioma)),
    porDefecto: enLaApp(PAIS_POR_DEFECTO_EN_LA_APP)
      ? PAIS_POR_DEFECTO_EN_LA_APP
      : null,
  });
}
