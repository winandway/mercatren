import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  firmaValida,
  firmarRuta,
  secretoDeFirma,
  VIGENCIA_S,
} from "@/lib/media/firma";
import { MEDIA_PRIVADOS } from "@/lib/media/privados";
import {
  MAX_ADJUNTOS,
  MAX_BYTES,
  nombreLimpio,
  revisarAdjuntos,
  tipoDe,
} from "@/lib/soporte/adjuntos";
import { ticketParaGerente } from "@/lib/soporte/casos";

/**
 * LAS CAPTURAS DE LOS CASOS DE AYUDA (1 nov 2026, pedido de Richard por el
 * gerente de correo): hasta 3 por mensaje, en una carpeta PRIVADA del
 * almacenamiento, y se abren solo con un enlace firmado que vale 8 días.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");
const imagen = (name: string, type: string, size = 1000) => ({
  name,
  type,
  size,
});

describe("qué capturas se aceptan", () => {
  it("hasta 3, de jpg, png, webp o heic, y de 10 MB como mucho", () => {
    expect(revisarAdjuntos([imagen("a.png", "image/png")])).toBeNull();
    expect(
      revisarAdjuntos([1, 2, 3].map((i) => imagen(`${i}.jpg`, "image/jpeg"))),
    ).toBeNull();
    expect(
      revisarAdjuntos(
        [1, 2, 3, 4].map((i) => imagen(`${i}.jpg`, "image/jpeg")),
      ),
    ).toBe("demasiados");
    expect(revisarAdjuntos([imagen("a.pdf", "application/pdf")])).toBe("tipo");
    expect(revisarAdjuntos([imagen("a.png", "image/png", MAX_BYTES + 1)])).toBe(
      "grande",
    );
    expect(revisarAdjuntos([imagen("a.png", "image/png", 0)])).toBe("vacio");
    expect(MAX_ADJUNTOS).toBe(3);
  });

  it("la foto HEIC del iPhone sin tipo se reconoce por la extensión", () => {
    expect(tipoDe("IMG_0001.HEIC", "")).toBe("image/heic");
    expect(tipoDe("foto.heif", "image/heif")).toBe("image/heic");
    expect(tipoDe("x.exe", "")).toBeNull();
  });

  it("el nombre se limpia: sin rutas ni caracteres raros", () => {
    expect(nombreLimpio("C:\\\\Users\\\\x\\\\captura de pantalla.png")).toBe(
      "captura de pantalla.png",
    );
    expect(nombreLimpio("../../etc/passwd")).toBe("passwd");
  });
});

describe("el enlace firmado", () => {
  const ruta = "ayuda/caso-1/aa-123.png";

  it("abre con la firma buena y hasta que vence (8 días)", async () => {
    const ahora = 1_800_000_000;
    const q = new URLSearchParams(await firmarRuta(ruta, "secreto", ahora));
    expect(Number(q.get("vence")) - ahora).toBe(VIGENCIA_S);
    expect(VIGENCIA_S).toBeGreaterThanOrEqual(7 * 24 * 60 * 60);
    expect(
      await firmaValida(
        ruta,
        q.get("vence"),
        q.get("firma"),
        "secreto",
        ahora + 100,
      ),
    ).toBe(true);
    expect(
      await firmaValida(
        ruta,
        q.get("vence"),
        q.get("firma"),
        "secreto",
        ahora + VIGENCIA_S + 1,
      ),
    ).toBe(false);
  });

  it("no abre con otra ruta, otro secreto, firma tocada o sin secreto", async () => {
    const q = new URLSearchParams(await firmarRuta(ruta, "secreto"));
    const [v, f] = [q.get("vence"), q.get("firma")];
    expect(await firmaValida("ayuda/caso-2/otra.png", v, f, "secreto")).toBe(
      false,
    );
    expect(await firmaValida(ruta, v, f, "otro")).toBe(false);
    expect(await firmaValida(ruta, v, `${f}x`, "secreto")).toBe(false);
    expect(await firmaValida(ruta, String(Number(v) + 999), f, "secreto")).toBe(
      false,
    );
    expect(await firmaValida(ruta, v, f, null)).toBe(false);
  });

  it("la llave de firma sale de una variable que el sitio tiene", () => {
    expect(secretoDeFirma({ SINCRONIZAR_LLAVE: " a " })).toBe("a");
    expect(secretoDeFirma({})).toBeNull();
  });
});

describe("la carpeta es privada y solo la abre la firma", () => {
  it("ayuda/ está entre los privados", () => {
    expect(MEDIA_PRIVADOS).toContain("ayuda/");
  });

  it("el servidor de archivos solo acepta la firma para ayuda/", () => {
    const media = leer("src/app/media/[...clave]/route.ts");
    expect(media).toContain('if (!ruta.startsWith("ayuda/")) return false;');
    expect(media).toMatch(
      /esPrivado\(ruta\) &&\s*!\(await conEnlaceFirmado\(peticion, ruta\)\)/,
    );
  });
});

describe("cada mensaje le llega al gerente con sus capturas", () => {
  it("adjuntos: [{nombre, tipo, url}] en el mensaje que toca", () => {
    const t = ticketParaGerente(
      {
        id: "c1",
        nombre: "Ana",
        idioma: "es",
        asunto: "x",
        estado: "abierto",
        creadoEn: new Date(0),
      },
      [
        {
          id: "m1",
          casoId: "c1",
          autor: "cliente",
          texto: "mira",
          creadoEn: new Date(0),
        },
      ],
      new Map([
        [
          "m1",
          [
            {
              nombre: "a.png",
              tipo: "image/png",
              url: "https://mercatren.com/media/ayuda/c1/a.png?vence=1&firma=x",
            },
          ],
        ],
      ]),
    );
    expect(t.mensajes[0]!.adjuntos).toEqual([
      {
        nombre: "a.png",
        tipo: "image/png",
        url: "https://mercatren.com/media/ayuda/c1/a.png?vence=1&firma=x",
      },
    ]);
  });

  it("los enlaces se firman con el dominio del sitio y la carpeta privada", () => {
    const consultas = leer("src/lib/soporte/casos-consultas.ts");
    expect(consultas).toContain(
      "${SITIO.url}/media/${f.clave}?${await firmarRuta(f.clave, secreto)}",
    );
    expect(consultas).toContain(
      "`ayuda/${caso.id}/${id}.${extensionDe(a.tipo)}`",
    );
  });

  it("el chat enseña la miniatura con la ruta relativa: se ve desde los cuatro dominios", () => {
    const pagina = leer(
      "src/app/[locale]/(tienda)/(docs)/support/caso/[codigo]/page.tsx",
    );
    expect(pagina).toContain("src={enEsteDominio(a.url)}");
    expect(pagina).toContain("href={enEsteDominio(a.url)}");
    expect(pagina).not.toMatch(/(src|href)=\{a\.url\}/);
  });
});

describe("lo escrito no se pierde si falla la subida", () => {
  it("el chat borra el borrador y las capturas SOLO con el ok", () => {
    const chat = leer("src/components/ayuda/chat-del-caso.tsx");
    expect(chat).toMatch(
      /if \(r\.ok\) \{\s*olvidarBorrador\(llave\);\s*form\.reset\(\);\s*setCapturas\(\[\]\);/,
    );
    expect(chat).toContain("<FormularioPersistente");
    /* Y en ningún otro sitio: si el envío falla, las capturas se quedan. */
    expect(chat.split("setCapturas([])").length - 1).toBe(1);
    expect(chat.split("olvidarBorrador(llave)").length - 1).toBe(1);
  });
});
