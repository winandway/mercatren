"use client";

import { Loader2, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { useRouter } from "@/i18n/navigation";
import { accionPromocionar } from "@/lib/ganar/acciones";

/**
 * Promocionar un producto desde el panel: el producto y el presupuesto del
 * día. Lo escrito no se pierde (`FormularioPersistente`) y el borrador se
 * borra al guardar bien.
 */
export function FormularioPromocion({
  llave,
  productos,
}: {
  llave: string;
  productos: { id: string; titulo: string }[];
}) {
  const t = useTranslations("panel.ganar");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setAviso(null);
    iniciar(async () => {
      const r = await accionPromocionar(
        String(datos.get("productoId") ?? ""),
        String(datos.get("presupuesto") ?? ""),
      );
      if (r.ok) {
        olvidarBorrador(llave);
        setAviso({ ok: true, texto: t("promoGuardada") });
        router.refresh();
        return;
      }
      setAviso({
        ok: false,
        texto:
          r.motivo === "presupuesto"
            ? t("promoPresupuestoMal")
            : r.motivo === "no_publicado"
              ? t("promoNoPublicado")
              : t("error"),
      });
    });
  }

  if (productos.length === 0) {
    return <p className="text-sm text-tinta-suave">{t("promoSinProductos")}</p>;
  }

  return (
    <FormularioPersistente
      llave={llave}
      onSubmit={enviar}
      className="space-y-3"
    >
      <label className="block">
        <span className="text-sm font-semibold">{t("promoProducto")}</span>
        <select
          name="productoId"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm outline-none focus:border-carga-500"
        >
          <option value="" disabled>
            {t("promoElegir")}
          </option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </select>
      </label>
      <label className="block max-w-xs">
        <span className="text-sm font-semibold">{t("promoPresupuesto")}</span>
        <input
          name="presupuesto"
          inputMode="decimal"
          required
          defaultValue="5"
          placeholder="5"
          className="mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        />
        <span className="mt-1 block text-xs text-tinta-suave">
          {t("promoPresupuestoAyuda")}
        </span>
      </label>
      <button
        type="submit"
        disabled={pendiente}
        className="boton-principal gap-2 disabled:opacity-60"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Megaphone className="h-4 w-4" aria-hidden />
        )}
        {t("promoGuardar")}
      </button>
      {aviso ? (
        <p
          role="status"
          className={
            aviso.ok
              ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
          }
        >
          {aviso.texto}
        </p>
      ) : null}
      <p className="text-xs text-tinta-suave">{t("promoSinCobro")}</p>
    </FormularioPersistente>
  );
}
