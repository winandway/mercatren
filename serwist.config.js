/**
 * Configuracion del trabajador que hace de Mercatren una aplicacion instalable.
 *
 * Se genera con `npm run sw`, que corre ANTES de `next build` para que el
 * archivo public/sw.js entre en los estaticos que se publican.
 *
 * No se usa el plugin de Next porque ese trabaja con webpack y Next 16 compila
 * con Turbopack. Este generador es independiente del compilador.
 */
module.exports = {
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",

  // Se guardan de entrada los archivos de la marca (iconos, logo). El resto
  // del sitio se va guardando a medida que el usuario navega (runtimeCaching).
  globDirectory: "public",
  globPatterns: ["**/*.{png,svg,ico,webmanifest}"],
  globIgnores: ["sw.js", "sw.js.map", "LEEME-iconos.txt"],

  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
};
