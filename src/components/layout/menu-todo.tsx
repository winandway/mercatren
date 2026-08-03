"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

type Enlace = { href: string; texto: string };

/**
 * El menu "Todo" del encabezado, como el de las tiendas grandes: se abre un
 * panel desde la izquierda con las categorias del catalogo y las secciones
 * del sitio.
 *
 * Antes era un boton que no hacia nada. Un boton que no hace nada es peor que
 * no tener boton.
 */
export function MenuTodo({
  etiqueta,
  categorias,
  secciones,
  tituloCategorias,
  tituloSecciones,
  cerrar,
}: {
  etiqueta: string;
  categorias: Enlace[];
  secciones: Enlace[];
  tituloCategorias: string;
  tituloSecciones: string;
  cerrar: string;
}) {
  const [abierto, setAbierto] = useState(false);

  // Con el panel abierto, la pagina de atras no se mueve; y Escape lo cierra,
  // que es lo que la gente intenta por instinto.
  useEffect(() => {
    if (!abierto) return;

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={abierto}
        className="celda-encabezado flex shrink-0 items-center gap-1 font-bold"
      >
        <Menu className="h-4 w-4" aria-hidden />
        {etiqueta}
      </button>

      {abierto ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label={cerrar}
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-riel-950/60"
          />

          <nav className="relative flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-white text-tinta shadow-xl">
            <div className="flex items-center justify-between bg-riel-900 px-5 py-4 text-white">
              <p className="text-lg font-bold">{etiqueta}</p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label={cerrar}
                className="rounded p-1 transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {categorias.length > 0 ? (
              <section className="border-b border-borde px-5 py-4">
                <h2 className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
                  {tituloCategorias}
                </h2>
                <ul className="mt-2">
                  {categorias.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={() => setAbierto(false)}
                        className="block py-2.5 text-sm font-medium hover:text-carga-600"
                      >
                        {c.texto}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="px-5 py-4">
              <h2 className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
                {tituloSecciones}
              </h2>
              <ul className="mt-2">
                {secciones.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      onClick={() => setAbierto(false)}
                      className="block py-2.5 text-sm font-medium hover:text-carga-600"
                    >
                      {s.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </nav>
        </div>
      ) : null}
    </>
  );
}
