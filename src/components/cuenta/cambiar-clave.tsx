"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Cambiar la propia contrasena, desde la cuenta.
 *
 * Hacia falta de verdad: una cuenta creada por el equipo llega con una
 * contrasena temporal y hasta ahora no habia manera de cambiarla desde el
 * sitio. El correo de "olvide mi contrasena" existe, pero depende de que el
 * envio este conectado; esto no depende de nada.
 *
 * Se pide la contrasena actual a proposito: si alguien se sienta frente a una
 * sesion abierta, no puede cambiarla sin saber la que hay.
 */
export function CambiarClave() {
  const t = useTranslations("entrar.seguridad");

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const clases =
    "mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setAviso(null);

    if (nueva.length < 10) {
      setAviso({ ok: false, texto: t("corta") });
      return;
    }
    if (nueva !== repetida) {
      setAviso({ ok: false, texto: t("noCoinciden") });
      return;
    }

    setEnviando(true);
    const { error } = await authClient.changePassword({
      currentPassword: actual,
      newPassword: nueva,
      // La sesion de aqui sigue abierta; las demas se cierran, que es lo
      // sensato si se cambia la contrasena porque alguien la vio.
      revokeOtherSessions: true,
    });
    setEnviando(false);

    if (error) {
      setAviso({ ok: false, texto: t("errorActual") });
      return;
    }

    setActual("");
    setNueva("");
    setRepetida("");
    setAviso({ ok: true, texto: t("listo") });
  }

  return (
    <form onSubmit={enviar} className="mt-4 max-w-md space-y-3">
      <p className="text-sm text-tinta-suave">{t("texto")}</p>

      {aviso ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">{t("actual")}</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          className={clases}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("nueva")}</span>
        <input
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          className={clases}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("repetir")}</span>
        <input
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          className={clases}
        />
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="boton-principal gap-2 disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="h-4 w-4" aria-hidden />
        )}
        {enviando ? t("cambiando") : t("cambiar")}
      </button>
    </form>
  );
}
