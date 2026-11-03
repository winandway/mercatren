# Respuesta a Apple por el rechazo del 3 nov 2026 (BORRADOR, sin enviar)

> **No se manda sin el «sí» de Richard**, y cuando lo dé se mandan TODAS las
> apps de la cuenta el mismo día (regla de Gerencia). Va en App Store
> Connect → Mercatren → Revisión de apps → el envío rechazado → «Responder al
> equipo de revisión de apps».

## De dónde sale este texto

- Las preguntas 5 a 8 siguen la línea común de la cuenta
  (`~/Gerencia/APPLE-4.3-LINEA-COMUN.md`), con los marcos de trabajo que de
  verdad usa Mercatren (SwiftUI y WebKit, no Expo).
- Las preguntas 1 a 4 son propias de Mercatren, con datos comprobados en el
  proyecto: una sola compilación en TestFlight (1.0.0, compilación 1) y sin
  beta externa.
- **La pregunta 9 NO usa la frase común** («owned and operated by Windoce
  LLC»), porque para Mercatren no es cierta: Mercatren lo opera Mercatren LLC,
  que vende y factura cada pedido, y así lo dicen el sitio, la ficha de la
  tienda y las facturas. Apple lo puede comprobar. Se dice la verdad: no es
  de un cliente; Windoce LLC hace y mantiene la app, y las dos empresas son
  del mismo dueño. Avisado a Gerencia.

## Antes de mandarla

1. **El «sí» de Richard para toda la cuenta.**
2. **El sitio activo con productos**: el revisor abre la app al leerla y hoy
   vería «Este sitio está en pausa».

## El texto para pegar (en inglés, como lo pide Apple)

```
Hello App Review team,

Thank you for the detailed feedback. Below are our answers to each question.

1. What the app does and the problem it solves
Mercatren is an online marketplace. Independent stores list their products, and every order is sold and invoiced by Mercatren LLC, a Michigan company, which buys the merchandise from the supplier in its own name and ships it to the address the buyer chooses. In the app, a shopper browses the catalog by department and by store, searches, adds items to a cart, pays by card, and follows each order from payment to delivery with its tracking number. The same account gives them a personal locker address in Miami to receive purchases from other online stores, and lets them open their own store. The problem it solves: Spanish- and English-speaking shoppers in the U.S. who want to buy from small independent stores get one fully bilingual place, with the final price shown up front and a documented record of every purchase.

2. Intended users
Adults in the United States who shop online in Spanish or English, especially Hispanic households; small independent merchants who want to sell to them; and customers who use a U.S. locker address for their own purchases.

3. The need it addresses
Small stores rarely get a storefront that works in both languages and that they can open the same day. In Mercatren every screen, product page and help article exists in English and Spanish, a new store goes live immediately without an approval wait, the price includes shipping where it applies, and the locker service and the store share a single account.

4. Beta testing
One build (version 1.0.0, build 1) was uploaded to TestFlight, and we did not run an external beta with it; the build was tested internally on the iOS Simulator. The service itself has been live on the web since August 2026 with real buyers and merchants, and their feedback shaped what the app shows: the checkout lacked a place to enter the delivery address (added), buyers could not tell why a payment option was unavailable (now explained on screen), and order pages did not show the carrier (they now show the carrier and the tracking number).

5. Standalone product or suite
Mercatren is a standalone product with its own brand, domain, account system and backend. Windoce LLC is a software company that also publishes other, unrelated products under its developer account. Mercatren shares no accounts, features or data with them.

6. Could it be an in-app purchase or feature of another app
No. Mercatren has its own buyers, merchants, orders, payments and locker service; it does not fit inside any other app on the account, and its users and data are kept separate.

7. Code, frameworks or assets shared with other apps on the account
No significant shared code, frameworks or assets beyond standard frameworks (SwiftUI and WebKit on iOS; Next.js and React on the web; Stripe for card payments). Mercatren's app, backend, design and brand assets live in their own repository.

8. Code, SDKs or content shared with third-party apps
No. Mercatren is not built on a white-label product, template or app generation service.

9. Created for a client or partner
No. Mercatren is not a client's app. The service is operated by Mercatren LLC, the company that sells and invoices every order, and Windoce LLC, the account holder, designs, builds and runs the app, the website and the backend. Both companies belong to the same owner. The concept, brand, content and service are ours, and we support customers ourselves.

Thank you,
Windoce LLC
```
