# Plan: el comercio puede cobrar por Zelle, hasta un tope

Hoy solo hay tres formas de cobrar: a otro comercio, ACH y wire. Falta Zelle,
que es la vía rápida para montos chicos. Pero Zelle NO puede ser la vía para
todo: los bancos vigilan Zelle con un umbral mucho más bajo que ACH, y una
cuenta que paga proveedores por Zelle todos los días termina restringida.

Por eso el tope no es un capricho: es lo que protege la cuenta del banco.

- [x] 1. `ZELLE_RETIRO_MAXIMO_CENTAVOS` en `src/lib/dinero.ts`, con el
      porqué del número escrito al lado.
- [x] 2. `zelle` como forma de retiro (la columna es texto: no toca la base).
- [x] 3. El servidor RECHAZA un retiro por Zelle que pase del tope. Esta es
      la que manda: el navegador se puede saltar.
- [x] 4. El formulario pide correo o teléfono de Zelle, no cuenta ni ruta, y
      avisa del tope ANTES de que escriba el monto.
- [x] 5. Si el monto pasa del tope, el formulario lo dice y ofrece ACH en vez
      de dejarlo intentar y fallar.
- [x] 6. La cola del equipo y el correo de "ya te transferimos" muestran Zelle
      como forma, con su destino.
- [x] 7. Textos bilingües.
- [x] 8. Pruebas del tope: justo debajo pasa, justo encima no, y las otras
      formas no quedan limitadas.
- [x] 9. Tipos, lint, pruebas, navegador y publicar.
