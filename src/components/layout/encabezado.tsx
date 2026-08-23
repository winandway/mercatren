import { LayoutDashboard, UserRound } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Buscador } from "@/components/layout/buscador";
import { MenuCuenta } from "@/components/layout/menu-cuenta";
import { MenuTodo } from "@/components/layout/menu-todo";
import { ContadorCarrito } from "@/components/layout/contador-carrito";
import { SelectorCiudad } from "@/components/layout/selector-ciudad";
import { SelectorIdioma } from "@/components/layout/selector-idioma";
import { Logo } from "@/components/marca/logo";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { recordado } from "@/lib/cachecito";
import { listarCategoriasConProductos } from "@/lib/catalogo/consultas";
import { coberturaPorCiudad } from "@/lib/entrega/cobertura";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import type { Idioma } from "@/lib/dinero";
import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal } from "@/lib/mercado/mercados";

/**
 * Encabezado del sitio: barra oscura con el buscador ancho arriba, igual que
 * las tiendas grandes de Estados Unidos. En celular el buscador baja a su
 * propia fila para que quepa completo.
 */
export async function Encabezado() {
  const t = await getTranslations("encabezado");
  const locale = await getLocale();

  /**
   * TODO LO DEL ENCABEZADO SE PIDE A LA VEZ, no en fila. Antes eran cuatro
   * esperas encadenadas — categorías, sesión, ciudad, cobertura — y como el
   * encabezado va en TODAS las páginas, cada visita pagaba esa fila completa
   * antes de ver un solo pixel. Ahora la espera es la de la consulta más
   * lenta, no la suma de las cuatro.
   *
   * Las dos agregadas (categorías y bombillos) además se recuerdan un minuto:
   * son iguales para todo el mundo y cambian poco. La sesión y la ciudad no
   * se recuerdan nunca — dependen de quién pregunta.
   *
   * Si algo falla, se sigue sin esa pieza: el encabezado nunca puede tumbar
   * la página.
   */
  const mercado = await mercadoActual();
  /* Las ciudades del selector son la geografía de VENEZUELA, que solo tiene
     sentido en el mercado principal. En mercatren.cl la pregunta «¿dónde lo
     retiras?» todavía no existe; cuando Chile tenga su geografía, el
     selector se enseña con la suya (PLAN-PAISES.md, fase 2). */
  const conSelectorDeCiudad = esMercadoPrincipal(mercado);

  const [categorias, usuario, zona, cobertura] = await Promise.all([
    /* La llave lleva el mercado: el menú de categorías ya sale filtrado por
       el dominio, y una llave única serviría el de un país en el otro. */
    recordado(`menu-categorias-${mercado.codigo}`, 60_000, () =>
      listarCategoriasConProductos(mercado),
    ).catch(() => []),
    obtenerUsuario().catch(() => null),
    zonaDelCliente(),
    /* La llave lleva el mercado: el conteo por ciudad se calcula sobre el
       catálogo de ESTE país, y una llave única serviría el de otro. */
    recordado(`cobertura-ciudades-${mercado.codigo}`, 60_000, () =>
      coberturaPorCiudad(mercado),
    ),
  ]);
  const trabajaEnElPanel =
    usuario?.rol === "soporte" ||
    usuario?.rol === "validador" ||
    usuario?.rol === "vendedor";

  return (
    <header className="sticky top-0 z-50" data-solo-pantalla>
      {/* Fila principal */}
      <div className="bg-riel-900 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
          <Link
            href="/"
            className="celda-encabezado flex items-center"
            aria-label="Mercatren"
          >
            <Logo className="h-7 sm:h-9" prioridad />
          </Link>

          {/* DÓNDE ESTÁ QUIEN COMPRA. Antes aquí había un texto fijo que
              decía "Estados Unidos" y no detectaba nada — le decía lo mismo a
              alguien parado en Caracas. Ahora se pregunta y se recuerda. */}
          {conSelectorDeCiudad ? (
            <div className="hidden xl:block">
              <SelectorCiudad
                zonaActual={zona?.slug ?? null}
                cobertura={cobertura}
              />
            </div>
          ) : null}

          {/* EL BUSCADOR ES EL PROTAGONISTA. Se come todo el espacio libre y
              en celular baja a su propia fila para salir completo. Lo demas
              del encabezado se aprieta o se esconde antes que el. */}
          <div className="order-last w-full min-w-0 basis-full md:order-none md:w-auto md:flex-1 md:basis-auto">
            <Buscador idioma={locale as Idioma} />
          </div>

          <SelectorIdioma />

          {/* Al que trabaja en el panel se le pone el panel a un toque: es
              donde va siempre, y antes no habia ningun camino visible. */}
          {trabajaEnElPanel ? (
            <Link
              href="/panel"
              className="celda-encabezado flex shrink-0 items-center gap-1.5 text-xs font-bold"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t("panel")}</span>
            </Link>
          ) : null}

          {/* Quien entro tiene aqui su menu, con la salida incluida. Antes
              esto era un enlace suelto y no habia forma de cerrar sesion en
              todo el sitio. */}
          {usuario ? (
            <MenuCuenta
              nombre={usuario.name ?? ""}
              trabajaEnElPanel={trabajaEnElPanel}
            />
          ) : (
            /**
             * ENTRAR TIENE QUE VERSE EN EL CELULAR.
             *
             * Estaba en `hidden sm:block`, así que en un teléfono no había
             * NINGUNA forma de entrar ni de crear cuenta desde el encabezado —
             * y el teléfono es por donde entra casi todo el mundo. Ahora en
             * pantalla chica sale el icono, y en grande el texto de siempre.
             */
            <Link
              href="/entrar"
              aria-label={t("identificate")}
              className="celda-encabezado flex shrink-0 items-center gap-1.5 text-xs"
            >
              <UserRound className="h-5 w-5 sm:hidden" aria-hidden />
              <span className="hidden sm:block">
                <span className="block max-w-32 truncate text-white/70">
                  {t("hola")}
                </span>
                <span className="block text-sm font-bold">
                  {t("identificate")}
                </span>
              </span>
            </Link>
          )}

          {/* Los pedidos ya viven en el menu y en la cuenta: aqui solo se
              muestran cuando la pantalla da de sobra. */}
          <Link
            href="/pedidos"
            className="celda-encabezado hidden text-xs xl:block"
          >
            <span className="block text-white/70">{t("hola")}</span>
            <span className="block text-sm font-bold">{t("pedidos")}</span>
          </Link>

          <ContadorCarrito />
        </div>
      </div>

      {/* DÓNDE ESTÁ QUIEN COMPRA, EN EL CELULAR.
          En pantalla chica no cabe arriba, y esconderlo ahí lo dejaba
          invisible justo en el aparato por donde entra casi todo el mundo.
          Va en su propia franja bajo el buscador, como en Amazon: una línea,
          de lado a lado, imposible de no ver. */}
      {conSelectorDeCiudad ? (
        <div className="border-b border-white/10 bg-riel-800 text-white xl:hidden">
          <div className="mx-auto flex max-w-[1500px] px-3 py-1 sm:px-4">
            <SelectorCiudad
              zonaActual={zona?.slug ?? null}
              cobertura={cobertura}
              enLinea
            />
          </div>
        </div>
      ) : null}

      {/* Fila de categorias */}
      <div className="bg-riel-800 text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-3 py-1 text-sm sm:px-4">
          <MenuTodo
            etiqueta={t("menuTodo")}
            tituloCategorias={t("categorias")}
            tituloSecciones={t("secciones")}
            cerrar={t("cerrar")}
            categorias={categorias.map((c) => ({
              href: `/catalogo?categoria=${c.slug}`,
              texto: `${locale === "en" ? (c.nombreEn ?? c.nombreEs) : c.nombreEs} (${c.cuantos})`,
            }))}
            secciones={[
              /* En el celular este menú es la vía principal: aquí tiene que
                 estar la entrada, que es lo primero que busca quien llega. */
              ...(usuario
                ? []
                : [
                    { href: "/entrar", texto: t("identificate") },
                    { href: "/registro", texto: t("crearCuenta") },
                  ]),
              { href: "/catalogo", texto: t("catalogo") },
              { href: "/tiendas", texto: t("tiendas") },
              { href: "/vender", texto: t("vender") },
              { href: "/como-funciona", texto: t("comoFunciona") },
              { href: "/docs", texto: t("docs") },
              { href: "/videos", texto: t("videos") },
              { href: "/blog", texto: t("blog") },
              { href: "/ayuda", texto: t("ayuda") },
              { href: "/pedidos", texto: t("pedidos") },
            ]}
          />
          <Link href="/catalogo" className="celda-encabezado shrink-0">
            {t("catalogo")}
          </Link>
          {/* EL DIRECTORIO DE TIENDAS. Sin este enlace no había ninguna forma
              de descubrir a un vendedor sin saberse su dirección de memoria. */}
          <Link href="/tiendas" className="celda-encabezado shrink-0">
            {t("tiendas")}
          </Link>
          <Link href="/vender" className="celda-encabezado shrink-0">
            {t("vender")}
          </Link>
          <Link
            href="/como-funciona"
            className="celda-encabezado hidden shrink-0 sm:block"
          >
            {t("comoFunciona")}
          </Link>
          <Link
            href="/docs"
            className="celda-encabezado hidden shrink-0 md:block"
          >
            {t("docs")}
          </Link>
          <Link
            href="/ayuda"
            className="celda-encabezado hidden shrink-0 md:block"
          >
            {t("ayuda")}
          </Link>
          {/* LOS SHORTS: los comercios enseñando su tienda por dentro. Va en
              la barra porque es el gancho — se entra a mirar y se sale
              comprando. */}
          <Link
            href="/videos"
            className="celda-encabezado hidden shrink-0 md:block"
          >
            {t("videos")}
          </Link>
          {/* EL BLOG, en la barra y no solo escondido en el menú "Todo". Cada
              nota que se publica suma para Google, y una sección que nadie ve
              no la lee nadie. */}
          <Link
            href="/blog"
            className="celda-encabezado hidden shrink-0 lg:block"
          >
            {t("blog")}
          </Link>
        </div>
      </div>
    </header>
  );
}
