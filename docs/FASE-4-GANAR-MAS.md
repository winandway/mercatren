# Fase 4 · Ganar más: el plan Pro y los productos promocionados

> Encargada por Gerencia el 5 nov 2026 dentro de `docs/PLAN-UNA-SOLA-MERCATREN.md`
> (sección 8, fase 4, y sección 9, decisiones 3 y 4). **Nada de esto cobra
> dinero real sin el sí de Richard.** Se construye entero, se prueba con datos
> locales y se deja apagado el cobro hasta que él lo encienda.

## Las decisiones, tomadas «como lo hace el mercado»

Lo aprobado en el plan (no se cambia aquí):

- **Plan Pro: 9,99 dólares al mes, el primer mes gratis.** Referencia: Etsy
  Plus a 10 dólares.
- **Promocionados: pago por clic, 0,15 dólares el clic, con un presupuesto
  diario que pone el vendedor, de 1 a 50 dólares. Nunca se cobra más que ese
  presupuesto.** Referencia: Etsy Ads y Amazon Sponsored Products.

Lo que el plan no fijaba y se decide aquí (se cambia con una línea):

| Decisión                      | Valor                                                                        | Por qué                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Productos publicados sin plan | **100**                                                                      | Suficiente para empezar sin pagar; las plataformas con plan gratis ponen un tope y el de pago lo sube. |
| Productos publicados con Pro  | **5.000**                                                                    | «Más productos» de verdad, sin dejar una puerta infinita a cargas masivas.                             |
| Quien ya pasa de 100          | **Se respeta lo publicado**                                                  | Nadie pierde lo que ya vende; solo no se publican más hasta bajar de 100 o pasar a Pro.                |
| Mes gratis                    | **Una vez por tienda**                                                       | Evita encadenar pruebas.                                                                               |
| Cancelar Pro                  | **Al final del mes pagado**                                                  | Como Etsy y la mayoría: se usa lo pagado.                                                              |
| Clic que cuenta               | **Uno por persona, por producto, por día**                                   | Los clics repetidos y los de robots no se cobran.                                                      |
| Etiqueta del promocionado     | **«Patrocinado» / «Sponsored»**                                              | Obligatorio por transparencia (FTC en EE. UU.).                                                        |
| Dónde sale                    | **Primero en la búsqueda y en la portada del país, como mucho 2 de cada 12** | Que no tape el catálogo.                                                                               |

## Qué se construye

1. **Plan Pro:** la tabla de planes por tienda, el tope de productos en
   `guardarProducto` (servidor, para la web y la app), la tienda destacada en
   su categoría y las estadísticas (vistas y clics por producto, sin escribir
   en la base por cada visita: regla «LA NUBE NO SE COME EL DINERO»).
2. **Promocionados:** campañas por producto con presupuesto diario, el clic
   cobrable con su candado contra repetidos y robots, el gasto del día con
   tope, y su lugar en la búsqueda y la portada con la etiqueta.
3. **Panel y app:** «Plan Pro» y «Promocionar» para el vendedor, en los dos
   idiomas, y su guía pública en Docs.
4. **El cobro:** construido y APAGADO. Hasta que Richard diga sí (y existan
   las claves de prueba de Stripe para probarlo de punta a punta), el mes gratis
   corre y lo promocionado se anota «por cobrar» sin tocar ninguna tarjeta.

## Estado (5 nov 2026)

**Construido y probado en local**, en la app y en el panel, con su guía
pública («Plan Pro y productos promocionados», dirección
`/docs/pro-plan-and-sponsored-products`). Las piezas:

- Reglas puras: `src/lib/ganar/reglas.ts`.
- Plan: `src/lib/ganar/planes.ts` · estadísticas: `estadisticas.ts`.
- Promocionados y el clic: `src/lib/ganar/promociones.ts` y
  `src/app/datos/promo/clic/route.ts`.
- La app: `/datos/app/mi/plan`, `/datos/app/mi/promociones`; pantallas
  `plan-pro.tsx` y `promocionar/[id].tsx`.
- El panel: `/panel/plan` y `/panel/promociones` (acciones en
  `src/lib/ganar/acciones.ts`).

**Falta (decisión de Richard): encender el cobro.** Bloque en rojo de
`VERIFICAR-PAGOS.md`. Ver también `PENDIENTES.md` y `HISTORIAL.md`.
