import { getTranslations, setRequestLocale } from "next-intl/server";

import { FilaBusquedaImagen } from "@/components/panel/fila-busqueda-imagen";
import { listarBusquedasPorImagen } from "@/lib/busqueda-imagen/acciones";
import { exigirEquipoInterno } from "@/lib/autorizacion";
import { fechaHora } from "@/lib/fechas";

/**
 * EL HISTORIAL DE LAS BÚSQUEDAS POR FOTO (30 ago 2026).
 *
 * Pedido del dueño: cada foto con la que un cliente buscó queda aquí — qué
 * entendió el ojo, cuántos resultados dio y el correo del que quiere el
 * aviso. Lo que la gente busca y NO tenemos es la lista de compras del
 * catálogo. El botón «Avisar» pide el enlace de la ficha a mano: la persona
 * del equipo es la única que sabe CUÁL producto es el de la foto.
 */
export default async function PaginaBusquedasImagen({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await exigirEquipoInterno();
  const t = await getTranslations("panel.busquedasImagen");
  const filas = await listarBusquedasPorImagen();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">{t("titulo")}</h1>
        <p className="text-sm text-tinta-suave">{t("texto")}</p>
      </header>

      {filas.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-tinta-suave">
          {t("vacio")}
        </p>
      ) : (
        <ul className="space-y-3">
          {filas.map((f) => (
            <FilaBusquedaImagen
              key={f.id}
              busqueda={{
                id: f.id,
                mercado: f.mercado,
                imagenClave: f.imagenClave,
                mirada: f.mirada,
                resultados: f.resultados,
                correo: f.correo,
                estado: f.estado ?? "pendiente",
                enlaceAvisado: f.enlaceAvisado,
                fecha: fechaHora(f.creadoEn, locale) ?? "",
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
