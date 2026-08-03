import {
  CircleHelp,
  LayoutDashboard,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CambiarClave } from "@/components/cuenta/cambiar-clave";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cuenta" });
  // Pagina privada: fuera de los buscadores.
  return {
    title: t("titulo"),
    description: t("entradilla"),
    robots: { index: false, follow: false },
  };
}

/** Los roles que ven el panel de administracion. */
const ROLES_CON_PANEL = ["soporte", "validador", "vendedor"];

/**
 * "Cuenta y listas": la puerta de entrada de quien ya entro.
 *
 * Muestra sus datos y lo lleva a donde quiera ir. Al comercio y al equipo les
 * aparece ademas el acceso al panel; al cliente no, porque ahi no tiene nada.
 */
export default async function PaginaCuenta({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cuenta");
  const usuario = await obtenerUsuario();

  if (!usuario) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">{t("titulo")}</h1>
        <p className="mt-3 text-tinta-suave">{t("entrar")}</p>
        <Link href="/entrar" className="boton-principal mt-6">
          {t("titulo")}
        </Link>
      </div>
    );
  }

  const rol = usuario.rol ?? "cliente";

  const tarjetas = [
    {
      href: "/pedidos" as const,
      icono: Package,
      titulo: t("tarjetas.pedidos.titulo"),
      texto: t("tarjetas.pedidos.texto"),
    },
    ...(ROLES_CON_PANEL.includes(rol)
      ? [
          {
            href: "/panel" as const,
            icono: LayoutDashboard,
            titulo: t("tarjetas.panel.titulo"),
            texto: t("tarjetas.panel.texto"),
          },
        ]
      : []),
    {
      href: "/ayuda" as const,
      icono: CircleHelp,
      titulo: t("tarjetas.ayuda.titulo"),
      texto: t("tarjetas.ayuda.texto"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xl font-bold text-white">
          {usuario.name?.trim()?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            {usuario.name}
          </h1>
          <p className="truncate text-sm text-tinta-suave">{usuario.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((tarjeta) => (
          <Link
            key={tarjeta.href}
            href={tarjeta.href}
            className="group rounded-xl border border-borde p-5 transition-colors hover:border-carga-500"
          >
            <tarjeta.icono className="h-5 w-5 text-carga-500" aria-hidden />
            <h2 className="mt-3 font-bold group-hover:text-carga-600">
              {tarjeta.titulo}
            </h2>
            <p className="mt-1 text-sm leading-snug text-tinta-suave">
              {tarjeta.texto}
            </p>
          </Link>
        ))}
      </div>

      {/* Los datos con los que verificamos sus pagos. */}
      <section className="mt-8 rounded-xl border border-borde p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <UserRound className="h-4 w-4 text-carga-500" aria-hidden />
          {t("tarjetas.datos.titulo")}
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">
          {t("tarjetas.datos.texto")}
        </p>

        <dl className="mt-4 divide-y divide-borde border-t border-borde text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-tinta-suave">{t("nombre")}</dt>
            <dd className="font-semibold">{usuario.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-tinta-suave">{t("correo")}</dt>
            <dd className="truncate font-semibold">{usuario.email}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-tinta-suave">{t("rol")}</dt>
            <dd className="font-semibold">{t(`roles.${rol}`)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl bg-slate-50 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-4 w-4 text-precio-600" aria-hidden />
          {t("tarjetas.seguridad.titulo")}
        </h2>
        <CambiarClave />
      </section>
    </div>
  );
}
