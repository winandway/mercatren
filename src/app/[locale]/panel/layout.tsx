import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MenuLateral } from "@/components/panel/menu-lateral";
import { redirect } from "@/i18n/navigation";
import {
  esEquipoInterno,
  tienePermisoDePanel,
  obtenerUsuario,
} from "@/lib/autorizacion";
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

  // Si la cuenta es de un comercio que todavia no tiene tienda asignada, la
  // consulta avisa en vez de romper la pantalla.
  const pendientes = await listarPendientesDeValidacion().catch(() => []);

  return (
    <div className="min-h-screen bg-slate-50">
      <MenuLateral
        porValidar={pendientes.length}
        esInterno={interno}
        nombre={usuario?.name ?? ""}
      />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
