import { describe, expect, it } from "vitest";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DURACION_MAXIMA_SEGUNDOS,
  duracionCorta,
  duracionIso,
  extensionDeVideo,
  MINIMO_PARA_HILERA,
  repartirHileras,
  revisarVideo,
  slugDeVideo,
  type VideoPublico,
} from "@/lib/videos/reglas";

/**
 * LOS SHORTS DE MERCATREN. Lo que protege esta prueba: el tope de tres
 * minutos (que es lo que pidió el dueño y lo que evita que alguien suba una
 * película), que cada video tenga su dirección propia —para indexarse— y que
 * las hileras no conviertan la portada en una tienda de videos.
 */
const video = (n: number): VideoPublico => ({
  id: `v${n}`,
  slug: `video-${n}`,
  titulo: `Video ${n}`,
  descripcion: null,
  url: `/media/videos/x/${n}.mp4`,
  portadaUrl: null,
  duracionSegundos: 30,
  tiendaNombre: "Tienda",
  tiendaSlug: "tienda",
  tiendaId: "tienda",
  vistas: 0,
  creadoEn: null,
});

describe("qué video se acepta", () => {
  const base = {
    tipo: "video/mp4",
    bytes: 10_000_000,
    duracionSegundos: 45,
    titulo: "Mi tienda por dentro",
  };

  it("un video vertical normal, sí", () => {
    expect(revisarVideo(base)).toEqual({ ok: true });
    expect(revisarVideo({ ...base, tipo: "video/quicktime" })).toEqual({
      ok: true,
    });
  });

  it("MÁS DE TRES MINUTOS, NO — es la regla que puso el dueño", () => {
    expect(DURACION_MAXIMA_SEGUNDOS).toBe(180);
    expect(revisarVideo({ ...base, duracionSegundos: 181 })).toEqual({
      ok: false,
      motivo: "muy_largo",
    });
    expect(revisarVideo({ ...base, duracionSegundos: 180 })).toEqual({
      ok: true,
    });
  });

  it("ni un archivo que no es video, ni uno gigante, ni uno sin título", () => {
    expect(revisarVideo({ ...base, tipo: "application/pdf" })).toEqual({
      ok: false,
      motivo: "no_es_video",
    });
    expect(revisarVideo({ ...base, bytes: 500_000_000 })).toEqual({
      ok: false,
      motivo: "muy_pesado",
    });
    expect(revisarVideo({ ...base, titulo: "  " })).toEqual({
      ok: false,
      motivo: "sin_titulo",
    });
    expect(revisarVideo({ ...base, duracionSegundos: 1 })).toEqual({
      ok: false,
      motivo: "muy_corto",
    });
  });

  it("el .mov del iPhone se guarda como .mov, no como .mp4", () => {
    expect(extensionDeVideo("video/quicktime")).toBe("mov");
    expect(extensionDeVideo("video/mp4")).toBe("mp4");
    expect(extensionDeVideo("lo que sea")).toBe("mp4");
  });
});

describe("la dirección de cada video", () => {
  it("sale del título, sin acentos, y lleva un sufijo para no chocar", () => {
    expect(slugDeVideo("Así es mi ferretería por dentro", "a1b2c3")).toBe(
      "asi-es-mi-ferreteria-por-dentro-a1b2c3",
    );
    expect(slugDeVideo("  ¡¡¡  ", "x")).toBe("video-x");
  });
});

describe("las duraciones", () => {
  it("se leen bien en pantalla y en el dato de Google", () => {
    expect(duracionCorta(95)).toBe("1:35");
    expect(duracionCorta(9)).toBe("0:09");
    expect(duracionIso(95)).toBe("PT1M35S");
    expect(duracionIso(45)).toBe("PT45S");
  });
});

describe("las hileras en la portada", () => {
  const productos = Array.from({ length: 40 }, (_, i) => i);

  it("con menos de tres videos NO se dibuja ninguna hilera", () => {
    const r = repartirHileras(productos, [video(1), video(2)], 12, 8);
    expect(r).toHaveLength(1);
    expect(r[0]!.tipo).toBe("productos");
    expect(MINIMO_PARA_HILERA).toBe(3);
  });

  it("nunca abre con videos ni deja una hilera colgando al final", () => {
    const r = repartirHileras(
      productos,
      [video(1), video(2), video(3), video(4)],
      12,
      4,
    );
    expect(r[0]!.tipo).toBe("productos");
    expect(r[r.length - 1]!.tipo).toBe("productos");
    /* Y todos los productos siguen ahí, en orden. */
    const salida = r.flatMap((x) => (x.tipo === "productos" ? x.items : []));
    expect(salida).toEqual(productos);
  });

  it("mete una hilera cada N productos y va rotando cuáles enseña", () => {
    const videos = Array.from({ length: 8 }, (_, i) => video(i + 1));
    const r = repartirHileras(productos, videos, 12, 4);
    const hileras = r.filter((x) => x.tipo === "videos");
    expect(hileras.length).toBeGreaterThanOrEqual(2);
    const primera =
      hileras[0]!.tipo === "videos" ? hileras[0]!.videos.map((v) => v.id) : [];
    const segunda =
      hileras[1]!.tipo === "videos" ? hileras[1]!.videos.map((v) => v.id) : [];
    expect(primera).not.toEqual(segunda);
  });

  it("con pocos productos no se parte nada", () => {
    const r = repartirHileras([1, 2, 3], [video(1), video(2), video(3)], 12, 4);
    expect(r).toEqual([{ tipo: "productos", items: [1, 2, 3] }]);
    expect(repartirHileras([], [video(1)], 12, 4)).toEqual([]);
  });
});

/**
 * QUE SE PUEDA ESCUCHAR (24 ago 2026). El dueño subió videos y no sonaban: la
 * vista previa llevaba `muted` y la lista del panel era una miniatura sin
 * reproductor. Aquí no hay autoplay —la persona pulsa play—, así que el
 * navegador no obliga a silenciar nada.
 */
describe("los videos se pueden escuchar", () => {
  const subir = readFileSync(
    "src/components/panel/videos/subir-video.tsx",
    "utf8",
  );
  const previa = subir.slice(
    subir.indexOf("src={elegido.vistaPrevia}") - 200,
    subir.indexOf("src={elegido.vistaPrevia}") + 400,
  );

  it("la vista previa al subir NO va silenciada y trae los controles", () => {
    expect(previa).toContain("controls");
    expect(
      previa,
      "volvió el `muted` que dejaba la vista previa sin sonido",
    ).not.toMatch(/^\s*muted$/m);
  });

  it("y se le dice a la persona que le dé play", () => {
    expect(subir).toContain('t("dalePlay")');
  });

  it("la lista del panel abre un reproductor de verdad, no una miniatura muda", () => {
    const lista = readFileSync(
      "src/app/[locale]/panel/videos/page.tsx",
      "utf8",
    );
    expect(lista).toContain("<ReproductorVideo");
    const reproductor = readFileSync(
      "src/components/panel/videos/reproductor-video.tsx",
      "utf8",
    );
    expect(reproductor).toContain("controls");
    expect(reproductor).not.toMatch(/^\s*muted$/m);
    /* Y se puede salir: equis, Escape y clic fuera. */
    expect(reproductor).toContain('e.key === "Escape"');
    expect(reproductor).toContain("setAbierto(false)");
  });

  it("el visor público arranca en silencio PERO con su botón de sonido, que es lo que exige el navegador", () => {
    const visor = readFileSync(
      "src/components/videos/visor-videos.tsx",
      "utf8",
    );
    expect(visor).toContain("muted={!sonido}");
    expect(visor).toContain('t("visor.conSonido")');
  });
});

/**
 * LOS SHORTS SE COMPORTAN COMO EN CUALQUIER RED DE VIDEOS (24 ago 2026).
 *
 * Palabras del dueño: *«no inventes la rueda, hágalo igual como funcionan las
 * redes sociales»*. Tres niveles y los tres los elige la persona: el mouse
 * encima mueve el video en la hilera, el clic abre el reproductor con los
 * menús del sitio, y solo el botón de expandir lleva a pantalla completa.
 */
describe("los Shorts, como en YouTube", () => {
  const tarjeta = readFileSync(
    "src/components/videos/tarjeta-video.tsx",
    "utf8",
  );
  const visor = readFileSync("src/components/videos/visor-videos.tsx", "utf8");
  const social = readFileSync(
    "src/components/videos/acciones-social.tsx",
    "utf8",
  );

  it("la tarjeta reproduce al pasar el mouse y se detiene al quitarlo, en silencio", () => {
    expect(tarjeta).toContain("onMouseEnter");
    expect(tarjeta).toContain("onMouseLeave");
    /* Y también con el teclado: quien navega con tabulador ve lo mismo. */
    expect(tarjeta).toContain("onFocus");
    expect(tarjeta).toContain("muted");
    /* Nada se precarga hasta que el mouse entra: ocho videos a la vez se comen
       la conexión de un teléfono. */
    expect(tarjeta).toContain('preload="none"');
  });

  it("la página del video vive en el grupo (visor): menús en escritorio, inmersivo en teléfono", () => {
    /* Historia en dos actos: primero el grupo sin encabezado se tragaba la
       pantalla en escritorio (se quitó); después el encabezado completo tapó
       el botón de la tienda en el teléfono (24 ago 2026, captura del dueño).
       La forma final es el grupo CON encabezado — oculto solo en teléfono. */
    expect(
      existsSync(
        join(process.cwd(), "src/app/[locale]/(visor)/video/[slug]/page.tsx"),
      ),
    ).toBe(true);
    expect(
      existsSync(join(process.cwd(), "src/app/[locale]/(tienda)/video")),
      "la página del video no puede estar duplicada en los dos grupos",
    ).toBe(false);
  });

  it("la pantalla completa es la del navegador y SOLO con el botón de expandir", () => {
    expect(visor).toContain("requestFullscreen");
    expect(visor).toContain("exitFullscreen");
    expect(visor).toContain('t("visor.expandir")');
    /* Y el estado se lee del navegador, no de una variable que se puede
       desincronizar (salir con Escape también cierra). */
    expect(visor).toContain("fullscreenchange");
  });

  it("hay pausa, sonido y flechas de anterior y siguiente", () => {
    for (const clave of [
      "visor.pausar",
      "visor.reanudar",
      "visor.conSonido",
      "visor.anterior",
      "visor.siguiente",
    ]) {
      expect(visor, `falta ${clave}`).toContain(`t("${clave}")`);
    }
  });

  it("corazón, comentarios y compartir, con el número que sube al momento", () => {
    expect(social).toContain("alternarCorazon");
    expect(social).toContain("comentarVideo");
    expect(social).toContain("navigator.share");
    /* El corazón se pinta antes de que conteste el servidor y se corrige si
       dice que no: esperar el viaje de red se siente roto. */
    expect(social).toContain("setCorazones(antes.corazones)");
  });

  it("y quien no entró ve el botón igual, con la invitación a entrar", () => {
    expect(social).toContain("hayQueEntrar");
    const acciones = readFileSync("src/lib/videos/social-acciones.ts", "utf8");
    expect(acciones).toContain('t("videos.entraParaCorazon")');
    expect(acciones).toContain('t("videos.entraParaComentar")');
  });

  it("un comentario se oculta, no se borra: el rastro tiene que existir", () => {
    const acciones = readFileSync("src/lib/videos/social-acciones.ts", "utf8");
    expect(acciones).toContain('set({ estado: "oculto" })');
    expect(acciones).not.toContain("delete(comentariosVideo)");
  });
});

describe("el contador de vistas y el reproductor profesional (24 ago 2026)", () => {
  it("formatea como las redes: corto y en el idioma de quien mira", async () => {
    const { formatearVistas } = await import("@/lib/videos/reglas");
    expect(formatearVistas(0, "es")).toBe("0");
    expect(formatearVistas(999, "es")).toBe("999");
    /* En miles ya se abrevia — el texto exacto lo decide Intl, aquí solo se
       exige que NO salga el número largo. */
    expect(formatearVistas(1234, "es")).not.toBe("1234");
    expect(formatearVistas(1234, "en")).toMatch(/K/);
    expect(formatearVistas(-5, "es")).toBe("0");
  });

  it("la vista se cuenta al MIRAR (2 segundos), una vez por sesión", async () => {
    const { readFileSync } = await import("node:fs");
    const visor = readFileSync(
      "src/components/videos/visor-videos.tsx",
      "utf8",
    );
    expect(visor).toContain("}, 2000);");
    expect(visor).toContain("sessionStorage.getItem(llave)");
    expect(visor).toContain("registrarVistaDeVideo");
  });

  it("la ventana de precarga: src solo cerca, auto para el actual y el siguiente", async () => {
    const { readFileSync } = await import("node:fs");
    const visor = readFileSync(
      "src/components/videos/visor-videos.tsx",
      "utf8",
    );
    /* Es lo que quita el tirón al pasar de video Y lo que aguanta diez mil:
       lejos del que se mira no se descarga ni un byte. */
    expect(visor).toContain(
      "i >= actual - 1 && i <= actual + 2 ? v.url : undefined",
    );
    expect(visor).toContain('preload={i <= actual + 1 ? "auto" : "metadata"}');
  });

  it("en el teléfono el visor es la pantalla: el encabezado queda para escritorio", async () => {
    const { readFileSync } = await import("node:fs");
    const layout = readFileSync("src/app/[locale]/(visor)/layout.tsx", "utf8");
    /* El dueño lo pidió con la captura delante: el buscador tapaba el botón
       de la tienda. Oculto en el teléfono, intacto en escritorio. */
    expect(layout).toContain('<div className="hidden sm:block">');
    expect(layout).toContain("<Encabezado />");
    /* Y el rastro se queda: la flecha de volver lo necesita. */
    expect(layout).toContain("<RastroDeNavegacion />");
  });

  it("contar una vista comprueba que el video esté publicado", async () => {
    const { readFileSync } = await import("node:fs");
    const acciones = readFileSync("src/lib/videos/social-acciones.ts", "utf8");
    expect(acciones).toContain('eq(videosTienda.estado, "publicado")');
  });
});

describe("el video se encoge en el navegador antes de subirse (24 ago 2026)", () => {
  it("haceFaltaComprimir: pesado sí, liviano en mp4 no, liviano en mov sí (por el índice)", async () => {
    const { haceFaltaComprimir, UMBRAL_BITS_POR_SEGUNDO } =
      await import("@/lib/videos/comprimir-video");
    /* El caso real medido: 61,8 MB por 34 s = 14,5 Mbps. */
    expect(haceFaltaComprimir(61_803_614, 34, "video.mov")).toBe(true);
    /* Un mp4 ya eficiente se sube tal cual. */
    expect(haceFaltaComprimir(10_000_000, 30, "video.mp4")).toBe(false);
    /* Un mov liviano se reempaqueta igual: el índice viene al final. */
    expect(haceFaltaComprimir(10_000_000, 30, "video.mov")).toBe(true);
    expect(UMBRAL_BITS_POR_SEGUNDO).toBe(3_500_000);
  });

  it("las reglas de las fotos, en el código: fallo → original, nunca agrandar, carga diferida", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/videos/comprimir-video.ts", "utf8");
    expect(fuente).toContain('await import("mediabunny")');
    expect(fuente).toContain("return { archivo, comprimido: false };");
    /* Si salió más pesado, gana el original. */
    expect(fuente).toContain("buffer.byteLength >= archivo.size");
    /* Y el índice adelante, que es lo que hace que arranque al toque. */
    expect(fuente).toContain('fastStart: "in-memory"');
  });

  it("aligerar un video ya subido usa clave NUEVA: el viejo vive un año en la caché del borde", async () => {
    const { readFileSync } = await import("node:fs");
    const acciones = readFileSync("src/lib/videos/acciones.ts", "utf8");
    const i = acciones.indexOf("reemplazarArchivoDeVideo");
    expect(i).toBeGreaterThan(0);
    const trozo = acciones.slice(i);
    expect(trozo).toContain("nanoid()");
    expect(trozo).toContain("archivo.size >= video.pesoBytes");
    expect(trozo).toContain("BUCKET.delete(video.clave)");
  });
});
