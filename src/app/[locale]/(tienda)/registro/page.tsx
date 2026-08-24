import { ShoppingCart, Store } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { FormularioRegistro } from "@/components/cuenta/formulario-registro";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "entrar" });
  // Una pantalla de alta no aporta nada en un buscador.
  return {
    title: t("tituloRegistro"),
    robots: { index: false, follow: false },
  };
}

/** Alta de cuenta. Hace falta para comprar y para seguir un pedido. */
export default async function PaginaRegistro({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // La clave publica del escudo anti-robots. Si no esta cargada, el
  // componente no dibuja nada y la entrada funciona como siempre.
  const { env } = getCloudflareContext();
  const claveEscudo = env.TURNSTILE_CLAVE_SITIO;
  const t = await getTranslations("entrar");

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("tituloRegistro")}
      </h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("subtituloRegistro")}</p>

      {/**
       * QUÉ PUEDE HACER CON ESTA CUENTA, DICHO SIN LETRA CHICA (24 ago 2026).
       *
       * Lo pidió el dueño: «que sea claro si él está creando una cuenta para
       * comprar, que le diga: mira, con esta cuenta puedes comprar y también
       * puedes vender». El subtítulo lo decía, pero en gris de 14px debajo
       * del título — o sea, no lo decía.
       *
       * Son DOS tarjetas y no una lista porque la pregunta que trae la
       * persona es «¿esta cuenta es la mía?»: ver los dos caminos uno al lado
       * del otro la responde sin leer una palabra de más. Y la de vender
       * cierra con lo que de verdad importa hoy: se publica al momento, no
       * hay nada que esperar.
       */}
      <ul className="mt-5 grid gap-3">
        {[
          { icono: ShoppingCart, clave: "comprar" },
          { icono: Store, clave: "vender" },
        ].map(({ icono: Icono, clave }) => (
          <li
            key={clave}
            className="flex items-start gap-3 rounded-xl border border-borde bg-white p-3.5"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carga-500/10 text-carga-600">
              <Icono className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-riel-900">
                {t(`conTuCuenta.${clave}.titulo`)}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-tinta-suave">
                {t(`conTuCuenta.${clave}.texto`)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <FormularioRegistro claveEscudo={claveEscudo} />
    </section>
  );
}
