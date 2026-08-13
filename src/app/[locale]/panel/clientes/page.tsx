import { Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { obtenerAlcance } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { listarClientes } from "@/lib/pedidos/consultas";

export const dynamic = "force-dynamic";

/**
 * Los clientes que han comprado.
 *
 * Un comercio ve solo a quienes le compraron A EL, y el gasto que muestra es
 * lo que gastaron EN SU TIENDA. Ver la lista completa de compradores de la
 * plataforma, o lo que gastaron en otro comercio, seria filtrar datos de un
 * competidor.
 */
export default async function PaginaClientes({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.clientes");
  const tm = await getTranslations("panel.menu");
  const { comercio } = await searchParams;

  const alcance = await obtenerAlcance();
  const clientes = await listarClientes(comercio);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          {alcance.tipo === "tienda" ? t("subtitulo") : t("subtituloEquipo")}
        </p>
      </header>

      {clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-tinta-suave" aria-hidden />
          <p className="mt-4 text-sm text-tinta-suave">{t("vacio")}</p>

          {/* Aquí es donde se confunde la gente: entra buscando un comercio y
              encuentra la pantalla vacía. Se le dice a dónde ir. */}
          <p className="mt-2 text-sm text-tinta-suave">
            {t("pista")}{" "}
            <Link
              href="/panel/usuarios"
              className="font-semibold text-carga-600 hover:underline"
            >
              {tm("usuarios")}
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {clientes.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-borde bg-white p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-riel-900 text-sm font-bold text-white">
                {c.nombre?.trim()?.[0]?.toUpperCase() ?? "?"}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.nombre}</p>
                <p className="truncate text-xs text-tinta-suave">{c.correo}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-tinta-suave">
                  <span>{t("pedidos", { n: c.pedidos })}</span>
                  {c.ultimo ? (
                    <span>
                      {t("columna.ultimo")}:{" "}
                      {fechaCorta(new Date(Number(c.ultimo) * 1000), idioma)}
                    </span>
                  ) : null}
                  {c.pais ? <span>{c.pais}</span> : null}
                </p>
              </div>

              <p className="shrink-0 text-right">
                <span className="block text-lg font-extrabold tabular-nums">
                  {formatearPrecio(c.gastadoCentavos, idioma)}
                </span>
                <span className="block text-[12px] text-tinta-suave">
                  {t("columna.gastado")}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
