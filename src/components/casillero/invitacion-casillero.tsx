import { PackagePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";

/**
 * ══ «¿NO TIENES CASILLERO?» ══
 *
 * Richard, 9 sep 2026: _«cuando le da a comprar el producto, bien hacia
 * abajo debe haber un botoncito que diga: si vas a comprar y enviar a
 * alguna parte de Sudamérica, puedes crear tu casillero aquí»_. Y lo mismo
 * dentro de las tiendas.
 *
 * ══ NO SE LE ENSEÑA A QUIEN YA LO TIENE ══
 *
 * Un cartel que invita a crear algo que ya tienes es ruido, y a la tercera
 * vez la gente deja de leer los carteles de esta página — incluidos los
 * que sí importan. Quien ya tiene casillero ve el enlace a SU casillero, y
 * quien no tiene sesión ve la invitación, que es a quien va dirigida.
 *
 * Es un componente de servidor y hace UNA consulta corta por su cuenta:
 * ponerlo como propiedad obligaría a tocar todas las pantallas donde va, y
 * al día siguiente estaría solo en la mitad.
 */
export async function InvitacionCasillero({
  variante = "ficha",
}: {
  /** ficha: bajo el botón de comprar · tienda: dentro del comercio. */
  variante?: "ficha" | "tienda";
}) {
  const t = await getTranslations("casillero");
  const usuario = await obtenerUsuario().catch(() => null);
  const yaTiene = usuario
    ? await casilleroDe(usuario.id).catch(() => null)
    : null;

  const compacto = variante === "tienda";

  return (
    <aside
      data-invitacion-casillero
      className={`rounded-xl border border-borde bg-slate-50 ${compacto ? "p-4" : "p-5"}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carga-500/15">
          <PackagePlus className="h-5 w-5 text-carga-600" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-bold">
            {yaTiene ? t("invitacionTengoTitulo") : t("invitacionTitulo")}
          </p>
          <p className="mt-1 text-sm text-tinta-suave">
            {yaTiene
              ? t("invitacionTengoTexto", { codigo: yaTiene.codigo })
              : t("invitacionTexto")}
          </p>
          <Link
            href={yaTiene ? "/casillero/mi-casillero" : "/casillero"}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-carga-600 hover:underline"
          >
            {yaTiene ? t("invitacionTengoBoton") : t("invitacionBoton")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
