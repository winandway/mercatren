// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { casillaCercana } from "@/components/comun/boton-camara";
import { entregarAlInput, esCelular, motivoDelFallo } from "@/lib/camara";

/**
 * ══ TODA SUBIDA DE IMAGEN OFRECE LA CÁMARA (regla global, 9 nov 2026) ══
 *
 * Una casilla de imagen sin «Tomar foto» es un trabajo sin terminar. Este
 * candado recorre TODO el sitio y se pone en rojo si una queda sin el botón.
 */
const raiz = join(__dirname, "..", "..");

function archivosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return archivosTsx(ruta);
    return n.endsWith(".tsx") ? [ruta] : [];
  });
}

/** Las casillas `<input type="file">` que aceptan imágenes, sin las de `capture`. */
function casillasDeImagen(codigo: string): number {
  const casillas = codigo.match(/<input\b[^>]*?type="file"[\s\S]*?\/>/g) ?? [];
  return casillas.filter((c) => {
    const acepta = /accept=["{]([^"}]*)/.exec(c)?.[1] ?? "";
    return /image/.test(acepta) && !/\bcapture=/.test(c);
  }).length;
}

describe("toda casilla de imagen del sitio tiene «Tomar foto»", () => {
  const archivos = archivosTsx(join(raiz, "src"))
    .map((ruta) => ({ ruta, codigo: readFileSync(ruta, "utf8") }))
    .filter((a) => casillasDeImagen(a.codigo) > 0);

  it("hay casillas de imagen que revisar (el candado no está ciego)", () => {
    expect(archivos.length).toBeGreaterThanOrEqual(15);
  });

  it.each(archivos.map((a) => [relative(raiz, a.ruta), a.codigo]))(
    "%s",
    (_ruta, codigo) => {
      const botones = (codigo.match(/<BotonCamara\b/g) ?? []).length;
      expect(botones).toBeGreaterThanOrEqual(1);
    },
  );

  it("el detector sí ve una casilla sin botón", () => {
    expect(casillasDeImagen('<input type="file" accept="image/*" />')).toBe(1);
    expect(casillasDeImagen('<input type="file" accept="video/*" />')).toBe(0);
  });
});

describe("la foto entra en la casilla de siempre", () => {
  function conDataTransfer() {
    class DT {
      archivos: File[] = [];
      items = { add: (f: File) => this.archivos.push(f) };
      get files() {
        return this.archivos as unknown as FileList;
      }
    }
    vi.stubGlobal("DataTransfer", DT);
  }

  it("pone la foto y dispara el cambio, como si se hubiera elegido a mano", () => {
    conDataTransfer();
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { writable: true, value: null });
    const cambio = vi.fn();
    input.addEventListener("change", cambio);
    const foto = new File(["x"], "foto.jpg", { type: "image/jpeg" });
    expect(entregarAlInput(input, foto)).toBe(true);
    expect(input.files?.[0]).toBe(foto);
    expect(cambio).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("en una casilla de varias fotos suma la nueva sin perder las anteriores", () => {
    conDataTransfer();
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    const vieja = new File(["a"], "a.jpg");
    Object.defineProperty(input, "files", {
      writable: true,
      value: [vieja] as unknown as FileList,
    });
    const nueva = new File(["b"], "b.jpg");
    entregarAlInput(input, nueva);
    expect(Array.from(input.files ?? [])).toEqual([vieja, nueva]);
    vi.unstubAllGlobals();
  });

  it("sin casilla dice que no pudo", () => {
    expect(entregarAlInput(null, new File(["x"], "x.jpg"))).toBe(false);
  });

  it("encuentra la casilla de imagen más cercana al botón", () => {
    document.body.innerHTML = `
      <div><input type="file" accept="video/*" id="video" />
        <div><label><input type="file" accept="image/*" id="foto" /></label>
          <button id="b">Tomar foto</button></div></div>`;
    const boton = document.getElementById("b");
    expect(casillaCercana(boton)?.id).toBe("foto");
  });
});

describe("sin cámara o sin permiso, se dice en palabras", () => {
  it("permiso negado", () => {
    expect(motivoDelFallo({ name: "NotAllowedError" })).toBe("sinPermiso");
  });
  it("sin cámara", () => {
    expect(motivoDelFallo({ name: "NotFoundError" })).toBe("sinCamara");
    expect(motivoDelFallo(null)).toBe("sinCamara");
  });
  it("los textos existen en los dos idiomas", () => {
    for (const idioma of ["es", "en"]) {
      const m = JSON.parse(
        readFileSync(join(raiz, "messages", `${idioma}.json`), "utf8"),
      ) as { camara: Record<string, string> };
      for (const clave of [
        "tomarFoto",
        "sinCamara",
        "sinPermiso",
        "capturar",
      ]) {
        expect(m.camara[clave]).toBeTruthy();
      }
    }
  });
});

describe("en el celular se usa la cámara del aparato", () => {
  it("reconoce celulares y el iPad que se hace pasar por Mac", () => {
    expect(esCelular({ userAgent: "iPhone", maxTouchPoints: 5 })).toBe(true);
    expect(esCelular({ userAgent: "Android Mobile", maxTouchPoints: 5 })).toBe(
      true,
    );
    expect(esCelular({ userAgent: "Macintosh", maxTouchPoints: 5 })).toBe(true);
    expect(esCelular({ userAgent: "Macintosh", maxTouchPoints: 0 })).toBe(
      false,
    );
    expect(esCelular({ userAgent: "Windows NT", maxTouchPoints: 0 })).toBe(
      false,
    );
  });
});
