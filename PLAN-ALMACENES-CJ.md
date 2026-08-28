# PLAN-ALMACENES-CJ — la expansión por países usando los almacenes de CJ

> Escrito el 27 ago 2026 por pedido del dueño, con la pantalla de «Almacenes
> globales» de CJ delante. **Próximo objetivo decidido por él: RUMANÍA.**
> Regla de cabecera: un almacén NO es un mercado — el almacén dice desde dónde
> sale la caja; el mercado es un dominio nuestro con su moneda, su impuesto y
> su idioma. La arquitectura ya lo sabe (`PLAN-PAISES.md`): abrir un país es
> una entrada en la tabla de mercados y una plaza en `src/lib/cj/plazas.ts`,
> no una copia del código.

## Los 17 almacenes de CJ, por continente

| Continente            | Almacenes                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- |
| América del Norte (3) | **Estados Unidos** (en uso) · Canadá · México                                             |
| Europa (6)            | **Rumanía** (próximo) · España · Alemania · Francia · Polonia · Reino Unido               |
| Asia (6)              | **China** (el central) · Japón · Vietnam · Tailandia · Filipinas · Emiratos Árabes Unidos |
| Oceanía (1)           | Australia                                                                                 |
| África (1)            | Nigeria                                                                                   |
| **América del Sur**   | **NINGUNO** — Chile y Colombia se surten por envío internacional                          |

## Cómo se abastecen Chile y Colombia (sin almacén propio)

Tres candidatos, y la decisión se toma MIDIENDO, no suponiendo:

1. **Estados Unidos** — lo que el código ya hace (las plazas CL/CO cotizan
   `startCountryCode: "US"`). Probado en nuestra operación; catálogo menor.
2. **China** — el almacén central: catálogo enorme y las líneas CJPacket que
   ya mueven paquetes a Latinoamérica. Probablemente más barato; SIN medir.
3. **México** — el más cercano, pero **sin confirmar** que CJ despache
   internacional desde ahí: muchos almacenes locales solo sirven a su país.

### Paso 0 (💻, corto): la sonda de almacenes

Un script/pantalla que cotice `freightCalculate` con el MISMO producto desde
`US`, `CN` y `MX` hacia una dirección de Santiago y una de Bogotá, y enseñe
precio y plazo lado a lado. Con ese número se decide el `startCountryCode` de
cada plaza — hoy es `US` y cambiarlo es una línea en `plazas.ts`.

## El orden de expansión propuesto (después de Rumanía)

| #   | País                   | Por qué en ese puesto                                           |
| --- | ---------------------- | --------------------------------------------------------------- |
| 1   | **Rumanía**            | Decisión del dueño. Almacén local = entrega doméstica rápida.   |
| 2   | **España**             | Almacén local Y habla español: el sitio ya está en su idioma.   |
| 3   | **México**             | Español, almacén local, y de paso responde si sirve para CL/CO. |
| 4   | Reino Unido / Alemania | Almacén local; exigen idioma e impuestos propios.               |

**Lo que hace fácil o difícil un país, en una línea:** almacén local (plazo
corto y sin aduana para el comprador) + idioma que ya hablamos + impuesto que
sepamos operar. Rumanía tiene lo primero; lo segundo y lo tercero son el
trabajo.

## RUMANÍA — el plan completo

### Lo que Rumanía tiene a favor

- **Almacén de CJ EN el país**: la caja sale y llega dentro de Rumanía o de la
  UE — sin aduana para el comprador y con plazo corto de verdad (a medir).
- Stripe cobra en **RON** (leu rumano, moneda normal de dos decimales: no hay
  que tocar `mercado/moneda.ts`).
- La arquitectura multi-país está lista: mercado + plaza + tasa + dirección.

### Lo que hay que resolver ANTES de programar (👤 dueño, en orden)

- [ ] 🔴 👤 **El dominio**: registrar `mercatren.ro` y conectarlo en
      YaDominios Cloud (la plataforma lo enlaza al mismo sitio, como .cl).
- [ ] 🔴 👤 **El IVA de la Unión Europea — con contador, no de memoria.**
      Vender DENTRO de la UE desde un almacén rumano implica IVA rumano desde
      la primera venta y probablemente registro (local u OSS). **Ninguna tasa
      ni régimen se programa sin la fuente oficial y el sí del contador** —
      misma disciplina que el SII chileno, donde leer la norma cambió dos
      respuestas que «se sabían».
- [ ] 🔴 👤 **El idioma.** El sitio habla español e inglés; el comprador
      rumano compra en rumano. Decisión de negocio: ¿se abre con inglés
      (rápido, vende menos) o se agrega el rumano (trabajo grande de
      contenido, vende de verdad)? La infraestructura next-intl admite un
      tercer idioma; los textos son el costo.
- [ ] 🟠 👤 **El procesador y la moneda del cobro**: confirmar en Stripe que
      la cuenta puede presentar cargos en RON.
- [ ] 🟠 👤 **Turnstile**: agregar `mercatren.ro` al widget.

### Lo que es código (💻, cuando lo de arriba esté decidido)

- [ ] 💻 Mercado `RO` en `mercados.ts` (+ dominio) — el muro de datos y caché
      lo cubre solo.
- [ ] 💻 Plaza `RO` en `cj/plazas.ts`: `tienda-ro-<rubro>`, moneda RON,
      **`startCountryCode: "RO"`** (¡cotizar desde el almacén rumano, no
      desde EE. UU.!), respaldo de flete propio, referencia Bucarest.
- [ ] 💻 Tasa `dolar_ron_centesimas` en Configuración (misma pieza de CL/CO).
- [ ] 💻 `precio-rumania.ts`: misma fórmula; el IVA según lo que diga el
      contador (si es «incluido en el precio» como Chile, la pieza ya existe).
- [ ] 💻 Dirección rumana en el checkout: los **județe** de lista, como las
      regiones chilenas.
- [ ] 💻 Solo tarjeta, textos del hero/meta/og por mercado (la mecánica ya
      está: es agregar el caso RO).
- [ ] 💻 El filtro del catálogo de CJ por almacén RO en la búsqueda (hoy la
      pantalla filtra almacén de EE. UU.; parametrizar por plaza).
- [ ] 👤 Compra de prueba rumana: plazo real, papel dentro de la caja, y que
      el precio final no sorprenda a nadie.

### En qué NO nos metemos todavía

- Nada de IOSS/OSS programado a ciegas: primero el contador.
- Nada de traducción automática al rumano: la regla de la casa es no inventar
  traducciones. Si se decide rumano, se hace bien.
- Los demás países de la lista esperan a que Rumanía venda.
