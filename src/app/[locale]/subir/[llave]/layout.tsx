/**
 * La herramienta va SOLA: sin encabezado, sin buscador, sin pie.
 *
 * Es una app dentro de un enlace, no una página del sitio — y quien la abre
 * está de pie en un almacén con una mano libre. Cada barra de arriba es
 * pantalla que le quitas al botón de grabar.
 */
export default function LayoutSubir({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-dvh bg-white">{children}</main>;
}
