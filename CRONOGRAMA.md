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

### 3. 🔴 👤 Los puntos de API de CJ — ES EL ÚNICO FRENO QUE QUEDA

**Medido el 4 sep 2026, con las corridas del robot delante:** de las ocho
corridas del día, **seis no hicieron nada** porque CJ no tenía puntos. Las dos
que sí encontraron afinaron **3.178 productos en total** y las dos se pararon
al agotarlos.

Ese es el techo real: **unos 3.000 productos por día**, lo dé quien lo dé. No
lo marca nuestro reloj ni el robot de GitHub —los dos están sobrados—, lo
marca la cantidad de llamadas que CJ nos deja hacer.

Con 47.500 en la cola, a ese ritmo son **unos 16 días**. Con el doble de
puntos, ocho.

- **Lo único que sube ese techo es comprarle más a CJ.** No hay ajuste de
  código que lo cambie: el sistema ya llama todo lo que le dejan.
- Se renuevan solos cada día, y el sistema **deja de llamarlos hasta que
  vuelvan** para no gastar el reloj en balde.
- **Cómo saber cómo va:** `https://mercatren.com/datos/salud` — el renglón
  `catalogo` dice, por país, cuántos están a la venta y cuántos en revisión.
  No hace falta entrar al panel ni tener sesión.

### 4. 🔴 💻 Terminar de traer las fotos a nuestros servidores

54.000 fotos vivían en servidores de terceros. Ya se copian solas a 3.000 por
hora, primero las de los comercios. **Sin nada que hacer de tu lado**; en
menos de un día está.

---

## DESPUÉS (la semana que viene)

### 5. 🟠 💻 Terminar el afinado de los 47.500 en revisión

Cada producto necesita su flete real, sus tallas y su stock antes de salir a
la venta. **Corre solo y no hay nada que tocar** — lo único que lo frena son
los puntos de CJ (punto 3).

**Medido el 4 sep 2026 a las 22:40:**

| País           | A la venta | En revisión |
| -------------- | ---------- | ----------- |
| Estados Unidos | 2.560      | 44.850      |
| Chile          | 1.245      | 102         |
| Colombia       | 3.520      | 2.583       |
| **Total**      | **7.325**  | **47.535**  |

**Y lo que está a la venta está BIEN:** los 7.325 publicados tienen los tres
el envío ya cotizado a CJ y metido dentro del precio, y ninguno sin costo
base. El candado hace su trabajo: lo que no pasa el último filtro no sale a
la venta.

- **Cómo lo miras sin entrar a nada:** `https://mercatren.com/datos/salud`,
  renglón `catalogo`.

### 6. 🟠 💻 El traductor: 38.500 títulos por pasar al español

**Está corriendo y no hay nada que hacer de tu lado.** Medido el 4 sep 2026:
**441 títulos en 20 minutos = 1.323 por hora**, así que los 38.500 que faltan
salen en **poco más de un día**.

Lo que sigue pendiente es que la tanda entera se pierde cuando el modelo
devuelve un carácter de más. No detiene el trabajo —la siguiente vuelta lo
reintenta—, pero desperdicia llamadas: hay que rescatar lo que sí vino bien y
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
