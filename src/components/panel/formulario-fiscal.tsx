"use client";

import { CheckCircle2, FileText, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Campo } from "@/components/ui/campo";
import { FormularioPersistente } from "@/components/ui/formulario-persistente";
import { guardarFormularioFiscal } from "@/lib/fiscal/acciones";
import { PAISES } from "@/lib/fiscal/paises";
import { TIPOS_DE_ENTIDAD } from "@/lib/fiscal/w8bene";

/**
 * EL FORMULARIO FISCAL, EN ESPAÑOL Y EN UNA PANTALLA.
 *
 * ══ POR QUÉ ESTO Y NO «BÁJATE EL PDF» ══
 *
 * Es lo que hacen Google, YouTube y Facebook con quien cobra desde fuera de
 * Estados Unidos: unos campos, una firma, y sale el documento lleno. La
 * alternativa —bajar un PDF en inglés, imprimirlo, firmarlo, escanearlo y
 * mandarlo por correo— la abandona la mayoría, y con ella se les queda el
 * dinero parado sin que nadie sepa por qué.
 *
 * ══ LO QUE MÁS TRANQUILIZA ESTÁ ARRIBA, NO ABAJO ══
 *
 * «Esto no se manda al IRS» va antes del primer campo. Mucha gente cree que
 * está declarando impuestos en Estados Unidos y abandona ahí mismo; decirlo
 * después de que llenó doce casillas no sirve de nada.
 */
export function FormularioFiscal({
  paisPorDefecto,
  yaFirmado,
}: {
  paisPorDefecto?: string | null;
  yaFirmado?: boolean;
}) {
  const t = useTranslations("panel.fiscal");
  const [estado, accion, guardando] = useActionState(
    guardarFormularioFiscal,
    null,
  );

  return (
    <FormularioPersistente llave="formulario-fiscal" action={accion}>
      <div className="bg-riel-50 rounded-lg px-3 py-2.5 text-sm text-riel-700">
        <p className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("noSeManda")}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo
            tipo="razonSocial"
            nombre="nombreLegal"
            etiqueta={t("campos.nombreLegal")}
            ayuda={t("campos.nombreLegalAyuda")}
            requerido
          />
        </div>

        <label className="block text-sm">
          <span className="font-medium text-riel-800">
            {t("campos.paisConstitucion")}
          </span>
          {/**
           * UNA LISTA, NO UNA CASILLA LIBRE — Y SIN ESTADOS UNIDOS.
           *
           * La casilla libre dejó guardado «COUNTRY OF INCORPORATION: ESTADOS
           * UNIDOS» en un formulario cuyo propósito entero es declarar lo
           * contrario. Y no fue por escribirlo a mano: el `maxLength` de dos
           * letras lo saltó el **autocompletado del navegador**, que también
           * metió «ESTADOSUNIDOS» en el número fiscal.
           *
           * La lista no lleva Estados Unidos **ni sus territorios** (Puerto
           * Rico, Guam, Islas Vírgenes, Samoa, Marianas): para el IRS todos son
           * «U.S. person» y les toca el W-9. Quitar solo «Estados Unidos» deja
           * pasar Puerto Rico, que es el mismo error con otro nombre.
           *
           * El candado de verdad está en el SERVIDOR: esto se salta con la
           * consola.
           */}
          <select
            name="paisConstitucion"
            defaultValue={paisPorDefecto ?? ""}
            required
            autoComplete="off"
            className="mt-1 h-9 w-full rounded-lg border border-borde px-2"
          >
            <option value="">{t("campos.eligePais")}</option>
            {PAISES.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
          <span className="text-riel-600 mt-1 block text-xs">
            {t("campos.paisAyuda")}
          </span>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-riel-800">
            {t("campos.tipoEntidad")}
          </span>
          <select
            name="tipoEntidad"
            required
            defaultValue="corporacion"
            className="mt-1 h-9 w-full rounded-lg border border-borde px-2"
          >
            {TIPOS_DE_ENTIDAD.map((tipo) => (
              <option key={tipo} value={tipo}>
                {t(`tipos.${tipo}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <Campo
            tipo="direccion"
            nombre="direccion"
            etiqueta={t("campos.direccion")}
            ayuda={t("campos.direccionAyuda")}
            requerido
          />
        </div>

        <Campo
          tipo="ciudad"
          nombre="ciudad"
          etiqueta={t("campos.ciudad")}
          requerido
        />
        <Campo
          tipo="textoCorto"
          nombre="region"
          etiqueta={t("campos.region")}
        />
        <Campo
          tipo="alfanumerico"
          nombre="codigoPostal"
          etiqueta={t("campos.codigoPostal")}
        />
        {/* `autoComplete="off"`: el navegador rellenó este campo con
            «ESTADOSUNIDOS», que no es el número fiscal de nadie. En un
            formulario que se firma bajo pena de perjurio, un dato que puso el
            navegador y nadie miró es justo lo que no puede pasar. */}
        <Campo
          tipo="identificacionFiscal"
          nombre="identificacionFiscal"
          etiqueta={t("campos.identificacionFiscal")}
          ayuda={t("campos.identificacionAyuda")}
          autoComplete="off"
        />
      </div>

      <div className="mt-6 border-t border-borde pt-4">
        <h3 className="font-semibold text-riel-900">{t("firma.titulo")}</h3>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Campo
            tipo="nombrePersona"
            nombre="firmanteNombre"
            etiqueta={t("firma.nombre")}
            requerido
          />
          <Campo
            tipo="textoCorto"
            nombre="firmanteCargo"
            etiqueta={t("firma.cargo")}
            ayuda={t("firma.cargoAyuda")}
            requerido
          />
        </div>

        {/* LA DECLARACIÓN VA A LA VISTA, ENTERA Y ANTES DE LA CASILLA.
            Es una declaración bajo pena de perjurio. Esconderla detrás de un
            «acepto los términos» haría que nadie sepa qué está firmando — y
            si algún día hay que demostrar qué aceptó, un enlace no vale. */}
        <p className="bg-riel-50 mt-4 rounded-lg px-3 py-2.5 text-sm text-riel-700">
          {t("firma.declaracion")}
        </p>

        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="firma"
            value="si"
            required
            className="mt-0.5 size-4"
          />
          <span>{t("firma.casilla")}</span>
        </label>

        <p className="text-riel-600 mt-2 text-xs">{t("firma.quedaRegistro")}</p>
      </div>

      {estado && !estado.ok ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {/* SE NOMBRAN LOS CAMPOS QUE FALTAN, no un «revisa el formulario»:
                esto lo llena alguien a 900 km que no puede preguntar. */}
            {estado.faltan?.length
              ? t("errores.faltan", {
                  /* Los nombres se traducen con la MISMA clave que dibuja cada
                     etiqueta. Si el aviso dice «Ciudad» y la casilla dice otra
                     cosa, no sirve de nada. */
                  campos: estado.faltan
                    .map((c) => t(`campos.${c}` as never))
                    .join(", "),
                })
              : t(`errores.${estado.motivo ?? "generico"}` as never)}
          </span>
        </p>
      ) : null}

      {estado?.ok ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("guardado")}</span>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={guardando}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-carga-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-carga-600 disabled:opacity-60"
      >
        {guardando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {yaFirmado ? t("botonRehacer") : t("boton")}
      </button>
    </FormularioPersistente>
  );
}
