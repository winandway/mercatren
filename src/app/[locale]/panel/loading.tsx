/**
 * ══ AL TOCAR EL MENÚ, LA PANTALLA RESPONDE AL INSTANTE (21 sep 2026) ══
 *
 * Richard: «el menú está muy lento; navego y por ejemplo en Configuración
 * está muy lento». Sin este archivo, al tocar un ítem del menú NO PASABA
 * NADA hasta que el servidor terminaba todas las consultas de la pantalla
 * de destino: el menú parecía muerto. Con él, el menú se queda, el ítem se
 * marca, y este esqueleto sale de inmediato mientras la pantalla real llega.
 *
 * Es puro dibujo: sin texto (nada que traducir), sin datos (nada que
 * esperar). Imita lo que tienen casi todas las pantallas del panel: un
 * título, una fila de tarjetas con cifras y una tabla.
 */
export default function Cargando() {
  return (
    <div aria-busy className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-borde bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-7 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-borde bg-white">
        <div className="border-b border-borde px-5 py-4">
          <div className="h-4 w-40 rounded bg-slate-200" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-6 border-b border-borde px-5 py-4">
            <div className="h-3 w-1/4 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-1/6 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
