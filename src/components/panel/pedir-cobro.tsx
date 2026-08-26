"use client";

import { Check, Copy, Link2, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";

import { Campo } from "@/components/ui/campo";
import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { useRouter } from "@/i18n/navigation";
import { crearCobroDesdePanel, reenviarCobro } from "@/lib/cobros/pedir";

/**
 * PEDIR UN COBRO Y MANDÁRSELO A QUIEN VA A PAGAR.
 *
 * ══ EL ENLACE SE VE Y SE COPIA, SIEMPRE ══
 *
 * El correo sale solo, pero **la mayoría de estos enlaces se mandan por
 * WhatsApp**: el que paga es el hijo o el socio en Estados Unidos, y con quien
 * se habla es por chat. Un sistema que solo mande el correo obliga a entrar al
 * buzón del cliente para copiar el enlace — o sea, obliga a lo imposible.
 *
 * Por eso, en cuanto el cobro se crea, el enlace queda **a la vista y con su
 * botón de copiar**, aunque el correo también haya salido.
 */
export function PedirCobro({
  tiendas,
}: {
  tiendas?: { id: string; nombre: string }[];
}) {
  const t = useTranslations("panel.pedirCobro");
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, creando] = useActionState(crearCobroDesdePanel, null);

  /**
   * AL CREARLO BIEN: SE OLVIDA EL BORRADOR Y SE VACÍA EL FORMULARIO.
   *
   * Sin lo primero, al volver a la pantalla el borrador **repinta el cobro
   * anterior**, y quien no se fije crea el mismo dos veces — o peor, con un
   * monto que ya no es el que quería. Pasó en la primera prueba: el campo
   * volvió con el valor del intento fallido.
   *
   * Y se vacía a mano porque un formulario que se queda lleno con el cobro que
   * acaba de salir invita a pulsar el botón otra vez.
   */
  useEffect(() => {
    if (!estado?.ok) return;
    olvidarBorrador("pedir-cobro");
    formulario.current?.reset();
    router.refresh();
  }, [estado?.ok, router]);

  return (
    <div className="rounded-xl border border-borde bg-white p-4">
      <h2 className="flex items-center gap-2 font-bold">
        <Link2 className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("queEs")}</p>

      <FormularioPersistente
        ref={formulario}
        llave="pedir-cobro"
        action={accion}
        className="mt-4"
      >
        {tiendas && tiendas.length > 0 ? (
          <label className="mb-4 block text-sm">
            <span className="font-medium text-riel-800">
              {t("deQueComercio")}
            </span>
            <select
              name="tiendaId"
              required
              className="mt-1 h-9 w-full rounded-lg border border-borde px-2"
            >
              <option value="">{t("eligeComercio")}</option>
              {/* `tienda` y no `t`: ese nombre ya lo usa el hook de
                  traducciones, y sombrearlo aquí dentro dejaría el `.map` sin
                  poder traducir nada. */}
              {tiendas.map((tienda) => (
                <option key={tienda.id} value={tienda.id}>
                  {tienda.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {/**
           * EL MONTO VA A MANO Y NO CON `<Campo>`, IGUAL QUE EN LOS RETIROS.
           *
           * `tipo="soloNumeros"` **se come el punto decimal**: quien escribe
           * 45.90 guarda 4590, y eso son $4,590.00 cobrados a alguien por una
           * factura de cuarenta y cinco dólares. Lo encontró la primera prueba
           * en pantalla, no una prueba unitaria.
           *
           * `inputMode="decimal"` es lo que saca el teclado con punto en el
           * celular, que es desde donde carga esto casi todo el mundo.
           */}
          <label className="block text-sm" htmlFor="monto">
            <span className="font-medium text-riel-800">{t("cuanto")}</span>
            <span className="relative mt-1 block">
              <span
                className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-suave"
                aria-hidden
              >
                $
              </span>
              <input
                id="monto"
                name="monto"
                type="text"
                inputMode="decimal"
                required
                autoComplete="off"
                placeholder="0.00"
                /* 16px como mínimo: por debajo, el iPhone hace zoom al tocar. */
                className="h-9 w-full rounded-lg border border-borde py-3 pr-3 pl-7 text-base tabular-nums sm:py-2.5 sm:text-sm"
              />
            </span>
            <span className="text-riel-600 mt-1 block text-xs">
              {t("cuantoAyuda")}
            </span>
          </label>
          <Campo
            tipo="alfanumerico"
            nombre="referencia"
            etiqueta={t("factura")}
            ayuda={t("facturaAyuda")}
            requerido
          />
          <Campo
            tipo="correo"
            nombre="correo"
            etiqueta={t("correo")}
            ayuda={t("correoAyuda")}
            requerido
          />
          <Campo
            tipo="nombrePersona"
            nombre="nombre"
            etiqueta={t("nombre")}
            ayuda={t("nombreAyuda")}
          />
          <div className="sm:col-span-2">
            <Campo
              tipo="textoCorto"
              nombre="concepto"
              etiqueta={t("concepto")}
              ayuda={t("conceptoAyuda")}
            />
          </div>
        </div>

        {/**
         * ══ QUÉ MÉTODOS ACEPTA ESTE COBRO (26 ago 2026) ══
         *
         * Lo pidió el dueño con la cuenta hecha: con tarjeta, Stripe se lleva
         * 2,9% + $0.30 ADEMÁS del 3% de Mercatren — en una factura de siete
         * mil dólares, más de doscientos. Si el comercio calculó su factura
         * para cobrar por transferencia, dejar la tarjeta abierta es regalar
         * ese dinero.
         *
         * Las tres van marcadas por defecto: quitar una es una decisión, y la
         * que se toma sin querer no puede ser la que deje al cliente sin
         * poder pagar.
         */}
        <fieldset className="mt-4 rounded-xl border border-borde p-4">
          <legend className="px-1 text-sm font-bold">
            {t("metodosTitulo")}
          </legend>
          <p className="text-xs leading-relaxed text-tinta-suave">
            {t("metodosAyuda")}
          </p>
          <div className="mt-3 space-y-2">
            {(
              [
                { valor: "transferencia", clave: "transferencia" },
                { valor: "zelle", clave: "zelle" },
                { valor: "tarjeta", clave: "tarjeta" },
              ] as const
            ).map(({ valor, clave }) => (
              <label key={valor} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  name="metodos"
                  value={valor}
                  defaultChecked
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {t(`metodos.${clave}.titulo`)}
                  </span>
                  <span className="block text-xs leading-snug text-tinta-suave">
                    {t(`metodos.${clave}.detalle`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Cargos />

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-tinta-suave">
            {t("opciones")}
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-riel-800">{t("dias")}</span>
              <select
                name="dias"
                defaultValue="7"
                className="mt-1 h-9 w-full rounded-lg border border-borde px-2"
              >
                {[1, 3, 7, 10, 15].map((d) => (
                  <option key={d} value={d}>
                    {d === 1 ? t("unDia", { n: d }) : t("variosDias", { n: d })}
                  </option>
                ))}
              </select>
            </label>
            {/* El modo callado: quien paga no ve el nombre del comercio. Existe
                para la reventa — si el cliente final ve quién surte a su
                tienda, le compra directo. */}
            <label className="flex items-start gap-2 self-end pb-2 text-sm">
              <input
                type="checkbox"
                name="modo"
                value="solo_mercatren"
                className="mt-0.5 size-4"
              />
              <span>{t("sinNombrar")}</span>
            </label>
          </div>
        </details>

        {estado && !estado.ok ? (
          <p
            role="status"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900"
          >
            {estado.mensaje}
            {estado.campos?.length ? ` (${estado.campos.join(", ")})` : null}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={creando}
          className="boton-principal mt-5 gap-2 text-sm disabled:opacity-60"
        >
          {creando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {t("boton")}
        </button>
      </FormularioPersistente>

      {estado?.ok ? (
        <EnlaceListo url={estado.url} referencia={estado.referencia} />
      ) : null}
    </div>
  );
}

/**
 * FLETE Y MANEJO: LOS DOS CARGOS QUE NO SON MERCANCÍA.
 *
 * ══ EL CASO QUE LO PIDIÓ ══
 *
 * Una ferretería vende diez sacos de cemento por $540. El cliente pide que se
 * los lleven: el camión son $40 y subirlos a un tercer piso con dos ayudantes,
 * $20. Antes no había dónde meterlo — o se sumaba al precio del cemento, y
 * entonces la factura miente sobre qué se vendió, o no se cobraba.
 *
 * ══ EL TOTAL SE VE MIENTRAS SE ESCRIBE ══
 *
 * Quien está cobrando necesita comprobar que da lo que acordó con el cliente
 * **antes** de mandar el enlace. Un total que solo aparece después de crear el
 * cobro obliga a anularlo y rehacerlo cuando no cuadra.
 */
function Cargos() {
  const t = useTranslations("panel.pedirCobro");
  const [mercancia, setMercancia] = useState("");
  const [flete, setFlete] = useState("");
  const [manejo, setManejo] = useState("");

  /* Se lee del propio formulario para no duplicar el campo del monto: el
     usuario escribe arriba y el total de abajo lo sigue. */
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>("form");
    if (!form) return;
    const leer = () => {
      const v = (n: string) =>
        (
          form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value ?? ""
        ).trim();
      setMercancia(v("monto"));
      setFlete(v("flete"));
      setManejo(v("manejo"));
    };
    leer();
    form.addEventListener("input", leer);
    return () => form.removeEventListener("input", leer);
  }, []);

  const num = (v: string) => {
    const n = Number.parseFloat(v.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const total = num(mercancia) + num(flete) + num(manejo);
  const hayCargos = num(flete) > 0 || num(manejo) > 0;

  return (
    <details
      className="mt-4 rounded-lg border border-borde bg-slate-50/60 p-3"
      open={hayCargos}
    >
      <summary className="cursor-pointer text-sm font-semibold">
        {t("cargosTitulo")}
      </summary>

      <p className="mt-2 text-xs text-tinta-suave">{t("cargosQueEs")}</p>

      <div className="mt-3 space-y-3">
        <CampoCargo
          nombre="flete"
          etiqueta={t("flete")}
          ayuda={t("fleteAyuda")}
          ejemplo={t("fleteEjemplo")}
        />
        <CampoCargo
          nombre="manejo"
          etiqueta={t("manejo")}
          ayuda={t("manejoAyuda")}
          ejemplo={t("manejoEjemplo")}
        />
      </div>

      {total > 0 ? (
        <p className="mt-3 border-t border-borde pt-2 text-sm">
          <span className="text-tinta-suave">{t("vaAPagar")} </span>
          <strong className="tabular-nums">${total.toFixed(2)}</strong>
          {hayCargos ? (
            <span className="text-xs text-tinta-suave">
              {" "}
              ({t("deMercancia", { monto: num(mercancia).toFixed(2) })}
              {num(flete) > 0
                ? t("masFlete", { monto: num(flete).toFixed(2) })
                : ""}
              {num(manejo) > 0
                ? t("masManejo", { monto: num(manejo).toFixed(2) })
                : ""}
              )
            </span>
          ) : null}
        </p>
      ) : null}
    </details>
  );
}

/** Un cargo: su monto y la explicación que lee el cliente. */
function CampoCargo({
  nombre,
  etiqueta,
  ayuda,
  ejemplo,
}: {
  nombre: string;
  etiqueta: string;
  ayuda: string;
  ejemplo: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
      <label className="block text-sm" htmlFor={nombre}>
        <span className="font-medium text-riel-800">{etiqueta}</span>
        <span className="relative mt-1 block">
          <span
            className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          >
            $
          </span>
          <input
            id={nombre}
            name={nombre}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            className="h-9 w-full rounded-lg border border-borde py-3 pr-3 pl-7 text-base tabular-nums sm:py-2.5 sm:text-sm"
          />
        </span>
      </label>
      <label className="block self-end text-sm" htmlFor={`${nombre}Concepto`}>
        <input
          id={`${nombre}Concepto`}
          name={`${nombre}Concepto`}
          type="text"
          maxLength={160}
          placeholder={ejemplo}
          className="h-9 w-full rounded-lg border border-borde px-3 text-sm"
        />
        <span className="text-riel-600 mt-1 block text-xs">{ayuda}</span>
      </label>
    </div>
  );
}

/** El enlace recién creado, grande y copiable. */
function EnlaceListo({ url, referencia }: { url: string; referencia: string }) {
  const t = useTranslations("panel.pedirCobro");
  return (
    <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3">
      <p className="text-sm font-semibold text-emerald-900">
        {t("listo", { referencia })}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-xs">
          {url}
        </code>
        <BotonCopiar texto={url} />
      </div>
      <p className="mt-2 text-xs text-emerald-800">{t("mandaloPorWhatsapp")}</p>
    </div>
  );
}

/** Copiar al portapapeles, con la confirmación que hace falta ver. */
export function BotonCopiar({ texto }: { texto: string }) {
  const t = useTranslations("panel.pedirCobro");
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          /* Vuelve a su estado normal solo. Sin esto, el botón se queda
             diciendo «copiado» para siempre y deja de significar nada. */
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          /* Sin permiso de portapapeles no se puede copiar por código. Se
             selecciona el texto para que lo copie a mano en vez de dejarlo
             sin salida. */
          const sel = window.getSelection();
          const rango = document.createRange();
          const nodo = document.querySelector(`code`);
          if (nodo && sel) {
            rango.selectNodeContents(nodo);
            sel.removeAllRanges();
            sel.addRange(rango);
          }
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-borde bg-white px-2.5 py-1.5 text-xs font-semibold hover:border-carga-500"
    >
      {copiado ? (
        <>
          <Check className="h-3.5 w-3.5 text-precio-600" aria-hidden />
          {t("copiado")}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {t("copiar")}
        </>
      )}
    </button>
  );
}

/**
 * REENVIAR UN COBRO QUE YA EXISTE A OTRO CORREO.
 *
 * El enlace NO cambia y la referencia tampoco: en el extracto del banco sigue
 * apareciendo el mismo número. Anular y volver a crear obligaría a cambiar la
 * referencia, y eso es justo lo que ensucia la conciliación.
 */
export function ReenviarCobro({
  cobroId,
  url,
}: {
  cobroId: string;
  url: string;
}) {
  const t = useTranslations("panel.pedirCobro");
  const [estado, accion, enviando] = useActionState(reenviarCobro, null);

  return (
    <div className="mt-3 border-t border-borde/60 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-slate-50 px-2 py-1.5 font-mono text-xs">
          {url}
        </code>
        <BotonCopiar texto={url} />
      </div>

      <form action={accion} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="cobroId" value={cobroId} />
        <input
          type="email"
          name="correo"
          required
          placeholder={t("otroCorreo")}
          className="h-8 min-w-0 flex-1 rounded-lg border border-borde px-2 text-xs"
        />
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-borde px-2.5 py-1.5 text-xs font-semibold hover:border-carga-500 disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("reenviar")}
        </button>
      </form>

      {estado ? (
        <p
          role="status"
          className={`mt-1.5 text-xs font-medium ${
            estado.ok ? "text-precio-600" : "text-red-800"
          }`}
        >
          {estado.mensaje}
        </p>
      ) : null}
    </div>
  );
}
