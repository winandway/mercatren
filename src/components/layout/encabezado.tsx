import { LayoutDashboard, UserRound } from "lucide-react";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { Buscador } from "@/components/layout/buscador";
import { MenuCuenta } from "@/components/layout/menu-cuenta";
import { MenuTodo } from "@/components/layout/menu-todo";
import { ContadorCarrito } from "@/components/layout/contador-carrito";
import { SelectorCiudad } from "@/components/layout/selector-ciudad";
import { SelectorIdioma } from "@/components/layout/selector-idioma";
import { BanderaDelMercado } from "@/components/marca/bandera-pais";
import { Logo } from "@/components/marca/logo";
import { MercatrenGlobal } from "@/components/marca/mercatren-global";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { recordado } from "@/lib/cachecito";
import { listarCategoriasConProductos } from "@/lib/catalogo/consultas";
import { coberturaPorCiudad } from "@/lib/entrega/cobertura";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import type { Idioma } from "@/lib/dinero";
import { mercadoActual } from "@/lib/mercado/actual";
import { seRetiraEnCiudad } from "@/lib/mercado/mercados";

/**
 * Encabezado del sitio: barra oscura con el buscador ancho arriba, igual que
 * las tiendas grandes de Estados Unidos. En celular el buscador baja a su
 * propia fila para que quepa completo.
 */
export async function Encabezado() {
  const t = await getTranslations("encabezado");
  const tGlobal = await getTranslations("global");
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
  /**
   * ══ EL SELECTOR SE DIBUJA DONDE HAY ALGO QUE RETIRAR (6 sep 2026) ══
   *
   * Las ciudades son la geografía de Venezuela. Hasta hoy la condición era
   * «¿es el mercado principal?», porque principal y Venezuela eran el mismo
   * sitio; con la mudanza a mercatren.com.ve dejaron de serlo, y esa regla
   * le habría pedido a un comprador de Miami que eligiera en qué ciudad
   * venezolana retira su compra.
   *
   * La condición nueva no nombra ningún país: **se dibuja si de verdad hay
   * ciudades con productos que retirar**, que es lo que la pregunta
   * significa. Y por eso se ajusta sola en la mudanza: el día que las
   * tiendas venezolanas pasen al mercado VE, el .com se queda sin cobertura
   * y el selector desaparece de ahí ese mismo minuto, sin publicar nada.
   * Mientras tanto —código publicado, dato sin mover— el comprador
   * venezolano sigue filtrando por su ciudad en mercatren.com como siempre.
   */
  const conSelectorDeCiudad = seRetiraEnCiudad(mercado) || cobertura.length > 0;

  const trabajaEnElPanel =
    usuario?.rol === "soporte" ||
    usuario?.rol === "validador" ||
    usuario?.rol === "vendedor";

  return (
    <header className="sticky top-0 z-50" data-solo-pantalla>
      {/* Fila principal */}
      <div className="bg-riel-900 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:gap-x-3 sm:px-4">
          <Link
            href="/"
            className="celda-encabezado flex items-center gap-2"
            aria-label="Mercatren"
          >
            <Logo className="h-6 sm:h-9" prioridad />
            {/* La banderita del país, junto al logo. En celular NO va aquí:
                allá la bandera es el botón que abre «Mercatren en el mundo»
                —una sola pieza en vez de dos— porque con las dos el carrito
                se caía a una segunda línea. Medido a 360 px. */}
            <span className="hidden lg:flex">
              <BanderaDelMercado mercado={mercado} />
            </span>
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
            {/**
             * EL BUSCADOR LEE LA URL, ASÍ QUE VA EN SUSPENSE (6 sep 2026).
             *
             * Usa `useSearchParams` para conservar lo buscado, y eso obliga a
             * Next a envolverlo. Hasta hoy no hacía falta porque el selector
             * de ciudad —y su consulta de cobertura— hacían dinámica toda
             * página con encabezado. Al mudarse Venezuela, mercatren.com dejó
             * de dibujar el selector, `/docs` volvió a prerenderizarse y la
             * compilación se cayó entera. El respaldo es la misma casilla sin
             * el atajo del teclado: nadie ve un hueco.
             */}
            <Suspense
              fallback={
                <div
                  aria-hidden
                  className="h-10 w-full rounded-lg bg-white/10"
                />
              }
            >
              <Buscador idioma={locale as Idioma} />
            </Suspense>
          </div>

          {/* La bandera-botón, arriba y solo en celular: ahí la barra de
              secciones se sale de la pantalla y el botón «Global» de abajo no
              se ve nunca. */}
          <MercatrenGlobal
            mercado={mercado}
            idioma={locale}
            soloIcono
            textos={{
              boton: tGlobal("boton"),
              titulo: tGlobal("titulo"),
              entrada: tGlobal("entrada"),
              mudanza: tGlobal("mudanza"),
              aqui: tGlobal("aqui"),
              cerrar: tGlobal("cerrar"),
            }}
          />
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
            /* ══ EL BUSCADOR ES EL PROTAGONISTA DE VERDAD (30 ago 2026) ══
               Pedido del dueño: los bloques «Hola, Iniciar sesión» y «Hola,
               Devoluciones y pedidos» se comían el ancho del buscador en
               todas las pantallas. Entrar queda como UN ícono (el camino
               completo sigue en el menú hamburguesa y dentro de la cuenta), y
               el de pedidos se fue de la barra: ya vive en los dos menús. */
            <Link
              href="/entrar"
              aria-label={t("identificate")}
              title={t("identificate")}
              className="celda-encabezado flex shrink-0 items-center"
            >
              <UserRound className="h-5 w-5" aria-hidden />
            </Link>
          )}

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
            translate="no"
            className="celda-encabezado notranslate hidden shrink-0 md:block"
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
          {/* MERCATREN EN EL MUNDO. Va al final de la barra y en TODOS los
              dominios: es donde alguien que tenía su cuenta en el .com y
              despertó en otro dominio entiende qué pasó. Pedido de Richard
              el día de la mudanza de Venezuela. */}
          <MercatrenGlobal
            mercado={mercado}
            idioma={locale}
            textos={{
              boton: tGlobal("boton"),
              titulo: tGlobal("titulo"),
              entrada: tGlobal("entrada"),
              mudanza: tGlobal("mudanza"),
              aqui: tGlobal("aqui"),
              cerrar: tGlobal("cerrar"),
            }}
          />
        </div>
      </div>
    </header>
  );
}
