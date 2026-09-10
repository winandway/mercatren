import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DeclararPaquete } from "@/components/casillero/declarar-paquete";
import { Link, redirect } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";
import { ETIQUETA_ESTADO, ETIQUETA_ESTADO_EN } from "@/lib/casillero/estados";
import { paquetesDe } from "@/lib/casillero/mis-paquetes";
import { formatearPrecio, type Idioma } from "@/lib/dinero";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "casillero" });
  return {
    title: t("paquetesTitulo"),
    robots: { index: false, follow: false },
  };
}

/**
 * Lo que el cliente tiene en Miami.
 *
 * Lo primero que se ve es lo que le toca hacer a él: **declarar el valor**.
 * Sin ese dato el paquete no sale de la bodega, y no por una regla nuestra
 * sino porque lo exige la aduana.
 */
export default async function PaginaMisPaquetes({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const t = await getTranslations("casillero");

  const usuario = await obtenerUsuario();
  if (!usuario)
    redirect({ href: "/entrar?volver=/casillero/mis-paquetes", locale });
  const casillero = usuario ? await casilleroDe(usuario.id) : null;
  if (!casillero) redirect({ href: "/casillero/crear", locale });

  const paquetes = await paquetesDe(casillero!.id);
  const etiquetas = idioma === "en" ? ETIQUETA_ESTADO_EN : ETIQUETA_ESTADO;
  const porDeclarar = paquetes.filter((p) => p.faltaDeclarar && p.enBodega);

  const textos = {
    declarar: t("declararBoton"),
    descripcion: t("preDescripcion"),
    valor: t("preValor"),
    valorAyuda: t("declararValorAyuda"),
    enviar: t("declararEnviar"),
    enviando: t("preEnviando"),
    listo: t("declararListo"),
    error_descripcion: t("preErrorDescripcion"),
    error_valor: t("preErrorValor"),
    "error_no-es-tuyo": t("declararErrorNoEsTuyo"),
    error_sesion: t("errorSesion"),
    error_fallo: t("errorFallo"),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("paquetesTitulo")}
        </h1>
        <Link
          href="/casillero/mi-casillero"
          className="text-sm font-semibold text-carga-600 hover:underline"
        >
          {t("verMiDireccion")}
        </Link>
      </div>

      {porDeclarar.length > 0 ? (
        <p className="mt-4 rounded-lg border border-carga-500/40 bg-carga-500/10 p-3 text-sm">
          <strong>{t("faltaDeclararTitulo")}</strong> {t("faltaDeclararTexto")}
        </p>
      ) : null}

      {paquetes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-borde bg-white p-6 text-center">
          <p className="font-semibold">{t("sinPaquetes")}</p>
          <p className="mt-1 text-sm text-tinta-suave">
            {t("sinPaquetesTexto")}
          </p>
          <Link href="/casillero/avisar" className="boton-principal mt-4">
            {t("prealertaBoton")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {paquetes.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-borde bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold">{p.wr}</p>
                  <p className="mt-0.5 text-sm">{etiquetas[p.estado]}</p>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {[p.remitente, p.tracking].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {p.pesoFacturableLb ? (
                    <>
                      <p className="font-semibold tabular-nums">
                        {p.pesoFacturableLb} lb
                      </p>
                      {/* El peso que se cobra y el real, los dos: sin
                          enseñar la cuenta, un cliente con una caja liviana
                          y voluminosa cree que le estamos cobrando de más. */}
                      {p.pesoLb && p.pesoLb !== p.pesoFacturableLb ? (
                        <p className="text-xs text-tinta-suave">
                          {t("pesoReal")} {p.pesoLb} lb
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {p.valorDeclaradoCentavos ? (
                    <p className="text-xs text-tinta-suave">
                      {formatearPrecio(p.valorDeclaradoCentavos, idioma, "USD")}
                    </p>
                  ) : null}
                </div>
              </div>

              {p.faltaDeclarar && p.enBodega ? (
                <div className="mt-3 border-t border-borde pt-3">
                  <DeclararPaquete paqueteId={p.id} textos={textos} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
