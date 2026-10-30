# Auditoría de gastos de Mercatren — 29 de octubre de 2026

> Orden de Richard: _«desactive todo por completo hasta nuevo aviso… lleve a
> cero el gasto, porque Mercatren es un proyecto que por ahora está parado y
> no produce nada»_. Esto es lo que se encontró, lo que se apagó y cómo se
> vuelve a encender el día que él lo diga.

---

## 1. Qué estaba cobrando: la IA de Google (Gemini)

**El cobro del banco.** «GOOGLE CLOUD» de **$25 cada dos o tres días**, en la
cuenta de negocio terminada en 8662, tarjeta 9018, **desde el 3 de septiembre
de 2026**, sin parar.

**Por qué es de Mercatren.** El 2 de septiembre el sitio estrenó su reloj
propio, que late **cada minuto**. En cada latido le pedía a Gemini (la IA de
Google) una tanda de títulos al español, otra de títulos al inglés y, a
veces, descripciones. El primer cobro de la tarjeta 9018 es del día
siguiente, el 3 de septiembre. Desde entonces no paró.

**Por qué salía tan caro, si el modelo es barato.**

1. **El modelo «pensaba».** `gemini-2.5-flash` razona por dentro antes de
   contestar si no se le dice lo contrario, y Google cobra ese razonamiento
   como texto de salida, a $2,50 el millón. Para traducir un título no hace
   falta, y era la mayor parte de la factura.
2. **No había ningún tope.** 1.440 latidos al día, todos los días, sin
   límite de gasto.
3. **Las descripciones.** Traducir una descripción cuesta lo que veinte
   títulos, y el reloj las traía de CJ y las traducía todo el día, para un
   catálogo cuya venta en Estados Unidos está en pausa.

## 2. La cuenta, mes por mes (lo que se ve en las capturas del banco)

| Mes                    | Cobros de Google Cloud                              | Total                   | ¿De quién?                                                                                                                  |
| ---------------------- | --------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Julio 2026 (1 al 8)    | 7 de $10 + 15 de $25 + 1 cargo por sobregiro de $35 | **$480**                | **No es de Mercatren**: Mercatren nació el 2 de agosto. Es otro proyecto, con la tarjeta 8686. Se cortó solo el 8 de julio. |
| Agosto 2026            | ninguno                                             | **$0**                  | —                                                                                                                           |
| Septiembre 2026        | 12 de $25                                           | **$300**                | Mercatren (el reloj, desde el 3 de sep)                                                                                     |
| Octubre 2026 (al 29)   | 10 de $25 (el último, pendiente)                    | **$250**                | Mercatren                                                                                                                   |
| **Total de Mercatren** |                                                     | **≈ $550 en dos meses** | **≈ $9 al día, ≈ $280 al mes**                                                                                              |

Mercatren no ha tenido ventas en ese tiempo: **es pérdida completa**.

**Ojo con la cifra exacta.** Sale de las capturas: si alguna fila quedó entre
dos capturas, falta. La cifra exacta, separada por proyecto y por servicio,
está en Google Cloud → Facturación → Informes, entrando con la cuenta
`torplanet1@gmail.com` (la que emitió la llave del traductor).

**Lo que NO es pérdida:** el cobro de **Google Workspace de $8,12** al mes
(el correo `@mercatren.com`). Es el correo de la empresa y de la cuenta de
Google Play; quitarlo es decisión de Richard.

## 3. Lo que se apagó (29 oct 2026)

Todo vive en **`src/lib/en-pausa.ts`**, con dos interruptores escritos en el
código (no en el panel, a propósito: lo que se apaga por dinero no se puede
volver a encender escribiendo en una casilla).

| Pieza                                | Qué hacía                                                   | Estado                                                                                         |
| ------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Traductor (Gemini)                   | Títulos y descripciones al español y al inglés, cada minuto | **Apagado** (`IA_APAGADA`)                                                                     |
| Búsqueda por foto (Gemini)           | Cada visitante que subía una foto                           | **Apagada**; el botón de la cámara ya no se ofrece                                             |
| Índice visual (Gemini)               | Vectores de las fotos del catálogo                          | **Apagado**                                                                                    |
| Asistente del panel                  | Chat del equipo con un agente externo                       | **Apagado**                                                                                    |
| Reloj de cada minuto                 | Importar y afinar CJ, stock, traducción, conteos, vigilante | **Apagado** (`RELOJ_APAGADO`) y **quitado de `yadominios.json`**: la plataforma ya no lo llama |
| Sincronización (GitHub, cada 10 min) | Catálogos de los comercios y CJ                             | **Flujo desactivado** y la puerta contesta «apagado»                                           |
| Afinado (GitHub, cada 30 min)        | Fletes y tallas de CJ                                       | **Flujo desactivado**                                                                          |
| Vigilante (GitHub, cada 20 min)      | Revisar todo y mandar correos                               | **Flujo desactivado** y la puerta contesta «apagado»                                           |

**Además, aunque se quite la pausa,** quedan dos frenos permanentes:

- **Sin «pensar»:** toda llamada de texto lleva `thinkingBudget: 0`.
- **Tope diario:** 150 unidades al día (`src/lib/ia/presupuesto.ts`), unos
  **$0,25 al día** como mucho. Si se acaba, el traductor espera a mañana.
- **Las descripciones, fuera del reloj** (`DESCRIPCIONES_EN_EL_RELOJ`).

Candado: `tests/unit/mercatren-en-pausa.test.ts`, comprobado en rojo.

## 4. Lo que sigue encendido, y por qué

| Pieza                                   | Costo                        | Por qué sigue                                                                                                            |
| --------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| El sitio mercatren.com (y .cl, .com.co) | Casi cero sin visitas        | La app está **en revisión en Google Play**: los revisores tienen que poder entrar. Apagar el sitio tumbaría la revisión. |
| Stripe                                  | Solo cobra por venta         | Sin ventas, cero.                                                                                                        |
| Mercury                                 | Gratis                       | —                                                                                                                        |
| CJ                                      | Gratis (la API no cobra)     | El saldo que queda en CJ es dinero nuestro, no un gasto.                                                                 |
| Correos del sistema (Cloudflare)        | Por correo enviado           | Sin actividad, cero.                                                                                                     |
| Google Workspace                        | $8,12 al mes                 | Decisión de Richard.                                                                                                     |
| Dominios                                | Anual                        | Decisión de Richard.                                                                                                     |
| GitHub                                  | Gratis (repositorio público) | Solo corre al publicar.                                                                                                  |

## 5. Cómo se comprueba que el gasto paró

En el banco, **no debe aparecer ningún cobro nuevo de «GOOGLE CLOUD» con la
tarjeta 9018** después del 29 de octubre. Google cobra cuando lo acumulado
llega a $25: si en los próximos 10 días aparece uno, es lo que ya se había
gastado antes del apagado (como mucho uno). **Si aparece un segundo, ese gasto
es de OTRO proyecto** en la misma cuenta de Google, no de Mercatren.

Para estar 100 % seguros del lado de Google: entrando con
`torplanet1@gmail.com`, en Google AI Studio → API keys, se puede **borrar la
llave del traductor**. Con el código apagado no hace falta; es la garantía
extra.

## 6. Cómo se vuelve a encender (cuando Richard lo diga)

1. En `src/lib/en-pausa.ts`: `IA_APAGADA = false` y/o `RELOJ_APAGADO = false`.
2. Si se enciende el reloj: devolver a `yadominios.json` el bloque
   `"triggers": { "crons": ["* * * * *"] }`.
3. Reactivar los flujos de GitHub: `gh workflow enable afinar.yml`,
   `sincronizar.yml` y `vigilante.yml`.
4. Las descripciones siguen fuera del reloj hasta cambiar
   `DESCRIPCIONES_EN_EL_RELOJ`, y el tope diario sigue puesto.
5. Publicar, y mirar el banco la semana siguiente.
