import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    // Hay otro package-lock.json mas arriba en el disco; sin esto Next elige
    // esa carpeta como raiz y avisa en cada compilacion.
    // OJO: no usar `import.meta.dirname` aqui. Este archivo se carga como
    // CommonJS, ahi queda indefinido y el servidor de desarrollo deja de
    // encontrar los paquetes ("Cannot find module 'next-intl'").
    root: process.cwd(),
  },
};

export default withNextIntl(nextConfig);

// El trabajador de la aplicacion instalable (public/sw.js) NO se genera aqui:
// lo arma `npm run sw` con el generador propio de Serwist, porque el plugin de
// Next trabaja con webpack y este proyecto compila con Turbopack.

// Permite usar la base de datos y el bucket de YaDominios Cloud mientras se
// trabaja con `npm run dev`, sin conectarse a nada remoto.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
