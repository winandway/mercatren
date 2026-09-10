"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ══ EL FORMULARIO DEL WIDGET ══
 *
 * Vive dentro de un iframe en la página de otro. Pide lo mínimo y, al
 * terminar, **enseña el código y la dirección línea por línea**: es el
 * único momento en que la dirección se ve fuera de la cuenta, y se puede
 * porque ya hay casillero, que es lo que la hace servir.
 *
 * El alto se le dice a la página que lo aloja: sin eso queda una barra de
 * desplazamiento dentro del marco, que en el celular se ve roto.
 */
export function FormularioWidget({
  clave,
  es,
}: {
  clave: string;
  es: boolean;
}) {
  const caja = useRef<HTMLDivElement>(null);
  /* Cuándo se abrió, para el tiempo mínimo de llenado. Se toma en un
     efecto y no al construir: llamar a `Date.now()` durante el dibujado
     hace que dos dibujados den dos valores distintos, y React lo prohíbe
     con razón. */
  const abierto = useRef(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Solo «listo»: el servidor NO devuelve el código ni la dirección, y no
     puede — cualquiera escribiría el correo de otro y se llevaría su
     casillero. El dato va al buzón. Ver `datos/widget/route.ts`. */
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (abierto.current === 0) abierto.current = Date.now();
  }, []);

  useEffect(() => {
    const avisar = () => {
      const alto = caja.current?.getBoundingClientRect().height ?? 0;
      window.parent?.postMessage(
        { tipo: "mtr-casillero-alto", alto: Math.ceil(alto) + 32 },
        "*",
      );
    };
    avisar();
    const observador = new ResizeObserver(avisar);
    if (caja.current) observador.observe(caja.current);
    return () => observador.disconnect();
  }, [listo, error]);

  const t = (a: string, b: string) => (es ? a : b);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/datos/widget", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clave,
          nombreLegal: String(datos.get("nombreLegal") ?? ""),
          email: String(datos.get("email") ?? ""),
          telefono: String(datos.get("telefono") ?? ""),
          paisDestino: String(datos.get("paisDestino") ?? ""),
          terminos: datos.get("terminos") === "on",
          web: String(datos.get("web") ?? ""),
          segundos: abierto.current
            ? Math.round((Date.now() - abierto.current) / 1000)
            : 0,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; motivo?: string };
      if (!j.ok) {
        setError(
          j.motivo === "limite"
            ? t(
                "Demasiados intentos. Prueba en unos minutos.",
                "Too many attempts. Try again in a few minutes.",
              )
            : t(
                "No se pudo crear. Revisa los datos.",
                "Couldn't create it. Check your details.",
              ),
        );
        return;
      }
      setListo(true);
    } catch {
      setError(t("No hay conexión.", "No connection."));
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div ref={caja} className="space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          {t("Revisa tu correo", "Check your email")}
        </p>
        <p className="text-sm text-slate-600">
          {t(
            "Te mandamos tu número de casillero y tu dirección de Miami. Si ya tenías cuenta en Mercatren, ahí te decimos cómo entrar.",
            "We've sent you your locker number and your Miami address. If you already had a Mercatren account, the email explains how to sign in.",
          )}
        </p>
        <p className="text-xs text-slate-500">
          {t(
            "No la enseñamos aquí a propósito: es tuya, y solo tú tienes que verla.",
            "We don't show it here on purpose: it's yours, and only you should see it.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div ref={caja}>
      <form onSubmit={enviar} className="space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          {t("Crea tu casillero en Miami", "Create your Miami locker")}
        </p>
        {error ? (
          <p className="rounded bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-800">
            {error}
          </p>
        ) : null}
        <input
          name="nombreLegal"
          required
          placeholder={t("Nombre y apellidos", "First and last name")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          placeholder={t("Correo electrónico", "Email")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="telefono"
          required
          placeholder={t(
            "Teléfono con código de país",
            "Phone with country code",
          )}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="paisDestino"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {t("¿A qué país lo enviamos?", "Which country do we ship to?")}
          </option>
          {[
            ["VE", "Venezuela"],
            ["CO", "Colombia"],
            ["CL", "Chile"],
            ["PE", "Perú"],
            ["EC", "Ecuador"],
            ["BO", "Bolivia"],
            ["AR", "Argentina"],
            ["PY", "Paraguay"],
            ["UY", "Uruguay"],
            ["BR", "Brasil"],
          ].map(([c, n]) => (
            <option key={c} value={c}>
              {n}
            </option>
          ))}
        </select>
        {/* LA TRAMPA. Invisible para una persona; un robot la rellena y el
            servidor lo descarta sin crear nada. */}
        <input
          name="web"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute h-0 w-0 opacity-0"
        />
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input name="terminos" type="checkbox" required className="mt-0.5" />
          <span>
            {t(
              "Acepto los términos y la política de privacidad de Mercatren.",
              "I accept Mercatren's terms and privacy policy.",
            )}
          </span>
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-[#FF6B1A] px-4 py-2.5 text-sm font-semibold text-[#0a1826] disabled:opacity-60"
        >
          {enviando
            ? t("Creando…", "Creating…")
            : t("Crear mi casillero", "Create my locker")}
        </button>
      </form>
    </div>
  );
}
