import {
  Bot,
  Route,
  Scale,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BuscadorDocs } from "@/components/docs/buscador-docs";
import { EnlaceDocs } from "@/components/docs/enlace-docs";
import { Link } from "@/i18n/navigation";
import { porSeccion, SECCIONES, type EntradaDocs } from "@/lib/docs/indice";

const ICONOS: Record<(typeof SECCIONES)[number]["icono"], LucideIcon> = {
  route: Route,
  bag: ShoppingBag,
  store: Store,
  bot: Bot,
  scale: Scale,
};

export function iconoDeSeccion(
  icono: (typeof SECCIONES)[number]["icono"],
): LucideIcon {
  return ICONOS[icono];
}

/**
 * LA BARRA LATERAL DE DOCS: el buscador, el inicio y cada sección con su
 * ícono y sus enlaces. En el celular va plegada en un «Índice» que se abre a
 * un toque; en escritorio queda pegada a la izquierda mientras se baja.
 */
export async function BarraDocs({ entradas }: { entradas: EntradaDocs[] }) {
  const t = await getTranslations("docs");
  const grupos = porSeccion(entradas);

  const contenido = (
    <nav aria-label={t("barra.etiqueta")} className="space-y-6">
      <BuscadorDocs entradas={entradas} />
      <Link
        href="/docs"
        className="block text-sm font-bold text-riel-700 hover:text-carga-600"
      >
        {t("barra.inicio")}
      </Link>
      {SECCIONES.map((s) => {
        const Icono = ICONOS[s.icono];
        const lista = grupos[s.id];
        if (lista.length === 0) return null;
        return (
          <div key={s.id}>
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-riel-700 uppercase">
              <Icono className="h-4 w-4 text-carga-600" aria-hidden />
              {t(`secciones.${s.id}.titulo`)}
            </p>
            <ul className="mt-2 space-y-0.5 border-l border-borde pl-2">
              {lista.map((e) => (
                <li key={e.href}>
                  <EnlaceDocs href={e.href} externo={e.externo}>
                    {e.titulo}
                  </EnlaceDocs>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Celular: plegado. */}
      <details className="rounded-xl border border-borde bg-white p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-bold text-riel-900">
          {t("barra.indice")}
        </summary>
        <div className="mt-4">{contenido}</div>
      </details>
      {/* Escritorio: pegada. */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <p className="mb-4 text-lg font-extrabold tracking-tight text-riel-900">
            {t("titulo")}
          </p>
          {contenido}
        </div>
      </aside>
    </>
  );
}
