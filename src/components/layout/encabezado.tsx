import { MapPin, Menu } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Buscador } from "@/components/layout/buscador";
import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import { ContadorCarrito } from "@/components/layout/contador-carrito";
import { SelectorIdioma } from "@/components/layout/selector-idioma";
import { Logo } from "@/components/marca/logo";
import { Link } from "@/i18n/navigation";

/**
 * Encabezado del sitio: barra oscura con el buscador ancho arriba, igual que
 * las tiendas grandes de Estados Unidos. En celular el buscador baja a su
 * propia fila para que quepa completo.
 */
export async function Encabezado() {
  const t = await getTranslations("encabezado");

  return (
    <header className="sticky top-0 z-50">
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

          <button
            type="button"
            className="celda-encabezado hidden items-center gap-1 text-left text-xs lg:flex"
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="block text-white/70">{t("entregarEn")}</span>
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <BanderaEEUU className="h-3.5 w-3.5" />
                {t("paisPorDefecto")}
              </span>
            </span>
          </button>

          {/* En celular el buscador baja a su propia fila; de tableta para
              arriba vuelve al centro y se come todo el espacio libre. */}
          <div className="order-last w-full min-w-0 basis-full md:order-none md:w-auto md:flex-1 md:basis-auto">
            <Buscador />
          </div>

          <SelectorIdioma />

          <Link
            href="/entrar"
            className="celda-encabezado hidden text-xs sm:block"
          >
            <span className="block text-white/70">{t("hola")}</span>
            <span className="block text-sm font-bold">
              {t("cuentaYListas")}
            </span>
          </Link>

          <Link
            href="/pedidos"
            className="celda-encabezado hidden text-xs lg:block"
          >
            <span className="block text-white/70">{t("hola")}</span>
            <span className="block text-sm font-bold">{t("pedidos")}</span>
          </Link>

          <ContadorCarrito />
        </div>
      </div>

      {/* Fila de categorias */}
      <div className="bg-riel-800 text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-3 py-1 text-sm sm:px-4">
          <button
            type="button"
            className="celda-encabezado flex shrink-0 items-center gap-1 font-bold"
          >
            <Menu className="h-4 w-4" aria-hidden />
            {t("menuTodo")}
          </button>
          <Link href="/catalogo" className="celda-encabezado shrink-0">
            {t("catalogo")}
          </Link>
          <Link href="/vender" className="celda-encabezado shrink-0">
            {t("vender")}
          </Link>
        </div>
      </div>
    </header>
  );
}
