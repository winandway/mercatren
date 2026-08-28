import { ArrowLeft, BadgeCheck, Store, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CambiarCorreo } from "@/components/panel/usuarios/cambiar-correo";
import { AprobarComercio } from "@/components/panel/aprobar-comercio";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import {
  obtenerUsuarioPorId,
  resumenDelComercio,
} from "@/lib/usuarios/consultas";

export const dynamic = "force-dynamic";

/**
 * La ficha de una cuenta.
 *
 * Lo que no se sabe NO se rellena con un guion inventado: la fila entera
 * desaparece. Una ficha llena de huecos hace dudar de los datos que sí están.
 */
export default async function FichaDeUsuario({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.usuarios");
  const usuario = await obtenerUsuarioPorId(id).catch(() => null);
  /* Cambiar el correo de acceso es cambiar quién entra a una cuenta: no es
     tarea de un validador. */
  const soySoporte = (await obtenerUsuario())?.rol === "soporte";
  if (!usuario) notFound();

  const resumen = usuario.tienda
    ? await resumenDelComercio(usuario.tienda.id).catch(() => null)
    : null;

  const cuenta = [
    { etiqueta: t("campos.correo"), valor: usuario.correo },
    {
      etiqueta: t("campos.estado"),
      valor: t(`estados.${usuario.estadoCuenta}`),
    },
    { etiqueta: t("campos.rol"), valor: t(`roles.${usuario.rol}`) },
    { etiqueta: t("campos.idioma"), valor: t(`idiomas.${usuario.idioma}`) },
    { etiqueta: t("campos.pais"), valor: usuario.pais },
    { etiqueta: t("campos.telefono"), valor: usuario.telefono },
    { etiqueta: t("campos.alta"), valor: fechaHora(usuario.creadoEn, idioma) },
  ].filter((c) => c.valor);

  const empresa = usuario.tienda
    ? [
        {
          etiqueta: t("campos.razonSocial"),
          valor: usuario.tienda.razonSocial,
        },
        {
          etiqueta: t("campos.identificacion"),
          valor: usuario.tienda.identificacionFiscal,
        },
        { etiqueta: t("campos.tienda"), valor: usuario.tienda.nombre },
        {
          etiqueta: t("campos.correoEmpresa"),
          valor: usuario.tienda.correoContacto,
        },
        { etiqueta: t("campos.telefono"), valor: usuario.tienda.telefono },
        { etiqueta: t("campos.direccion"), valor: usuario.tienda.direccion },
        { etiqueta: t("campos.ciudad"), valor: usuario.tienda.ciudad },
        { etiqueta: t("campos.paisEmpresa"), valor: usuario.tienda.paisOrigen },
        { etiqueta: t("campos.sitioWeb"), valor: usuario.tienda.sitioWeb },
        { etiqueta: t("campos.horario"), valor: usuario.tienda.horario },
        {
          etiqueta: t("campos.comision"),
          valor: `${usuario.tienda.comisionPuntosBase / 100}%`,
        },
      ].filter((c) => c.valor)
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/panel/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-tinta-suave transition-colors hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("volver")}
      </Link>

      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xl font-bold text-white">
          {usuario.nombre.trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 truncate text-2xl font-bold tracking-tight">
            {usuario.nombre}
            {/* El punto de color, también aquí: es lo primero que se mira. */}
            <span
              aria-hidden
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                usuario.estadoCuenta === "activo"
                  ? "bg-precio-600"
                  : usuario.estadoCuenta === "inactivo"
                    ? "bg-red-500"
                    : "bg-slate-300",
              )}
            />
            {usuario.correoVerificado ? (
              <BadgeCheck
                className="h-5 w-5 shrink-0 text-precio-600"
                aria-label={t("verificado")}
              />
            ) : null}
          </h1>
          <p className="truncate text-sm text-tinta-suave">{usuario.correo}</p>
        </div>
      </header>

      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <UserRound className="h-4 w-4 text-carga-500" aria-hidden />
          {t("laCuenta")}
        </h2>
        <dl className="mt-4 divide-y divide-borde text-sm">
          {cuenta.map((c) => (
            <div
              key={c.etiqueta}
              className="flex flex-wrap justify-between gap-2 py-2.5"
            >
              <dt className="text-tinta-suave">{c.etiqueta}</dt>
              <dd className="font-semibold break-words">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      {usuario.tienda ? (
        <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <Store className="h-4 w-4 text-carga-500" aria-hidden />
            {t("laEmpresa")}
          </h2>
          <dl className="mt-4 divide-y divide-borde text-sm">
            {empresa.map((c) => (
              <div
                key={c.etiqueta}
                className="flex flex-wrap justify-between gap-2 py-2.5"
              >
                <dt className="text-tinta-suave">{c.etiqueta}</dt>
                <dd className="font-semibold break-words">{c.valor}</dd>
              </div>
            ))}
          </dl>

          {resumen && resumen.ventas > 0 ? (
            <dl className="mt-4 grid gap-3 border-t border-borde pt-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-tinta-suave">{t("ventas")}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">
                  {resumen.ventas}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-tinta-suave">{t("bruto")}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">
                  {formatearPrecio(resumen.brutoCentavos, idioma, "USD")}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-xs text-tinta-suave">{t("neto")}</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">
                  {formatearPrecio(resumen.netoCentavos, idioma, "USD")}
                </dd>
              </div>
            </dl>
          ) : null}

          {/* La solicitud espera una decisión: se pone donde se ve. */}
          {usuario.tienda.estado === "pendiente" ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                {t("esperaAprobacion")}
              </p>
              <p className="mt-1 mb-3 text-sm text-amber-900/80">
                {t("esperaAprobacionTexto")}
              </p>
              <AprobarComercio tiendaId={usuario.tienda.id} />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-borde pt-4">
            <Link
              href={`/panel/billetera?comercio=${usuario.tienda.slug}`}
              className="boton-secundario text-sm"
            >
              {t("verBilletera")}
            </Link>
            <Link
              href={`/tienda/${usuario.tienda.slug}`}
              className="boton-secundario text-sm"
            >
              {t("verTienda")}
            </Link>
          </div>
        </section>
      ) : null}

      {/* CAMBIARLE EL CORREO DE ACCESO. Solo Soporte: es cambiar quién puede
          entrar a esa cuenta, no una tarea operativa. La comprobación de
          verdad va en la acción del servidor; esconder el formulario es
          comodidad, no seguridad. */}
      {soySoporte ? (
        <CambiarCorreo usuarioId={usuario.id} correoActual={usuario.correo} />
      ) : null}
    </div>
  );
}
