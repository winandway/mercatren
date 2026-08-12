import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  comoJsonLd,
  fichaDeProducto,
  fichaDeTienda,
  migasDePan,
} from "@/lib/seo/datos-estructurados";
import { SOCIEDAD } from "@/lib/sociedad";

const RAIZ = join(import.meta.dirname, "..", "..", "src");

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

const PRODUCTO = {
  slug: "tubo-pvc-2",
  titulo: "Tubo PVC 2 pulgadas",
  descripcion: "Tubo de PVC para aguas blancas.",
  precioCentavos: 1234,
  moneda: "USD",
  existencias: 8,
  controlaExistencias: true,
  sku: "PVC-2",
  marca: "Pavco",
  categoria: "Ferretería",
  imagenes: ["https://mercatren.com/media/uno.jpg"],
};

describe("lo que Google lee de cada ficha", () => {
  it("el precio va en dólares con dos decimales, no en centavos", () => {
    const ficha = fichaDeProducto(PRODUCTO, "es");
    // 1234 centavos son $12.34. Publicar "1234" le diría a Google que el
    // tubo cuesta mil doscientos dólares.
    expect(ficha.offers.price).toBe("12.34");
    expect(ficha.offers.priceCurrency).toBe("USD");
  });

  it("la disponibilidad sigue a las existencias reales", () => {
    expect(fichaDeProducto(PRODUCTO, "es").offers.availability).toContain(
      "InStock",
    );
    expect(
      fichaDeProducto({ ...PRODUCTO, existencias: 0 }, "es").offers
        .availability,
    ).toContain("OutOfStock");
  });

  it("lo que no lleva cuenta de existencias siempre está disponible", () => {
    // El cemento se vende por kilo y su contador está en cero siempre.
    const suelto = { ...PRODUCTO, existencias: 0, controlaExistencias: false };
    expect(fichaDeProducto(suelto, "es").offers.availability).toContain(
      "InStock",
    );
  });

  it("quien vende es la sociedad, no el comercio", () => {
    /* La figura jurídica del negocio: nosotros compramos y revendemos. Poner
       al comercio aquí diría lo contrario de lo que dicen los términos.

       Se compara contra SOCIEDAD y no contra un nombre escrito a mano: el 12
       de agosto de 2026 la sociedad pasó de Windoce, LLC a Mercatren LLC, y
       esta prueba se puso roja por decir el nombre viejo en vez de por haber
       encontrado un fallo. Lo que hay que comprobar es que vendemos NOSOTROS,
       no cómo nos llamamos hoy. */
    const ficha = fichaDeProducto(PRODUCTO, "es");
    expect(ficha.offers.seller.legalName).toBe(SOCIEDAD.nombre);
  });

  it("no inventa campos que no tenemos", () => {
    const pelado = {
      ...PRODUCTO,
      descripcion: null,
      sku: null,
      marca: null,
      categoria: null,
      imagenes: [],
    };
    const ficha = fichaDeProducto(pelado, "es") as Record<string, unknown>;
    for (const campo of ["description", "sku", "brand", "category", "image"]) {
      expect(ficha[campo], `${campo} no debería existir`).toBeUndefined();
    }
  });

  it("la tienda sin ciudad no declara una dirección inventada", () => {
    const sinCiudad = fichaDeTienda(
      {
        slug: "una",
        nombre: "Una tienda",
        descripcion: null,
        ciudad: null,
        telefono: null,
        sitioWeb: null,
        logoUrl: null,
      },
      "es",
    ) as Record<string, unknown>;
    expect(sinCiudad.address).toBeUndefined();
  });

  it("las migas van numeradas desde uno y en orden", () => {
    const migas = migasDePan(
      [
        { nombre: "Mercatren", ruta: "" },
        { nombre: "Catálogo", ruta: "/catalogo" },
      ],
      "es",
    );
    expect(migas.itemListElement.map((m) => m.position)).toEqual([1, 2]);
    expect(migas.itemListElement[1].item).toContain("/es/catalogo");
  });
});

describe("el escape del JSON-LD", () => {
  it("un título con </script> no puede cerrar la etiqueta", () => {
    // El título lo escribe el comercio. Sin escapar, esto sacaría todo lo que
    // viniera después fuera del bloque de datos y dentro del HTML.
    const salida = comoJsonLd(
      fichaDeProducto(
        { ...PRODUCTO, titulo: "</script><img src=x onerror=alert(1)>" },
        "es",
      ),
    );

    expect(salida).not.toContain("</script>");
    expect(salida).not.toContain("<img");
    // Y sigue siendo el mismo dato al leerlo.
    expect(JSON.parse(salida).name).toBe(
      "</script><img src=x onerror=alert(1)>",
    );
  });

  it("ningún JSON-LD del sitio se escribe sin pasar por comoJsonLd", () => {
    const sueltos: string[] = [];

    for (const ruta of archivos(RAIZ)) {
      const codigo = readFileSync(ruta, "utf8");
      if (!codigo.includes("application/ld+json")) continue;
      // Un JSON.stringify dentro de un archivo con JSON-LD es la señal.
      if (/__html:\s*JSON\.stringify/.test(codigo)) sueltos.push(ruta);
    }

    expect(sueltos, sueltos.join("\n")).toEqual([]);
  });
});
