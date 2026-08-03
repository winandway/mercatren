import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";

import { MenuLateral } from "@/components/panel/menu-lateral";
import { redirect } from "@/i18n/navigation";
import { getAuth } from "@/lib/auth";
import type { Rol } from "@/lib/db/schema";
import { listarPendientesDeValidacion } from "@/lib/zelle/consultas";

/** Quienes pueden entrar al panel. El resto ni ve la puerta. */
const ROLES_PERMITIDOS: Rol[] = ["soporte", "validador"];

/** El panel lee la base en cada visita: nunca se genera de antemano. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

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
  // sin sesion con permiso, no se entra.
  const sesion = await getAuth().api.getSession({ headers: await headers() });
  const rol = (sesion?.user as { rol?: Rol } | undefined)?.rol;

  if (!sesion?.user || !rol || !ROLES_PERMITIDOS.includes(rol)) {
    redirect({ href: "/entrar?destino=/panel", locale });
  }

  const pendientes = await listarPendientesDeValidacion();

  return (
    <div className="min-h-screen bg-slate-50">
      <MenuLateral porValidar={pendientes.length} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
