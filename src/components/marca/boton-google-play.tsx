import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import {
  fichaDeGooglePlay,
  insigniaDeGooglePlay,
} from "@/lib/app-android/google-play";
import { cn } from "@/lib/utils";

/**
 * El distintivo oficial «Disponible en Google Play», con enlace a la ficha.
 * Una sola pieza para el pie, la portada y la cuenta. El alto nunca baja de
 * 40 px: es el mínimo de las normas de marca de Google.
 */
export async function BotonGooglePlay({ className }: { className?: string }) {
  const idioma = await getLocale();
  const t = await getTranslations("googlePlay");
  const insignia = insigniaDeGooglePlay(idioma);
  return (
    <a
      href={fichaDeGooglePlay(idioma)}
      target="_blank"
      rel="noopener noreferrer"
      data-google-play
      className={cn("inline-block shrink-0", className)}
    >
      <Image
        src={insignia.src}
        alt={t("alt")}
        width={insignia.ancho}
        height={insignia.alto}
        unoptimized
        className="h-11 w-auto"
      />
    </a>
  );
}
