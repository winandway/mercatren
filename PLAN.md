# Plan: abrir Chile y Colombia (todo lo de código; lo del dueño queda de último en PENDIENTES)

- [x] Paso 1: la tasa del dólar CLP y COP editable en Panel → Configuración (`dolar_clp_centesimas`, `dolar_cop_centesimas`), con guardas contra tasas rotas
- [x] Paso 2: las tiendas por rubro de Chile y Colombia (`tienda-cl-<rubro>`, `tienda-co-<rubro>`) con su mercado correcto, calcadas de las de EE. UU.
- [x] Paso 3: el catálogo de CJ por mercado — con el selector del panel en Chile/Colombia, «Agregar» crea el producto en la tienda de ese país con precio en su moneda, y rechaza con aviso lo que pase de USD 500 (solo Chile)
- [x] Paso 4: el flete CJ→CL / CJ→CO cotizado al publicar, con respaldo que nunca es cero
- [x] Paso 5: el precio de Colombia (`precio-colombia.ts`): misma fórmula, COP entero, sin IVA nuestro
- [x] Paso 6: la dirección chilena y colombiana en el checkout (regiones de Chile y departamentos de Colombia elegidos de lista) en `destino/direccion.ts`
- [x] Paso 7: el checkout cobra en la moneda del pedido (CLP/COP por Stripe) y anota el IVA chileno en `impuestosCentavos` (sale del precio, no se suma)
- [x] Paso 8: en el checkout de CL/CO solo tarjeta — sin Zelle ni ACH, que son cuentas de EE. UU.
- [x] Paso 9: el candado del destino en el pedido a CJ para CL/CO (país + taxId ya viajan; agregar CO a la tabla de destinos)
- [x] Paso 10: los textos de `.cl` y `.com.co` — título, portada y pie dejan de decir «Estados Unidos» y «dólares» en esos dominios
- [x] Paso 11: la tarjeta social por mercado — YA EXISTÍA del 17 ago (generador + layout); comprobado que los archivos están en public/
- [x] Paso 12: el reporte del F129 en Panel → Configuración — lo cobrado de IVA chileno por trimestre, en USD
- [ ] Paso 13: verificación completa (`npm run verify`), prueba en navegador de las pantallas tocadas, push, build en verde y propagación comprobada en el borde
- [ ] Paso 14: PENDIENTES.md y CLAUDE.md al día, con lo del dueño (Turnstile, compras de prueba, decisión de aduana en CO) claramente de último
