import { Bloques } from "@/components/docs/bloques";
import { MODELO_ES } from "@/contenido/docs/modelo.es";
import type { PaginaContenido } from "@/contenido/paginas/tipos";

/**
 * El molde de todas las paginas de texto del sitio: terminos, privacidad,
 * quienes somos, ayuda, vender.
 *
 * Una sola forma para todas, para que el sitio se sienta de una pieza y para
 * que agregar una pagina nueva sea escribir su contenido y nada mas.
 */
export function PaginaDeContenido({ pagina }: { pagina: PaginaContenido }) {
  const conIndice = pagina.indiceTitulo && pagina.secciones.length > 3;

  return (
    <>
      <header className="bg-riel-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {pagina.titulo}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/70">
            {pagina.entradilla}
          </p>
          {pagina.vigencia ? (
            <p className="mt-5 text-xs text-white/50">{pagina.vigencia}</p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div
          className={
            conIndice ? "lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12" : undefined
          }
        >
          {conIndice ? (
            <nav
              aria-label={pagina.indiceTitulo}
              className="lg:sticky lg:top-6 lg:self-start"
            >
              <p className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
                {pagina.indiceTitulo}
              </p>
              <ol className="mt-3 space-y-1.5 border-l border-borde">
                {pagina.secciones.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="-ml-px flex gap-2 border-l-2 border-transparent py-1 pl-3 text-sm text-tinta-suave transition-colors hover:border-carga-500 hover:text-tinta"
                    >
                      {s.numero ? (
                        <span className="font-bold text-carga-500">
                          {s.numero}
                        </span>
                      ) : null}
                      <span className="leading-snug">{s.titulo}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <article className={conIndice ? "mt-10 min-w-0 lg:mt-0" : "min-w-0"}>
            {pagina.secciones.map((seccion, i) => (
              <section
                key={seccion.id}
                id={seccion.id}
                className={
                  i === 0
                    ? "scroll-mt-6"
                    : "mt-12 scroll-mt-6 border-t border-borde pt-8"
                }
              >
                <h2 className="flex gap-3 text-xl font-extrabold tracking-tight sm:text-2xl">
                  {seccion.numero ? (
                    <span className="text-carga-500">{seccion.numero}</span>
                  ) : null}
                  <span className="text-balance">{seccion.titulo}</span>
                </h2>
                {/* Las figuras del documento del modelo no se usan aqui, pero
                    el renderizador las pide: se le pasan las que ya existen. */}
                <Bloques
                  bloques={seccion.bloques}
                  figuras={MODELO_ES.figuras}
                />
              </section>
            ))}

            {pagina.cierre ? (
              <p className="mt-10 border-t border-borde pt-6 text-xs leading-relaxed text-tinta-suave">
                {pagina.cierre}
              </p>
            ) : null}
          </article>
        </div>
      </div>
    </>
  );
}
