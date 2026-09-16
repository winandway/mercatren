import {
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Package,
  PackageCheck,
  PackagePlus,
  RotateCcw,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CambiarClave } from "@/components/cuenta/cambiar-clave";
import { Salir } from "@/components/cuenta/salir";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";
import { paquetesDe } from "@/lib/casillero/mis-paquetes";
import { listarPedidosPropios } from "@/lib/pedidos/acciones";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cuenta" });
  // Pagina privada: fuera de los buscadores.
  return {
    title: t("titulo"),
    description: t("entradilla"),
    robots: { index: false, follow: false },
  };
}

/** Los roles que ven el panel de administracion. */
const ROLES_CON_PANEL = ["soporte", "validador", "vendedor"];

/** Un pedido que todavía se mueve: pagado o por pagar, no cerrado. */
const EN_CURSO = new Set(["pendiente_pago", "pagado", "preparando", "enviado"]);

/**
 * ══ MI CUENTA: EL PANEL DEL COMPRADOR (16 sep 2026) ══
 *
 * Richard, mirando la pantalla anterior: _«hace falta un panel de control
 * para usuarios bien bonito, como lo tiene Amazon… no quiero que inventes
 * la rueda: un menú, un dashboard para el usuario que compra. Y luego si le
 * da la gana de vender, pues vende»_.
 *
 * Es UNA sola cuenta: la misma persona compra, tiene su casillero en Miami
 * y, si quiere, abre su tienda. Aquí está todo eso de un vistazo: cuántos
 * pedidos van en camino, cuántos llegaron, cuántos paquetes esperan en
 * Miami, y una tarjeta por cada cosa que puede hacer. Al comprador nunca
 * se le habla de «roles»: eso es del equipo.
 */
export default async function PaginaCuenta({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cuenta");
  const usuario = await obtenerUsuario();

  if (!usuario) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">{t("titulo")}</h1>
        <p className="mt-3 text-tinta-suave">{t("entrar")}</p>
        <Link href="/entrar?destino=/cuenta" className="boton-principal mt-6">
          {t("entrarBoton")}
        </Link>
      </div>
    );
  }

  const rol = usuario.rol ?? "cliente";
  const trabajaEnElPanel = ROLES_CON_PANEL.includes(rol);

  /* Tres lecturas, ninguna tumba la página: si una falla, su número sale en
     cero y el resto se dibuja igual. */
  const [pedidos, casillero] = await Promise.all([
    listarPedidosPropios().catch(() => []),
    casilleroDe(usuario.id).catch(() => null),
  ]);
  const paquetes = casillero
    ? await paquetesDe(casillero.id).catch(() => [])
    : [];

  const enCurso = pedidos.filter((p) => EN_CURSO.has(p.estado)).length;
  const entregados = pedidos.filter((p) => p.estado === "entregado").length;
  const porPagar = pedidos.filter((p) => p.estado === "pendiente_pago").length;
  const enMiami = paquetes.filter((p) => p.enBodega).length;

  const resumen = [
    { valor: enCurso, texto: t("resumen.enCurso"), href: "/pedidos" as const },
    {
      valor: entregados,
      texto: t("resumen.entregados"),
      href: "/pedidos" as const,
    },
    {
      valor: enMiami,
      texto: t("resumen.enMiami"),
      href: (casillero ? "/casillero/mis-paquetes" : "/casillero/crear") as
        "/casillero/mis-paquetes" | "/casillero/crear",
    },
  ];

  const tarjetas = [
    {
      href: "/pedidos" as const,
      Icono: Package,
      titulo: t("tarjetas.pedidos.titulo"),
      texto:
        porPagar > 0
          ? t("tarjetas.pedidos.porPagar", { n: porPagar })
          : t("tarjetas.pedidos.texto"),
      aviso: porPagar > 0,
    },
    {
      href: "/devoluciones" as const,
      Icono: RotateCcw,
      titulo: t("tarjetas.devoluciones.titulo"),
      texto: t("tarjetas.devoluciones.texto"),
    },
    {
      href: "/ayuda" as const,
      Icono: CreditCard,
      titulo: t("tarjetas.pagos.titulo"),
      texto: t("tarjetas.pagos.texto"),
    },
    ...(trabajaEnElPanel
      ? [
          {
            href: "/panel" as const,
            Icono: LayoutDashboard,
            titulo: t("tarjetas.panel.titulo"),
            texto: t("tarjetas.panel.texto"),
          },
        ]
      : [
          {
            href: "/vender/empezar" as const,
            Icono: Store,
            titulo: t("tarjetas.vender.titulo"),
            texto: t("tarjetas.vender.texto"),
          },
        ]),
    {
      href: "/ayuda" as const,
      Icono: CircleHelp,
      titulo: t("tarjetas.ayuda.titulo"),
      texto: t("tarjetas.ayuda.texto"),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* Quién es, y la salida a la vista: en una computadora compartida es
          lo que impide que el siguiente entre con su cuenta. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xl font-bold text-white">
            {usuario.name?.trim()?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-tinta-suave">{t("hola")}</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight">
              {usuario.name}
            </h1>
            <p className="truncate text-sm text-tinta-suave">{usuario.email}</p>
          </div>
        </div>
        <Salir
          variante="enlace"
          className="rounded-lg border border-borde px-3 py-2 text-sm hover:bg-slate-50"
        />
      </div>

      {/* Los tres números que un comprador mira primero. */}
      <dl className="mt-8 grid grid-cols-3 gap-3">
        {resumen.map((r) => (
          <Link
            key={r.texto}
            href={r.href}
            className="rounded-xl border border-borde bg-white p-4 text-center transition-colors hover:border-carga-500"
          >
            <dd className="text-3xl font-extrabold tabular-nums">{r.valor}</dd>
            <dt className="mt-1 text-xs font-semibold text-tinta-suave">
              {r.texto}
            </dt>
          </Link>
        ))}
      </dl>

      {/* ══ EL CASILLERO, EN GRANDE ══ Si ya lo tiene, verde y con su código;
          si no, la invitación a activarlo. Nunca dos botones que se
          contradigan (Richard, 16 sep 2026). */}
      <section
        className={`mt-6 rounded-2xl p-5 sm:p-6 ${
          casillero
            ? "border-2 border-emerald-500 bg-emerald-50"
            : "border border-borde bg-riel-950 text-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className={`flex items-center gap-2 text-sm font-bold ${casillero ? "text-emerald-800" : "text-white/80"}`}
            >
              {casillero ? (
                <PackageCheck className="h-5 w-5" aria-hidden />
              ) : (
                <PackagePlus className="h-5 w-5" aria-hidden />
              )}
              {casillero
                ? t("tarjetas.casillero.titulo")
                : t("tarjetas.casillero.activarTitulo")}
            </p>
            {casillero ? (
              <p className="mt-1 font-mono text-2xl font-extrabold tracking-wide">
                {casillero.codigo}
              </p>
            ) : null}
            <p
              className={`mt-1 text-sm ${casillero ? "text-tinta-suave" : "text-white/80"}`}
            >
              {casillero
                ? t("tarjetas.casillero.texto", { n: enMiami })
                : t("tarjetas.casillero.activarTexto")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {casillero ? (
              <>
                <Link
                  href="/casillero/mi-casillero"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  {t("tarjetas.casillero.ver")}
                </Link>
                <Link href="/casillero/avisar" className="boton-secundario">
                  {t("tarjetas.casillero.avisar")}
                </Link>
              </>
            ) : (
              <Link href="/casillero/crear" className="boton-principal">
                {t("tarjetas.casillero.activar")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((tarjeta) => (
          <Link
            key={tarjeta.titulo}
            href={tarjeta.href}
            className={`group rounded-xl border p-5 transition-colors hover:border-carga-500 ${
              "aviso" in tarjeta && tarjeta.aviso
                ? "border-carga-500 bg-carga-500/5"
                : "border-borde"
            }`}
          >
            <tarjeta.Icono className="h-5 w-5 text-carga-500" aria-hidden />
            <h2 className="mt-3 font-bold group-hover:text-carga-600">
              {tarjeta.titulo}
            </h2>
            <p className="mt-1 text-sm leading-snug text-tinta-suave">
              {tarjeta.texto}
            </p>
          </Link>
        ))}
      </div>

      {/* Los datos con los que verificamos sus pagos. */}
      <section className="mt-8 rounded-xl border border-borde p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <UserRound className="h-4 w-4 text-carga-500" aria-hidden />
          {t("tarjetas.datos.titulo")}
        </h2>
        <p className="mt-1 text-sm text-tinta-suave">
          {t("tarjetas.datos.texto")}
        </p>
        <dl className="mt-4 divide-y divide-borde border-t border-borde text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-tinta-suave">{t("nombre")}</dt>
            <dd className="font-semibold">{usuario.name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-tinta-suave">{t("correo")}</dt>
            <dd className="truncate font-semibold">{usuario.email}</dd>
          </div>
          {/* El «tipo de cuenta» solo le dice algo al equipo. Al comprador,
              nada: es una cuenta y punto. */}
          {trabajaEnElPanel ? (
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-tinta-suave">{t("rol")}</dt>
              <dd className="font-semibold">{t(`roles.${rol}`)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="mt-4 rounded-xl bg-slate-50 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <ShieldCheck className="h-4 w-4 text-precio-600" aria-hidden />
          {t("tarjetas.seguridad.titulo")}
        </h2>
        <CambiarClave />
      </section>
    </div>
  );
}
