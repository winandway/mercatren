"use client";

import { ChevronDown, LayoutDashboard, Package, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Salir } from "@/components/cuenta/salir";
import { Link } from "@/i18n/navigation";

/**
 * "Cuenta y listas" del encabezado, con su panel desplegable.
 *
 * Antes era un enlace suelto a la cuenta y no habia NINGUNA forma de cerrar
 * sesion en todo el sitio: se entraba y ya. En una computadora compartida, o
 * en una demostracion delante de un cliente, eso deja el panel abierto para
 * quien se siente despues.
 *
 * Se abre al tocarlo y se cierra al tocar fuera o con Escape, igual que el
 * selector de idioma.
 */
export function MenuCuenta({
  nombre,
  trabajaEnElPanel,
}: {
  nombre: string;
  trabajaEnElPanel: boolean;
}) {
  const t = useTranslations("encabezado");
  const tc = useTranslations("cuenta");
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  const entradas = [
    { href: "/cuenta" as const, Icono: UserRound, texto: tc("titulo") },
    { href: "/pedidos" as const, Icono: Package, texto: t("pedidos") },
    ...(trabajaEnElPanel
      ? [
          {
            href: "/panel" as const,
            Icono: LayoutDashboard,
            texto: t("panel"),
          },
        ]
      : []),
  ];

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="celda-encabezado hidden items-center gap-1 text-left text-xs sm:flex"
      >
        <span className="min-w-0">
          <span className="block max-w-32 truncate text-white/70">
            {`${t("hola")} ${nombre.split(" ")[0]}`}
          </span>
          <span className="block text-sm font-bold">{t("cuentaYListas")}</span>
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </button>

      {abierto ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-lg bg-white p-2 text-tinta shadow-2xl ring-1 ring-black/10">
          <p className="truncate px-3 pt-2 pb-1 text-sm font-bold">{nombre}</p>

          <ul className="border-b border-borde pb-2">
            {entradas.map(({ href, Icono, texto }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setAbierto(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-50"
                >
                  <Icono className="h-4 w-4 text-carga-500" aria-hidden />
                  {texto}
                </Link>
              </li>
            ))}
          </ul>

          <Salir
            variante="enlace"
            className="mt-1 w-full rounded-md px-3 py-2 transition-colors hover:bg-red-50 hover:text-red-700"
          />
        </div>
      ) : null}
    </div>
  );
}
