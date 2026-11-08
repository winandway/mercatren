"use client";

import { useTranslations } from "next-intl";

import { MenuModeracion } from "./menu-moderacion";

/**
 * Los tres puntos de la ficha y de la tienda en la web (8 nov 2026):
 * denunciar el producto, denunciar la tienda y bloquear al vendedor, igual
 * que en la app nativa. Al bloquear se recarga para que desaparezca.
 */
export function ModeracionFicha({
  productoId,
  tiendaId,
}: {
  productoId?: string;
  tiendaId: string;
}) {
  const t = useTranslations("moderacion");
  const alBloquear = () => window.location.reload();
  if (productoId) {
    return (
      <MenuModeracion
        tipo="producto"
        id={productoId}
        etiquetas={{
          denunciar: t("denunciarProducto"),
          bloquear: t("bloquearVendedor"),
        }}
        otraDenuncia={{
          tipo: "tienda",
          id: tiendaId,
          etiqueta: t("denunciarTienda"),
        }}
        onBloqueado={alBloquear}
      />
    );
  }
  return (
    <MenuModeracion
      tipo="tienda"
      id={tiendaId}
      etiquetas={{
        denunciar: t("denunciarTienda"),
        bloquear: t("bloquearVendedor"),
      }}
      onBloqueado={alBloquear}
    />
  );
}
