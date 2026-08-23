"use client";

import { ImagePlus, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { BannerPublicitario } from "@/components/catalogo/banner-publicitario";
import {
  FormularioPersistente,
  olvidarBorrador,
} from "@/components/ui/formulario-persistente";
import { useRouter } from "@/i18n/navigation";
import { guardarBanner } from "@/lib/banners/acciones";
import {
  CADA_CUANTOS_MAXIMO,
  CADA_CUANTOS_MINIMO,
  CADA_CUANTOS_POR_DEFECTO,
  UBICACIONES,
  type BannerPublico,
} from "@/lib/banners/reglas";
import { comprimirImagen } from "@/lib/imagenes/comprimir";
import { LADO_MAXIMO_PRODUCTO } from "@/lib/imagenes/medidas";
import { cn } from "@/lib/utils";

export type BannerEnFormulario = {
  id: string;
  tituloEs: string;
  tituloEn: string | null;
  textoEs: string | null;
  textoEn: string | null;
  botonEs: string | null;
  botonEn: string | null;
  imagenUrl: string | null;
  enlace: string;
  ubicacion: string;
  tiendaId: string | null;
  cadaCuantos: number;
  orden: number;
  activo: boolean;
  desde: string | null;
  hasta: string | null;
  mercado: string;
} | null;

const CLASES =
  "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

/**
 * EL FORMULARIO DEL BANNER. Persistente (lo escrito no se pierde si el
 * teléfono mata la pestaña al abrir el carrete), la imagen se comprime en el
 * navegador como todas las fotos del sitio, y abajo se ve EL BANNER COMO VA A
 * SALIR mientras se escribe: un anuncio se juzga viéndolo, no leyendo campos.
 */
export function FormularioBanner({
  banner,
  tiendas,
  mercados,
}: {
  banner: BannerEnFormulario;
  tiendas: { id: string; nombre: string; slug: string; mercado: string }[];
  mercados: { codigo: string; nombre: string }[];
}) {
  const t = useTranslations("panel.banners.formulario");
  const tu = useTranslations("panel.banners.ubicaciones");
  const router = useRouter();
  const llave = `banner-${banner?.id ?? "nuevo"}`;
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  /* Lo que se escribe, para la vista previa. */
  const [tituloEs, setTituloEs] = useState(banner?.tituloEs ?? "");
  const [textoEs, setTextoEs] = useState(banner?.textoEs ?? "");
  const [botonEs, setBotonEs] = useState(banner?.botonEs ?? "");
  const [enlace, setEnlace] = useState(banner?.enlace ?? "");
  const [tiendaId, setTiendaId] = useState(banner?.tiendaId ?? "");
  const [vista, setVista] = useState<string | null>(banner?.imagenUrl ?? null);
  const [quitar, setQuitar] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const previa: BannerPublico = {
    id: banner?.id ?? "nuevo",
    titulo: tituloEs || "…",
    texto: textoEs || null,
    boton: botonEs || null,
    imagenUrl: quitar ? null : vista,
    enlace: enlace || "/",
    cadaCuantos: CADA_CUANTOS_POR_DEFECTO,
  };

  return (
    <FormularioPersistente
      llave={llave}
      action={async (datos) => {
        setGuardando(true);
        setAviso(null);
        const r = await guardarBanner(datos);
        if (r.ok) {
          olvidarBorrador(llave);
          router.push("/panel/banners");
          router.refresh();
          return;
        }
        setAviso({ ok: false, texto: r.mensaje });
        setGuardando(false);
      }}
      className="space-y-8"
    >
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

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

      {/* Vista previa */}
      <section className="rounded-xl border border-borde bg-slate-50 p-4">
        <p className="mb-2 text-xs font-semibold tracking-wider text-tinta-suave uppercase">
          {t("vistaPrevia")}
        </p>
        <ul className="grid grid-cols-1">
          <li className="pointer-events-none">
            <BannerPublicitario banner={previa} />
          </li>
        </ul>
      </section>

      {/* Textos */}
      <section className="space-y-4">
        <h2 className="text-base font-bold">{t("textos")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("tituloEs")}
            <input
              name="tituloEs"
              required
              maxLength={120}
              defaultValue={banner?.tituloEs ?? ""}
              onChange={(e) => setTituloEs(e.target.value)}
              className={CLASES}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("tituloEn")}
            <input
              name="tituloEn"
              maxLength={120}
              defaultValue={banner?.tituloEn ?? ""}
              className={CLASES}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("textoEs")}
            <input
              name="textoEs"
              maxLength={300}
              defaultValue={banner?.textoEs ?? ""}
              onChange={(e) => setTextoEs(e.target.value)}
              className={CLASES}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("textoEn")}
            <input
              name="textoEn"
              maxLength={300}
              defaultValue={banner?.textoEn ?? ""}
              className={CLASES}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("botonEs")}
            <input
              name="botonEs"
              maxLength={40}
              defaultValue={banner?.botonEs ?? ""}
              onChange={(e) => setBotonEs(e.target.value)}
              className={CLASES}
            />
            <span className="mt-1 block text-xs font-normal text-tinta-suave">
              {t("botonAyuda")}
            </span>
          </label>
          <label className="block text-sm font-semibold">
            {t("botonEn")}
            <input
              name="botonEn"
              maxLength={40}
              defaultValue={banner?.botonEn ?? ""}
              className={CLASES}
            />
          </label>
        </div>
      </section>

      {/* Destino */}
      <section className="space-y-4">
        <h2 className="text-base font-bold">{t("destino")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("tienda")}
            <select
              name="tiendaId"
              value={tiendaId}
              onChange={(e) => {
                const id = e.target.value;
                setTiendaId(id);
                const tienda = tiendas.find((x) => x.id === id);
                if (tienda && (!enlace || enlace.startsWith("/tienda/")))
                  setEnlace(`/tienda/${tienda.slug}`);
              }}
              className={CLASES}
            >
              <option value="">{t("sinTienda")}</option>
              {tiendas.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-tinta-suave">
              {t("tiendaAyuda")}
            </span>
          </label>
          <label className="block text-sm font-semibold">
            {t("enlace")}
            <input
              name="enlace"
              required
              maxLength={500}
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="/tienda/…"
              className={CLASES}
            />
            <span className="mt-1 block text-xs font-normal text-tinta-suave">
              {t("enlaceAyuda")}
            </span>
          </label>
        </div>
      </section>

      {/* Dónde y cuándo */}
      <section className="space-y-4">
        <h2 className="text-base font-bold">{t("dondeYCuando")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold">
            {t("ubicacion")}
            <select
              name="ubicacion"
              defaultValue={banner?.ubicacion ?? "todas"}
              className={CLASES}
            >
              {UBICACIONES.map((u) => (
                <option key={u} value={u}>
                  {tu(u)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t("cadaCuantos")}
            <input
              name="cadaCuantos"
              type="number"
              inputMode="numeric"
              min={CADA_CUANTOS_MINIMO}
              max={CADA_CUANTOS_MAXIMO}
              defaultValue={banner?.cadaCuantos ?? CADA_CUANTOS_POR_DEFECTO}
              className={CLASES}
            />
            <span className="mt-1 block text-xs font-normal text-tinta-suave">
              {t("cadaCuantosAyuda")}
            </span>
          </label>
          <label className="block text-sm font-semibold">
            {t("orden")}
            <input
              name="orden"
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              defaultValue={banner?.orden ?? 0}
              className={CLASES}
            />
            <span className="mt-1 block text-xs font-normal text-tinta-suave">
              {t("ordenAyuda")}
            </span>
          </label>
          <label className="block text-sm font-semibold">
            {t("mercado")}
            <select
              name="mercado"
              defaultValue={banner?.mercado ?? "US"}
              className={CLASES}
            >
              {mercados.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t("desde")}
            <input
              name="desde"
              type="date"
              defaultValue={banner?.desde ?? ""}
              className={CLASES}
            />
          </label>
          <label className="block text-sm font-semibold">
            {t("hasta")}
            <input
              name="hasta"
              type="date"
              defaultValue={banner?.hasta ?? ""}
              className={CLASES}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            name="activo"
            type="checkbox"
            defaultChecked={banner?.activo ?? true}
            className="h-4 w-4 rounded border-borde"
          />
          {t("activo")}
        </label>
      </section>

      {/* Imagen */}
      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("imagen")}</h2>
        <p className="text-xs text-tinta-suave">{t("imagenAyuda")}</p>
        <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-borde bg-slate-50">
          {vista && !quitar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={vista} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs text-tinta-suave">
              <ImagePlus className="h-6 w-6" aria-hidden />
              {t("imagenVacia")}
            </span>
          )}
        </div>
        <input
          ref={entrada}
          type="file"
          name="imagen"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const campo = e.currentTarget;
            const archivo = campo.files?.[0];
            if (!archivo) return;
            setQuitar(false);
            setVista(URL.createObjectURL(archivo));
            try {
              const r = await comprimirImagen(archivo, LADO_MAXIMO_PRODUCTO);
              if (!r.seComprimio) return;
              const dt = new DataTransfer();
              dt.items.add(r.archivo);
              campo.files = dt.files;
              setVista(URL.createObjectURL(r.archivo));
            } catch (fallo) {
              /* Si comprimir falla, se sube el original: subir lento es mejor que no subir. */
              console.error("[banner] no se pudo comprimir:", fallo);
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
          >
            {t("imagenCambiar")}
          </button>
          {banner?.imagenUrl ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                name="quitarImagen"
                type="checkbox"
                checked={quitar}
                onChange={(e) => setQuitar(e.target.checked)}
                className="h-4 w-4 rounded border-borde"
              />
              {t("quitarImagen")}
            </label>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-lg bg-riel-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-riel-800 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {guardando ? t("guardando") : t("guardar")}
        </button>
      </div>
    </FormularioPersistente>
  );
}
