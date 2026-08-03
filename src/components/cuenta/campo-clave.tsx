"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Casilla de contrasena, SIEMPRE con el ojito para verla.
 *
 * REGLA DEL PROYECTO: ningun campo de contrasena se escribe a ciegas. Sin el
 * ojito, quien pega una contrasena guardada no puede comprobar que pego la
 * que era, y quien la escribe a mano no ve el dedo que se le fue. El
 * resultado siempre es el mismo: "credenciales incorrectas" sin saber por
 * que, y a veces la cuenta bloqueada.
 *
 * Toda casilla de contrasena del sitio usa este componente. Si aparece un
 * type="password" suelto en algun sitio, esta mal.
 *
 * El ojito arranca cerrado: la contrasena solo se ve cuando la persona lo
 * pide, no cuando pasa alguien por detras.
 */
export function CampoClave({
  nombre,
  etiqueta,
  ayuda,
  valor,
  onChange,
  autoComplete = "current-password",
  minimo,
  obligatorio = true,
}: {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  valor: string;
  onChange: (valor: string) => void;
  autoComplete?: "current-password" | "new-password";
  minimo?: number;
  obligatorio?: boolean;
}) {
  const t = useTranslations("entrar");
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {etiqueta}
      </label>

      <div className="relative mt-1">
        <input
          id={id}
          name={nombre}
          type={visible ? "text" : "password"}
          required={obligatorio}
          minLength={minimo}
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          // Sitio a la derecha para el ojito, para que no tape el texto.
          className={cn(
            "w-full rounded-lg border border-slate-300 py-2.5 pr-11 pl-3 text-sm outline-none",
            "focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30",
          )}
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // El boton dice lo que va a hacer, no lo que se ve ahora.
          aria-label={visible ? t("ocultarClave") : t("verClave")}
          title={visible ? t("ocultarClave") : t("verClave")}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-tinta-suave transition-colors hover:text-tinta focus-visible:outline-2"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      {ayuda ? <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p> : null}
    </div>
  );
}
