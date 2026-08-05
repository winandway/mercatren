import { ArrowDown, ArrowRight } from "lucide-react";
import { Fragment } from "react";

import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import type { TextosFiguras } from "@/contenido/docs/tipos";
import { cn } from "@/lib/utils";

/**
 * Los tres dibujos del documento del modelo de negocio.
 *
 * Estan hechos con cajas y bordes, no con una imagen: asi se leen en el
 * telefono, se pueden seleccionar y copiar, los busca Google y se imprimen
 * bien cuando alguien lleva el documento a una reunion.
 *
 * Los textos llegan desde el archivo de contenido para que existan en los dos
 * idiomas; aqui solo esta la forma.
 */

/** Una caja del diagrama: rol arriba, nombre, y el detalle en pequeno. */
function Caja({
  rol,
  nombre,
  detalle,
  tono = "claro",
  className,
}: {
  rol: string;
  nombre: string;
  detalle: string;
  tono?: "claro" | "oscuro" | "apagado";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tono === "oscuro" && "border-carga-500 bg-riel-900 text-white",
        tono === "claro" && "border-borde bg-white",
        tono === "apagado" && "border-dashed border-borde bg-slate-50",
        className,
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold tracking-[0.08em] uppercase",
          tono === "oscuro" ? "text-carga-300" : "text-tinta-suave",
        )}
      >
        {rol}
      </p>
      <p className="mt-0.5 text-sm font-bold">{nombre}</p>
      <p
        className={cn(
          "mt-1 text-xs leading-snug",
          tono === "oscuro" ? "text-white/70" : "text-tinta-suave",
        )}
      >
        {detalle}
      </p>
    </div>
  );
}

/** El paso de dinero: barra naranja gruesa, porque el dinero es lo que se mira. */
function Dinero({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-2 py-2 pl-1">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-carga-500 text-riel-950">
        <ArrowDown className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-xs leading-snug font-semibold">{texto}</p>
    </div>
  );
}

/** Un paso que no es dinero: linea fina, para que no compita con lo naranja. */
function Paso({ numero, texto }: { numero: string; texto: string }) {
  return (
    <div className="flex items-center gap-2 py-2 pl-1">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-borde bg-white text-[11px] font-bold text-tinta-suave">
        {numero}
      </span>
      <p className="text-xs leading-snug text-tinta-suave">{texto}</p>
    </div>
  );
}

function TituloPais({
  texto,
  bandera,
  className,
}: {
  texto: string;
  bandera?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-tinta-suave uppercase",
        className,
      )}
    >
      {bandera ? <BanderaEEUU className="h-3.5 w-3.5" /> : null}
      {texto}
    </p>
  );
}

/**
 * Figura 1. La compraventa, de punta a punta.
 *
 * Dos columnas: a la izquierda Estados Unidos, donde ocurre toda la operacion
 * comercial, y a la derecha la entrega del producto. En el telefono las
 * columnas se apilan y cada caja lleva escrito su pais.
 */
export function FiguraCiclo({ t }: { t: TextosFiguras["ciclo"] }) {
  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-borde bg-slate-50/60">
      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 md:gap-0">
        {/* Estados Unidos: la columna del dinero. */}
        <div className="md:pr-6">
          <TituloPais texto={t.eeuu} bandera className="mb-3" />

          <Caja {...t.comprador} />
          <Dinero texto={t.paga} />
          <Caja {...t.mercatren} tono="oscuro" />
          <Dinero texto={t.compra} />
          <Caja {...t.proveedor} />
        </div>

        {/* Venezuela: aqui solo se mueve mercancia. */}
        <div className="md:border-l md:border-dashed md:border-borde md:pl-6">
          <TituloPais texto={t.venezuela} className="mb-3" />

          <Caja {...t.consumidor} />
          <Paso numero="1" texto={t.pide} />
          <Caja {...t.comercio} />
          <Paso numero="5" texto={t.entrega} />

          {/* La informacion que cruza: no es dinero, y se dibuja distinto. */}
          <div className="mt-2 space-y-1.5 rounded-lg border border-dashed border-borde bg-white/70 p-3">
            <p className="flex items-start gap-2 text-xs text-tinta-suave">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t.orden}
            </p>
            <p className="flex items-start gap-2 text-xs text-tinta-suave">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t.enlace}
            </p>
          </div>
        </div>
      </div>

      <p className="border-t border-borde bg-white px-4 py-3 text-xs leading-relaxed text-tinta-suave sm:px-5">
        {t.fuera}
      </p>

      <figcaption className="border-t border-borde px-4 py-3 text-xs leading-relaxed text-tinta-suave sm:px-5">
        <span className="font-semibold text-tinta">{t.titulo}.</span> {t.pie}
      </figcaption>
    </figure>
  );
}

/** Una caja chica de las tiras de la figura 2. */
function Ficha({
  texto,
  tono = "claro",
}: {
  texto: string;
  tono?: "claro" | "oscuro" | "apagado";
}) {
  return (
    <span
      className={cn(
        "rounded-md border px-3 py-2 text-center text-xs leading-tight font-semibold whitespace-nowrap",
        tono === "oscuro" && "border-carga-500 bg-riel-900 text-white",
        tono === "claro" && "border-borde bg-white",
        tono === "apagado" &&
          "border-dashed border-borde bg-transparent text-tinta-suave",
      )}
    >
      {texto}
    </span>
  );
}

function Flecha({ tono = "gris" }: { tono?: "gris" | "rojo" | "naranja" }) {
  return (
    <ArrowRight
      className={cn(
        "h-4 w-4 shrink-0",
        tono === "rojo" && "text-red-600",
        tono === "naranja" && "text-carga-500",
        tono === "gris" && "text-tinta-suave",
      )}
      aria-hidden
    />
  );
}

/**
 * Figura 2. La figura que el modelo NO tiene, y la que sí.
 *
 * Arriba, en rojo, recibir dinero de una persona para entregárselo a otra.
 * Abajo, lo real: una compraventa de mercancía con dos facturas, cerrada
 * dentro de Estados Unidos, de la que solo el producto cruza la frontera. Es
 * la comparación que responde la primera pregunta de cualquier revisión.
 *
 * Las tiras se dibujan recorriendo la lista, no desarmándola en variables: el
 * contenido decide cuántas cajas hay, y agregar o quitar una no obliga a
 * tocar este archivo.
 */
export function FiguraFrontera({ t }: { t: TextosFiguras["frontera"] }) {
  return (
    <figure className="my-8 space-y-4">
      {/* Lo que NO hacemos. */}
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-5">
        <p className="text-[11px] font-bold tracking-[0.08em] text-red-700 uppercase">
          {t.noTitulo}
        </p>
        <p className="mt-1 text-xs text-tinta-suave">{t.noTexto}</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {t.noCajas.map((caja, i) => (
              <Fragment key={caja}>
                {i > 0 ? <Flecha tono="rojo" /> : null}
                <Ficha texto={caja} />
              </Fragment>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-red-700">
          ↑ {t.noNota}
        </p>
      </div>

      {/* Lo que SI hacemos. */}
      <div className="rounded-xl border border-borde bg-slate-50/60 p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-riel-900 uppercase">
          <BanderaEEUU className="h-3.5 w-3.5" />
          {t.siTitulo}
        </p>
        <p className="mt-1 text-xs text-tinta-suave">{t.siTexto}</p>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {t.siCajas.map((caja, i) => (
              <Fragment key={caja}>
                {i > 0 ? <Flecha tono="naranja" /> : null}
                {/* La segunda caja es Mercatren: va oscura, como en la otra
                    figura, para que se reconozca de un vistazo. */}
                <Ficha texto={caja} tono={i === 1 ? "oscuro" : "claro"} />
              </Fragment>
            ))}

            {/* La raya de puntos ES la frontera. A su derecha solo hay
                mercancía: lo comercial ya quedó cerrado a la izquierda. */}
            <span className="mx-1 self-stretch border-l border-dashed border-borde" />

            {t.cruzaCajas.map((caja) => (
              <Fragment key={caja}>
                <Flecha />
                <Ficha texto={caja} tono="apagado" />
              </Fragment>
            ))}
          </div>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-carga-600">
          <span>↑ {t.circuito}</span>
          <span className="text-tinta-suave">{t.frontera}</span>
        </p>

        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-tinta-suave ring-1 ring-borde">
          {t.consecuencia}
        </p>
      </div>
    </figure>
  );
}

/**
 * Figura 3. El modelo en cuatro pasos.
 *
 * Es la pagina que se ensena cuando solo hay un minuto para explicarlo.
 */
export function FiguraResumen({ t }: { t: TextosFiguras["resumen"] }) {
  return (
    <figure className="my-8">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.pasos.map((paso, i) => (
          <li
            key={paso.titulo}
            className={cn(
              "rounded-lg border p-4",
              i === 1
                ? "border-carga-500 bg-riel-900 text-white"
                : "border-borde bg-white",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                i === 1
                  ? "bg-carga-500 text-riel-950"
                  : "bg-slate-100 text-tinta-suave",
              )}
            >
              {i + 1}
            </span>
            <p className="mt-2 text-sm leading-snug font-bold">{paso.titulo}</p>
            <p
              className={cn(
                "mt-1 text-xs",
                i === 1 ? "text-white/70" : "text-tinta-suave",
              )}
            >
              {paso.detalle}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-3 grid gap-3 lg:grid-cols-4">
        <p className="flex items-center justify-center gap-2 rounded-lg bg-riel-900 px-4 py-2.5 text-center text-xs font-bold tracking-wide text-white uppercase lg:col-span-3">
          <BanderaEEUU className="h-4 w-4" />
          {t.banda}
        </p>
        <p className="rounded-lg border border-dashed border-borde px-4 py-2.5 text-center text-xs font-semibold text-tinta-suave">
          {t.sinDinero}
        </p>
      </div>

      <ol className="mt-5 space-y-2">
        {t.afirmaciones.map((frase, i) => (
          <li key={frase} className="flex gap-3 text-sm leading-relaxed">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-carga-500/15 text-[11px] font-bold text-carga-600">
              {i + 1}
            </span>
            <span>{frase}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
