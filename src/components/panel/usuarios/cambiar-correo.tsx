"use client";

import { AtSign, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { useRouter } from "@/i18n/navigation";
import { cambiarCorreoDeCuenta } from "@/lib/usuarios/acciones";
import { cn } from "@/lib/utils";

/**
 * CAMBIARLE EL CORREO DE ACCESO A UNA CUENTA.
 *
 * Los primeros comercios los dimos de alta nosotros con un correo NUESTRO, y
 * así no pueden entrar ni recuperar su contraseña: el enlace llega a un buzón
 * que ellos no manejan. Esto lo arregla en diez segundos, sin tocar la base a
 * mano.
 *
 * Se dice ANTES de pulsar que la contraseña no cambia. Es la primera duda de
 * quien lo hace —«¿lo dejo fuera de su cuenta?»— y no saberla es lo que hace
 * que nadie se atreva a tocarlo.
 */
export function CambiarCorreo({
  usuarioId,
  correoActual,
}: {
  usuarioId: string;
  correoActual: string;
}) {
  const t = useTranslations("panel.usuarios.cambiarCorreo");
  const router = useRouter();
  const [guardando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const llave = `correo-cuenta:${usuarioId}`;

  return (
    <section className="rounded-xl border border-borde bg-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <AtSign className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{t("texto")}</p>

      <FormularioPersistente
        llave={llave}
        className="mt-4 space-y-3"
        action={(datos) =>
          iniciar(async () => {
            setAviso(null);
            datos.set("usuarioId", usuarioId);

            let r;
            try {
              r = await cambiarCorreoDeCuenta(datos);
            } catch (fallo) {
              /* Nada de lo que pase aquí puede llevarse por delante lo
                 escrito: la misma regla que en el resto del panel. */
              console.error("[usuarios] no se pudo cambiar el correo:", fallo);
              setAviso({ ok: false, texto: String(fallo) });
              return;
            }

            setAviso({ ok: r.ok, texto: r.mensaje });
            if (r.ok) {
              olvidarBorrador(llave);
              router.refresh();
            }
          })
        }
      >
        {aviso ? (
          <p
            role="status"
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              aviso.ok
                ? "bg-emerald-50 text-emerald-900"
                : "bg-red-50 text-red-800",
            )}
          >
            {aviso.texto}
          </p>
        ) : null}

        <label className="block max-w-md">
          <span className="text-sm font-semibold">{t("campo")}</span>
          <input
            type="email"
            name="correo"
            required
            inputMode="email"
            autoComplete="off"
            defaultValue=""
            placeholder={t("marcador")}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500"
          />
          <span className="mt-1 block text-xs text-tinta-suave">
            {correoActual}
          </span>
        </label>

        {/* Lo que hay que saber ANTES de pulsar, no después. */}
        <p className="max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {t("aviso")}
        </p>

        <button
          type="submit"
          disabled={guardando}
          className="boton-principal gap-2 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {guardando ? t("guardando") : t("guardar")}
        </button>
      </FormularioPersistente>
    </section>
  );
}
