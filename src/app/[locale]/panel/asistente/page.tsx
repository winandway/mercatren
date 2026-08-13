import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ChatAsistente } from "@/components/panel/asistente/chat";
import { agenteConfigurado } from "@/lib/asistente/cliente";
import { esEquipoInterno } from "@/lib/autorizacion";

export const dynamic = "force-dynamic";

/**
 * EL ASISTENTE DE OPERACIÓN.
 *
 * Solo el equipo interno. El token del agente identifica a la EMPRESA, así que
 * quien entre aquí le habla como si fuera Mercatren: un comercio vería y
 * movería cosas de toda la operación, no de la suya.
 *
 * Un comercio recibe **404**, no un «no puedes»: así ni siquiera se le confirma
 * que esta pantalla existe. Es la misma regla que la ficha de un pedido ajeno.
 */
export default async function PaginaAsistente({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await esEquipoInterno())) notFound();

  const t = await getTranslations("panel.asistente");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("entradilla")}
        </p>
      </header>

      {/* Sin token no se dibuja el chat: sería un formulario que falla en cada
          envío sin decir por qué. */}
      {agenteConfigurado() ? (
        <ChatAsistente />
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("sinConfigurar")}
        </p>
      )}
    </div>
  );
}
