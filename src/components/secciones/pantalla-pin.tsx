"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { comprobarPin } from "@/lib/secciones/acciones";

/**
 * EL PIN, EN EL CELULAR Y CON UNA MANO.
 *
 * Cuatro casillas grandes con teclado numérico: en un almacén, con el teléfono
 * en una mano, un campo de texto normal y un teclado completo es justo lo que
 * hace que la herramienta se abandone.
 *
 * ══ TRES DETALLES QUE SON LA DIFERENCIA ══
 *
 * 1. **Salta sola a la siguiente casilla** al escribir, y al borrar vuelve
 *    atrás: es lo que hace que se teclee sin mirar.
 * 2. **Se envía sola al cuarto dígito.** Un botón «Entrar» debajo obliga a un
 *    toque más que no aporta nada — el PIN ya está completo.
 * 3. **Acepta pegar los cuatro dígitos de golpe**, que es como llega por
 *    WhatsApp.
 */
export function PantallaPin({
  llave,
  nombre,
}: {
  llave: string;
  nombre: string;
}) {
  const t = useTranslations("secciones");
  const [digitos, setDigitos] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const casillas = useRef<(HTMLInputElement | null)[]>([]);

  async function probar(pin: string) {
    setEnviando(true);
    setError(null);
    const r = await comprobarPin(llave, pin);
    setEnviando(false);
    if (r.ok) {
      /* Carga completa a propósito: el servidor tiene que volver a leer la
         cookie del pase para dibujar la pantalla de subir. */
      window.location.reload();
      return;
    }
    setError(r.mensaje);
    setDigitos(["", "", "", ""]);
    casillas.current[0]?.focus();
  }

  function escribir(i: number, valor: string) {
    const limpio = valor.replace(/[^0-9]/g, "");
    if (!limpio) {
      const copia = [...digitos];
      copia[i] = "";
      setDigitos(copia);
      return;
    }
    /* Pegar los cuatro de golpe: se reparten desde esta casilla. */
    const copia = [...digitos];
    for (let j = 0; j < limpio.length && i + j < 4; j++) {
      copia[i + j] = limpio[j] as string;
    }
    setDigitos(copia);
    const siguiente = Math.min(3, i + limpio.length);
    casillas.current[siguiente]?.focus();
    const pin = copia.join("");
    if (pin.length === 4 && !copia.includes("")) void probar(pin);
  }

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-16 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-carga-500/10 text-carga-600">
        <KeyRound className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-bold text-riel-900">{nombre}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("pidePin")}</p>

      <div className="mt-7 flex justify-center gap-3">
        {digitos.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              casillas.current[i] = el;
            }}
            value={d}
            onChange={(e) => escribir(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digitos[i] && i > 0) {
                casillas.current[i - 1]?.focus();
              }
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            disabled={enviando}
            aria-label={t("digito", { n: i + 1 })}
            className="h-16 w-14 rounded-xl border-2 border-borde text-center text-2xl font-bold tabular-nums outline-none focus:border-carga-500 disabled:opacity-60"
          />
        ))}
      </div>

      {enviando ? (
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-tinta-suave">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("comprobando")}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
