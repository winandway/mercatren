"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * "Olvidé mi contraseña": pedir el enlace.
 *
 * NUNCA SE DICE SI EL CORREO EXISTE. Salga bien o mal, la pantalla responde
 * lo mismo: "si esa dirección tiene cuenta, ya salió el enlace". Un mensaje
 * distinto para un correo desconocido convierte esta pantalla en una forma
 * cómoda de averiguar quién tiene cuenta aquí — y aquí dentro hay dinero de
 * comercios.
 *
 * Por eso tampoco se enseña el error del servidor: solo se registra.
 */
export function PedirEnlaceClave() {
  const t = useTranslations("clave");
  const idioma = useLocale();
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);

    // El enlace del correo lleva de vuelta a la pantalla donde se escribe la
    // contraseña nueva, en el idioma en el que se pidió.
    // En Better Auth 1.6 el método se llama `requestPasswordReset`. El
    // antiguo `forgetPassword` ya no existe.
    await authClient
      .requestPasswordReset({
        email: correo.trim(),
        redirectTo: `/${idioma}/nueva-clave`,
      })
      .catch(() => null);

    setEnviando(false);
    setListo(true);
  }

  if (listo) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-precio-600" aria-hidden />
        <h2 className="mt-3 font-bold">{t("listoTitulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("listoTexto")}</p>
        <Link
          href="/entrar"
          className="mt-4 inline-block text-sm font-semibold text-carga-600 hover:underline"
        >
          {t("volver")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label htmlFor="correo" className="block text-sm font-medium">
          {t("correo")}
        </label>
        <input
          id="correo"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="correo@ejemplo.com"
          // 16px como mínimo: por debajo, el iPhone hace zoom al tocar.
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="boton-principal w-full gap-2 disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {enviando ? t("enviando") : t("enviar")}
      </button>

      <p className="text-center">
        <Link
          href="/entrar"
          className="text-sm text-tinta-suave hover:underline"
        >
          {t("volver")}
        </Link>
      </p>
    </form>
  );
}
