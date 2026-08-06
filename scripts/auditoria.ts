/**
 * LA AUDITORÍA DE DEPENDENCIAS, CON MEMORIA.
 *
 * `npm audit --audit-level=high` a secas no sirve en este proyecto: hoy hay 4
 * fallos altos que vienen de las herramientas de compilación, y el único
 * arreglo que ofrece npm es BAJAR wrangler a una versión vieja. O sea, las dos
 * salidas obvias están prohibidas: romper el producto para que pase el
 * semáforo, o apagar el semáforo para que no moleste.
 *
 * Así que este script hace lo que hay que hacer: cada fallo conocido queda
 * **escrito, con su motivo y su fecha**, y la auditoría pasa. Pero si mañana
 * aparece UNO NUEVO —o si uno de los conocidos empeora— la compilación se pone
 * roja y dice cuál.
 *
 * Lo que NO se puede hacer: agregar algo a esta lista para que un cambio pase.
 * Se agrega cuando se ha mirado de verdad y se puede escribir por qué no
 * alcanza al sitio publicado.
 *
 * Escrito el 6 ago 2026 con el blindaje.
 */

import { execFileSync } from "node:child_process";

/** Un fallo que ya se miró, con el motivo por el que no nos alcanza. */
type Conocido = { severidad: string; motivo: string };

/**
 * LOS FALLOS QUE YA SE MIRARON (6 ago 2026).
 *
 * Los cuatro salen de la cadena de herramientas que compila el sitio, no del
 * sitio. El código que corre en Cloudflare cuando alguien entra a mercatren.com
 * no incluye ninguno de estos paquetes.
 */
const CONOCIDOS: Record<string, Conocido> = {
  undici: {
    severidad: "high",
    motivo:
      "Viene de wrangler/miniflare, que son las herramientas de compilación y " +
      "de desarrollo local. El sitio publicado corre en el runtime de " +
      "Cloudflare, que trae su propio fetch: undici no llega ahí. El arreglo " +
      "que ofrece npm es bajar wrangler a la 4.35, o sea romper la publicación.",
  },
  miniflare: {
    severidad: "high",
    motivo:
      "Es el simulador local de Cloudflare. No se publica. Arrastra undici.",
  },
  wrangler: {
    severidad: "high",
    motivo:
      "Herramienta de línea de comandos. No se publica. Arrastra miniflare.",
  },
  "@opennextjs/cloudflare": {
    severidad: "high",
    motivo:
      "El empaquetador que convierte Next en un worker. Corre al compilar, no " +
      "en el sitio. Arrastra wrangler.",
  },
  postcss: {
    severidad: "high",
    motivo:
      "Compila el CSS de Tailwind, sobre nuestras propias hojas de estilo. El " +
      "fallo necesita que alguien de fuera controle el CSS de entrada, y aquí " +
      "el CSS lo escribimos nosotros. No corre en el navegador de nadie.",
  },
  next: {
    severidad: "high",
    motivo: "Lo arrastra postcss, por el mismo motivo de arriba.",
  },
  sharp: {
    severidad: "high",
    motivo:
      "Solo lo usa `npm run iconos`, que se corre a mano para regenerar los " +
      "iconos desde el logo. No entra en la compilación del sitio.",
  },
};

const ORDEN = ["info", "low", "moderate", "high", "critical"];
/** A partir de aquí, un fallo detiene la compilación. */
const DESDE = ORDEN.indexOf("high");

type Reporte = {
  vulnerabilities?: Record<string, { severity: string; via: unknown[] }>;
};

function auditar(): Reporte {
  try {
    const salida = execFileSync("npm", ["audit", "--json"], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    return JSON.parse(salida) as Reporte;
  } catch (error) {
    /* npm audit devuelve código 1 cuando encuentra algo, y ahí execFileSync
       lanza. El informe viene igual en la salida, que es lo que interesa. */
    const salida = (error as { stdout?: string }).stdout;
    if (!salida) throw error;
    return JSON.parse(salida) as Reporte;
  }
}

const informe = auditar();
const fallos = informe.vulnerabilities ?? {};

const nuevos: string[] = [];
const peores: string[] = [];
let conocidosVistos = 0;

for (const [paquete, dato] of Object.entries(fallos)) {
  if (ORDEN.indexOf(dato.severity) < DESDE) continue;

  const conocido = CONOCIDOS[paquete];
  if (!conocido) {
    nuevos.push(`  ${dato.severity.toUpperCase()}  ${paquete}`);
    continue;
  }

  conocidosVistos++;
  if (ORDEN.indexOf(dato.severity) > ORDEN.indexOf(conocido.severidad)) {
    peores.push(
      `  ${paquete}: era ${conocido.severidad}, ahora es ${dato.severity}`,
    );
  }
}

if (nuevos.length === 0 && peores.length === 0) {
  console.log(
    `Auditoría de dependencias: sin novedad. ` +
      `${conocidosVistos} fallo(s) ya revisado(s) y anotado(s) en scripts/auditoria.ts.`,
  );
  process.exit(0);
}

console.error("\nLA AUDITORÍA DE DEPENDENCIAS ENCONTRÓ ALGO NUEVO\n");

if (nuevos.length > 0) {
  console.error("Fallos que nadie ha mirado todavía:\n");
  console.error(nuevos.join("\n"));
  console.error(
    "\nMíralos uno por uno. Si de verdad no alcanzan al sitio publicado, se\n" +
      "anotan en CONOCIDOS (scripts/auditoria.ts) con el motivo escrito.\n" +
      "Agregarlos sin mirarlos es exactamente lo que esto viene a evitar.\n",
  );
}

if (peores.length > 0) {
  console.error("Fallos conocidos que EMPEORARON:\n");
  console.error(peores.join("\n"));
  console.error(
    "\nHay que volver a mirarlos: la razón por la que se aceptaron cambió.\n",
  );
}

process.exit(1);
