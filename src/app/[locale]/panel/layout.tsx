import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { BurbujaAsistente } from "@/components/panel/asistente/burbuja";
import { MenuLateral } from "@/components/panel/menu-lateral";
import { VigilanteDeVersion } from "@/components/panel/vigilante-de-version";
import {
  FranjaMercado,
  SelectorMercado,
} from "@/components/panel/selector-mercado";
import { FranjaVerComo } from "@/components/panel/ver-como";
import { redirect } from "@/i18n/navigation";
import {
  esEquipoInterno,
  tienePermisoDePanel,
  obtenerUsuario,
} from "@/lib/autorizacion";
import { agenteConfigurado } from "@/lib/asistente/cliente";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { contarRetirosPendientes } from "@/lib/retiros/consultas";
import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { MERCADOS } from "@/lib/mercado/mercados";
import { hayQueAvisarDelMercado, mercadoDelPanel } from "@/lib/mercado/panel";
import { comercioObservado } from "@/lib/soporte/ver-como";
import { cn } from "@/lib/utils";
import { tiendaDeLaSesion } from "@/lib/tiendas/consultas";
import { listarPendientesDeValidacion } from "@/lib/zelle/consultas";

/** El panel lee la base en cada visita: nunca se genera de antemano. */
export const dynamic = "force-dynamic";

/**
 * El titulo de la pestaña también va traducido: un banco o un inversionista
 * que abra el panel en inglés no debería ver "Administración" arriba.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "panel" });
  return { title: t("titulo"), robots: { index: false, follow: false } };
}

export default async function LayoutPanel({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Aqui adentro hay dinero real de comercios y datos de quienes pagaron:
  // sin una cuenta con permiso, no se entra.
  if (!(await tienePermisoDePanel())) {
    redirect({ href: "/entrar?destino=/panel", locale });
  }

  const [usuario, interno] = await Promise.all([
    obtenerUsuario(),
    esEquipoInterno(),
  ]);

  /* Sin token configurado no se dibuja la burbuja: sería un botón que abre un
     chat que falla en cada envío. */
  const hayAsistente = agenteConfigurado();

  /**
   * UN COMERCIO SIN TIENDA NO PUEDE VER EL PANEL, PERO TAMPOCO DEBE ROMPERLO.
   *
   * `obtenerAlcance()` lanza cuando un vendedor no tiene comercio asignado, y
   * eso dejaba la pantalla en un error crudo. Puede pasar con una cuenta a la
   * que se le quitó la tienda, o si algo se corta a mitad del alta.
   *
   * En vez del error, se le manda a terminar su alta, que es lo único que le
   * falta para poder entrar.
   */
  if (!interno && usuario?.rol === "vendedor") {
    const suya = await tiendaDeLaSesion().catch(() => null);
    if (!suya) redirect({ href: "/vender/empezar", locale });
  }

  // Si la cuenta es de un comercio que todavia no tiene tienda asignada, la
  // consulta avisa en vez de romper la pantalla.
  const [pendientes, porRetirar] = await Promise.all([
    listarPendientesDeValidacion().catch(() => []),
    contarRetirosPendientes().catch(() => 0),
  ]);

  /**
   * AQUÍ ADENTRO VIAJAN LOS MENSAJES COMPLETOS. El layout público recorta el
   * espacio `panel` del paquete que va al navegador (31 KB que un visitante
   * del catálogo no necesita); este proveedor anidado se los devuelve a las
   * pantallas del panel, que son las únicas que los usan.
   */
  const mensajes = await getMessages();

  /* Si Soporte está mirando el panel de un comercio, se trae su nombre para
     la franja. Sin nombre no se dibuja: una franja que dice «estás viendo el
     panel de» y se corta ahí asusta más de lo que avisa. */
  const observado = await comercioObservado();
  const [comercioMirado] = observado
    ? await getDb()
        .select({ nombre: tiendas.nombre })
        .from(tiendas)
        .where(eq(tiendas.id, observado))
        .limit(1)
        .catch(() => [])
    : [];

  /* EL PAÍS QUE ESTÁ MIRANDO EL PANEL. Solo Soporte lo puede cambiar, y por
     eso solo a Soporte se le dibuja el selector — pero el muro no es este
     `if`, es que `mercadoDelPanel()` comprueba el rol al leer la cookie. */
  const mercado = await mercadoDelPanel();
  const puedeCambiarDePais = await esSoporteDeVerdad();

  /* Si se dibuja el asistente: manda el hueco del final y el propio botón. */
  const conAsistente = interno && hayAsistente;

  return (
    <NextIntlClientProvider messages={mensajes}>
      <div className="letra-panel min-h-screen bg-slate-50">
        {/* Si la pestaña se quedó en la versión de antes de publicar, se
            recarga sola en vez de enseñar «Server Action no encontrada», que
            no le dice nada a nadie y parece un botón roto. */}
        <VigilanteDeVersion />
        {hayQueAvisarDelMercado(mercado) ? (
          <FranjaMercado pais={mercado.nombre} />
        ) : null}
        {comercioMirado ? (
          <FranjaVerComo nombre={comercioMirado.nombre} />
        ) : null}
        <MenuLateral
          porValidar={pendientes.length}
          porRetirar={porRetirar}
          /* MIRANDO EL PANEL DE UN COMERCIO, EL MENÚ ES EL SUYO. Antes esto
             era `interno` a secas —el ROL de la sesión— así que Soporte veía
             el panel del comercio con su propio menú completo encima:
             Comercios, Cuentas, Configuración, Pedidos al proveedor. La gracia
             del modo es ver EXACTAMENTE lo que ve el comercio. */
          esInterno={interno && !observado}
          nombre={usuario?.name ?? ""}
        />
        <div className="lg:pl-64">
          {/* EL SELECTOR DE PAÍS, solo para Soporte. Va arriba del contenido y
              no dentro del menú lateral: en el celular el menú vive plegado, y
              un selector que hay que abrir un cajón para encontrar es un
              selector que nadie usa. */}
          {puedeCambiarDePais ? (
            <div className="flex justify-end border-b border-borde bg-white px-4 py-2 sm:px-6">
              <SelectorMercado
                actual={mercado.codigo}
                opciones={MERCADOS.map((m) => ({
                  codigo: m.codigo,
                  nombre: m.nombre,
                }))}
              />
            </div>
          ) : null}
          <main
            className={cn(
              "mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8",
              /**
               * ══ SITIO AL FINAL PARA QUE EL ASISTENTE NO TAPE NADA ══
               *
               * El botón flota fijo en la esquina de abajo a la derecha, que es
               * justo donde vive la acción de la última fila de cualquier
               * listado: el menú de tres puntos, el botón de agregar. Tapado
               * significa que **no se puede pulsar** — no es que se vea mal.
               *
               * Pasó de verdad el 15 ago 2026: en «Mis productos», el último
               * producto de la lista no se podía tocar.
               *
               * Se reserva el hueco solo cuando el asistente está puesto. Con
               * el hueco fijo, todo panel sin asistente arrastraría un vacío al
               * final sin ninguna razón.
               */
              conAsistente && "pb-28",
            )}
          >
            {children}
          </main>
        </div>

        {/* EL ASISTENTE, ENCIMA DE TODO EL PANEL. Una pregunta casi nunca nace
            en su propia pantalla: nace mirando un pedido, un retiro o un
            comercio. Obligar a irse a otra sección para preguntar es perder el
            contexto que motivó la pregunta. Solo el equipo interno: su token
            identifica a la EMPRESA. */}
        {conAsistente ? <BurbujaAsistente idioma={locale} /> : null}
      </div>
    </NextIntlClientProvider>
  );
}
