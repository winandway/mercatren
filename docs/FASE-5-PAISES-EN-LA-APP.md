# Fase 5 · Venezuela y España dentro de la app, preparados y apagados

> Encargo de Gerencia (5 nov 2026): «Prepara la fase 5 hasta donde no hace
> falta a Richard: Venezuela y luego España dentro de la app, con su moneda,
> sus precios, sus legales y su guía, todo apagado detrás de un interruptor
> por país… No se enciende la venta en ningún país sin el sí de Richard.»
>
> Estado: **construido, probado en local y APAGADO.** En producción la app
> solo ofrece Estados Unidos.
>
> **8 nov 2026: VENEZUELA ENCENDIDA en la app** (Gerencia, decisión delegada
> por Richard), con la venta por **Zelle en la web** y la tarjeta de la app
> apagada para el público hasta la prueba 9. Lo de la revisión del abogado
> abajo ya no frena a Venezuela (la web vende con esos textos); España sigue
> apagada. Detalle: `HISTORIAL.md`, «VENEZUELA ENCENDIDA EN LA APP…».

## 1. Los dos interruptores (y por qué son dos)

| Interruptor         | Dónde                              | Qué abre                                                                                                                                              | Hoy                                              |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `enLaApp`           | `src/lib/mercado/interruptores.ts` | Que el país se pueda elegir en la app y al crear la cuenta, que su guía salga en Docs, y que la puerta de compra de la app acepte pedidos de ese país | US encendido · VE y ES apagados                  |
| `dentroDeMercatren` | el mismo archivo                   | Que el país se use DENTRO de mercatren.com con la bandera (sin dominio propio)                                                                        | US y ES encendidos · VE vive en mercatren.com.ve |
| La venta            | `src/lib/ventas/pausa.ts`          | Que se pueda pagar: `ESPANA_SIN_COBRO` cierra España aunque todo lo demás esté encendido                                                              | España sin cobro                                 |

Encender un país en la app **no** abre su venta en España: la pausa de
ventas se mira aparte, en el servidor, en cada pedido. Se comprobó en el
simulador: con España encendida en la app, la ficha dice «Este producto no
se puede comprar en este momento».

**El equipo sí puede comprar con el país apagado** (igual que en la pausa de
ventas): es la única forma de hacer la compra real de prueba antes de
encenderlo.

## 2. Lo que se construyó

### La compra en la app, según el país

- **Qué pide la entrega lo dice el servidor**: `GET /datos/app/v1/entrega?pais=XX`
  devuelve si se envía o se retira, qué casillas pide y la lista de estados
  o provincias. Sale de `src/lib/destino/direccion.ts`, la MISMA fuente de la
  web. La app no tiene reglas propias por país.
- **Venezuela: retiro en la ciudad.** Solo nombre de quien retira, teléfono y
  ciudad. Título «Datos para el retiro» y el aviso «Lo retiras con el
  vendedor, en tu ciudad…». Al servidor viajan solo esos tres datos.
- **España: envío a domicilio.** Dirección, «Piso, puerta», ciudad, provincia
  (de una lista, en orden alfabético de España) y código postal de 5 cifras
  que tiene que empezar por el número de la provincia. En inglés dice
  «Postal code», no «ZIP code».
- **El pedido queda en el país que eligió la persona**, no en el del dominio.
  Antes, un pedido de Venezuela hecho desde la app quedaba anotado como de
  Estados Unidos (la app entra siempre por mercatren.com). Ahora la app manda
  el país; la acción del servidor lo resuelve contra la lista cerrada y exige
  que los productos sean de ese país.
- **La puerta de compra de la app mira el interruptor** (`403 pais_apagado`),
  no solo la pantalla.
- **El borrador del pago es de cada país**: la dirección de Madrid ya no
  aparece al pagar en Venezuela. Y el código postal ya se guarda en el
  borrador (la regla de «no guardar códigos» se lo comía).
- **La lista de países se pide siempre fresca**: el teléfono la guardaba y,
  al encender o apagar un país, seguía diciendo lo de antes.

Comprobado en local con los interruptores encendidos solo en la máquina:
pedido de Venezuela (mercado VE, país «Venezuela», retiro) y pedido de
España (mercado ES, en euros, provincia 28 y código postal 28013). Un
producto de Venezuela pedido «como si fuera de Estados Unidos» se rechaza.

### Moneda y precios

- Venezuela vende en **dólares**; España en **euros**, con el formato de
  cada idioma (24,90 € en español, €24.90 en inglés).
- El precio que ve el comprador es el que puso el comercio, con el margen
  dentro; en España el IVA va **dentro** del precio (regla «el IVA del
  comercio va dentro de su precio»). El margen de España todavía no está
  decidido (lo decide Richard).

### Los textos legales del país

- `GET /datos/app/v1/legal?pais=XX&idioma=xx&pagina=terminos|privacidad|ayuda|devoluciones`
  lleva a los de ese país: Venezuela a mercatren.com.ve; España a
  mercatren.com con la bandera de España puesta; Estados Unidos quita la
  bandera que hubiera quedado. No toca la cuenta (abrir los términos no es
  elegir país). Lista cerrada de páginas.
- Términos y privacidad ya enseñan las secciones de cada país
  (`paraElMercado`), como devoluciones.
- **Las secciones legales propias de España y Venezuela están escritas**
  (`src/contenido/paginas/legales-por-pais.ts`), con la base legal de cada
  frase en `docs/paises/`: quién vende, cómo es la venta, precio, desistimiento
  de 14 días con su formulario modelo, garantía de 3 años, ley y tribunales
  del consumidor, representante en la UE, derechos y la AEPD para España;
  quién vende, retiro en el comercio, pago, garantía, ley venezolana y datos
  tratados en EE. UU. para Venezuela.
- **España no se publica a medias.** Sale sola cuando estén los datos de Richard
  (`LEGALES_ES`: NIF español, representante fiscal, representante en la UE,
  domicilio y teléfono que se publican, quién paga la devolución, días para
  responder) y `revisadoPorAbogado: true` en cada país. Hoy las páginas no
  cambian. El candado (`tests/unit/legales-por-pais.test.ts`) no deja
  encender España o Venezuela en la app, ni abrir el cobro de España, sin
  sus textos listos.
- **Venezuela, publicada sin revisar por orden de Gerencia (5 nov 2026):**
  mercatren.com.ve enseñaba los términos de Estados Unidos («vendemos y
  entregamos únicamente dentro de Estados Unidos»), con la venta abierta. La
  sección de Venezuela ya sale en términos y privacidad, con
  `publicadoSinRevision: true`. **Pendiente de revisión del abogado**; la app
  no se enciende en Venezuela hasta `revisadoPorAbogado: true`.

### La guía de cada país en Docs, escondida

- «Mercatren Venezuela desde la app» y «Mercatren España desde la app», en
  español e inglés, con capturas reales del simulador (datos neutros, sin
  comercios reales a la vista). Originales en `docs/capturas/app-nativa/`.
- Llevan `soloConPais`: no salen en Docs, ni en el buscador, ni en el mapa
  del sitio, ni en su dirección hasta que el país se enciende en la app.

## 3. Cómo se enciende un país (cuando Richard diga sí)

1. Las compras de prueba del equipo, por la app, con el país todavía apagado:
   una con tarjeta de punta a punta, mirada hasta el pago en Stripe y el
   pedido avanzando (regla «prohibido lanzar pagos sin probar»). Se anota en
   `VERIFICAR-PAGOS.md`.
2. Lo del contador y el abogado que esté marcado como «bloquea» en la
   página del país (`docs/paises/`), y sus textos legales listos: los datos en
   `legales-por-pais.ts` y `revisadoPorAbogado: true`.
3. Una línea: `enLaApp: true` en `interruptores.ts` (y, para España, además
   `ESPANA_SIN_COBRO = false` en `ventas/pausa.ts`, con el margen decidido).
4. Push. La guía de Docs se publica sola con el interruptor.

## 4. Lo que exige cada país (para el contador)

- Venezuela: `docs/paises/VENEZUELA-IMPUESTOS-Y-LEGAL.md`
- España: `docs/paises/ESPANA-IMPUESTOS-Y-LEGAL.md`

## 5. Candados

- `tests/unit/app-movil-entrega-por-pais.test.ts` — la entrega de cada país,
  el país del pedido, la puerta que mira el interruptor, el borrador por país.
- `tests/unit/guias-y-legales-por-pais.test.ts` — la guía escondida, los
  textos legales del país y la lista de países fresca.
- `tests/unit/app-movil-cuentas.test.ts` — el código postal se guarda en el
  borrador.
- `tests/unit/legales-por-pais.test.ts` — ningún país se enciende sin sus
  textos legales; nada a medias; lo que la ley de España obliga a decir; nunca
  la plataforma europea de litigios (derogada el 20 jul 2025).

Todas se comprobaron en ROJO quitando el arreglo.
