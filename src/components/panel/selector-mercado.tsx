"use client";

import { Globe, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cambiarMercadoDelPanel } from "@/lib/mercado/acciones";

export type OpcionDeMercado = { codigo: string; nombre: string };

/**
 * EL SELECTOR DE PAÍS DEL PANEL (fase 4 del plan multi-país).
 *
 * ══ ESTO ES COMODIDAD, NO SEGURIDAD ══
 *
 * El muro está en el servidor: el país vive en la sesión y toda consulta usa
 * ESE. Este desplegable solo lo cambia. Si un parámetro de la dirección
 * pudiera hacer lo mismo, el selector sería un adorno.
 *
 * ══ RECARGA COMPLETA, NO NAVEGACIÓN SUAVE ══
 *
 * Igual que al salir de «ver su panel»: el menú lateral, los contadores de
 * arriba y las tarjetas se arman en el servidor. Con una navegación de
 * cliente se quedarían enseñando los números del país anterior — que es
 * exactamente la clase de pantalla que hace desconfiar de todo el sistema.
 */
export function SelectorMercado({
  actual,
  opciones,
}: {
  actual: string;
  opciones: OpcionDeMercado[];
}) {
  const t = useTranslations("panel.mercado");
  const [cambiando, setCambiando] = useState(false);

  return (
    <label className="flex items-center gap-2 text-sm">
      <Globe className="h-4 w-4 shrink-0 text-tinta-suave" aria-hidden />
      <span className="sr-only">{t("elige")}</span>
      <select
        value={actual}
        disabled={cambiando}
        onChange={async (e) => {
          setCambiando(true);
          await cambiarMercadoDelPanel(e.target.value);
          window.location.reload();
        }}
        className="rounded-lg border border-borde bg-white px-2 py-1 font-semibold disabled:opacity-60"
      >
        {opciones.map((o) => (
          <option key={o.codigo} value={o.codigo}>
            {o.nombre}
          </option>
        ))}
      </select>
      {cambiando ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : null}
    </label>
  );
}

/**
 * LA FRANJA DE «NO ESTÁS EN EL PRINCIPAL».
 *
 * Lo peligroso no es mirar otro país: es **olvidar que lo cambiaste**. Quien
 * vea «0 ventas» creyendo estar en mercatren.com va a pensar que se cayó algo,
 * y va a buscar un fallo que no existe.
 *
 * No se puede cerrar, misma regla que la franja de «ver su panel»: se vuelve
 * al principal o se queda ahí. Un aviso que se puede quitar se quita, y
 * entonces no avisa de nada.
 *
 * Va en AZUL y no en ámbar a propósito: el ámbar ya significa «estás viendo el
 * panel de otro». Dos avisos del mismo color en la misma pantalla se leen como
 * uno solo, y con los dos puestos hay que poder distinguirlos de un vistazo.
 */
export function FranjaMercado({ pais }: { pais: string }) {
  const t = useTranslations("panel.mercado");

  return (
    <div className="sticky top-0 z-40 flex items-center gap-2 bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
      <Globe className="h-4 w-4 shrink-0" aria-hidden />
      {t("estasViendo", { pais })}
    </div>
  );
}
