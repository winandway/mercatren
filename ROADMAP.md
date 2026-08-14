# Roadmap de Mercatren

> **Qué es esto.** La lista de lo que falta, ordenada por lo que desbloquea a lo
> demás — no por lo que apetece hacer. Cuando el dueño pregunte «¿qué tenemos
> pendiente?», se contesta desde aquí.
>
> **La regla que manda sobre todas:** primero lo formal y lo legal, después lo
> que crece. Un negocio que factura mal o cobra a nombre equivocado no se
> arregla creciendo — se arregla parando.
>
> Última revisión: 12 de agosto de 2026.

---

## Dónde estamos hoy

| Pieza                            | Estado                            |
| -------------------------------- | --------------------------------- |
| Mercatren LLC (Michigan) + EIN   | ✅ 11 ago 2026                    |
| Banco Mercury                    | ✅ Checking ••9805                |
| Stripe                           | ✅ activa                         |
| Banco Chase (para Zelle)         | ✅ aprobada, con fondo inicial    |
| Correos @mercatren.com           | ✅ buzón real en Google Workspace |
| El sitio dice Mercatren LLC      | ✅ publicado y comprobado         |
| Candado de aprobación en Mercury | ✅ todos los pagos, desde $0      |
| Google Merchant Center           | ⏸ 3 de 5 — parado en envíos       |

**Lo que esto significa:** la sociedad existe y puede operar. Lo que todavía no
ocurre es que el dinero entre a su nombre.

---

## BLOQUE 1 — Cerrar el traspaso (bloquea todo lo demás)

Mientras esto no esté, **un cobro con tarjeta sigue entrando en la cuenta de
Windoce, LLC** y le aparece así al comprador. Nada de lo que viene después
importa hasta cerrarlo.

1. **Claves de Stripe** al panel de YaDominios: `STRIPE_SECRET_KEY`,
   `STRIPE_CLAVE_PUBLICA`, `STRIPE_WEBHOOK_SECRET`.
2. **Webhook de Stripe** apuntando a **`https://mercatren.com/datos/stripe`**,
   con **siete** eventos: `payment_intent.succeeded`,
   `payment_intent.payment_failed`, los tres `charge.dispute.*`,
   `charge.refunded` y `radar.early_fraud_warning.created`.

   Los dos últimos se agregaron el 13 ago 2026. `charge.refunded` tapa el
   hueco de devolver **desde el panel de Stripe** en vez del nuestro: el dinero
   salía y aquí el pedido seguía diciendo «pagado». El aviso de fraude llega
   ANTES de que haya contracargo, que es la única ventana para no despachar la
   mercancía y devolver por decisión propia.

   **La dirección es esa, sin `/aviso` al final.** Aquí decía
   `/datos/stripe/aviso` y esa ruta nunca existió: el archivo está en
   `src/app/datos/stripe/route.ts`. Configurado así, Stripe habría llamado a
   un 404, habría dado el aviso por fallido y el comprador se quedaría con su
   pedido en «esperando el pago» teniendo el dinero ya cobrado.
   `tests/unit/rutas.test.ts` comprueba contra el disco que la constante
   apunte a un `route.ts` que existe.

3. **Zelle de Chase.** ✅ Dado de alta y activo (13 ago 2026). **Ojo con el
   correo: es `pagos@mercatren.com`, no `zelle@`** — el banco no aceptó
   registrar el seller directamente y hubo que darlo de alta de otra forma.

   Falta cargar **las dos variables a la vez** en el panel de YaDominios:
   - `ZELLE_CORREO_RECEPTOR` → `pagos@mercatren.com`
   - `ZELLE_NOMBRE_RECEPTOR` → `Mercatren LLC` (hoy dice `Windoce LLC`)

   Es el nombre que ve el comprador al ir a pagar. Si se cambia el nombre
   antes que el correo, se le enseña un nombre nuevo con la cuenta vieja y no
   paga.

4. **Datos de Mercury** para los retiros: `PAGO_CUENTA`, `PAGO_RUTA_ACH`,
   `PAGO_RUTA_WIRE`.
5. **Emisor de las facturas**: `EMISOR_IDENTIFICACION` y `EMISOR_DIRECCION`.
6. **Una venta de prueba de punta a punta**, de verdad y con dinero real: pagar
   con tarjeta, ver que entra en Mercury, que se emite el par de facturas, y
   que el neto aparece en la billetera del comercio.

**El corte contable es un hecho, no una fecha:** el primer dólar que Stripe
liquide en la cuenta de Mercatren LLC. Ni un hueco ni un solapamiento.

---

## BLOQUE 2 — Lo formal y lo legal (en paralelo, depende de terceros)

Se arranca YA porque el abogado y el contador tienen sus tiempos, no los
nuestros. No bloquea al bloque 1, pero sí a cualquier crecimiento serio.

1. **El puente Windoce → Mercatren, por escrito.** Durante meses la operación
   de Mercatren corrió a través de Windoce, LLC. Hoy no hay ningún papel que
   explique por qué. Un acuerdo corto entre las dos sociedades con la fecha de
   traspaso convierte «esto se ve raro» en «esto está documentado». **Es del
   abogado.**
2. **Cómo se declara la LLC de un solo miembro.** Por defecto es _disregarded
   entity_ y todo pasa a la declaración personal. Eso cambia cómo se reporta el
   1099-K, y el modelo entero se apoya en `bruto − costo de mercancía =
margen`. **Es del contador, y es la pregunta de esta semana, no de marzo.**
3. **Términos y privacidad revisados por el abogado.** Siguen pendientes desde
   que se escribieron.
4. **Regenerar el PDF del modelo de negocio** con Mercatren LLC. Lo revisó el
   abogado, así que el cambio pasa por él.
5. **El flujo de facturación por escrito**, de la venta a los libros, para
   llevarlo a QuickBooks Online.
6. **La dirección publicada es una casa.** Sale en las facturas y en los
   términos. Cuando haya dirección comercial se cambia — después es reeditar
   documentos ya emitidos.

---

## BLOQUE 3 — Que el dinero no se pierda

Nada de esto da ingresos. Todo evita perderlos.

1. ~~**Prueba de entrega en el pedido.**~~ ✅ 12 ago 2026 — tabla
   `pruebas_entrega`: guía, foto, firma o nota, con quién la aportó. El
   comprador no puede subirla y solo el equipo puede quitarla.
2. ~~**Devoluciones desde el panel.**~~ ✅ 12 ago 2026 — dentro de los tres
   puntos, con motivo obligatorio. No descuenta el neto del comercio: quién
   asume la devolución se acuerda aparte.
3. **Retiros con la API de Mercury, tramo 1.** El comercio pide → Mercatren
   revisa → sale a Mercury como solicitud → un admin aprueba. Lo que resuelve
   no es aprobar: es dejar de copiar a mano el banco, la cuenta y la ruta, que
   es donde se manda plata a la cuenta equivocada. Solo ACH domésticos al
   principio.

   Hecho el 12 ago 2026: la regla de aprobación en Mercury (todos los pagos,
   desde $0, con separación de funciones), el cliente de la API con un token
   **sin `Send Money`**, y el botón «Probar la conexión con el banco» en
   Configuración. **Falta** el alta del destinatario en Mercury (a mano, una
   vez por comercio) y enganchar el botón de retiro del comercio.

4. **Rotar `SOCIO_LLAVE`.** Se pegó en un chat. Sigue viva.
5. ~~**Límite de intentos**~~ ✅ 12 ago 2026 — ocho por cuenta y cuarenta por
   dirección cada quince minutos, en entrar y en recuperar clave. Registro no:
   ahí no hay contraseña que adivinar.

---

## BLOQUE 4 — Crecer

Solo cuando el bloque 1 esté cerrado. Meter volumen con la facturación a
medias multiplica el problema, no los ingresos.

1. **Ferremateriales Bley.** Están los tres archivos escritos pero sin
   commitear, y el botón sin enganchar a ninguna pantalla. Falta emitir su
   token, cargarlo en su Cloudflare, publicar y decidir con ellos cómo se
   contabiliza esa venta en el cierre de caja. **No se les escribe hasta que el
   bloque 1 esté cerrado** — decisión del dueño, y es la correcta: Bley vende
   bastante y empeoraría el desorden de facturación.
2. **Una página de «cómo trabajar con Mercatren»**, abierta y sin login, para
   mandarle el enlace a cada comercio nuevo en vez de explicarlo otra vez.
3. ~~**Avisar al comprador del concepto del Zelle**~~ ✅ 12 ago 2026 — en rojo,
   debajo del monto, con `Mercatren MT-000002` en grande y su botón de copiar.
4. ~~**Aviso al equipo cuando entra una venta.**~~ ✅ 12 ago 2026.
5. **La tienda de Estados Unidos, y con ella el catálogo para Google Shopping.**
   Proyecto que el dueño ya tenía en la cabeza: una tienda dentro de Mercatren
   con mercancía que se entrega **en Estados Unidos**, algunas cosas nuevas y
   otras usadas.

   Desbloquea Merchant Center. El 12 ago 2026 se llegó hasta el paso de
   envíos y se paró en «Do it later» a propósito: Google compara lo que se
   declara con lo que ve un comprador estadounidense en la ficha, y hoy la
   ficha dice «lo retiras en el local del comercio», en Venezuela. Declarar un
   envío dentro de EE.UU. que no existe es tergiversación, y esa es la causa
   número uno de suspensión de una cuenta.

   Lo que hace falta, en orden:
   - Una tienda con dirección y entrega reales en Estados Unidos.
   - Marcar en el catálogo qué productos se entregan allá, y que
     `/datos/google` mande **solo esos** — hoy manda todo.
   - Sus fichas en inglés de nativo, no traducción: Google las lee desde allá.
   - Recién entonces, volver a Merchant Center, declarar el envío de verdad y
     terminar el paso 4 de 5.

   Mientras tanto **no se pierde nada**: el posicionamiento normal de Google
   —mapa del sitio, datos estructurados, fichas y documentación— no depende de
   Merchant Center y ya está corriendo.

6. **El correo de contacto público sigue siendo `@windoce.com`.** Es la
   mención de Windoce más visible que queda en el sitio, y la que hace que la
   IA de Google siga asociando Mercatren con Windoce. Ya hay buzón real en
   `@mercatren.com`, así que cambiarlo es una línea — falta decidir qué alias
   se publica.

---

## BLOQUE 5 — Deuda técnica escrita

Está anotada en `CLAUDE.md` con su porqué. Se cierra archivo por archivo, cada
uno con su prueba.

1. **`zod` en las acciones que faltan.** Eran 15 archivos, no 9. Cerrados los
   que tocan dinero (Zelle, comprobante, pedidos, cobros) con
   `src/lib/validacion/acciones.ts`; **faltan los demás**.
2. **Nonce por petición en la CSP**, para poder quitar `unsafe-inline`.
3. **`noUncheckedIndexedAccess`**: rompe en 16 sitios.
4. **Buscador global en el panel**: hoy hay que saber en qué sección mirar.

---

## Cómo se usa esta lista

- Se contesta **por bloques, en orden**. Un pendiente del bloque 3 no adelanta
  a uno del 1, por mucho que apetezca.
- El bloque 2 corre **en paralelo** desde el primer día: depende de terceros.
- Cuando algo se termina, se marca aquí en el mismo trabajo. Una lista
  desactualizada miente igual que un panel que dice «En vivo» con el sitio
  caído.
