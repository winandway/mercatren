import Image from "next/image";

import { Link } from "@/i18n/navigation";

/**
 * EL MARCO DE LA PÁGINA DE PAGO: SOLO EL LOGOTIPO.
 *
 * ══ POR QUÉ SE SACÓ DEL MARCO DE LA TIENDA (19 ago 2026) ══
 *
 * Estaba dentro del encabezado normal, con su buscador y su menú de
 * departamentos. Medido en la página de pago de un cobro: **45 fotos del
 * catálogo del comercio**, ninguna visible, con la dirección diciendo
 * `tienda-bley-ferreteria` en claro dentro de cada una.
 *
 * Dos motivos para sacarlo, y los dos pesan:
 *
 * 1. **Hay cobros donde quien paga NO debe saber de qué comercio se trata** —
 *    le compró a otro que a su vez le compra a este. De nada sirve quitar el
 *    nombre de la tarjeta si el menú de alrededor trae su catálogo entero.
 * 2. **Quien paga está en un teléfono, muchas veces en Venezuela.** Cuarenta y
 *    cinco imágenes que nadie va a ver son segundos de espera delante de un
 *    botón de pagar. Ahí es donde se abandona.
 *
 * ══ Y NO PIERDE LA DIRECCIÓN ══
 *
 * `(tienda)` y esto son grupos de rutas: los paréntesis no salen en la
 * dirección. El enlace sigue siendo `/es/cobro/<enlace>`, así que **los que ya
 * se mandaron por correo siguen funcionando**.
 */
export default function LayoutCobro({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-borde bg-white">
        <div className="mx-auto flex max-w-lg items-center px-4 py-4">
          {/* Lleva al inicio y nada más: ni buscador, ni menú, ni carrito.
              Quien abre esto viene a una sola cosa. */}
          <Link href="/" className="inline-flex">
            <Image
              src="/logo_mercatren/mercatren-isologotipo-horizontal-com.svg"
              alt="Mercatren"
              width={168}
              height={32}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="px-4 py-8 text-center text-xs text-tinta-suave">
        © {new Date().getFullYear()} mercatren.com
      </footer>
    </>
  );
}
