/**
 * MIENTRAS LA PÁGINA PIENSA, SE VE LA TIENDA — NO UNA PANTALLA EN BLANCO.
 *
 * El dueño lo describió exacto: "uno le da al link y se queda ahí pensando,
 * la pantalla se pone en blanco, y luego carga". Eso era porque sin este
 * archivo el navegador no recibe NADA hasta que el servidor termina todas
 * sus consultas. Con él, el encabezado y este esqueleto salen de inmediato
 * y la mercancía aparece encima cuando llega.
 *
 * Es puro dibujo: sin texto (nada que traducir), sin datos (nada que
 * esperar). Las cajas imitan la portada — banner, tira de departamentos,
 * parrilla — para que el cambio a la página real no dé un salto.
 */
export default function Cargando() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="h-36 bg-riel-900/90 sm:h-44" />
      <div className="mx-auto max-w-[1500px] px-4">
        <div className="flex gap-6 overflow-hidden border-b border-borde py-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="shrink-0 space-y-2">
              <div className="mx-auto h-14 w-14 rounded-full bg-slate-200" />
              <div className="h-2.5 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-5 w-52 rounded bg-slate-200" />
        <div className="mt-4 grid grid-cols-3 gap-2.5 pb-10 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square rounded-xl bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-2/3 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
