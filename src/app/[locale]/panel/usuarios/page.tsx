import { BadgeCheck, Store, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BuscadorPanel } from "@/components/panel/buscador-panel";
import { Link } from "@/i18n/navigation";
import type { Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { listarUsuarios } from "@/lib/usuarios/consultas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * El punto de color de cada cuenta.
 *
 * Verde solo el que opera de verdad. Sin esta distinción, una demostración
 * con 120 cuentas todas en verde y un único comercio real se lee como números
 * inflados — y quien mira tiene razón en desconfiar.
 */
const TONO_ESTADO: Record<string, string> = {
  activo: "bg-precio-600",
  inactivo: "bg-red-500",
  demostracion: "bg-slate-300",
};

const TONO_ROL: Record<string, string> = {
  soporte: "bg-riel-900 text-white",
  validador: "bg-blue-100 text-blue-900",
  vendedor: "bg-carga-500/20 text-carga-700",
  cliente: "bg-slate-200 text-slate-700",
};

/**
 * Todas las cuentas del sistema.
 *
 * Distinto de "Clientes", que solo lista a quien ha COMPRADO. Aquí sale todo
 * el que tiene cuenta — comercios, validadores, el equipo —, que es lo que
 * hace falta para comprobar de un vistazo que un comercio ya está dado de
 * alta y con qué correo entra.
 */
export default async function PaginaUsuarios({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.usuarios");
  /* El texto viaja en la dirección: así el resultado sobrevive a un refresco y
     se puede pasar por chat. Se recorta antes de consultar. */
  const busqueda = ((await searchParams).q ?? "").trim().slice(0, 80);
  const usuarios = await listarUsuarios(busqueda).catch(() => []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-tinta-suave">{t("subtitulo")}</p>
      </header>

      <BuscadorPanel
        busqueda={busqueda}
        ruta="/panel/usuarios"
        placeholder={t("buscarPlaceholder")}
        textoTotal={t("total", { n: usuarios.length })}
        textoResultados={t("resultados", {
          n: usuarios.length,
          texto: busqueda,
        })}
      />

      {usuarios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <UserRound
            className="mx-auto h-10 w-10 text-tinta-suave"
            aria-hidden
          />
          {/* «No hay cuentas» y «no hay resultados» son cosas distintas: con el
              primero uno va a crear una cuenta; con el segundo, a corregir lo
              que escribió. */}
          <p className="mt-4 text-sm text-tinta-suave">
            {busqueda ? t("sinResultados", { texto: busqueda }) : t("vacio")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {usuarios.map((u) => (
            <li key={u.id}>
              <Link
                href={`/panel/usuarios/${u.id}`}
                className="block h-full rounded-xl border border-borde bg-white p-4 transition-colors hover:border-carga-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-riel-900 text-sm font-bold text-white">
                    {u.nombre.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 text-[12px] font-medium text-tinta-suave"
                      title={t(`estados.${u.estadoCuenta}`)}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          TONO_ESTADO[u.estadoCuenta],
                        )}
                      />
                      {t(`estados.${u.estadoCuenta}`)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[12px] font-bold",
                        TONO_ROL[u.rol] ?? TONO_ROL.cliente,
                      )}
                    >
                      {t(`roles.${u.rol}`)}
                    </span>
                  </span>
                </div>

                <p className="mt-3 flex items-center gap-1.5 font-semibold">
                  <span className="truncate">{u.nombre}</span>
                  {u.correoVerificado ? (
                    <BadgeCheck
                      className="h-4 w-4 shrink-0 text-precio-600"
                      aria-label={t("verificado")}
                    />
                  ) : null}
                </p>
                <p className="truncate text-sm text-tinta-suave">{u.correo}</p>

                {u.tienda ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-tinta-suave">
                    <Store className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{u.tienda.nombre}</span>
                  </p>
                ) : null}

                <p className="mt-1 text-xs text-tinta-suave">
                  {t("desde", { fecha: fechaCorta(u.creadoEn, idioma) ?? "—" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
