"use client";

import { ImagePlus, Loader2, Save, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { guardarMiTienda } from "@/lib/tiendas/acciones";
import { cn } from "@/lib/utils";

type Tienda = {
  id: string;
  nombre: string;
  descripcionEs: string | null;
  descripcionEn: string | null;
  logoUrl: string | null;
  portadaUrl: string | null;
  razonSocial: string | null;
  identificacionFiscal: string | null;
  correoContacto: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  sitioWeb: string | null;
  horario: string | null;
};

/** Un campo de texto del formulario. Todos se ven igual. */
function Campo({
  nombre,
  etiqueta,
  ayuda,
  valor,
  placeholder,
  tipo = "text",
  filas,
  obligatorio,
}: {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  valor: string | null;
  placeholder?: string;
  tipo?: string;
  filas?: number;
  obligatorio?: boolean;
}) {
  const clases =
    "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

  return (
    <label className="block">
      <span className="text-sm font-semibold">{etiqueta}</span>
      {filas ? (
        <textarea
          name={nombre}
          rows={filas}
          defaultValue={valor ?? ""}
          placeholder={placeholder}
          className={cn(clases, "resize-y")}
        />
      ) : (
        <input
          type={tipo}
          name={nombre}
          defaultValue={valor ?? ""}
          placeholder={placeholder}
          required={obligatorio}
          className={clases}
        />
      )}
      {ayuda ? (
        <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>
      ) : null}
    </label>
  );
}

/**
 * Elige una imagen y la muestra antes de guardarla.
 * Ver lo que se va a subir evita el clasico "subi la que no era".
 */
function ElegirImagen({
  nombre,
  etiqueta,
  ayuda,
  actual,
  vacio,
  cambiar,
  redonda,
}: {
  nombre: string;
  etiqueta: string;
  ayuda: string;
  actual: string | null;
  vacio: string;
  cambiar: string;
  redonda?: boolean;
}) {
  const [vista, setVista] = useState<string | null>(actual);
  const entrada = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-sm font-semibold">{etiqueta}</p>

      <div
        className={cn(
          "mt-2 flex items-center justify-center overflow-hidden border border-dashed border-borde bg-slate-50",
          redonda ? "h-24 w-24 rounded-2xl" : "h-28 w-full rounded-xl",
        )}
      >
        {vista ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={vista}
            alt=""
            className={cn(
              "h-full w-full",
              redonda ? "object-cover" : "object-cover",
            )}
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-tinta-suave">
            {redonda ? (
              <Store className="h-6 w-6" aria-hidden />
            ) : (
              <ImagePlus className="h-6 w-6" aria-hidden />
            )}
            {vacio}
          </span>
        )}
      </div>

      <input
        ref={entrada}
        type="file"
        name={nombre}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) setVista(URL.createObjectURL(archivo));
        }}
      />

      <button
        type="button"
        onClick={() => entrada.current?.click()}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-borde px-3 py-1.5 text-xs font-semibold transition-colors hover:border-carga-500"
      >
        <ImagePlus className="h-3.5 w-3.5" aria-hidden />
        {cambiar}
      </button>

      <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p>
    </div>
  );
}

/**
 * El formulario con el que el comercio se administra a si mismo: su marca,
 * su ficha y los datos de su empresa.
 *
 * Va todo en un solo envio porque son datos de la misma cosa; partirlo en
 * tres formularios obligaria a guardar tres veces.
 */
export function FormularioMiTienda({ tienda }: { tienda: Tienda }) {
  const t = useTranslations("panel.miTienda");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  return (
    <form
      action={async (datos) => {
        setGuardando(true);
        setAviso(null);
        const r = await guardarMiTienda(datos);
        setAviso({ ok: r.ok, texto: r.mensaje });
        setGuardando(false);
        if (r.ok) window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="space-y-6"
    >
      <input type="hidden" name="tiendaId" value={tienda.id} />

      {aviso ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      {/* La marca */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("marca.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("marca.texto")}</p>

        <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr]">
          <ElegirImagen
            nombre="logo"
            redonda
            etiqueta={t("marca.logo")}
            ayuda={t("marca.logoAyuda")}
            actual={tienda.logoUrl}
            vacio={t("marca.sinLogo")}
            cambiar={t("marca.cambiar")}
          />
          <ElegirImagen
            nombre="portada"
            etiqueta={t("marca.portada")}
            ayuda={t("marca.portadaAyuda")}
            actual={tienda.portadaUrl}
            vacio={t("marca.sinPortada")}
            cambiar={t("marca.cambiar")}
          />
        </div>
      </section>

      {/* La ficha publica */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("ficha.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("ficha.texto")}</p>

        <div className="mt-5 space-y-4">
          <Campo
            nombre="nombre"
            obligatorio
            etiqueta={t("ficha.nombre")}
            ayuda={t("ficha.nombreAyuda")}
            valor={tienda.nombre}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Campo
              nombre="descripcionEs"
              filas={4}
              etiqueta={t("ficha.descripcionEs")}
              valor={tienda.descripcionEs}
              placeholder={t("ficha.placeholderDescripcion")}
            />
            <Campo
              nombre="descripcionEn"
              filas={4}
              etiqueta={t("ficha.descripcionEn")}
              valor={tienda.descripcionEn}
              placeholder={t("ficha.placeholderDescripcion")}
            />
          </div>
          <p className="text-xs text-tinta-suave">
            {t("ficha.descripcionAyuda")}
          </p>
        </div>
      </section>

      {/* Los datos de la empresa */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("empresa.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("empresa.texto")}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo
            nombre="razonSocial"
            etiqueta={t("empresa.razonSocial")}
            valor={tienda.razonSocial}
            placeholder={t("empresa.placeholderRazon")}
          />
          <Campo
            nombre="identificacionFiscal"
            etiqueta={t("empresa.identificacionFiscal")}
            valor={tienda.identificacionFiscal}
            placeholder={t("empresa.placeholderFiscal")}
          />
          <Campo
            nombre="correoContacto"
            tipo="email"
            etiqueta={t("empresa.correoContacto")}
            valor={tienda.correoContacto}
            placeholder={t("empresa.placeholderCorreo")}
          />
          <Campo
            nombre="telefono"
            tipo="tel"
            etiqueta={t("empresa.telefono")}
            valor={tienda.telefono}
            placeholder={t("empresa.placeholderTelefono")}
          />
          <Campo
            nombre="direccion"
            etiqueta={t("empresa.direccion")}
            valor={tienda.direccion}
            placeholder={t("empresa.placeholderDireccion")}
          />
          <Campo
            nombre="ciudad"
            etiqueta={t("empresa.ciudad")}
            valor={tienda.ciudad}
            placeholder={t("empresa.placeholderCiudad")}
          />
          <Campo
            nombre="sitioWeb"
            tipo="url"
            etiqueta={t("empresa.sitioWeb")}
            valor={tienda.sitioWeb}
            placeholder={t("empresa.placeholderWeb")}
          />
          <Campo
            nombre="horario"
            etiqueta={t("empresa.horario")}
            valor={tienda.horario}
            placeholder={t("empresa.placeholderHorario")}
          />
        </div>
      </section>

      {/* En celular el boton se pega abajo: el formulario es largo y no se
          puede obligar a subir hasta arriba para guardar. */}
      <div className="sticky bottom-0 -mx-4 border-t border-borde bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-6">
        <button
          type="submit"
          disabled={guardando}
          className="boton-principal w-full gap-2 sm:w-auto"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {guardando ? t("guardando") : t("guardar")}
        </button>
      </div>
    </form>
  );
}
