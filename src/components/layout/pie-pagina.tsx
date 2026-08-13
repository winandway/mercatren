import { ArrowRight, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import { Logo } from "@/components/marca/logo";
import { Link } from "@/i18n/navigation";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { DESARROLLADOR, SOCIEDAD } from "@/lib/sociedad";

const SECCIONES = [
  {
    titulo: "comprar",
    enlaces: [
      { clave: "catalogo", href: "/catalogo" },
      { clave: "tiendas", href: "/tiendas" },
      { clave: "seguimiento", href: "/pedidos" },
    ],
  },
  {
    titulo: "vender",
    enlaces: [
      { clave: "abrirTienda", href: "/vender" },
      { clave: "comisiones", href: "/vender/comisiones" },
    ],
  },
  {
    titulo: "ayuda",
    enlaces: [
      { clave: "centroAyuda", href: "/ayuda" },
      /* ENTREGA Y DEVOLUCIONES VAN EN EL PIE A PROPÓSITO. Son las dos
         preguntas que se hace cualquiera antes de pagarle a una tienda que
         no conoce — y Google Merchant Center las exige alcanzables desde
         cualquier página del sitio, o no aprueba la cuenta. */
      { clave: "entrega", href: "/entrega" },
      { clave: "devoluciones", href: "/devoluciones" },
      // El contacto abre el buzon REAL de CORREO_CONTACTO. Nunca poner
      // aqui un correo @mercatren.com sin SMTP: no recibe y el mensaje se
      // pierde. noreply@mercatren.com es solo para ENVIAR avisos del sistema.
      { clave: "contacto", href: `mailto:${CORREO_CONTACTO}` },
    ],
  },
  {
    titulo: "empresa",
    enlaces: [
      { clave: "nosotros", href: "/nosotros" },
      { clave: "comoFunciona", href: "/como-funciona" },
      { clave: "docs", href: "/docs" },
      { clave: "blog", href: "/blog" },
      { clave: "transparencia", href: "/transparencia" },
      { clave: "terminos", href: "/terminos" },
      { clave: "privacidad", href: "/privacidad" },
    ],
  },
] as const;

export async function PiePagina() {
  const t = await getTranslations("piePagina");
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-riel-900 text-white" data-solo-pantalla>
      {/* Franja de llamada al comercio. El pie de una tienda lo lee mucha
          gente que llego a mirar; aqui es donde se le ofrece vender. */}
      <div className="border-b border-white/10 bg-riel-950">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <p className="font-bold">{t("vendeConNosotros")}</p>
            <p className="text-sm text-white/60">{t("vendeTexto")}</p>
          </div>
          <Link
            href="/vender"
            className="inline-flex items-center gap-2 rounded-lg bg-carga-500 px-5 py-2.5 text-sm font-semibold text-riel-950 transition-colors hover:bg-carga-600"
          >
            {t("vendeBoton")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2.6fr]">
          {/* La marca y de que va esto. */}
          <div className="max-w-sm">
            <Logo variante="horizontalComOscuro" className="h-9" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t("descripcion")}
            </p>

            <p className="mt-5 flex items-start gap-2 text-xs text-white/60">
              <BanderaEEUU className="mt-0.5 h-4 w-4" />
              {t("soloEEUU")}
            </p>

            {/* El buzon real, bien visible: es el unico que recibe. */}
            <div className="mt-6 rounded-xl bg-white/5 p-4">
              <p className="text-sm font-semibold">{t("contactoTitulo")}</p>
              <p className="mt-0.5 text-xs text-white/60">
                {t("contactoTexto")}
              </p>
              <a
                href={`mailto:${CORREO_CONTACTO}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-carga-400 hover:text-carga-300"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {CORREO_CONTACTO}
              </a>
            </div>
          </div>

          {/* Las cuatro columnas de enlaces. */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {SECCIONES.map((seccion) => (
              <div key={seccion.titulo}>
                <h2 className="mb-3 text-sm font-bold">
                  {t(`secciones.${seccion.titulo}`)}
                </h2>
                <ul className="space-y-2.5 text-sm text-white/70">
                  {seccion.enlaces.map((enlace) => (
                    <li key={enlace.clave}>
                      {enlace.href.startsWith("mailto:") ? (
                        <a
                          href={enlace.href}
                          className="transition-colors hover:text-carga-400"
                        >
                          {t(`enlaces.${enlace.clave}`)}
                        </a>
                      ) : (
                        <Link
                          href={enlace.href}
                          className="transition-colors hover:text-carga-400"
                        >
                          {t(`enlaces.${enlace.clave}`)}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quien opera el servicio. Un banco o un socio lo busca aqui. */}
        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          {t("operadoPor")}{" "}
          <span className="font-semibold text-white/70">{SOCIEDAD.nombre}</span>
          , {SOCIEDAD.pais}.
        </p>
      </div>

      {/* Credito del desarrollador: va en todos los sitios de Windoce, LLC. */}
      <div className="border-t border-white/10 bg-riel-950">
        <div className="mx-auto max-w-[1500px] px-4 py-5 text-center text-xs text-white/60">
          © {anio} mercatren.com | {t("derechos")} {t("desarrolladoPor")}{" "}
          <a
            href={DESARROLLADOR.sitio}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/80 transition-colors hover:text-carga-400"
          >
            {DESARROLLADOR.nombre}
          </a>
        </div>
      </div>
    </footer>
  );
}
