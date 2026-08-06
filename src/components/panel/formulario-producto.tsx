"use client";

import { ImagePlus, Loader2, Save, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import {
  DEPARTAMENTOS,
  nombreDepartamento,
} from "@/lib/catalogo/departamentos";
import { baseDesdePublicado } from "@/lib/dinero";
import { ESTADOS } from "@/lib/entrega/zonas";
import { borrarFoto, guardarProducto } from "@/lib/productos/acciones";
import { cn } from "@/lib/utils";

type Foto = { id: string; url: string | null; esNuestra: boolean };

type Producto = {
  id: string;
  tituloEs: string;
  tituloEn: string | null;
  descripcionEs: string | null;
  descripcionEn: string | null;
  sku: string | null;
  marca: string | null;
  unidad: string | null;
  precioCentavos: number;
  /**
   * Opcionales a proposito: mientras la base de produccion no tenga estas dos
   * columnas, la consulta no las trae. Exigirlas dejaba la pantalla sin
   * compilar y, peor, tumbaba la ficha publica con 500.
   */
  precioBaseCentavos?: number | null;
  precioAntesCentavos: number | null;
  existencias: number;
  controlaExistencias: boolean;
  estado: string;
  destacado: boolean;
  categoriaId?: string | null;
  /** La ciudad del depósito donde está, para el selector. */
  depositoZona?: string | null;
};

/** De centavos a lo que se escribe en la casilla. */
function aTexto(centavos: number | null | undefined) {
  if (centavos === null || centavos === undefined) return "";
  return (centavos / 100).toFixed(2);
}

function Campo({
  nombre,
  etiqueta,
  ayuda,
  valor,
  placeholder,
  tipo = "text",
  filas,
  obligatorio,
  modo,
}: {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  valor?: string | null;
  placeholder?: string;
  tipo?: string;
  filas?: number;
  obligatorio?: boolean;
  /** Abre el teclado numerico en el telefono. */
  modo?: "decimal";
}) {
  const clases =
    "mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

  return (
    <label className="block">
      <span className="text-sm font-semibold">{etiqueta}</span>
      {filas ? (
        <textarea
          name={nombre}
          rows={filas}
          defaultValue={valor ?? ""}
          placeholder={placeholder}
          className={cn(clases, "resize-y")}
        />
      ) : (
        <input
          type={tipo}
          name={nombre}
          inputMode={modo}
          defaultValue={valor ?? ""}
          placeholder={placeholder}
          required={obligatorio}
          className={clases}
        />
      )}
      {ayuda ? (
        <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>
      ) : null}
    </label>
  );
}

/**
 * Alta y edicion de un producto del comercio.
 *
 * OJO AL DINERO: el precio se escribe en dolares y el servidor lo guarda en
 * centavos enteros. OJO A LA MERCANCIA: las existencias SI llevan decimales,
 * porque el cable se vende por metro y el cemento por kilo.
 */
export function FormularioProducto({
  producto,
  imagenes,
  tiendaId,
}: {
  producto?: Producto;
  imagenes?: Foto[];
  tiendaId?: string;
}) {
  const t = useTranslations("panel.producto");
  const tPanel = useTranslations("errores");
  const idioma = useLocale();
  const router = useRouter();

  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [nuevas, setNuevas] = useState<File[]>([]);
  const [fotos, setFotos] = useState<Foto[]>(imagenes ?? []);
  const entradaFotos = useRef<HTMLInputElement>(null);

  const esNuevo = !producto;

  async function quitarGuardada(id: string) {
    const antes = fotos;
    setFotos((f) => f.filter((x) => x.id !== id));

    try {
      await borrarFoto(id);
    } catch (fallo) {
      /* Si el servidor no pudo, la foto vuelve a la lista: dejarla quitada en
         pantalla haría creer que se borró, y al recargar reaparecería. Y sin
         este `try`, la excepción se llevaba por delante el formulario entero
         con todo lo escrito. */
      console.error("[producto] no se pudo quitar la foto:", fallo);
      setFotos(antes);
      setAviso({ ok: false, texto: tPanel("noSePudoGuardar") });
    }
  }

  return (
    <form
      action={async (datos) => {
        setGuardando(true);
        setAviso(null);

        // Las fotos elegidas viajan aparte: el campo de archivo se limpia al
        // renderizar y se perderian.
        for (const foto of nuevas) datos.append("fotos", foto);

        /**
         * NADA DE LO QUE PASE AQUÍ PUEDE BORRAR EL FORMULARIO.
         *
         * Sin este `try`, cualquier excepción del servidor sube hasta React,
         * React desmonta el formulario para pintar la pantalla de error, y
         * **todo lo que la persona llevaba escrito desaparece**. Y sí lanza:
         * `obtenerAlcance()` corta con una excepción cuando la cuenta todavía
         * no tiene comercio asignado.
         *
         * Eso es exactamente lo que le pasó a MEGAYES una tarde entera:
         * cargaba el producto, se caía, y tenía que empezar de cero. Cargar un
         * producto con su descripción y sus fotos son diez minutos de trabajo;
         * perderlos tres veces seguidas es perder a un comercio.
         *
         * Ahora el fallo se muestra como un aviso arriba y **lo escrito se
         * queda donde está**, listo para reintentar.
         */
        let r: Awaited<ReturnType<typeof guardarProducto>>;
        try {
          r = await guardarProducto(datos);
        } catch (fallo) {
          console.error("[producto] no se pudo guardar:", fallo);
          setGuardando(false);
          setAviso({ ok: false, texto: tPanel("noSePudoGuardar") });
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        setGuardando(false);

        if (!r.ok) {
          setAviso({ ok: false, texto: r.mensaje });
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        setNuevas([]);
        if (esNuevo) router.replace(`/panel/productos/${r.id}`);
        else {
          setAviso({ ok: true, texto: r.mensaje });
          router.refresh();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="space-y-6"
    >
      {producto ? <input type="hidden" name="id" value={producto.id} /> : null}
      {tiendaId ? (
        <input type="hidden" name="tiendaId" value={tiendaId} />
      ) : null}

      {aviso ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      {/* Lo esencial */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("basico.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("basico.texto")}</p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Campo
              nombre="tituloEs"
              obligatorio
              etiqueta={t("nombreEs")}
              valor={producto?.tituloEs}
            />
            <Campo
              nombre="tituloEn"
              etiqueta={t("nombreEn")}
              ayuda={t("nombreAyuda")}
              valor={producto?.tituloEn}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/**
             * LA CASILLA ENSEÑA EL PRECIO DEL COMERCIO, no el publicado.
             * Si enseñara el publicado, al guardar se tomaría como base y el
             * ajuste se sumaría encima del ajuste: el precio subiría en
             * cascada con cada edición.
             */}
            <Campo
              nombre="precio"
              obligatorio
              modo="decimal"
              etiqueta={t("precio")}
              ayuda={t("precioAyuda")}
              valor={
                producto
                  ? aTexto(
                      producto.precioBaseCentavos ??
                        baseDesdePublicado(producto.precioCentavos),
                    )
                  : ""
              }
              placeholder="0.00"
            />
            <Campo
              nombre="precioAntes"
              modo="decimal"
              etiqueta={t("precioAntes")}
              valor={
                producto?.precioAntesCentavos
                  ? aTexto(baseDesdePublicado(producto.precioAntesCentavos))
                  : ""
              }
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Campo
              nombre="descripcionEs"
              filas={4}
              etiqueta={t("descripcionEs")}
              valor={producto?.descripcionEs}
            />
            <Campo
              nombre="descripcionEn"
              filas={4}
              etiqueta={t("descripcionEn")}
              valor={producto?.descripcionEn}
            />
          </div>
        </div>
      </section>

      {/* Fotos */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("fotos.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("fotos.texto")}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {fotos.map((f) => (
            <div
              key={f.id}
              className="relative h-24 w-24 overflow-hidden rounded-lg border border-borde bg-slate-50"
            >
              {f.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={f.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              <button
                type="button"
                onClick={() => quitarGuardada(f.id)}
                aria-label={t("quitarFoto")}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-tinta-suave shadow hover:text-red-600"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
              {!f.esNuestra ? (
                <span
                  title={t("fotoDeOrigen")}
                  className="absolute right-0 bottom-0 left-0 bg-riel-900/80 px-1 py-0.5 text-center text-[9px] text-white"
                >
                  {t("fotoDeOrigen")}
                </span>
              ) : null}
            </div>
          ))}

          {nuevas.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-carga-500 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(f)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setNuevas((n) => n.filter((_, j) => j !== i))}
                aria-label={t("quitarFoto")}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-tinta-suave shadow hover:text-red-600"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => entradaFotos.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-borde text-xs text-tinta-suave transition-colors hover:border-carga-500"
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
            {t("agregarFotos")}
          </button>
        </div>

        <input
          ref={entradaFotos}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => {
            const elegidas = Array.from(e.target.files ?? []);
            setNuevas((n) => [...n, ...elegidas].slice(0, 8));
            e.target.value = "";
          }}
        />
      </section>

      {/* Inventario */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("inventario.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("inventario.texto")}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo
            nombre="existencias"
            modo="decimal"
            etiqueta={t("existencias")}
            ayuda={t("existenciasAyuda")}
            valor={producto ? String(producto.existencias) : "0"}
          />
          <Campo
            nombre="unidad"
            etiqueta={t("unidad")}
            valor={producto?.unidad}
            placeholder={t("unidadPlaceholder")}
          />
          <Campo
            nombre="sku"
            etiqueta={t("sku")}
            valor={producto?.sku}
            placeholder={t("skuPlaceholder")}
          />
          <Campo
            nombre="marca"
            etiqueta={t("marca")}
            valor={producto?.marca}
            placeholder={t("marcaPlaceholder")}
          />
        </div>

        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            name="controlaExistencias"
            defaultChecked={producto?.controlaExistencias ?? true}
            className="mt-0.5 h-4 w-4 accent-carga-500"
          />
          <span>
            <span className="block text-sm font-semibold">{t("controla")}</span>
            <span className="block text-xs text-tinta-suave">
              {t("controlaAyuda")}
            </span>
          </span>
        </label>
      </section>

      {/* Publicacion */}
      <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("publicacion.titulo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">
          {t("publicacion.texto")}
        </p>

        {/**
         * EL DEPARTAMENTO, de una lista cerrada.
         *
         * El comercio elige de la lista de Mercatren; no escribe la suya. Si
         * cada uno inventara su categoría, el mismo taladro acabaría en
         * "Herramientas", "Ferreteria" y "Tools", y quien busca taladros
         * encontraría uno de tres.
         *
         * Sin departamento el producto se vende igual, pero no sale al
         * navegar por la portada — y ahí es donde lo va a encontrar quien
         * todavía no sabe que existe.
         */}
        <label className="mt-4 block max-w-md">
          <span className="text-sm font-semibold">{t("departamento")}</span>
          <select
            name="categoriaId"
            defaultValue={producto?.categoriaId ?? ""}
            className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm outline-none focus:border-carga-500"
          >
            <option value="">{t("sinDepartamento")}</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d.slug} value={`dep-${d.slug}`}>
                {nombreDepartamento(d, idioma)}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-tinta-suave">
            {t("departamentoAyuda")}
          </span>
        </label>

        {/* ¿EN QUÉ CIUDAD ESTÁ ESTA MERCANCÍA? Sin esto el producto no sale
            cuando un cliente filtra por su ciudad, y el filtro es la portada
            entera. Si la tienda no tiene depósitos, elegir la ciudad le crea
            uno ("Depósito principal") en el servidor. */}
        <label className="mt-4 block max-w-md">
          <span className="text-sm font-semibold">{t("ciudadProducto")}</span>
          <select
            name="ciudadDeposito"
            defaultValue={producto?.depositoZona ?? ""}
            className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm outline-none focus:border-carga-500"
          >
            <option value="">{t("sinCiudad")}</option>
            {ESTADOS.map((estado) => (
              <optgroup key={estado.slug} label={estado.nombre}>
                {estado.ciudades.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="mt-1 block text-xs text-tinta-suave">
            {t("ciudadProductoAyuda")}
          </span>
        </label>

        <label className="mt-4 block max-w-xs">
          <span className="text-sm font-semibold">{t("estado")}</span>
          <select
            name="estado"
            defaultValue={producto?.estado ?? "borrador"}
            className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 text-sm outline-none focus:border-carga-500"
          >
            <option value="borrador">{t("estadoBorrador")}</option>
            <option value="publicado">{t("estadoPublicado")}</option>
            <option value="agotado">{t("estadoAgotado")}</option>
          </select>
        </label>

        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            name="destacado"
            defaultChecked={producto?.destacado ?? false}
            className="mt-0.5 h-4 w-4 accent-carga-500"
          />
          <span>
            <span className="block text-sm font-semibold">
              {t("destacado")}
            </span>
            <span className="block text-xs text-tinta-suave">
              {t("destacadoAyuda")}
            </span>
          </span>
        </label>
      </section>

      {/* En el telefono el boton se queda pegado abajo: el formulario es
          largo y nadie deberia subir hasta arriba para guardar. */}
      <div className="sticky bottom-0 -mx-4 border-t border-borde bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-6">
        <button
          type="submit"
          disabled={guardando}
          className="boton-principal w-full gap-2 sm:w-auto"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {guardando ? t("guardando") : t("guardar")}
        </button>
      </div>
    </form>
  );
}
