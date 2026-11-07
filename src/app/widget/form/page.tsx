import { CASILLERO_ABIERTO } from "@/lib/casillero/abierto";
import { FormularioWidget } from "@/components/casillero/formulario-widget";
import { origenPorClave } from "@/lib/casillero/widget";

export const dynamic = "force-dynamic";

/**
 * El formulario que vive DENTRO del iframe del widget.
 *
 * Fuera del grupo `(tienda)`: aquí no van el encabezado ni el pie de
 * Mercatren, porque esto se dibuja incrustado en la página de otro y tiene
 * que ocupar lo mínimo.
 */
export default async function PaginaWidgetForm({
  searchParams,
}: {
  searchParams: Promise<{ clave?: string; idioma?: string }>;
}) {
  const { clave = "", idioma = "es" } = await searchParams;
  const origen = await origenPorClave(clave);
  const es = idioma !== "en";

  /* El casillero está cerrado desde el 7 nov 2026 (`casillero/abierto.ts`):
     el formulario que otros sitios llevan incrustado deja de abrir casilleros. */
  if (!CASILLERO_ABIERTO) {
    return (
      <main className="p-6 font-sans text-sm text-slate-600">
        {es
          ? "El casillero de Mercatren no está disponible por ahora. No envíes compras a su dirección."
          : "Mercatren's package locker is unavailable for now. Please don't ship purchases to its address."}
      </main>
    );
  }

  if (!origen) {
    return (
      <main className="p-6 font-sans text-sm text-slate-600">
        {es
          ? "Este formulario no está disponible."
          : "This form is not available."}
      </main>
    );
  }

  return (
    <main className="p-4 font-sans">
      <FormularioWidget clave={clave} es={es} />
    </main>
  );
}
