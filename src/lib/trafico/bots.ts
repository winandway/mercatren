/**
 * EL FILTRO DE ROBOTS DEL TRÁFICO — puro, para poder probarlo.
 *
 * ══ CÓMO CUENTAN LAS HERRAMIENTAS SERIAS (investigado el 30 ago 2026) ══
 *
 * Plausible y Umami — los medidores sin cookies de referencia — filtran en
 * dos capas: (1) el conteo exige ejecutar JavaScript, y la mayoría de los
 * robots no lo ejecutan, así que ni llegan; (2) a los que sí llegan se les
 * mira el User-Agent contra los patrones conocidos. Aquí igual: el pulso lo
 * manda el navegador (capa 1) y esta lista es la capa 2.
 */
const PATRONES_DE_ROBOT = [
  "bot",
  "crawl",
  "spider",
  "slurp",
  "search",
  "archive",
  "monitor",
  "preview",
  "scan",
  "fetch",
  "headless",
  "lighthouse",
  "pagespeed",
  "pingdom",
  "uptime",
  "curl",
  "wget",
  "python",
  "httpclient",
  "java/",
  "go-http",
  "facebookexternalhit",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "embedly",
  "quora link preview",
  "vkshare",
  "snap url preview",
  "gptbot",
  "claudebot",
  "perplexity",
  "bytespider",
];

/** ¿Este User-Agent es un robot? Vacío también cuenta como robot: ningún
    navegador de persona llega sin identificarse. */
export function esRobot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim().toLowerCase();
  if (ua.length === 0) return true;
  return PATRONES_DE_ROBOT.some((p) => ua.includes(p));
}

/** La ruta se guarda SIN query: en los parámetros viajan búsquedas y datos
    que no pintan nada en una tabla de tráfico. */
export function rutaLimpia(cruda: string): string {
  const sinQuery = cruda.split("?")[0]?.split("#")[0] ?? "/";
  return sinQuery.slice(0, 200) || "/";
}
