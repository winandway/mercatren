"use client";

import {
  Camera,
  ImageOff,
  Loader2,
  Search,
  Store,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

type Sugerencia = {
  slug: string;
  titulo: string;
  precioCentavos: number;
  moneda: string;
  imagenUrl: string | null;
  tiendaNombre: string;
  tiendaSlug: string;
  agotado: boolean;
};

type Resultado = {
  productos: Sugerencia[];
  comercios: { slug: string; nombre: string }[];
  total: number;
};

const VACIO: Resultado = { productos: [], comercios: [], total: 0 };

/** Se espera un pelin entre teclas para no consultar en cada letra. */
const ESPERA_MS = 160;

/** Sin acentos y en minusculas, igual que en el servidor. */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Resalta en el titulo las palabras que la persona escribio.
 * Es lo que hace que se entienda de un vistazo por que salio ese resultado.
 */
function Resaltado({ texto, palabras }: { texto: string; palabras: string[] }) {
  if (palabras.length === 0) return <>{texto}</>;

  const plano = normalizar(texto);
  const marcado = new Array<boolean>(texto.length).fill(false);

  for (const palabra of palabras) {
    let desde = plano.indexOf(palabra);
    while (desde !== -1) {
      for (
        let i = desde;
        i < desde + palabra.length && i < marcado.length;
        i++
      ) {
        marcado[i] = true;
      }
      desde = plano.indexOf(palabra, desde + palabra.length);
    }
  }

  // Se juntan los caracteres seguidos que estan marcados igual.
  const trozos: { texto: string; resaltado: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = trozos[trozos.length - 1];
    if (ultimo && ultimo.resaltado === marcado[i]) ultimo.texto += texto[i];
    else trozos.push({ texto: texto[i], resaltado: marcado[i] });
  }

  return (
    <>
      {trozos.map((t, i) =>
        t.resaltado ? (
          <mark key={i} className="bg-carga-500/25 text-inherit">
            {t.texto}
          </mark>
        ) : (
          <span key={i}>{t.texto}</span>
        ),
      )}
    </>
  );
}

/**
 * El buscador del encabezado.
 *
 * Busca mientras se escribe: a partir de la segunda letra va mostrando los
 * productos que calzan, con su foto y su precio, y se puede elegir con las
 * flechas del teclado. El motor esta en src/lib/catalogo/buscar.ts y entiende
 * varias palabras en cualquier orden, sin importar acentos.
 *
 * OJO A DONDE MANDA: al catalogo con ?q=. Antes apuntaba a /buscar, una
 * pagina que no existe, y toda busqueda terminaba en un 404.
 */
export function Buscador({ idioma }: { idioma: Idioma }) {
  const t = useTranslations("encabezado");
  const router = useRouter();
  const parametros = useSearchParams();
  const idLista = useId();

  // Si ya se busco algo, la caja lo conserva para poder corregirlo.
  const [texto, setTexto] = useState(parametros.get("q") ?? "");
  const [resultado, setResultado] = useState<Resultado>(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [elegido, setElegido] = useState(-1);

  const caja = useRef<HTMLFormElement>(null);
  const peticion = useRef<AbortController | null>(null);

  const palabras = normalizar(texto)
    .split(/[\s,]+/)
    .filter((p) => p.length > 1);

  // Busca al escribir. Cada tecla cancela la consulta anterior, asi que
  // siempre se pinta la respuesta de lo ultimo escrito y no la que llegue
  // tarde de una letra vieja.
  useEffect(() => {
    const limpio = texto.trim();

    // Todo el trabajo va dentro del temporizador, nunca en el cuerpo del
    // efecto: cambiar el estado ahi mismo dispara renders en cascada.
    const reloj = setTimeout(async () => {
      if (limpio.length < 2) {
        setResultado(VACIO);
        setCargando(false);
        return;
      }

      setCargando(true);
      peticion.current?.abort();
      const control = new AbortController();
      peticion.current = control;

      try {
        const r = await fetch(`/datos/buscar?q=${encodeURIComponent(limpio)}`, {
          signal: control.signal,
        });
        const datos = (await r.json()) as Resultado;
        setResultado(datos);
        setElegido(-1);
      } catch (e) {
        // Abortar es lo normal aqui: solo se reporta lo que no lo es.
        if ((e as Error)?.name !== "AbortError") setResultado(VACIO);
      } finally {
        setCargando(false);
      }
    }, ESPERA_MS);

    return () => clearTimeout(reloj);
  }, [texto]);

  // Un clic fuera cierra el desplegable.
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alTocar);
    return () => document.removeEventListener("mousedown", alTocar);
  }, [abierto]);

  function irAlCatalogo(consulta: string) {
    setAbierto(false);
    const limpio = consulta.trim();
    router.push(
      limpio ? `/catalogo?q=${encodeURIComponent(limpio)}` : "/catalogo",
    );
  }

  function irAlProducto(slug: string) {
    setAbierto(false);
    router.push(`/producto/${slug}`);
  }

  const hayQueMostrar =
    abierto &&
    texto.trim().length >= 2 &&
    (resultado.productos.length > 0 ||
      resultado.comercios.length > 0 ||
      !cargando);

  return (
    <form
      ref={caja}
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        // Con una sugerencia elegida con las flechas, se va a ese producto.
        if (elegido >= 0 && resultado.productos[elegido]) {
          irAlProducto(resultado.productos[elegido].slug);
        } else {
          irAlCatalogo(texto);
        }
      }}
    >
      <div className="flex h-10 w-full overflow-hidden rounded-md bg-white focus-within:ring-3 focus-within:ring-carga-500">
        <label htmlFor="buscador" className="sr-only">
          {t("buscar")}
        </label>
        <input
          id="buscador"
          name="q"
          type="search"
          value={texto}
          role="combobox"
          aria-expanded={hayQueMostrar}
          aria-controls={idLista}
          aria-autocomplete="list"
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={(e) => {
            const cuantos = resultado.productos.length;
            if (e.key === "ArrowDown" && cuantos) {
              e.preventDefault();
              setElegido((n) => (n + 1) % cuantos);
            } else if (e.key === "ArrowUp" && cuantos) {
              e.preventDefault();
              setElegido((n) => (n <= 0 ? cuantos - 1 : n - 1));
            } else if (e.key === "Escape") {
              setAbierto(false);
            }
          }}
          placeholder={t("buscarPlaceholder")}
          autoComplete="off"
          className="min-w-0 flex-1 px-3 text-sm text-tinta outline-none placeholder:text-tinta-suave"
        />
        {/* LA CÁMARA (30 ago 2026): buscar con una foto. Vive DENTRO de la
            caja del buscador — es otra forma de buscar, no otra sección. */}
        <Link
          href="/buscar-con-foto"
          aria-label={t("buscarConFoto")}
          title={t("buscarConFoto")}
          className="flex w-10 shrink-0 items-center justify-center text-tinta-suave transition-colors hover:text-tinta"
        >
          <Camera className="h-5 w-5" aria-hidden />
        </Link>
        <button
          type="submit"
          aria-label={t("buscar")}
          className="flex w-12 shrink-0 items-center justify-center bg-carga-500 text-riel-950 transition-colors hover:bg-carga-600"
        >
          {cargando ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Search className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {hayQueMostrar ? (
        <div
          id={idLista}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg bg-white text-tinta shadow-2xl ring-1 ring-black/10"
        >
          {resultado.productos.length === 0 && !cargando ? (
            <p className="px-4 py-6 text-center text-sm text-tinta-suave">
              {t("sinResultados", { texto: texto.trim() })}
            </p>
          ) : null}

          {resultado.productos.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              role="option"
              aria-selected={i === elegido}
              onMouseEnter={() => setElegido(i)}
              onClick={() => irAlProducto(p.slug)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                i === elegido ? "bg-carga-500/10" : "hover:bg-slate-50",
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-50">
                {p.imagenUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.imagenUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageOff className="h-4 w-4 text-tinta-suave" aria-hidden />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-sm leading-snug">
                  <Resaltado texto={p.titulo} palabras={palabras} />
                </span>
                <span className="mt-0.5 block truncate text-xs text-tinta-suave">
                  {p.tiendaNombre}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold tabular-nums">
                  {formatearPrecio(p.precioCentavos, idioma, p.moneda)}
                </span>
                {p.agotado ? (
                  <span className="block text-[11px] text-tinta-suave">
                    {t("agotado")}
                  </span>
                ) : null}
              </span>
            </button>
          ))}

          {resultado.comercios.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                setAbierto(false);
                router.push(`/tienda/${c.slug}`);
              }}
              className="flex w-full items-center gap-3 border-t border-borde px-3 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <Store
                className="h-4 w-4 shrink-0 text-tinta-suave"
                aria-hidden
              />
              <span className="truncate">
                <Resaltado texto={c.nombre} palabras={palabras} />
              </span>
              <span className="ml-auto shrink-0 text-xs text-tinta-suave">
                {t("verTienda")}
              </span>
            </button>
          ))}

          {resultado.total > 0 ? (
            <button
              type="button"
              onClick={() => irAlCatalogo(texto)}
              className="flex w-full items-center justify-center gap-2 border-t border-borde bg-slate-50 px-4 py-3 text-sm font-semibold text-carga-600 hover:bg-slate-100"
            >
              <TrendingUp className="h-4 w-4" aria-hidden />
              {t("verTodos", { n: resultado.total })}
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
