import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  cuerpoDelAlta,
  faltaEnTienda,
  urlMiTienda,
  type DatosTienda,
} from "../../app-movil/src/lib/tienda";
import { reglasDeCachePublica } from "@/lib/trafico/cache-del-borde";

/**
 * CREAR LA TIENDA DESDE LA APP (5 nov 2026). Lo que no puede pasar sin que
 * esto se ponga en rojo: que la app tenga un alta distinta de la web, que el
 * dueño salga del cuerpo y no de la sesión, que «mi tienda» se guarde en el
 * borde, que se abra una tienda en un país apagado, que cada intento fallido
 * deje una firma de más, o que el inicio vacío vuelva a ser una pantalla en
 * blanco (Gerencia: una app vacía no pasa ninguna tienda).
 */
const leer = (r: string) => readFileSync(r, "utf-8");
const RUTA = "src/app/datos/app/mi/tienda/route.ts";

const LLENO: DatosTienda = {
  nombre: "Tienda",
  razonSocial: "Empresa LLC",
  identificacionFiscal: "000000000",
  correoContacto: "contacto@ejemplo.com",
  telefono: "0000000000",
  direccion: "Dirección 1",
  ciudad: "Ciudad",
  paisOrigen: "US",
  descripcionEs: "",
};

describe("la puerta «mi tienda» del servidor", () => {
  const ruta = leer(RUTA);

  it("usa la MISMA alta de la web, firmada desde la app", () => {
    expect(ruta).toContain("darDeAltaComercio({");
    expect(ruta).toContain('contexto: "alta-comercio-app"');
  });

  it("el dueño sale de la sesión, nunca del cuerpo", () => {
    expect(ruta).toContain("const usuario = await obtenerUsuario()");
    /* El formulario no trae ningún dueño, y la búsqueda usa el de la sesión. */
    expect(ruta).not.toMatch(/(propietarioId|usuarioId|userId)\s*:\s*z\./);
    expect(ruta).toContain(".where(eq(tiendas.propietarioId, usuario.id))");
    expect(ruta).toMatch(/darDeAltaComercio\(\{\s*usuario,/);
    expect(ruta).toContain('respuestaDeError("sin_sesion", 401)');
  });

  it("una tienda solo nace en un país encendido", () => {
    expect(ruta).toContain(
      "if (!PAISES_ENCENDIDOS.includes(contexto.mercado.codigo)) {",
    );
  });

  it("es privada: sin caché y fuera de la parte que se guarda en el borde", () => {
    expect(ruta).toContain('"Cache-Control": "private, no-store"');
    const publicas = reglasDeCachePublica().map((r) => r.source);
    expect(publicas.some((s) => s.startsWith("/datos/app/mi"))).toBe(false);
    expect(
      publicas.some((s) => s === "/datos/app/:ruta*" || s === "/datos/:ruta*"),
    ).toBe(false);
  });
});

describe("la firma de los términos", () => {
  it("se graba en la misma escritura que la tienda, no antes de revisar los datos", () => {
    const alta = leer("src/lib/tiendas/alta.ts");
    const grupo = alta.indexOf("await db.batch([");
    const firma = alta.indexOf("db.insert(aceptaciones)");
    expect(grupo).toBeGreaterThan(-1);
    expect(firma).toBeGreaterThan(grupo);
    expect(alta).not.toContain("await db.insert(aceptaciones)");
  });
});

describe("el formulario de la app", () => {
  it("dice lo primero que falta, en el orden de la pantalla", () => {
    expect(faltaEnTienda({ ...LLENO, nombre: "A" }, true)).toBe(
      "faltaNombreTienda",
    );
    expect(faltaEnTienda({ ...LLENO, razonSocial: "" }, true)).toBe(
      "faltaRazonSocial",
    );
    expect(faltaEnTienda({ ...LLENO, identificacionFiscal: " " }, true)).toBe(
      "faltaDocumento",
    );
    expect(faltaEnTienda({ ...LLENO, correoContacto: "x@" }, true)).toBe(
      "faltaCorreo",
    );
    expect(faltaEnTienda({ ...LLENO, telefono: "123" }, true)).toBe(
      "faltaTelefono",
    );
    expect(faltaEnTienda({ ...LLENO, paisOrigen: "" }, true)).toBe(
      "faltaPaisOrigen",
    );
    expect(faltaEnTienda(LLENO, false)).toBe("faltaTerminos");
    expect(faltaEnTienda(LLENO, true)).toBeNull();
  });

  it("manda los datos limpios y la firma como sí o no", () => {
    const cuerpo = cuerpoDelAlta(
      {
        ...LLENO,
        correoContacto: " Contacto@Ejemplo.com ",
        descripcionEs: " ",
      },
      true,
    );
    expect(cuerpo.correoContacto).toBe("contacto@ejemplo.com");
    expect(cuerpo.descripcionEs).toBeUndefined();
    expect(cuerpo.aceptaTerminos).toBe(true);
    expect(urlMiTienda("US", "es")).toBe(
      "https://mercatren.com/datos/app/mi/tienda?pais=US&idioma=es",
    );
  });

  it("el borrador de la tienda es de su dueño (la llave lleva la cuenta)", () => {
    expect(leer("app-movil/src/app/crear-tienda.tsx")).toMatch(
      /useBorrador\(\s*"crear-tienda",\s*sesion\?\.user\?\.id,\s*d,/,
    );
  });
});

describe("el inicio nunca es una pantalla en blanco", () => {
  it("sin productos, invita a abrir una tienda", () => {
    const inicio = leer("app-movil/src/app/(tabs)/index.tsx");
    expect(inicio).toContain(
      "alVaciar={<PortadaVender pais={pais} idioma={idioma} />}",
    );
    expect(leer("app-movil/src/components/rejilla-catalogo.tsx")).toContain(
      "alVaciar ??",
    );
  });
});
