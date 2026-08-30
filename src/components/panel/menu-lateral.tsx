"use client";

import {
  Activity,
  Clapperboard,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  FileText,
  Flag,
  Languages,
  LayoutDashboard,
  Calculator,
  Megaphone,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
  Camera,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Salir } from "@/components/cuenta/salir";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Entrada = {
  href: string;
  clave: string;
  Icono: typeof LayoutDashboard;
  /** true = solo el equipo de Mercatren la ve. */
  soloInterno?: boolean;
};

/**
 * EL MENÚ SE ORDENA POR TRABAJO, NO POR MECANISMO.
 *
 * ══ CÓMO ESTABA Y POR QUÉ NO SERVÍA ══
 *
 * «Operación» juntaba un método de cobro (Pagos Zelle) con el dinero
 * (billetera, retiros) y con el papeleo (órdenes de compra). Y **Órdenes —las
 * ventas, el corazón del negocio— estaba metida dentro de «Catálogo»**, entre
 * los productos y los comercios. El dueño lo dijo entero: «está muy mal
 * organizado».
 *
 * El nombre de un grupo tiene que contestar «¿qué vengo a hacer?». Se viene a
 * mirar las VENTAS, a mover el DINERO, a cuidar MI NEGOCIO. No se viene a
 * «operación».
 */
const GRUPOS: { titulo: string; entradas: Entrada[] }[] = [
  {
    titulo: "ventas",
    entradas: [
      { href: "/panel", clave: "resumen", Icono: LayoutDashboard },
      // Lo que se vendió. Antes vivía enterrada dentro de «Catálogo».
      { href: "/panel/ordenes", clave: "ordenes", Icono: ShoppingBag },
      /* TODO el dinero que entra, en un solo sitio: tarjeta, Zelle y los
         enlaces de cobro. Antes solo había Zelle, y la tarjeta —el método de
         la primera venta real— no aparecía en ninguna pantalla. */
      { href: "/panel/cobros", clave: "cobros", Icono: Receipt },
      /* CUADRAR UNA FACTURA: cuántas unidades dan un monto exacto. Nació de
         un comercio con una factura de $7.475 y tubos de $199,05 que estaba
         probando cantidades a mano desde el celular. */
      {
        href: "/panel/calculadora",
        clave: "calculadora",
        Icono: Calculator,
      },
      { href: "/panel/validacion", clave: "validacion", Icono: ShieldCheck },
    ],
  },
  {
    titulo: "dinero",
    entradas: [
      { href: "/panel/billetera", clave: "billetera", Icono: Wallet },
      // Sacar el dinero de la billetera: el comercio pide, el equipo paga.
      { href: "/panel/retiros", clave: "retiros", Icono: ArrowUpRight },
      /* La otra mitad de cada venta: el comercio nos factura la mercancía que
         le compramos. Sin ese documento queda una compra sin respaldo. */
      {
        href: "/panel/ordenes-compra",
        clave: "ordenesCompra",
        Icono: FileText,
      },
    ],
  },
  {
    titulo: "miNegocio",
    entradas: [
      // Su propia tienda: la marca, la ficha y los datos de la empresa.
      { href: "/panel/mi-tienda", clave: "miTienda", Icono: Store },
      { href: "/panel/productos", clave: "misProductos", Icono: Package },
      /* LOS SHORTS DEL COMERCIO (23 ago 2026): su tienda por dentro, en video.
         Va en «Mi negocio» y no en «Equipo» porque es del comercio: lo graba
         él, sale en su tienda y con su nombre. */
      { href: "/panel/videos", clave: "misVideos", Icono: Clapperboard },
      // Cada comercio ve SUS clientes; el equipo, todos.
      { href: "/panel/clientes", clave: "clientes", Icono: Users },
      /* A quién le fía y cuánto le deben. El crédito lo da el comercio con su
         propio riesgo; aquí solo lleva la cuenta. */
      { href: "/panel/creditos", clave: "creditos", Icono: CreditCard },
    ],
  },
  {
    titulo: "equipo",
    entradas: [
      {
        href: "/panel/tiendas",
        clave: "tiendas",
        Icono: Store,
        soloInterno: true,
      },
      /* EL CATÁLOGO DE ESTADOS UNIDOS. Es el nuestro, no el de un comercio:
         Mercatren LLC compra a CJ y revende. Por eso vive en «Equipo» y no en
         «Mi negocio», que es donde cada proveedor ve lo suyo. */
      {
        href: "/panel/catalogo-usa",
        clave: "catalogoUsa",
        Icono: Flag,
        soloInterno: true,
      },
      /* LO QUE HAY QUE COMPRARLE AL PROVEEDOR para despachar cada venta de
         Estados Unidos. Va en «Equipo» y no en «Dinero» porque aquí se ven
         enlaces que cobran de NUESTRA tarjeta y el costo real de la mercancía
         — el número que un comercio no puede ver jamás. */
      {
        href: "/panel/proveedor",
        clave: "proveedor",
        Icono: Truck,
        soloInterno: true,
      },
      /* TIENDAS USA es OTRO trabajo: la de arriba sirve para agregar y esta
         para saber cuánto llevamos, en qué tienda está y qué departamento
         sigue vacío. Dos botones porque son dos preguntas distintas. */
      {
        href: "/panel/tiendas-usa",
        clave: "tiendasUsa",
        Icono: Store,
        soloInterno: true,
      },
      // Las CUENTAS del sistema, que no es lo mismo que los compradores.
      {
        href: "/panel/usuarios",
        clave: "usuarios",
        Icono: UserRound,
        soloInterno: true,
      },
      {
        href: "/panel/configuracion",
        clave: "configuracion",
        Icono: Settings,
        soloInterno: true,
      },
      /* CÓMO SE HABLA DE MERCATREN. Material interno: enseña las palabras que
         describen una figura jurídica que no es la nuestra, y por qué. Es del
         equipo, no de los proveedores. */
      {
        /* Las fotos con las que buscan los clientes: la demanda sin cubrir. */
        href: "/panel/busquedas-imagen",
        clave: "busquedasImagen",
        Icono: Camera,
      },
      {
        /* Solo personas, cero robots: visitas, países, en vivo. */
        href: "/panel/trafico",
        clave: "trafico",
        Icono: Activity,
      },
      {
        href: "/panel/diccionario",
        clave: "diccionario",
        Icono: BookOpen,
        soloInterno: true,
      },
      /* LA PUBLICIDAD DE LA CASA: los banners que salen en medio de las
         parrillas. Los maneja solo el equipo (rol soporte). */
      {
        href: "/panel/banners",
        clave: "banners",
        Icono: Megaphone,
        soloInterno: true,
      },
      /* LOS CANALES DE VIDEO DE MERCATREN («Tu Próximo Producto Ganador» y
         los que vengan). Cada uno tiene su enlace con PIN para subir desde el
         celular, y esas llaves solo las ve el equipo. */
      {
        href: "/panel/secciones",
        clave: "secciones",
        Icono: Clapperboard,
        soloInterno: true,
      },
    ],
  },
];

export function MenuLateral({
  porValidar = 0,
  porRetirar = 0,
  esInterno = false,
  nombre = "",
  paisDelPanel = "US",
}: {
  porValidar?: number;
  /** Retiros esperando a que alguien haga la transferencia. */
  porRetirar?: number;
  /** El equipo de Mercatren ve la operacion completa; un comercio, solo la suya. */
  esInterno?: boolean;
  nombre?: string;
  /**
   * EL MENÚ DICE EL CATÁLOGO DEL PAÍS ELEGIDO (27 ago 2026).
   *
   * Con el selector en Chile, la página se titulaba «Catálogo de Chile» y el
   * menú seguía diciendo «Catálogo de EE. UU.»: el dueño buscó dónde entrar y
   * se perdió con razón — dos letreros distintos para la misma puerta.
   */
  paisDelPanel?: string;
}) {
  const t = useTranslations("panel");
  const pathname = usePathname();
  const router = useRouter();
  const idioma = useLocale();
  const otroIdioma = idioma === "es" ? "en" : "es";
  const [abierto, setAbierto] = useState(false);

  const contenido = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <div className="flex items-center gap-2 px-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-carga-500/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_mercatren/mercatren-isotipo.svg"
            alt=""
            className="h-5 w-5"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">
            Mercatren
          </span>
          <span className="block truncate text-xs text-white/50">
            {nombre || t("titulo")}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-6">
        {GRUPOS.map((grupo) => {
          const entradas = grupo.entradas.filter(
            (e) => esInterno || !e.soloInterno,
          );
          if (entradas.length === 0) return null;
          return (
            <div key={grupo.titulo}>
              <h2 className="px-3 pb-2 text-[12px] font-semibold tracking-wider text-white/40 uppercase">
                {t(`menu.${grupo.titulo}`)}
              </h2>
              <ul className="space-y-0.5">
                {entradas.map(({ href, clave, Icono }) => {
                  /* Dos entradas se llaman distinto según quién mire, porque
                     son cosas distintas: el comercio no valida nada —solo ve
                     en qué va lo suyo— y la billetera, que para el equipo es
                     lo que hay POR PAGAR, para él es SU dinero. */
                  const PARA_EL_COMERCIO: Record<string, string> = {
                    validacion: "validacionComercio",
                    billetera: "billeteraComercio",
                    /* No es «una orden de compra» abstracta: es donde nos
                       factura lo que le compramos. Así sabe qué va a hacer
                       ahí sin tener que entrar a averiguarlo. */
                    ordenesCompra: "ordenesCompraComercio",
                  };
                  let etiqueta = !esInterno
                    ? (PARA_EL_COMERCIO[clave] ?? clave)
                    : clave;
                  /* EL CATÁLOGO SE LLAMA COMO EL PAÍS ELEGIDO. Con el
                     selector en Chile, la página decía «Catálogo de Chile» y
                     este menú «Catálogo de EE. UU.»: dos letreros distintos
                     para la misma puerta — el dueño se perdió con razón. */
                  if (clave === "catalogoUsa" && paisDelPanel === "CL") {
                    etiqueta = "catalogoCl";
                  }
                  if (clave === "catalogoUsa" && paisDelPanel === "CO") {
                    etiqueta = "catalogoCo";
                  }
                  /* Coincidencia por tramo completo, no por prefijo de texto:
                     con `startsWith` a secas, «/panel/ordenes-compra» dejaba
                     encendida también a «/panel/ordenes» y el menú marcaba dos
                     secciones a la vez. */
                  const activo =
                    pathname === href || pathname.startsWith(`${href}/`);
                  const insignia =
                    clave === "validacion"
                      ? porValidar
                      : clave === "retiros"
                        ? porRetirar
                        : 0;

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setAbierto(false)}
                        aria-current={activo ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          activo
                            ? "bg-riel-800 font-semibold text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {activo ? (
                          <span
                            aria-hidden
                            className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r bg-carga-500"
                          />
                        ) : null}
                        <Icono className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">
                          {t(`menu.${etiqueta}`)}
                        </span>
                        {insignia > 0 ? (
                          <span className="shrink-0 rounded-full bg-carga-500 px-1.5 py-0.5 text-[12px] font-bold text-riel-950">
                            {insignia}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="space-y-0.5 border-t border-white/10 pt-3">
        {/* Cambiar de idioma sin tener que ir a Configuración: delante de
            alguien que no habla español, cada clic de más se nota. */}
        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: otroIdioma })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Languages className="h-4 w-4" aria-hidden />
          {otroIdioma === "en" ? "English" : "Español"}
        </button>

        <Link
          href="/cuenta"
          onClick={() => setAbierto(false)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <UserRound className="h-4 w-4" aria-hidden />
          {t("miCuenta")}
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden />
          {t("irAlSitio")}
        </Link>

        {/* Aqui dentro hay dinero de comercios: salir tiene que estar a un
            toque, en la misma pantalla donde se trabaja. */}
        <Salir
          variante="enlace"
          className="w-full rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        />
      </div>
    </nav>
  );

  return (
    <>
      {/* Barra de celular */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-riel-950 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={t("abrirMenu")}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <span className="text-sm font-bold text-white">
          Mercatren · {t("titulo")}
        </span>
      </div>

      {/* Menu fijo en pantallas grandes */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-riel-950 lg:block">
        {contenido}
      </aside>

      {/* Menu deslizante en celular */}
      {abierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("cerrarMenu")}
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-in bg-riel-950 duration-200 slide-in-from-left">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrarMenu")}
              className="absolute top-4 right-3 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {contenido}
          </div>
        </div>
      ) : null}
    </>
  );
}
