# Respuesta a Apple por el rechazo del 3 nov 2026 (BORRADOR, sin enviar)

> **No se manda sin el «sí» de Richard.** Es un mensaje a Apple en nombre de
> la empresa. Va en App Store Connect → Mercatren → Revisión de apps → el
> envío rechazado → «Responder al equipo de revisión de apps».

## Antes de mandarla, tres cosas tienen que ser ciertas

1. **El sitio activo.** El revisor va a abrir la app después de leer la
   respuesta; hoy vería «Este sitio está en pausa».
2. **Productos publicados.** Hoy el catálogo está vacío a propósito.
3. **Decidida la cuenta de Mercatren LLC.** La respuesta a la pregunta 9 dice,
   porque es la verdad, que la marca es de Mercatren LLC y que la publica
   Windoce LLC. Eso es justo lo que prohíbe la norma 4.2.6, así que la
   respuesta promete que Mercatren LLC enviará la app desde su propia cuenta.
   Si esa cuenta no se va a abrir, esta respuesta no sirve y no se manda.

**Lo que recomiendo:** abrir la cuenta de Mercatren LLC y enviar desde allí
la versión mejorada. En ese caso, esta respuesta se manda solo como cortesía
en el envío viejo, o ni hace falta. Detalle del rechazo en
`RECHAZO-2026-11-03.md`.

## El texto para pegar (en inglés, como lo pide Apple)

```
Hello App Review team,

Thank you for the detailed feedback. Below are our answers to each question.

1. What the app does and the problem it solves
Mercatren is an online marketplace operated by Mercatren LLC, a Michigan company. Independent stores list their products, and every order is sold and invoiced by Mercatren LLC, which buys the merchandise from the supplier in its own name and ships it to the address the buyer chooses. In the app, a shopper browses the catalog by department and by store, searches, adds items to a cart, pays by card, and follows each order from payment to delivery with its tracking number. The same account gives them a personal locker address in Miami to receive purchases from other online stores, and lets them open their own store. The problem it solves: Spanish- and English-speaking shoppers in the U.S. who want to buy from small independent stores get one fully bilingual place, with the final price shown up front and a documented record of every purchase.

2. Intended users
Adults in the United States who shop online in Spanish or English, especially Hispanic households; small independent merchants who want to sell to them; and customers who use a U.S. locker address for their own purchases.

3. The need it addresses
Small stores rarely get a storefront that works in both languages and that they can open the same day. In Mercatren every screen, product page and help article exists in English and Spanish, a new store goes live immediately without an approval wait, the price includes shipping where it applies, and the locker service and the store share a single account.

4. Beta testing
We did not run a TestFlight beta before this submission; the build was tested internally on the iOS Simulator. The service itself has been live on the web since August 2026 with real buyers and merchants, and their feedback shaped what the app shows: the checkout lacked a place to enter the delivery address (added), buyers could not tell why a payment option was unavailable (now explained on screen), and order pages did not show the carrier (they now show the carrier and the tracking number). Before resubmitting, we will run a TestFlight beta with buyers and merchants and apply their feedback.

5. Standalone product or suite
Mercatren is a standalone product and the only app of Mercatren LLC. It is not part of a suite. The other apps currently on this developer account belong to other businesses and share no catalog, accounts, orders or service with Mercatren.

6. Could it be an in-app purchase or feature of another app
No. Mercatren is a separate business with its own buyers, merchants, orders and payments, and it does not belong inside any other app on the account.

7. Code, frameworks or assets shared with other apps on the account
The native shell (SwiftUI with native tabs for Home, Search, Cart and Account, pull to refresh, swipe-back navigation and an offline screen) was written for Mercatren. The developer, Windoce LLC, follows a similar approach in other apps it builds, but Mercatren shares no content, catalog, backend, user accounts or brand assets with them.

8. Code, SDKs or content shared with third-party apps
Only standard frameworks: SwiftUI and WebKit on iOS. Mercatren's web platform is built on open-source frameworks (Next.js and React) and uses Stripe for card payments.

9. Created for a client or partner
Yes. The app's content and brand belong to Mercatren LLC. Windoce LLC is the software company that builds and maintains Mercatren's platform, and both companies have the same owner. We understand guideline 4.2.6, so Mercatren LLC is enrolling in the Apple Developer Program and will submit the app from its own account.

Thank you,
Mercatren LLC
```
