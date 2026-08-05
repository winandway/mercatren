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
import { listarCategoriasConProductos } from "@/lib/catalogo/consultas";
import { coberturaPorCiudad } from "@/lib/entrega/cobertura";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import type { Idioma } from "@/lib/dinero";

/**
 * Encabezado del sitio: barra oscura con el buscador ancho arriba, igual que
 * las tiendas grandes de Estados Unidos. En celular el buscador baja a su
 * propia fila para que quepa completo.
 */
export async function Encabezado() {
  const t = await getTranslations("encabezado");
  const locale = await getLocale();

  // Las categorias del menu salen del catalogo real. Si la base no responde,
  // el menu sale sin ellas: el encabezado nunca puede tumbar la pagina.
  const categorias = await listarCategoriasConProductos().catch(() => []);

  // Quien entro, para saludarlo por su nombre y para abrirle el panel si
  // trabaja ahi. Si algo falla al leer la sesion, se sigue como visitante:
  // el encabezado nunca puede tumbar la pagina.
  const usuario = await obtenerUsuario().catch(() => null);
  const zona = await zonaDelCliente();
  // Los bombillos verdes del selector: en qué ciudades ya hay mercancía.
  const cobertura = await coberturaPorCiudad();
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
          <div className="hidden xl:block">
            <SelectorCiudad
              zonaActual={zona?.slug ?? null}
              cobertura={cobertura}
            />
          </div>

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
      <div className="border-b border-white/10 bg-riel-800 text-white xl:hidden">
        <div className="mx-auto flex max-w-[1500px] px-3 py-1 sm:px-4">
          <SelectorCiudad
            zonaActual={zona?.slug ?? null}
            cobertura={cobertura}
            enLinea
          />
        </div>
      </div>

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
              { href: "/vender", texto: t("vender") },
              { href: "/como-funciona", texto: t("comoFunciona") },
              { href: "/docs", texto: t("docs") },
              { href: "/ayuda", texto: t("ayuda") },
              { href: "/pedidos", texto: t("pedidos") },
            ]}
          />
          <Link href="/catalogo" className="celda-encabezado shrink-0">
            {t("catalogo")}
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
        </div>
      </div>
    </header>
  );
}
