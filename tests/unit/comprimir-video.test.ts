import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * EL COMPRESOR DE VIDEO, CON EL CONVERSOR SIMULADO.
 *
 * La conversión real usa WebCodecs, que no existe en Node: aquí se simula
 * `mediabunny` para probar las DECISIONES del compresor, que es donde están
 * las reglas — el perfil de salida, «si falla se sube el original», «nunca
 * empeorar» y «nunca agrandar». La conversión de verdad se comprobó aparte,
 * con un navegador real: un .mov de 13 MB a 14 Mbps quedó en 2,74 MB a
 * 2,84 Mbps con el índice en el byte 32.
 */
const estadoDelFalso = {
  buffer: null as ArrayBuffer | null,
  fallarAlIniciar: false,
  opcionesVideo: null as Record<string, unknown> | null,
  ancho: 1080,
  alto: 1920,
};

vi.mock("mediabunny", () => ({
  ALL_FORMATS: [],
  BlobSource: class {},
  BufferTarget: class {
    buffer: ArrayBuffer | null = null;
  },
  Mp4OutputFormat: class {
    constructor(public opciones: { fastStart: string }) {}
  },
  Input: class {
    async getPrimaryVideoTrack() {
      return {
        displayWidth: estadoDelFalso.ancho,
        displayHeight: estadoDelFalso.alto,
      };
    }
  },
  Output: class {
    target = { buffer: null as ArrayBuffer | null };
    constructor(public opciones: unknown) {}
  },
  Conversion: {
    init: async (opciones: {
      output: { target: { buffer: ArrayBuffer | null } };
      video: Record<string, unknown>;
    }) => {
      if (estadoDelFalso.fallarAlIniciar) throw new Error("codec raro");
      estadoDelFalso.opcionesVideo = opciones.video;
      return {
        onProgress: undefined as ((p: number) => void) | undefined,
        async execute() {
          opciones.output.target.buffer = estadoDelFalso.buffer;
        },
      };
    },
  },
}));

function archivoPesado(nombre = "video.mov", bytes = 61_803_614): File {
  /* No hace falta el contenido real: las decisiones van por peso y nombre. */
  const f = new File(["x"], nombre, { type: "video/quicktime" });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

afterEach(() => {
  estadoDelFalso.buffer = null;
  estadoDelFalso.fallarAlIniciar = false;
  estadoDelFalso.opcionesVideo = null;
  estadoDelFalso.ancho = 1080;
  estadoDelFalso.alto = 1920;
  vi.unstubAllGlobals();
});

describe("comprimirVideo", () => {
  it("sin WebCodecs se sube el original: subir pesado es mejor que no poder subir", async () => {
    const { comprimirVideo } = await import("@/lib/videos/comprimir-video");
    const original = archivoPesado();
    const r = await comprimirVideo(original, 34);
    expect(r.comprimido).toBe(false);
    expect(r.archivo).toBe(original);
  });

  it("comprime al perfil de las redes y sale .mp4", async () => {
    vi.stubGlobal("VideoEncoder", class {});
    estadoDelFalso.buffer = new ArrayBuffer(2_800_000);
    const { comprimirVideo, BITRATE_VIDEO, CUADROS_POR_SEGUNDO } =
      await import("@/lib/videos/comprimir-video");
    const avances: number[] = [];
    const r = await comprimirVideo(archivoPesado(), 34, (p) => avances.push(p));
    expect(r.comprimido).toBe(true);
    expect(r.archivo.name).toBe("video.mp4");
    expect(r.archivo.type).toBe("video/mp4");
    /* 1080×1920 se baja a 720×1280; el perfil es el de las redes. */
    expect(r.ancho).toBe(720);
    expect(r.alto).toBe(1280);
    expect(estadoDelFalso.opcionesVideo).toMatchObject({
      codec: "avc",
      bitrate: BITRATE_VIDEO,
      frameRate: CUADROS_POR_SEGUNDO,
    });
  });

  it("nunca se agranda: un video más chico que 720p conserva su tamaño", async () => {
    vi.stubGlobal("VideoEncoder", class {});
    estadoDelFalso.buffer = new ArrayBuffer(1_000_000);
    estadoDelFalso.ancho = 640;
    estadoDelFalso.alto = 360;
    const { comprimirVideo } = await import("@/lib/videos/comprimir-video");
    const r = await comprimirVideo(archivoPesado(), 34);
    expect(r.comprimido).toBe(true);
    expect(estadoDelFalso.opcionesVideo).not.toHaveProperty("width");
    expect(r.ancho).toBe(640);
  });

  it("si salió MÁS pesado, gana el original: comprimir jamás puede empeorar", async () => {
    vi.stubGlobal("VideoEncoder", class {});
    estadoDelFalso.buffer = new ArrayBuffer(70_000_000);
    const { comprimirVideo } = await import("@/lib/videos/comprimir-video");
    const original = archivoPesado();
    const r = await comprimirVideo(original, 34);
    expect(r.comprimido).toBe(false);
    expect(r.archivo).toBe(original);
  });

  it("si el conversor revienta, se sube el original — la misma regla de las fotos", async () => {
    vi.stubGlobal("VideoEncoder", class {});
    estadoDelFalso.fallarAlIniciar = true;
    const { comprimirVideo } = await import("@/lib/videos/comprimir-video");
    const original = archivoPesado();
    const r = await comprimirVideo(original, 34);
    expect(r.comprimido).toBe(false);
    expect(r.archivo).toBe(original);
  });

  it("un buffer vacío tampoco reemplaza nada", async () => {
    vi.stubGlobal("VideoEncoder", class {});
    estadoDelFalso.buffer = new ArrayBuffer(0);
    const { comprimirVideo } = await import("@/lib/videos/comprimir-video");
    const r = await comprimirVideo(archivoPesado(), 34);
    expect(r.comprimido).toBe(false);
  });
});
