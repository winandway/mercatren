"use client";

import { Loader2 } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { BannerPublicitario } from "@/components/catalogo/banner-publicitario";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { intercalarBanners, type BannerPublico } from "@/lib/banners/reglas";
import type { ProductoLista } from "@/lib/catalogo/consultas";
import {
  casillaDe,
  LISTA_GUARDADA_MAXIMO,
  type ListaGuardada,
  seDevuelveLoGuardado,
} from "@/lib/catalogo/seguir-bajando";
import type { Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/**
 * TODOS los productos, en parrilla, cargando solos mientras se baja.
 *
 * Es lo que hacen Mercado Libre y AliExpress, y por la misma razón: el
 * cliente que llega no quiere navegar un índice, quiere ver cosas. Con 622
 * productos, meterlos en dos carruseles de catorce era enseñar el 4% del
 * catálogo y esconder el resto detrás de una flechita.
 *
 * LA SEMILLA LA PONE EL SERVIDOR y viaja en cada tanda. Si cada tanda barajara
 * de nuevo, al bajar saldría el mismo taladro tres veces y otros productos
 * no saldrían nunca.
 *
 * ══ YA NO ES SOLO LA PORTADA (20 sep 2026) ══
 * El catálogo, las búsquedas, los departamentos y las tiendas tenían un botón
 * «Siguiente» («Página 1 de 36»). Ahora usan esta misma pieza: con `consulta`
 * las tandas salen del listado con SUS filtros en vez de la parrilla
 * barajada. Una sola petición a la vez, 800 px antes de llegar al final, y se
 * deja de pedir cuando no hay más.
 */

/** ¿La persona llegó aquí con «atrás» o «adelante»? Ver `seguir-bajando.ts`. */
let ultimaVueltaMs = 0;
let yaMontoUnaVez = false;
if (typeof window !== "undefined") {
  /* ══ CUÁNDO SE ENTERA UNO DE QUE ES UNA VUELTA (medido el 20 sep 2026) ══
     Next vuelve a montar la página ANTES de que llegue `popstate`: la lista
     nacía creyéndose una visita nueva y 20 ms después llegaba el aviso. Por
     eso se escucha primero la API de navegación (`navigate` avisa al empezar,
     con `traverse` para atrás/adelante) y `popstate` queda de respaldo para
     los navegadores que todavía no la traen — ahí la lista se corrige sola
     en cuanto llega el aviso (ver `crearAlmacen`). */
  type ConNavegacion = {
    navigation?: {
      addEventListener: (
        tipo: "navigate",
        oyente: (e: { navigationType?: string }) => void,
      ) => void;
    };
  };
  (window as unknown as ConNavegacion).navigation?.addEventListener(
    "navigate",
    (e) => {
      if (e.navigationType === "traverse") ultimaVueltaMs = Date.now();
    },
  );
  window.addEventListener(
    "popstate",
    () => {
      ultimaVueltaMs = Date.now();
    },
    true,
  );
}
function esUnaVuelta(): boolean {
  if (typeof window === "undefined") return false;
  if (Date.now() - ultimaVueltaMs < 4000) return true;
  if (yaMontoUnaVez) return false;
  /* La primera pintura del documento: si el navegador lo cargó entero por
     «atrás» (sin caché de página), lo dice la entrada de navegación. */
  const [nav] = performance.getEntriesByType("navigation") as
    PerformanceNavigationTiming[] | [];
  return nav?.type === "back_forward";
}

function leerGuardada(llave: string): ListaGuardada<ProductoLista> | null {
  try {
    const crudo = window.sessionStorage.getItem(llave);
    return crudo ? (JSON.parse(crudo) as ListaGuardada<ProductoLista>) : null;
  } catch {
    return null; /* Navegación privada o cuota llena: se sigue sin memoria. */
  }
}

function guardar(llave: string, lista: ListaGuardada<ProductoLista>): void {
  try {
    window.sessionStorage.setItem(llave, JSON.stringify(lista));
  } catch {
    /* idem */
  }
}

/**
 * Lo guardado de ESTA lista, servido con `useSyncExternalStore`: en el
 * servidor y durante la hidratación vale `null` (se pinta lo mismo que mandó
 * el servidor) y justo después React vuelve a pintar con lo recuperado. Es la
 * forma de leer algo de fuera de React sin cambiar el estado en un efecto.
 *
 * Se decide al montar; y si el navegador avisa TARDE de que era una vuelta
 * (`popstate` llega después del montaje donde no hay API de navegación), se
 * decide otra vez durante el primer segundo y medio, y la lista se corrige.
 */
type Almacen = {
  leer: () => ListaGuardada<ProductoLista> | null;
  suscribir: (avisar: () => void) => () => void;
};
const ALMACEN_VACIO: Almacen = { leer: () => null, suscribir: () => () => {} };
const VENTANA_DEL_AVISO_TARDIO_MS = 1500;
/** Lo que se espera antes de la primera petición: ver `nacio`. */
const ESPERA_AL_NACER_MS = 200;

function crearAlmacen(
  llave: string | null,
  clave: string | undefined,
  primerId: string | null,
  paginaInicial: number,
): Almacen {
  if (typeof window === "undefined" || !llave || !clave) return ALMACEN_VACIO;
  let valor: ListaGuardada<ProductoLista> | null = null;
  /* Se lee UNA vez, al nacer: esta misma lista vuelve a guardar al poco rato
     (y en desarrollo React la desmonta y la monta de nuevo), así que leer
     después sería leerse a sí misma recién nacida, con 24 productos. */
  const guardadaAlNacer = leerGuardada(llave);
  const decidir = () => {
    const decision = {
      guardada: guardadaAlNacer,
      clave,
      esVuelta: esUnaVuelta(),
      primerIdAhora: primerId,
      paginaInicial,
      ahora: Date.now(),
    };
    valor = seDevuelveLoGuardado(decision) ? decision.guardada : null;
  };
  decidir();
  return {
    leer: () => valor,
    suscribir: (avisar) => {
      if (valor) return () => {};
      const alVolver = () => {
        decidir();
        if (valor) avisar();
      };
      window.addEventListener("popstate", alVolver);
      /* El aviso pudo llegar entre el montaje y esta suscripción (React se
         suscribe después de pintar): se mira otra vez ahora mismo. */
      const alSuscribir = window.setTimeout(alVolver, 0);
      const fin = window.setTimeout(
        () => window.removeEventListener("popstate", alVolver),
        VENTANA_DEL_AVISO_TARDIO_MS,
      );
      return () => {
        window.clearTimeout(alSuscribir);
        window.clearTimeout(fin);
        window.removeEventListener("popstate", alVolver);
      };
    },
  };
}
const nadaEnElServidor = () => null;

export function ParrillaInfinita({
  inicial,
  semilla,
  paginas,
  idioma,
  textoCargando,
  textoFinal,
  sinFiltroDeZona = false,
  desdePagina = 1,
  banners = [],
  consulta,
  columnas = "grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7",
  clave,
  primero,
}: {
  inicial: ProductoLista[];
  /** Los banners de la casa, que se meten cada tantos productos sobre TODO lo cargado. */
  banners?: BannerPublico[];
  semilla: number;
  paginas: number;
  /**
   * La tanda inicial puede no ser la primera: la portada enseña la página 1
   * arriba («De todas las tiendas») y aquí abajo sigue desde la 2, así que
   * la siguiente que se pide es la 3 y nada sale repetido.
   */
  desdePagina?: number;
  idioma: Idioma;
  textoCargando: string;
  textoFinal: string;
  /**
   * La primera tanda la armó el servidor; las siguientes tienen que seguir la
   * MISMA regla, o al bajar aparecería mercancía de otra ciudad en una
   * portada filtrada. El servidor de tandas lee la ciudad de la cookie; esta
   * bandera le dice cuándo ignorarla (portada en "toda Venezuela").
   */
  sinFiltroDeZona?: boolean;
  /**
   * Un listado con filtros (búsqueda, departamento, tienda): lo que arma
   * `consultaDeLista`. Sin esto, es la parrilla barajada de la portada.
   */
  consulta?: string;
  /** Las columnas de la parrilla: cada página conserva las suyas. */
  columnas?: string;
  /**
   * Con clave, lo bajado se recuerda en esta pestaña: al volver de una ficha
   * la lista sigue donde estaba. Tiene que identificar ESTE listado (la
   * dirección con sus filtros).
   */
  clave?: string;
  /** Una pieza fija al principio de la parrilla (el mapa del almacén). */
  primero?: ReactNode;
}) {
  const llave = clave ? casillaDe(clave) : null;
  const primerId = inicial[0]?.id ?? null;

  /* AL VOLVER DE UNA FICHA: se devuelve lo que ya había bajado y se le deja
     donde iba. Ver `seguir-bajando.ts`. */
  const [almacen] = useState(() =>
    crearAlmacen(llave, clave, primerId, desdePagina),
  );
  const recuperada = useSyncExternalStore(
    almacen.suscribir,
    almacen.leer,
    nadaEnElServidor,
  );

  /* Lo que se ve: lo bajado en esta visita; si no ha bajado nada, lo
     recuperado; y si tampoco, lo que pintó el servidor. */
  const [bajado, setBajado] = useState<{
    productos: ProductoLista[];
    pagina: number;
  } | null>(null);
  const productos = bajado?.productos ?? recuperada?.productos ?? inicial;
  const pagina = bajado?.pagina ?? recuperada?.pagina ?? desdePagina;

  const [cargando, setCargando] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);
  const ultimoAlto = useRef(0);
  /* El cerrojo va en una referencia y no en el estado: el scroll dispara
     varias veces antes de que React vuelva a pintar, y con el estado solo
     se pedía la MISMA tanda dos veces (visto en la prueba del 20 sep). */
  const pidiendo = useRef(false);
  const hayMas = pagina < paginas;

  /* Recién nacida no pide nada: en los navegadores que avisan tarde de que
     era una vuelta, la lista nace arriba de todo lo que el navegador ya bajó,
     y pedir ahí es traer otra vez lo que está a punto de devolverse. */
  const nacio = useRef(0);
  useEffect(() => {
    yaMontoUnaVez = true;
    nacio.current = performance.now();
  }, []);

  /* Y se le deja a la altura donde iba, antes de pintar. */
  useLayoutEffect(() => {
    if (recuperada) window.scrollTo(0, recuperada.alto);
  }, [recuperada]);

  /* Se guarda al irse (a una ficha, a otra página o al cerrar), con la altura
     que se vio por última vez EN esta página: cuando esto corre, el navegador
     ya puede haber empezado a subir para la siguiente. */
  useEffect(() => {
    if (!llave || !clave) return;
    const alGuardar = () => {
      if (productos.length > LISTA_GUARDADA_MAXIMO) return;
      guardar(llave, {
        clave,
        primerId,
        productos,
        pagina,
        alto: ultimoAlto.current,
        guardadoEn: Date.now(),
      });
    };
    window.addEventListener("pagehide", alGuardar);
    return () => {
      window.removeEventListener("pagehide", alGuardar);
      alGuardar();
    };
  }, [llave, clave, primerId, productos, pagina]);

  const traerMas = useCallback(async () => {
    if (pidiendo.current || !hayMas) return;
    pidiendo.current = true;
    setCargando(true);

    try {
      const siguiente = pagina + 1;
      const r = await fetch(
        consulta
          ? `/datos/catalogo?${consulta}&pagina=${siguiente}`
          : `/datos/catalogo?pagina=${siguiente}&semilla=${semilla}${sinFiltroDeZona ? "&todas=1" : ""}`,
      );
      const datos = (await r.json()) as { productos: ProductoLista[] };

      if (datos.productos?.length) {
        /* Sin repetidos: si el listado se rehízo entre una tanda y la
           siguiente, un producto puede caer en las dos. */
        const vistos = new Set(productos.map((p) => p.id));
        setBajado({
          productos: [
            ...productos,
            ...datos.productos.filter((p) => !vistos.has(p.id)),
          ],
          pagina: siguiente,
        });
      } else {
        // Sin nada que agregar, se deja de pedir: si no, cada scroll
        // dispararía otra petición que tampoco trae nada.
        setBajado({ productos, pagina: paginas });
      }
    } catch {
      // Un fallo de red no puede dejar la parrilla trabada: se vuelve a
      // intentar en el siguiente scroll.
    } finally {
      pidiendo.current = false;
      setCargando(false);
    }
  }, [consulta, hayMas, pagina, paginas, productos, semilla, sinFiltroDeZona]);

  /**
   * Se mide la posición a mano en vez de usar IntersectionObserver, igual que
   * en la lista de tiques: es más fácil de seguir y no se queda pegado cuando
   * el contenido cambia de alto al cargar las fotos.
   *
   * 800px de adelanto para que la siguiente tanda esté lista antes de que se
   * llegue al final y no se vea el salto.
   */
  useEffect(() => {
    const nodo = centinela.current;

    const mirar = () => {
      ultimoAlto.current = window.scrollY;
      if (!nodo || !hayMas) return;
      if (performance.now() - nacio.current < ESPERA_AL_NACER_MS) return;
      if (nodo.getBoundingClientRect().top < window.innerHeight + 800) {
        void traerMas();
      }
    };

    const falta = ESPERA_AL_NACER_MS - (performance.now() - nacio.current);
    const alNacer = window.setTimeout(mirar, Math.max(0, falta) + 10);
    window.addEventListener("scroll", mirar, { passive: true });
    window.addEventListener("resize", mirar, { passive: true });
    return () => {
      window.clearTimeout(alNacer);
      window.removeEventListener("scroll", mirar);
      window.removeEventListener("resize", mirar);
    };
  }, [hayMas, traerMas]);

  return (
    <>
      {/* TRES POR HILERA EN EL CELULAR en la portada, como Amazon. Con dos,
          cada foto sale enorme y en la primera pantalla apenas caben dos
          productos; con tres se ven seis y la tienda parece una tienda. El
          catálogo y las tiendas traen sus propias columnas. */}
      <ul className={cn("grid", columnas)}>
        {primero}
        {intercalarBanners(productos, banners).map((x, i) =>
          x.tipo === "banner" ? (
            <li key={`banner-${x.banner.id}-${i}`} className="col-span-full">
              <BannerPublicitario banner={x.banner} />
            </li>
          ) : (
            <li key={x.item.id}>
              <TarjetaProducto producto={x.item} idioma={idioma} />
            </li>
          ),
        )}
      </ul>

      <div ref={centinela} className="py-8 text-center" aria-live="polite">
        {cargando ? (
          <p className="inline-flex items-center gap-2 text-sm text-tinta-suave">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {textoCargando}
          </p>
        ) : !hayMas && paginas > 1 ? (
          <p className="text-sm text-tinta-suave">{textoFinal}</p>
        ) : null}
      </div>
    </>
  );
}
