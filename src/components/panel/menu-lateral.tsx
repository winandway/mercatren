"use client";

import {
  ArrowUpRight,
  LayoutDashboard,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Entrada = {
  href: string;
  clave: string;
  Icono: typeof LayoutDashboard;
  insignia?: number;
};

const GRUPOS: { titulo: string; entradas: Entrada[] }[] = [
  {
    titulo: "operacion",
    entradas: [
      { href: "/panel", clave: "resumen", Icono: LayoutDashboard },
      { href: "/panel/pagos-zelle", clave: "pagosZelle", Icono: Receipt },
      { href: "/panel/validacion", clave: "validacion", Icono: ShieldCheck },
    ],
  },
  {
    titulo: "catalogo",
    entradas: [
      { href: "/panel/ordenes", clave: "ordenes", Icono: ShoppingBag },
      { href: "/panel/tiendas", clave: "tiendas", Icono: Store },
      { href: "/panel/clientes", clave: "clientes", Icono: Users },
    ],
  },
  {
    titulo: "sistema",
    entradas: [
      { href: "/panel/configuracion", clave: "configuracion", Icono: Settings },
    ],
  },
];

export function MenuLateral({ porValidar = 0 }: { porValidar?: number }) {
  const t = useTranslations("panel");
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const contenido = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <div className="flex items-center gap-2 px-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-carga-500/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_mercatren/mercatren-isotipo.svg"
            alt=""
            className="h-5 w-5"
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">
            Mercatren
          </span>
          <span className="block truncate text-xs text-white/50">
            {t("titulo")}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-6">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo}>
            <h2 className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
              {t(`menu.${grupo.titulo}`)}
            </h2>
            <ul className="space-y-0.5">
              {grupo.entradas.map(({ href, clave, Icono }) => {
                const activo =
                  href === "/panel"
                    ? pathname === "/panel"
                    : pathname.startsWith(href);
                const insignia = clave === "validacion" ? porValidar : 0;

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setAbierto(false)}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        activo
                          ? "bg-riel-800 font-semibold text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {activo ? (
                        <span
                          aria-hidden
                          className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r bg-carga-500"
                        />
                      ) : null}
                      <Icono className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        {t(`menu.${clave}`)}
                      </span>
                      {insignia > 0 ? (
                        <span className="shrink-0 rounded-full bg-carga-500 px-1.5 py-0.5 text-[11px] font-bold text-riel-950">
                          {insignia}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ArrowUpRight className="h-4 w-4" aria-hidden />
        {t("irAlSitio")}
      </Link>
    </nav>
  );

  return (
    <>
      {/* Barra de celular */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-riel-950 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={t("abrirMenu")}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <span className="text-sm font-bold text-white">
          Mercatren · {t("titulo")}
        </span>
      </div>

      {/* Menu fijo en pantallas grandes */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-riel-950 lg:block">
        {contenido}
      </aside>

      {/* Menu deslizante en celular */}
      {abierto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("cerrarMenu")}
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 animate-in bg-riel-950 duration-200 slide-in-from-left">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrarMenu")}
              className="absolute top-4 right-3 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {contenido}
          </div>
        </div>
      ) : null}
    </>
  );
}
