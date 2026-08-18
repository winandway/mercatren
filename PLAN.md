# Plan: abrir Colombia (mercatren.com.co)

> Piloto automático, 18 ago 2026. Mismo patrón que Chile: el dominio decide el
> mercado y solo cambia el DATO, nunca el código.
>
> **La plataforma va por su lado:** hoy `mercatren.com.co` responde 522 (activo
> en el panel, todavía sin llegar al sitio) y `mercatren.co` aún no resuelve.
> Eso lo resuelve YaDominios; aquí se deja todo listo para que funcione en
> cuanto ellos terminen.

- [x] Paso 1: Declarar el mercado `CO` en `src/lib/mercado/mercados.ts`, con sus
      pruebas y sin tocar los otros dos.
- [x] Paso 2: Moneda: Colombia vende en **pesos colombianos (COP)**, que no
      tienen centavos — igual que el peso chileno.
- [x] Paso 3: El documento de Colombia es el **NIT**, con dígito verificador de
      la DIAN. Comprobado contra 5 NIT públicos reales antes de escribirlo.
- [x] Paso 4: Vocabulario del formulario de alta para Colombia (teléfono +57,
      ayuda de dirección, país ya puesto), bilingüe.
- [x] Paso 5: La tarjeta social `og-co.png` que dice «mercatren.com.co».
- [x] Paso 6: `npm run verify`, publicar y comprobar en vivo lo que se pueda
      —el 522 depende de la plataforma— dejando constancia de qué falta.
- [x] Paso 7: Actualizar `PLAN-PAISES.md` y `CLAUDE.md`, y anotar qué queda
      pendiente del lado de YaDominios.
