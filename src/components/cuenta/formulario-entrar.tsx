"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Entrada al sistema. El panel de administracion solo abre para las cuentas
 * con permiso; una cuenta recien creada entra como cliente.
 */
export function FormularioEntrar() {
  const t = useTranslations("entrar");
  const router = useRouter();
  const parametros = useSearchParams();
  const destino = parametros.get("destino") ?? "/";

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const { error: fallo } = await authClient.signIn.email({
      email: correo.trim(),
      password: clave,
    });

    setEnviando(false);

    if (fallo) {
      setError(t("errorCredenciales"));
      return;
    }

    router.push(destino);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-4">
      <div>
        <label htmlFor="correo" className="block text-sm font-medium">
          {t("correo")}
        </label>
        <input
          id="correo"
          type="email"
          required
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder={t("correoPlaceholder")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        />
      </div>

      <div>
        <label htmlFor="clave" className="block text-sm font-medium">
          {t("clave")}
        </label>
        <input
          id="clave"
          type="password"
          required
          minLength={10}
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="boton-principal w-full disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          t("entrar")
        )}
      </button>
    </form>
  );
}
