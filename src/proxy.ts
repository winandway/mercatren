import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * Se aplica a las paginas, pero NO a las rutas de servidor (/datos, /media,
   * /upload), ni a los archivos con extension, ni a los internos de Next.
   */
  matcher: ["/((?!_next|datos|media|upload|sw.js|manifest.json|.*\\..*).*)"],
};
