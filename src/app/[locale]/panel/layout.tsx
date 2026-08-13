import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { MenuLateral } from "@/components/panel/menu-lateral";
import { FranjaVerComo } from "@/components/panel/ver-como";
import { redirect } from "@/i18n/navigation";
import {
  esEquipoInterno,
  tienePermisoDePanel,
  obtenerUsuario,
} from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { contarRetirosPendientes } from "@/lib/retiros/consultas";
import { comercioObservado } from "@/lib/soporte/ver-como";
import { tiendaDeLaSesion } from "@/lib/tiendas/consultas";
import { listarPendientesDeValidacion } from "@/lib/zelle/consultas";

/** El panel lee la base en cada visita: nunca se genera de antemano. */
export const dynamic = "force-dynamic";

/**
 * El titulo de la pestaña también va traducido: un banco o un inversionista
 * que abra el panel en inglés no debería ver "Administración" arriba.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "panel" });
  return { title: t("titulo"), robots: { index: false, follow: false } };
}

export default async function LayoutPanel({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Aqui adentro hay dinero real de comercios y datos de quienes pagaron:
  // sin una cuenta con permiso, no se entra.
  if (!(await tienePermisoDePanel())) {
    redirect({ href: "/entrar?destino=/panel", locale });
  }

  const [usuario, interno] = await Promise.all([
    obtenerUsuario(),
    esEquipoInterno(),
  ]);

  /**
   * UN COMERCIO SIN TIENDA NO PUEDE VER EL PANEL, PERO TAMPOCO DEBE ROMPERLO.
   *
   * `obtenerAlcance()` lanza cuando un vendedor no tiene comercio asignado, y
   * eso dejaba la pantalla en un error crudo. Puede pasar con una cuenta a la
   * que se le quitó la tienda, o si algo se corta a mitad del alta.
   *
   * En vez del error, se le manda a terminar su alta, que es lo único que le
   * falta para poder entrar.
   */
  if (!interno && usuario?.rol === "vendedor") {
    const suya = await tiendaDeLaSesion().catch(() => null);
    if (!suya) redirect({ href: "/vender/empezar", locale });
  }

  // Si la cuenta es de un comercio que todavia no tiene tienda asignada, la
  // consulta avisa en vez de romper la pantalla.
  const [pendientes, porRetirar] = await Promise.all([
    listarPendientesDeValidacion().catch(() => []),
    contarRetirosPendientes().catch(() => 0),
  ]);

  /**
   * AQUÍ ADENTRO VIAJAN LOS MENSAJES COMPLETOS. El layout público recorta el
   * espacio `panel` del paquete que va al navegador (31 KB que un visitante
   * del catálogo no necesita); este proveedor anidado se los devuelve a las
   * pantallas del panel, que son las únicas que los usan.
   */
  const mensajes = await getMessages();

  /* Si Soporte está mirando el panel de un comercio, se trae su nombre para
     la franja. Sin nombre no se dibuja: una franja que dice «estás viendo el
     panel de» y se corta ahí asusta más de lo que avisa. */
  const observado = await comercioObservado();
  const [comercioMirado] = observado
    ? await getDb()
        .select({ nombre: tiendas.nombre })
        .from(tiendas)
        .where(eq(tiendas.id, observado))
        .limit(1)
        .catch(() => [])
    : [];

  return (
    <NextIntlClientProvider messages={mensajes}>
      <div className="letra-panel min-h-screen bg-slate-50">
        {comercioMirado ? (
          <FranjaVerComo nombre={comercioMirado.nombre} />
        ) : null}
        <MenuLateral
          porValidar={pendientes.length}
          porRetirar={porRetirar}
          esInterno={interno}
          nombre={usuario?.name ?? ""}
        />
        <div className="lg:pl-64">
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
