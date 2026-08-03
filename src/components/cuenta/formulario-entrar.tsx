"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { CampoClave } from "@/components/cuenta/campo-clave";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Entrada al sistema. El panel de administracion solo abre para las cuentas
 * con permiso; una cuenta recien creada entra como cliente.
 */
export function FormularioEntrar() {
  const t = useTranslations("entrar");
  const idioma = useLocale();
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

    const { data, error: fallo } = await authClient.signIn.email({
      email: correo.trim(),
      password: clave,
    });

    setEnviando(false);

    if (fallo) {
      setError(t("errorCredenciales"));
      return;
    }

    /**
     * A DONDE VA CADA QUIEN.
     *
     * Si venia de una pantalla concreta (el middleware manda aqui con
     * ?destino=), se le devuelve ahi. Si no, se le lleva a donde tiene algo
     * que hacer: a quien trabaja en el panel, al panel; a quien compra, a la
     * tienda.
     */
    const rol = (data?.user as { rol?: string } | undefined)?.rol;
    const trabajaEnElPanel =
      rol === "soporte" || rol === "validador" || rol === "vendedor";

    const ruta = destino !== "/" ? destino : trabajaEnElPanel ? "/panel" : "/";

    /**
     * SE VA CON UNA CARGA COMPLETA, NO CON NAVEGACION DE CLIENTE.
     *
     * Aqui acaba de cambiar quien eres, y de eso depende TODA la pantalla: el
     * encabezado, el menu lateral, lo que el panel deja ver. Una navegacion de
     * cliente arrastra lo que el navegador ya tenia armado de cuando no habias
     * entrado, y ademas depende de que el trabajador de la aplicacion instalada
     * no se meta en el camino — que era justo lo que estaba pasando: la
     * navegacion al panel moria en silencio y la persona se quedaba mirando la
     * misma pantalla, sin ningun error.
     *
     * Una carga completa no tiene ese problema: el servidor arma la pagina otra
     * vez con la sesion nueva. Cuesta una fraccion de segundo y solo pasa una
     * vez, al entrar.
     */
    window.location.assign(`/${idioma}${ruta === "/" ? "" : ruta}`);
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

      <CampoClave
        nombre="clave"
        etiqueta={t("clave")}
        valor={clave}
        onChange={setClave}
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
          t("entrar")
        )}
      </button>

      {/* Sin esto, quien llega sin cuenta no puede comprar: se queda aqui. */}
      <p className="text-center text-sm text-tinta-suave">
        {t("noTengo")}{" "}
        <Link
          href={
            destino !== "/"
              ? `/registro?destino=${encodeURIComponent(destino)}`
              : "/registro"
          }
          className="font-semibold text-carga-600 hover:underline"
        >
          {t("registrate")}
        </Link>
      </p>
    </form>
  );
}
