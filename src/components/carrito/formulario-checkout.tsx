"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";

import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { Campo } from "@/components/ui/campo";
import { camposDeEntrega, ESTADOS_US } from "@/lib/destino/direccion";
import { Link, useRouter } from "@/i18n/navigation";
import { sumarCarrito, useCarrito } from "@/lib/carrito/store";
import {
  baseDesdePublicado,
  formatearPrecio,
  precioZelleCentavos,
  type Idioma,
} from "@/lib/dinero";
import { opcionesDeEntrega } from "@/lib/envios/acciones";
import { crearPedido } from "@/lib/pedidos/acciones";
import { cn } from "@/lib/utils";
import { ZELLE_MINIMO_CENTAVOS } from "@/lib/dinero";

/**
 * La tarjeta va PRIMERA y preseleccionada: es el método protagonista
 * (decisión del 4 ago 2026). Zelle queda para compras desde $200 — por
 * debajo se enseña deshabilitada con el motivo, no escondida: una opción
 * que desaparece sin explicación parece un error.
 *
 * El valor "stripe" es el interno; el cliente lee "tarjeta".
 */
const METODOS = [
  { valor: "stripe", disponible: true },
  { valor: "zelle", disponible: true },
  { valor: "billetera", disponible: false },
] as const;

/**
 * Cierre de la compra: a donde va y como se paga.
 *
 * Los precios que se muestran son de referencia. El pedido se arma en el
 * servidor, que vuelve a leer precios y existencias de la base.
 */
export function FormularioCheckout({ haySesion }: { haySesion: boolean }) {
  const t = useTranslations("checkout");
  const tc = useTranslations("carrito");
  const te = useTranslations("envio");
  const idioma = useLocale() as Idioma;
  const router = useRouter();

  const { lineas, vaciar } = useCarrito();
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<string>("stripe");
  const [forma, setForma] = useState<"retiro" | "envio">("retiro");
  /* Si alguno de los comercios del carrito despacha, y cuánto costaría. Lo
     calcula el SERVIDOR con las políticas de la base: el número que se enseña
     aquí tiene que ser el mismo que se va a cobrar. */
  const [envio, setEnvio] = useState<{
    despachan: boolean;
    costoCentavos: number;
    destino: "US" | "VE";
  }>({ despachan: false, costoCentavos: 0, destino: "VE" });

  /* Se pregunta al montar y cada vez que cambia el carrito. Si falla, se queda
     en "no despachan": mejor no ofrecer un envío que ofrecerlo y no cumplirlo. */
  const claveCarrito = lineas
    .map((l) => `${l.productoId}:${l.cantidad}`)
    .join("|");

  useEffect(() => {
    let vivo = true;
    if (lineas.length === 0) return;
    opcionesDeEntrega(
      lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
    )
      .then((r) => {
        if (vivo) setEnvio(r);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveCarrito]);

  const enElNavegador = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!enElNavegador) return null;

  if (!haySesion) {
    return (
      <div className="rounded-xl border border-borde p-6 text-center">
        <p className="text-sm">{t("necesitaCuenta")}</p>
        <Link href="/entrar?destino=/checkout" className="boton-principal mt-4">
          {t("entrar")}
        </Link>
      </div>
    );
  }

  if (lineas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-borde px-6 py-12 text-center">
        <p className="text-sm text-tinta-suave">{tc("vacio")}</p>
        <Link href="/catalogo" className="boton-principal mt-4">
          {tc("verCatalogo")}
        </Link>
      </div>
    );
  }

  const total = sumarCarrito(lineas);

  /**
   * EL TOTAL DEL MÉTODO QUE ELIGIÓ, no siempre el de tarjeta.
   *
   * Los precios del catálogo llevan incorporado el 2.9% + $0.30 del procesador
   * de tarjeta. Por Zelle ese procesador no existe, así que `crearPedido`
   * rearma el pedido más barato en el servidor — y hasta hoy el resumen seguía
   * enseñando el de tarjeta. El cliente elegía Zelle viendo un número y le
   * llegaba otro más bajo.
   *
   * Aunque la sorpresa fuera a favor, está mal por dos motivos: un total que
   * cambia después de confirmar se lee como un error del sitio, y esconde
   * justo lo que hace que la gente elija Zelle, que es el método que además
   * nos deja mejor margen.
   *
   * ES DE REFERENCIA, igual que el resto del resumen (ver el comentario de
   * arriba): aquí solo está el precio publicado, así que la base se deduce con
   * `baseDesdePublicado`. El número que manda es el que arma el servidor
   * leyendo la base de datos, y puede diferir en algún centavo.
   */
  const totalZelle = lineas.reduce(
    (suma, l) =>
      suma +
      precioZelleCentavos(baseDesdePublicado(l.precioCentavos)) * l.cantidad,
    0,
  );
  /* En Estados Unidos siempre se despacha: lo decide el destino del carrito,
     que sale de la base. */
  const soloEnvio = envio.destino === "US";
  const formaReal = soloEnvio ? "envio" : forma;

  const esZelle = metodo === "zelle";
  /* El envío solo se cobra si lo eligió Y hay quien despache. */
  const costoEnvio = formaReal === "envio" ? envio.costoCentavos : 0;
  const totalAMostrar = (esZelle ? totalZelle : total) + costoEnvio;
  const ahorroZelle = Math.max(0, total - totalZelle);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const datos = new FormData(evento.currentTarget);
    const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

    iniciarTransicion(async () => {
      const resultado = await crearPedido({
        entrega: {
          nombre: texto("nombre"),
          telefono: texto("telefono"),
          pais: texto("pais"),
          ciudad: texto("ciudad"),
          direccion: texto("direccion"),
          direccion2: texto("direccion2"),
          estado: texto("estado"),
          codigoPostal: texto("codigoPostal"),
          /* Vacío se manda vacío, no `undefined`: el esquema del servidor ya
             trata la casilla en blanco como una respuesta válida. */
          referencia: texto("referencia"),
          notas: texto("notas"),
        },
        metodoPago: metodo as "zelle" | "stripe",
        formaEntrega: formaReal,
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
        })),
      });

      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }

      // El pedido ya vive en el servidor: el carrito del navegador sobra.
      vaciar();
      /* El pedido ya existe con estos datos dentro: el borrador cumplió su
         trabajo y estorbaría en la próxima compra. */
      olvidarBorrador("checkout");
      router.push(`/pedido/${resultado.numero}`);
    });
  }

  return (
    <FormularioPersistente
      llave="checkout"
      onSubmit={enviar}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-borde p-5">
          <h2 className="text-lg font-bold">
            {/* «¿Quién retira el pedido?» no tiene sentido cuando solo se
                despacha: nadie va a retirar nada. */}
            {soloEnvio ? t("entrega.tituloEnvio") : t("entrega.titulo")}
          </h2>

          {/**
           * CÓMO QUIERE RECIBIRLO — Y EN ESTADOS UNIDOS NO SE PREGUNTA.
           *
           * Los productos que vienen de una API (CJ hoy, Dropi mañana) **los
           * despacha el proveedor**: no hay local a donde ir a buscarlos.
           * Estados Unidos se trabaja a nivel nacional, no por tiendas
           * físicas, así que ofrecer «lo busco en su local» es ofrecer algo
           * que no existe — y hacer elegir entre dos opciones cuando solo hay
           * una es una pregunta que sobra justo antes de pagar.
           *
           * Los comercios de Venezuela SÍ tienen local: ahí se puede retirar
           * o pedir envío, y las dos opciones se quedan como estaban.
           */}
          {soloEnvio ? null : envio.despachan ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(["retiro", "envio"] as const).map((opcion) => (
                <label
                  key={opcion}
                  className={cn(
                    "flex cursor-pointer gap-2.5 rounded-xl border p-3",
                    forma === opcion
                      ? "border-riel-900 bg-riel-900/5"
                      : "border-borde hover:bg-neutral-50",
                  )}
                >
                  <input
                    type="radio"
                    name="formaEntrega"
                    value={opcion}
                    checked={forma === opcion}
                    onChange={() => setForma(opcion)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {te(opcion === "retiro" ? "opcionRetiro" : "opcionEnvio")}
                    </span>
                    <span className="block text-xs text-tinta-suave">
                      {opcion === "retiro"
                        ? te("opcionRetiroTexto")
                        : formatearPrecio(envio.costoCentavos, idioma)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          {/* EL AVISO YA NO ES FIJO. Decía "todo se retira en el depósito"
              aunque el comercio despachara, así que el comprador leía lo
              contrario de lo que iba a pasar justo antes de pagar. */}
          <p className="mt-1 rounded-lg bg-carga-500/5 px-3 py-2 text-sm text-tinta-suave ring-1 ring-carga-500/30">
            {soloEnvio
              ? /* «$0.00» al lado de un envío se lee como que falta cobrarlo.
                   Lo que pasa de verdad es que ya está dentro del precio. */
                te("avisoEnvioIncluido")
              : envio.despachan
                ? forma === "envio"
                  ? te("avisoEnvio")
                  : te("avisoRetiro")
                : t("entrega.aviso")}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* LAS CASILLAS LAS DECIDE EL DESTINO, no un `if` aquí dentro.
                Venezuela se retira en el depósito y basta con quién va a
                buscarlo; Estados Unidos se despacha, y ahí la dirección
                completa ES el pedido. La tabla vive en
                src/lib/destino/direccion.ts y la usa también el servidor, así
                que la pantalla y el candado no se pueden desincronizar. */}
            {camposDeEntrega(envio.destino).map((campo) =>
              campo.nombre === "estado" ? (
                /* El estado, de una LISTA. Escrito a mano llegan «Florida»,
                   «florida» y «MI» pensando en la ciudad — y CJ compara el
                   código de dos letras contra su tabla: lo que no reconoce, lo
                   rechaza. */
                <div key={campo.nombre}>
                  <label htmlFor="estado" className="block text-sm font-medium">
                    {t("entrega.estado")}
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    required
                    autoComplete="address-level1"
                    defaultValue=""
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
                  >
                    <option value="" disabled>
                      {t("entrega.estadoPlaceholder")}
                    </option>
                    {ESTADOS_US.map((e) => (
                      <option key={e.codigo} value={e.codigo}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div
                  key={campo.nombre}
                  className={campo.ancho ? "sm:col-span-2" : undefined}
                >
                  <Campo
                    tipo={campo.tipo}
                    nombre={campo.nombre}
                    etiqueta={(() => {
                      /* «Nombre de quien retira» no vale cuando nadie va a
                         retirar nada: en Estados Unidos se despacha siempre. */
                      const base =
                        soloEnvio && campo.nombre === "nombre"
                          ? t("entrega.nombreEnvio")
                          : t(`entrega.${campo.nombre}`);
                      return campo.obligatorio
                        ? base
                        : `${base} · ${t("entrega.opcional")}`;
                    })()}
                    marcador={t(`entrega.${campo.nombre}Placeholder`)}
                    requerido={campo.obligatorio}
                  />
                </div>
              ),
            )}
            <div className="sm:col-span-2">
              <Campo
                tipo="textoCorto"
                nombre="notas"
                etiqueta={`${t("entrega.notas")} · ${t("entrega.opcional")}`}
                marcador={t("entrega.notasPlaceholder")}
                area
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-borde p-5">
          <h2 className="text-lg font-bold">{t("pago.titulo")}</h2>

          <ul className="mt-4 space-y-2">
            {METODOS.map((m) => {
              /* Zelle es para montos grandes: bajo $200 se deshabilita con el
                 motivo a la vista. El servidor lo vuelve a comprobar. */
              const zelleCorto =
                m.valor === "zelle" && total < ZELLE_MINIMO_CENTAVOS;
              const disponible = m.disponible && !zelleCorto;
              return (
                <li key={m.valor}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      metodo === m.valor
                        ? "border-carga-500 bg-carga-500/5"
                        : "border-borde hover:border-riel-700",
                      !disponible && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      value={m.valor}
                      checked={metodo === m.valor}
                      disabled={!disponible}
                      onChange={() => setMetodo(m.valor)}
                      className="mt-1 accent-carga-500"
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {t(`pago.${m.valor}`)}
                        {!m.disponible ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-tinta-suave">
                            {t("pago.proximamente")}
                          </span>
                        ) : zelleCorto ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-tinta-suave">
                            {t("pago.zelleDesde")}
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-xs text-tinta-suave">
                        {t(`pago.${m.valor}Texto`)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-borde p-4 lg:sticky lg:top-28">
        <h2 className="text-sm font-bold">{t("resumen")}</h2>

        <ul className="mt-3 space-y-2 text-xs">
          {lineas.map((l) => (
            <li key={l.productoId} className="flex justify-between gap-2">
              <span className="line-clamp-1 text-tinta-suave">
                {l.cantidad} × {l.titulo}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatearPrecio(l.precioCentavos * l.cantidad, idioma)}
              </span>
            </li>
          ))}
        </ul>

        {costoEnvio > 0 ? (
          <p className="mt-2 flex justify-between text-xs text-tinta-suave">
            <span>{te("lineaEnvio")}</span>
            <span className="tabular-nums">
              {formatearPrecio(costoEnvio, idioma)}
            </span>
          </p>
        ) : null}

        <p className="mt-3 flex justify-between border-t border-borde pt-3 text-base font-bold">
          <span>{tc("total")}</span>
          <span className="tabular-nums">
            {formatearPrecio(totalAMostrar, idioma)}
          </span>
        </p>

        {esZelle && ahorroZelle > 0 ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {t("pago.ahorroZelle", {
              monto: formatearPrecio(ahorroZelle, idioma),
            })}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pendiente}
          className="boton-principal mt-4 w-full disabled:opacity-60"
        >
          {pendiente ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {t("procesando")}
            </>
          ) : (
            t("confirmar")
          )}
        </button>
      </aside>
    </FormularioPersistente>
  );
}
