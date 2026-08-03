import { getTranslations } from "next-intl/server";

import { CORREO_CONTACTO } from "@/lib/correo/direcciones";

import { Logo } from "@/components/marca/logo";
import { Link } from "@/i18n/navigation";

const SECCIONES = [
  {
    titulo: "comprar",
    enlaces: [
      { clave: "catalogo", href: "/catalogo" },
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
      // El contacto abre el buzon REAL (mercatren@windoce.com). Nunca poner
      // aqui un correo @mercatren.com sin SMTP: no recibe y el mensaje se
      // pierde. noreply@mercatren.com es solo para ENVIAR avisos del sistema.
      { clave: "contacto", href: `mailto:${CORREO_CONTACTO}` },
    ],
  },
  {
    titulo: "empresa",
    enlaces: [
      { clave: "comoFunciona", href: "/como-funciona" },
      { clave: "docs", href: "/docs" },
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
    <footer className="mt-16 bg-riel-900 text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-10">
        <Logo variante="horizontalComOscuro" className="mb-8 h-9" />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {SECCIONES.map((seccion) => (
            <div key={seccion.titulo}>
              <h2 className="mb-3 text-sm font-bold">
                {t(`secciones.${seccion.titulo}`)}
              </h2>
              <ul className="space-y-2 text-sm text-white/70">
                {seccion.enlaces.map((enlace) => (
                  <li key={enlace.clave}>
                    {enlace.href.startsWith("mailto:") ? (
                      <a href={enlace.href} className="hover:text-carga-400">
                        {t(`enlaces.${enlace.clave}`)}
                      </a>
                    ) : (
                      <Link href={enlace.href} className="hover:text-carga-400">
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

      {/* Credito del desarrollador: va en todos los sitios de Windoce LLC. */}
      <div className="border-t border-white/10 bg-riel-950">
        <div className="mx-auto max-w-[1500px] px-4 py-5 text-center text-xs text-white/60">
          © {anio} mercatren.com | {t("derechos")} {t("desarrolladoPor")}{" "}
          <a
            href="https://windoce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/80 transition-colors hover:text-carga-400"
          >
            Windoce LLC
          </a>
        </div>
      </div>
    </footer>
  );
}
