"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { CampoClave } from "@/components/cuenta/campo-clave";
import { Escudo } from "@/components/cuenta/escudo";
import { Campo } from "@/components/ui/campo";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { registrarAceptacion } from "@/lib/legal-acciones";
import { medirClave } from "@/lib/validacion/fortaleza";

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
export function FormularioRegistro({ claveEscudo }: { claveEscudo?: string }) {
  const t = useTranslations("entrar");
  const tClave = useTranslations("formularios.clave");
  const idioma = useLocale();
  const parametros = useSearchParams();
  const destino = parametros.get("destino") ?? "/";

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [pase, setPase] = useState<string | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    // Se corta ANTES de llamar al servidor, con el motivo de verdad. Una
    // contraseña de 9 caracteres rebotaba en el servidor y la pantalla decía
    // "puede que ese correo ya esté registrado": la persona cambiaba de
    // correo tres veces y el problema era la clave. Pasó de verdad.
    if (clave.length < 10) {
      setError(t("errorClaveCorta"));
      return;
    }

    /**
     * LAS INDEFENDIBLES NO PASAN, por muy larga que sea la clave.
     *
     * El medidor ya lo dice en pantalla mientras se escribe; esto es el
     * cinturón. Solo corta lo que no tiene defensa posible —`password123`,
     * `12345678901`, o una que lleve dentro su propio correo—, no las
     * simplemente flojas: exigir una clave perfecta espanta clientes, pero
     * dejar pasar la más probada del mundo es regalar la cuenta.
     *
     * Esta cuenta puede terminar viendo el dinero de un comercio.
     */
    const fuerza = medirClave(clave, [correo, nombre]);
    if (!fuerza.aceptable) {
      const motivo = fuerza.consejos[0] ?? "muyCorta";
      setError(tClave.has(motivo) ? tClave(motivo) : t("errorClaveCorta"));
      return;
    }

    /* SIN ACEPTAR LOS TÉRMINOS NO HAY CUENTA. La casilla arranca sin marcar
       —una premarcada no prueba nada— y el navegador ya la exige con
       `required`; esto es el cinturón por si el HTML se manipula. */
    if (!acepta) {
      setError(t("errorAceptaTerminos"));
      return;
    }

    setEnviando(true);

    const { error: fallo } = await authClient.signUp.email(
      { name: nombre.trim(), email: correo.trim(), password: clave },
      { headers: pase ? { "x-escudo": pase } : {} },
    );

    setEnviando(false);

    if (fallo) {
      /**
       * EL MOTIVO REAL, no uno genérico. Culpar al correo cuando el problema
       * es la contraseña manda a la persona a pelear con lo que sí estaba
       * bien. En el registro decir "ese correo ya tiene cuenta" es lo normal
       * (Amazon lo dice); lo que no se puede es decirlo cuando no es cierto.
       */
      const codigo = (fallo as { code?: string }).code;
      setError(
        fallo.status === 403
          ? t("errorEscudo")
          : codigo === "PASSWORD_TOO_SHORT"
            ? t("errorClaveCorta")
            : codigo === "PASSWORD_TOO_LONG"
              ? t("errorClaveLarga")
              : codigo === "USER_ALREADY_EXISTS"
                ? t("errorCorreoOcupado")
                : codigo === "INVALID_EMAIL"
                  ? t("errorCorreoInvalido")
                  : t("errorRegistro"),
      );
      return;
    }

    /* LA ACEPTACIÓN QUEDA GRABADA con quién, cuándo y qué versión. Va
       después del alta porque necesita la sesión recién creada; si la
       grabación fallara, el error queda en el servidor y la cuenta sigue. */
    await registrarAceptacion("registro");

    /* La cuenta ya existe. ANTES de la carga completa: si no, la pantalla
       vuelve y le repinta encima un nombre y un correo ya usados. */
    olvidarBorrador("registro-cuenta");

    // Carga completa, por lo mismo que en la pantalla de entrar: acaba de
    // cambiar quien eres y el servidor tiene que armar la pagina otra vez.
    window.location.assign(`/${idioma}${destino === "/" ? "" : destino}`);
  }

  return (
    <FormularioPersistente
      llave="registro-cuenta"
      onSubmit={enviar}
      className="mt-8 space-y-4"
    >
      {/* Nombre y correo pasan por las reglas compartidas: el nombre no admite
          números y el correo se guarda en minúsculas, sea como sea que lo
          escriba la persona. */}
      <Campo
        tipo="nombrePersona"
        nombre="nombre"
        etiqueta={t("nombre")}
        marcador={t("nombrePlaceholder")}
        valor={nombre}
        onChange={setNombre}
        requerido
      />

      <Campo
        tipo="correo"
        nombre="correo"
        etiqueta={t("correo")}
        marcador={t("correoPlaceholder")}
        valor={correo}
        onChange={setCorreo}
        requerido
      />

      <CampoClave
        nombre="clave"
        etiqueta={t("claveNueva")}
        ayuda={t("claveAyuda")}
        valor={clave}
        onChange={setClave}
        autoComplete="new-password"
        minimo={10}
        /* Con esto el medidor rechaza una contraseña que lleve dentro su propio
           correo o su nombre, que es de las primeras que prueba quien la conoce. */
        contexto={[correo, nombre]}
      />

      {/* LA FIRMA DEL CONTRATO. Casilla sin premarcar, con el texto a un
          clic en esa misma pantalla: es lo que hace que la aceptación valga
          como firma. */}
      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          required
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-carga-500"
        />
        <span className="text-tinta-suave">
          {t.rich("aceptoTerminos", {
            terminos: (texto) => (
              <Link
                href="/terminos"
                target="_blank"
                className="font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
              >
                {texto}
              </Link>
            ),
            privacidad: (texto) => (
              <Link
                href="/privacidad"
                target="_blank"
                className="font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
              >
                {texto}
              </Link>
            ),
          })}
        </span>
      </label>

      <Escudo claveSitio={claveEscudo} idioma={idioma} onPase={setPase} />

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
    </FormularioPersistente>
  );
}
