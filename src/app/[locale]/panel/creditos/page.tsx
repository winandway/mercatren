import { getTranslations, setRequestLocale } from "next-intl/server";

import { PanelCreditos } from "@/components/panel/credito/panel-creditos";
import { obtenerAlcance } from "@/lib/autorizacion";
import { clientesConCredito } from "@/lib/credito/consultas";
import { type Idioma } from "@/lib/dinero";
import { listarClientes } from "@/lib/pedidos/consultas";

export const dynamic = "force-dynamic";

/**
 * Los créditos que un comercio le dio a sus clientes.
 *
 * LA TIENDA SALE DEL ALCANCE, no de la dirección. Un vendedor solo ve los
 * créditos de su comercio aunque cambie el enlace a mano; aquí hay dinero que
 * un competidor no puede ver.
 */
export default async function PaginaCreditos({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.creditos");
  const { comercio } = await searchParams;

  const alcance = await obtenerAlcance();
  const esEquipo = alcance.tipo === "todos";

  /* El equipo puede mirar el de un comercio concreto; un vendedor, solo el
     suyo — y el suyo manda aunque en la dirección venga pedido otro. */
  const tiendaId = alcance.tipo === "tienda" ? alcance.tiendaId : comercio;

  if (!tiendaId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            {t("subtituloEquipo")}
          </p>
        </header>
        <p className="rounded-xl border border-dashed border-borde bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("subtituloEquipo")}
        </p>
      </div>
    );
  }

  const [creditos, clientes] = await Promise.all([
    clientesConCredito(tiendaId),
    listarClientes(comercio),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          {esEquipo ? t("subtituloEquipo") : t("subtitulo")}
        </p>
      </header>

      <PanelCreditos
        creditos={creditos}
        clientes={clientes.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          correo: c.correo,
        }))}
        idioma={idioma}
        esEquipo={esEquipo}
        tiendaId={tiendaId}
      />
    </div>
  );
}
