"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CampoClave } from "@/components/cuenta/campo-clave";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/** El mismo mínimo que exige el servidor (`minPasswordLength` en auth.ts). */
const MINIMO = 10;

/**
 * La segunda mitad de "olvidé mi contraseña": poner la nueva.
 *
 * Aquí se llega desde el enlace del correo, que trae el pase en la dirección.
 * Sin pase no hay nada que hacer, y se dice — en vez de enseñar un formulario
 * que va a fallar al enviarlo.
 *
 * SE PIDE DOS VECES a propósito. Con el ojito se puede comprobar lo escrito,
 * pero quien pega una contraseña del gestor no la mira: si se pegó a medias,
 * lo descubriría mañana, cerrado fuera de su propia cuenta.
 *
 * Al terminar se manda a entrar con una CARGA COMPLETA: Better Auth cierra
 * las demás sesiones al cambiar la contraseña, y con una navegación de
 * cliente el encabezado se quedaría como estaba.
 */
export function PonerClaveNueva() {
  const t = useTranslations("clave");
  const idioma = useLocale();
  const parametros = useSearchParams();
  const pase = parametros.get("token");
  const errorEnlace = parametros.get("error");

  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  if (!pase || errorEnlace) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-tinta-suave">
          {errorEnlace ? t("enlaceVencido") : t("sinEnlace")}
        </p>
        <Link
          href="/olvide-mi-clave"
          className="mt-4 inline-block text-sm font-semibold text-carga-600 hover:underline"
        >
          {t("titulo")}
        </Link>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-precio-600" aria-hidden />
        <p className="mt-3 text-sm font-medium">{t("cambiada")}</p>
        <a
          href={`/${idioma}/entrar`}
          className="boton-principal mt-4 inline-flex"
        >
          {t("volver")}
        </a>
      </div>
    );
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (clave.length < MINIMO) return setError(t("cortaDemas"));
    if (clave !== repetida) return setError(t("noCoinciden"));

    setGuardando(true);
    const { error: fallo } = await authClient.resetPassword({
      newPassword: clave,
      token: pase!,
    });
    setGuardando(false);

    // Un pase gastado o vencido es el fallo normal aquí; el resto es raro.
    if (fallo) {
      setError(fallo.status === 400 ? t("enlaceVencido") : t("algoFallo"));
      return;
    }

    setListo(true);
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <CampoClave
        nombre="clave"
        etiqueta={t("nueva")}
        ayuda={t("minimo")}
        valor={clave}
        onChange={setClave}
        autoComplete="new-password"
        minimo={MINIMO}
      />

      <CampoClave
        nombre="repetida"
        etiqueta={t("repetir")}
        valor={repetida}
        onChange={setRepetida}
        autoComplete="new-password"
        minimo={MINIMO}
      />

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
        disabled={guardando}
        className="boton-principal w-full gap-2 disabled:opacity-60"
      >
        {guardando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {guardando ? t("guardando") : t("guardar")}
      </button>
    </form>
  );
}
