/**
 * EL VISOR DE SHORTS: pantalla completa, sin encabezado ni pie.
 *
 * Va en su propio grupo de rutas —la URL sigue siendo `/video/<slug>`— porque
 * un visor tipo TikTok con la barra del sitio encima deja de ser pantalla
 * completa: el video se corta arriba y el botón de «Entra en mi tienda» queda
 * empujado fuera de la pantalla del teléfono. Probado el 23 ago 2026 en 375 px.
 *
 * La forma de volver es el nombre del comercio, arriba a la izquierda, que
 * lleva a su tienda: nadie se queda encerrado.
 */
export default function LayoutVisor({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-[100svh] bg-black">{children}</main>;
}
