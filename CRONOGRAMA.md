# Cronograma de Mercatren

> Escrito el 3 de septiembre de 2026, a pedido del dueño: «no haces un
> roadmap de todo lo que tenemos pendiente, todo, absolutamente todo, y me
> vas pasando las cosas si le pones prioridad». Esto es esa lista, en orden
> de importancia, diciendo **qué es de él (👤) y qué es mío (💻)**, y cuánto
> cuesta cada cosa.
>
> `PENDIENTES.md` sigue siendo el índice largo por temas. Esto es el orden en
> que se van a hacer y quién hace cada una. **Al terminar algo se marca en
> los dos sitios.**

## Cómo se lee

| Marca | Qué significa                                         |
| ----- | ----------------------------------------------------- |
| 👤    | Solo lo puede hacer Richard (dinero, claves, cuentas) |
| 💻    | Lo hago yo                                            |
| 🔴    | Hay dinero o clientes esperando                       |
| 🟠    | Frena el crecimiento                                  |
| 🟡    | Mejora, no urge                                       |

---

## AHORA (esta semana)

### 1. 🔴 👤 Cerrar las tres pruebas para que el bot deje de escribir

**MT-000004, MT-000011 y MT-000013.** Son pruebas del equipo pagadas con
nuestra propia tarjeta, así que **no hay nada que devolver** — decisión tuya
del 4 de septiembre. Lo único que falta es cerrarlas para que el vigilante deje
de mandar el mismo correo cada seis horas.

- Panel → **Pedidos al proveedor** → en cada una, **«Cerrar: fue una prueba»**.
  El botón está a la derecha, y **al lado sale el correo del comprador**.
- **MIRA ESE CORREO ANTES DE CERRAR.** Si alguna es de un cliente de verdad, no
  la cierres: se quedaría pagando algo que nunca le llega, y eso se resuelve
  devolviéndole el dinero (Órdenes → tres puntos → Devolver).
- No devuelve dinero, no cancela nada del lado del comprador, y una compra ya
  **pagada o enviada no se puede cerrar** — el sistema se niega.
- **Cómo saber que quedó:** las tres salen en verde como «Cerrado», la lista de
  «Ventas esperando» queda vacía, y en Panel → Vigilante las alertas rojas de
  compras bajan a cero. El correo deja de llegar.

### 2. 🔴 👤 Comprar un producto de prueba en Estados Unidos

Es lo único que falta para dar el circuito por probado (regla de la casa: un
sitio con pagos no se anuncia sin probarlo de punta a punta).

- **Espera a que CJ tenga puntos otra vez** (ver el punto 3). Con el panel en
  rojo por «sin puntos» la compra se va a negar sola, y está bien que lo haga.
- Compra como Soporte, con tu dirección real de Michigan.
- **Cómo saber que quedó:** en Panel → Pedidos al proveedor, la compra
  aparece **pagada con el saldo**, y te llega el correo. Si sale con enlace de
  tarjeta, es que faltó saldo en CJ.

### 3. 🔴 👤 Los puntos de API de CJ

Tu captura lo dijo: `Used today: 61520, Remaining: 0`. La importación del
almacén completo se los comió. Mientras estén en cero **no se afina ningún
precio, no se refresca stock y no se puede comprar al proveedor**.

- Se renuevan solos cada día. **Yo ya hice que el sistema deje de llamarlos
  hasta que vuelvan**, para no gastar el reloj en balde.
- Para tener más puntos, CJ pide una sola cosa: comprarles más. Es decir, el
  punto 2 de arriba también sube el límite.
- **Cómo saber que volvieron:** Panel → Vigilante, la línea «Conexión con CJ»
  deja de decir «sin puntos».

### 4. 🔴 💻 Terminar de traer las fotos a nuestros servidores

54.000 fotos vivían en servidores de terceros. Ya se copian solas a 3.000 por
hora, primero las de los comercios. **Sin nada que hacer de tu lado**; en
menos de un día está.

---

## DESPUÉS (la semana que viene)

### 5. 🟠 💻 Terminar el afinado de los 51.000 en revisión

Cada producto necesita su flete real, sus tallas y su stock antes de salir a
la venta. Va a unos 3.840 por día, atado a los puntos de CJ. **Cuantos más
puntos, más rápido.**

- **Cómo lo miras:** Tablero → «El catálogo, de un vistazo», la columna «Por
  resolver» bajando cada día.

### 6. 🟠 💻 El traductor se para con JSON roto

45.000 títulos siguen en inglés. El traductor pierde la tanda entera cuando
el modelo devuelve un carácter de más. Hay que rescatar lo que sí vino bien y
pedir tandas más chicas.

### 7. 🟠 👤 El reloj de YaDominios Cloud no llama

El sitio late con el tráfico y con GitHub, así que funciona; pero el
planificador de la plataforma no está invocando su propia puerta. **Es de la
otra sesión (YaDominios Cloud), no de Mercatren.**

### 8. 🟠 👤 La pistola de código de barras

No está en el almacén de Estados Unidos de CJ; en el de China sí. Decisión
tuya: traerla desde China (20 días) o buscar otro proveedor para ese
producto.

### 9. 🟡 💻 Descripciones propias para Google

Las fichas de CJ traen el texto del proveedor. Merchant Center penaliza el
texto duplicado. Hay que escribir descripción propia, al menos de lo que más
se vende.

---

## MÁS ADELANTE

### 10. 🟡 👤 El PDF del modelo de negocio

Lo tiene que aprobar el abogado antes de volver a publicarlo; hoy la página
en HTML lo reemplaza.

### 11. 🟡 👤 DNS-AID y DNSSEC

Dos registros en el DNS de mercatren.com para que los agentes de IA
descubran el sitio. Está todo lo demás publicado.

### 12. 🟡 💻 Buscadores en las pantallas que crezcan

Enlaces de cobro, órdenes de compra y créditos tienen hoy menos de treinta
filas. Se les pone el buscador cuando pasen de ahí.

---

## Lo que ya no hay que vigilar (hecho)

- Las fotos se copian solas y una rota no se enseña (3 sep).
- El tablero dice qué hay en cada plaza y el vigilante el detalle (3 sep).
- Historial de fallos con «ya lo arreglé» (3 sep).
- Sin confirmación de stock no se cobra (3 sep).
- El reloj propio del sitio late cada minuto (3 sep).
- El vigilante corre cada 20 minutos y manda correo (2 sep).
- Nada de CJ a la venta sin flete real (2 sep).
- Guía de impuestos y W-8BEN-E para los comercios (3 sep).
