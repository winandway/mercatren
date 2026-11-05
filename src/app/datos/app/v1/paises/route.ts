import {
  contextoDe,
  paisParaApp,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { MERCADOS } from "@/lib/mercado/mercados";

/**
 * Los países, para la pantalla de bienvenida de la app: nombre, moneda y si
 * ya se puede comprar ahí (`encendido`). Sin base de datos: sale de la lista
 * cerrada de mercados. Ver `lib/app-movil/datos.ts`.
 */
export function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  return respuestaPublica({
    ok: true,
    paises: MERCADOS.map((m) => paisParaApp(m, contexto.idioma)),
  });
}
