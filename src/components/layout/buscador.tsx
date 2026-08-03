"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

/**
 * Buscador ancho del encabezado, la pieza central del sitio.
 */
export function Buscador() {
  const t = useTranslations("encabezado");
  const router = useRouter();
  const [texto, setTexto] = useState("");

  return (
    <form
      role="search"
      className="flex h-10 w-full overflow-hidden rounded-md bg-white focus-within:ring-3 focus-within:ring-carga-500"
      onSubmit={(evento) => {
        evento.preventDefault();
        const limpio = texto.trim();
        if (!limpio) return;
        router.push(`/buscar?q=${encodeURIComponent(limpio)}`);
      }}
    >
      <label htmlFor="buscador" className="sr-only">
        {t("buscar")}
      </label>
      <input
        id="buscador"
        name="q"
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder={t("buscarPlaceholder")}
        autoComplete="off"
        className="min-w-0 flex-1 px-3 text-sm text-tinta outline-none placeholder:text-tinta-suave"
      />
      <button
        type="submit"
        aria-label={t("buscar")}
        className="flex w-12 shrink-0 items-center justify-center bg-carga-500 text-riel-950 transition-colors hover:bg-carga-600"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}
