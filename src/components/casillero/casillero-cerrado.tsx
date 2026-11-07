import { PackageX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Lo que se ve en cualquier página del casillero mientras está cerrado
 * (7 nov 2026, `casillero/abierto.ts`). No enseña la dirección de Miami a
 * nadie, ni a quien ya tenía su casillero: un paquete mandado ahí no lo
 * recibe nadie.
 */
export async function CasilleroCerrado() {
  const t = await getTranslations("casillero.cerrado");
  return (
    <section
      data-casillero-cerrado
      className="mx-auto max-w-xl px-4 py-16 text-center"
    >
      <PackageX className="mx-auto h-12 w-12 text-tinta-suave" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold text-tinta">{t("titulo")}</h1>
      <p className="mt-3 leading-relaxed text-tinta-suave">{t("texto")}</p>
      <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
        {t("paquetes")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="boton-principal">
          {t("volver")}
        </Link>
        <Link
          href="/ayuda"
          className="inline-flex items-center justify-center rounded-lg border border-borde px-4 py-2 text-sm font-semibold text-tinta hover:bg-slate-50"
        >
          {t("ayuda")}
        </Link>
      </div>
    </section>
  );
}
