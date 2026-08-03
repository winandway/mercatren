import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Las secciones del panel que todavia no tienen datos cargados.
 * Se muestran con su estructura para que se entienda a donde va cada cosa.
 */
export async function SeccionEnPreparacion({
  titulo,
  Icono,
}: {
  titulo: string;
  Icono: LucideIcon;
}) {
  const t = await getTranslations("panel.enConstruccion");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
      </header>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-tinta-suave">
          <Icono className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-base font-semibold">{t("titulo")}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-tinta-suave">
          {t("texto")}
        </p>
      </div>
    </div>
  );
}
