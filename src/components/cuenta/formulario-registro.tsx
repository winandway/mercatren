"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CampoClave } from "@/components/cuenta/campo-clave";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Alta de cuenta para quien va a comprar.
 *
 * Sin esta pantalla nadie podia crear una cuenta desde el sitio, y como hace
 * falta cuenta para comprar, no se podia comprar. El servidor si permitia el
 * alta; lo que faltaba era la pantalla.
 *
 * OJO: una cuenta nueva entra SIEMPRE como cliente. El rol no viaja en este
 * formulario a proposito (`input: false` en el esquema de la cuenta): quien
 * entra al panel se decide aparte, nunca desde aqui.
 */
export function FormularioRegistro() {
  const t = useTranslations("entrar");
  const router = useRouter();
  const parametros = useSearchParams();
  const destino = parametros.get("destino") ?? "/";

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const { error: fallo } = await authClient.signUp.email({
      name: nombre.trim(),
      email: correo.trim(),
      password: clave,
    });

    setEnviando(false);

    if (fallo) {
      setError(t("errorRegistro"));
      return;
    }

    router.push(destino);
    router.refresh();
  }

  const clases =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

  return (
    <form onSubmit={enviar} className="mt-8 space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium">
          {t("nombre")}
        </label>
        <input
          id="nombre"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={t("nombrePlaceholder")}
          className={clases}
        />
      </div>

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
          className={clases}
        />
      </div>

      <CampoClave
        nombre="clave"
        etiqueta={t("claveNueva")}
        ayuda={t("claveAyuda")}
        valor={clave}
        onChange={setClave}
        autoComplete="new-password"
        minimo={10}
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
        disabled={enviando}
        className="boton-principal w-full disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          t("registrarse")
        )}
      </button>

      <p className="text-center text-sm text-tinta-suave">
        <Link href="/entrar" className="font-semibold hover:text-carga-600">
          {t("volverEntrar")}
        </Link>
      </p>
    </form>
  );
}
