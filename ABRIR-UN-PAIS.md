# ABRIR-UN-PAIS — el traje completo, casilla por casilla

> Escrito el 28 ago 2026 por orden del dueño, después de que Chile naciera a
> medias y él tuviera que ir encontrando los huecos ficha por ficha («tengo
> que estarte diciendo qué es lo que tenemos que hacer»). **La regla: un
> dominio nuevo se abre recorriendo ESTA lista entera, sin que nadie tenga
> que pedir las piezas una por una.** El país no está abierto hasta que cada
> casilla esté marcada.
>
> La arquitectura de fondo vive en `PLAN-PAISES.md` (multi-inquilino, tres
> muros). Esta lista es la operativa: qué se toca, en qué orden, y cómo se
> comprueba.

## A · Lo que decide el DUEÑO antes de tocar código 👤

- [ ] El dominio, registrado y conectado en YaDominios Cloud.
- [ ] La moneda en que vende (y si su unidad menor no es la centésima,
      `mercado/moneda.ts` ya lo sabe o se le enseña).
- [ ] El régimen de impuestos, **leído de la fuente oficial, jamás de
      memoria** (el del SII chileno cambió dos respuestas «sabidas»). Si hay
      que registrarse (tipo SII), es del dueño con su contador.
- [ ] De qué ALMACÉN de CJ se surte (China para Latinoamérica; local si
      existe). Va en la plaza, no en la cabeza de nadie.
- [ ] El idioma del comprador. Sin traducciones inventadas.
- [ ] Turnstile: el dominio nuevo agregado al widget en Cloudflare.
- [ ] Quién asume lo que la aduana cobre al recibir, si no hay régimen que lo
      evite. Se decide ANTES de la primera ficha, porque define qué promete.

## B · El código (💻, en este orden)

1. [ ] **Mercado** en `mercado/mercados.ts` (dominio → código). La caché y el
       muro de datos lo heredan solos.
2. [ ] **Plaza** en `cj/plazas.ts`: tienda general, prefijos de rubro,
       moneda, país de entrega, ALMACÉN, respaldo de flete (nunca cero, y
       nunca el doméstico de EE. UU. para un envío internacional), referencia
       de cotización.
3. [ ] **Precio** (`destino/precio-<pais>.ts`): margen + procesador dentro,
       la conversión con la tasa, el impuesto si va dentro del precio, y el
       tope del régimen si existe. Con pruebas comprobadas en rojo y la
       conversión verificada A MANO (la de Chile nació con un error de 100×).
4. [ ] **Tasa automática** (`mercado/tasa-automatica.ts`): la fuente del
       país en DolarApi (o equivalente comprobado en vivo), los límites
       cuerdos, y los dos ajustes del dueño.
5. [ ] **Destino** (`destino/reglas.ts` + `direccion.ts`): el código en
       DESTINOS, su PLAZO honesto (conservador hasta medirlo), sus campos de
       dirección y su lista de estados/regiones/departamentos (nombre
       completo sin acentos fuera de EE. UU.).
6. [ ] **Checkout**: solo envío, solo los métodos que el comprador de allá
       puede usar (Zelle/ACH son de EE. UU.), Stripe en la moneda del pedido,
       y el impuesto anotado en `impuestosCentavos` si aplica.
7. [ ] **Pedido a CJ** (`cj/destino-fiscal.ts`): el país en la tabla, el
       `taxId` si el régimen lo exige, y el almacén correcto de origen.
8. [ ] **Textos de la vitrina**: hero y subtítulo del país, pie sin
       «dólares», meta de la ficha diciendo la verdad (cómo llega y cómo se
       paga), franja de entrega con el plazo y la explicación del impuesto,
       tarjeta social `og-<pais>.png` (`npm run iconos`).
9. [ ] **El panel entero obedece el selector**: órdenes, cobros (3 pestañas),
       clientes, retiros (lista e insignia), tablero, Zelle, comercios,
       catálogo de CJ, traductor. La regla vive en cada consulta:
       `alcance total → filtrar por mercadoDelPanel()`. Al agregar una
       consulta nueva del panel, nace con ese filtro o nace mal.
10. [ ] **El código público del producto** es nuestro (`MT-<pais>-…`), nunca
        el del proveedor — en ficha, JSON-LD y feed.
11. [ ] **Reporte fiscal** si el régimen lo pide (el F129 chileno es el
        molde).

## C · Cómo se comprueba (no es opcional)

- [ ] `npm run verify` en verde y las pruebas nuevas comprobadas en ROJO.
- [ ] `curl -H "Host: <dominio>" localhost:3000/es`: el hero del país, un
      producto sembrado visible, su ficha con la moneda y la franja correcta,
      la meta y el `og:url` del dominio. (El diccionario viaja entero en la
      página: para lo visible se mira el `<h1>`, no un grep a secas.)
- [ ] El panel con el selector en el país nuevo: catálogo, tablero, órdenes y
      cobros limpios, y el aviso naranja del catálogo diciendo a dónde entra.
- [ ] Publicar, build en verde, **y el 200 del borde antes de decir «ya está»**.
- [ ] 👤 La compra de prueba del país: plazo real, papel dentro de la caja, y
      que la aduana no cobre lo que el régimen promete que no cobra.

## Los países, contra esta lista

| Casilla                            | US  | CL      | CO                 | RO (próximo) |
| ---------------------------------- | --- | ------- | ------------------ | ------------ |
| Mercado + plaza + almacén          | ✅  | ✅      | ✅                 | —            |
| Precio con pruebas                 | ✅  | ✅      | ✅                 | —            |
| Tasa automática                    | n/a | ✅      | ✅                 | —            |
| Destino + dirección                | ✅  | ✅      | ✅                 | —            |
| Checkout (moneda/métodos/impuesto) | ✅  | ✅      | ✅                 | —            |
| Pedido a CJ (país/taxId/almacén)   | ✅  | ✅      | ✅                 | —            |
| Textos + og + meta + franja        | ✅  | ✅      | ✅                 | —            |
| Panel por selector                 | ✅  | ✅      | ✅                 | —            |
| Código público MT                  | ✅  | ✅      | ✅                 | —            |
| Reporte fiscal                     | n/a | ✅ F129 | n/a                | —            |
| 👤 Turnstile del dominio           | ✅  | ⬜      | ⬜                 | —            |
| 👤 Compra de prueba                | ⬜  | ⬜      | ⬜                 | —            |
| 👤 Impuestos con contador          | n/a | ✅ SII  | ⬜ decisión aduana | ⬜ IVA UE    |
