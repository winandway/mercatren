"use client";

import { Globe, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import {
  BanderaDelMercado,
  BanderaDePais,
} from "@/components/marca/bandera-pais";
import { Logo } from "@/components/marca/logo";
import { MERCADOS, type Mercado } from "@/lib/mercado/mercados";

/**
 * MERCATREN EN EL MUNDO: la ventana que dice dónde vive cada país.
 *
 * ══ POR QUÉ EXISTE (7 sep 2026) ══
 *
 * Lo pidió Richard el día que Venezuela se mudó a su propio dominio, y el
 * motivo es el que importa: **hay gente que tenía su cuenta en mercatren.com
 * y de un día para otro su tienda vive en mercatren.com.ve**. Sin una
 * explicación a la vista, eso se lee como que el sitio perdió sus productos.
 * Sus palabras: «que la gente pueda entender qué fue lo que pasó y por qué
 * los mudamos».
 *
 * Por eso la ventana no es solo una lista de enlaces: **cuenta el cambio
 * primero** y después ofrece los cuatro dominios.
 *
 * ══ TRES COSAS QUE NO SE TOCAN ══
 *
 * 1. **Los enlaces son `<a>` con la dirección completa, no `<Link>`.** Van a
 *    OTRO dominio; el enrutador de Next solo sabe moverse dentro de este, y
 *    con `<Link>` la navegación muere sin decir nada.
 * 2. **Se conserva el idioma.** Quien está leyendo en inglés en
 *    mercatren.com llega a `/en` en el dominio nuevo, no a `/es`.
 * 3. **La lista sale de `MERCADOS`**, la misma lista cerrada que decide el
 *    mercado por dominio. Un país nuevo aparece aquí solo, el mismo día que
 *    se declara: una lista escrita a mano se queda vieja al primer país.
 */
export function MercatrenGlobal({
  mercado,
  idioma,
  textos,
  soloIcono = false,
}: {
  /** En cuál estamos parados: se marca y no se ofrece como destino. */
  mercado: Mercado;
  idioma: string;
  /**
   * ══ EN EL CELULAR, EL BOTÓN ES LA PROPIA BANDERA ══
   *
   * Medido a 360 px: el logo con su bandera (146 px), un globo aparte (26),
   * el idioma (50), la cuenta (38) y el carrito (46) no caben en los 336 px
   * útiles — **el carrito se caía a una segunda línea**. Poner la bandera Y
   * un globo era pedir dos veces el mismo espacio para decir lo mismo.
   *
   * Así que arriba se dibuja UNA cosa: la bandera del país, y tocarla abre
   * esta ventana. Es el patrón de cualquier sitio internacional —tocas tu
   * bandera para cambiar de país— y de paso la explicación de la mudanza le
   * llega a quien entra por teléfono, que es la mayoría.
   */
  soloIcono?: boolean;
  textos: {
    boton: string;
    titulo: string;
    entrada: string;
    mudanza: string;
    aqui: string;
    cerrar: string;
  };
}) {
  const ventana = useRef<HTMLDialogElement>(null);
  const [abierta, setAbierta] = useState(false);
  /* El título se enlaza por id y el componente se dibuja dos veces (barra y
     encabezado): con un id escrito a mano habría dos iguales en la página. */
  const idTitulo = useId();

  /* `showModal()` es lo que trae gratis el fondo oscuro, el foco atrapado
     dentro y el cierre con Escape. Un div con estado no da nada de eso. */
  useEffect(() => {
    const d = ventana.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label={soloIcono ? textos.titulo : undefined}
        className={
          soloIcono
            ? "flex shrink-0 items-center rounded-lg p-1 text-white/90 transition-colors hover:bg-white/10 lg:hidden"
            : "celda-encabezado hidden shrink-0 items-center gap-1.5 lg:flex"
        }
      >
        {soloIcono ? (
          <BanderaDelMercado mercado={mercado} soloBandera />
        ) : (
          <>
            <Globe className="h-3.5 w-3.5" aria-hidden />
            {textos.boton}
          </>
        )}
      </button>

      <dialog
        ref={ventana}
        onClose={() => setAbierta(false)}
        /* Tocar el fondo cierra: el clic cae en el propio <dialog>, no en su
           contenido, y por eso se compara el destino con el elemento. */
        onClick={(e) => {
          if (e.target === ventana.current) setAbierta(false);
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-2xl bg-white p-0 text-riel-900 shadow-2xl backdrop:bg-black/60"
        aria-labelledby={idTitulo}
      >
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={() => setAbierta(false)}
            aria-label={textos.cerrar}
            className="absolute top-3 right-3 rounded-lg p-1.5 text-riel-900/50 transition-colors hover:bg-riel-900/5 hover:text-riel-900"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <Logo variante="horizontal" ancho={150} alto={34} />

          <h2 id={idTitulo} className="mt-4 text-lg font-extrabold">
            {textos.titulo}
          </h2>
          <p className="mt-1.5 text-sm text-riel-900/70">{textos.entrada}</p>

          {/* EL AVISO DE LA MUDANZA, y va ANTES de la lista a propósito:
              quien abre esto porque «no encuentra sus productos» necesita
              leer el porqué antes de ver cuatro enlaces que no pidió. */}
          <p className="mt-3 rounded-xl border-l-4 border-carga-500 bg-carga-500/10 p-3 text-sm text-riel-900/85">
            {textos.mudanza}
          </p>

          <ul className="mt-4 space-y-1.5">
            {MERCADOS.map((m) => {
              const aqui = m.codigo === mercado.codigo;
              const contenido = (
                <>
                  <BanderaDePais
                    codigo={m.codigo}
                    clase="h-4 w-auto shrink-0 rounded-[2px] ring-1 ring-black/10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {m.nombre}
                    </span>
                    <span className="block truncate text-xs text-riel-900/60">
                      {m.dominio}
                    </span>
                  </span>
                  {aqui ? (
                    <span className="shrink-0 rounded-full bg-riel-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {textos.aqui}
                    </span>
                  ) : null}
                </>
              );
              return (
                <li key={m.codigo}>
                  {aqui ? (
                    <span className="flex items-center gap-3 rounded-xl bg-riel-900/5 px-3 py-2.5">
                      {contenido}
                    </span>
                  ) : (
                    <a
                      href={`https://${m.dominio}/${idioma}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-riel-900/5"
                    >
                      {contenido}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </>
  );
}
