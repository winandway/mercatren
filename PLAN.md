# Plan: el formulario fiscal W-8BEN-E dentro de Mercatren

> Para que un comercio de Venezuela, Colombia o donde sea pueda cobrar sin
> mandar un PDF por WhatsApp ni que nadie lo suba a mano.
>
> **La salvedad que manda sobre todo el diseño:** el IRS dice que escribir el
> nombre en la línea de la firma NO cuenta como firma electrónica. Hace falta
> guardar fecha, hora y una declaración de que se firmó electrónicamente. Sin
> eso el formulario no vale y el trabajo se pierde.

## Bloque A — Las reglas, puras y probadas

- [x] A1 · Qué campos pide el W-8BEN-E y cuáles son obligatorios
- [x] A2 · Vencimiento: tres años desde el final del año de la firma
- [x] A3 · Cuándo hace falta el formulario y cuándo no (EE. UU. no lo necesita)
- [x] A4 · Pruebas de las reglas, con los casos reales de Venezuela y Colombia

## Bloque B — Dónde se guarda

- [x] B1 · Tabla nueva `formularios_fiscales`, con el registro de la firma
- [x] B2 · Acción para guardarlo, con el alcance del comercio
- [x] B3 · Consulta del estado para el panel

## Bloque C — La pantalla del comercio

- [x] C1 · Formulario en español, con los campos explicados en palabras normales
- [x] C2 · La casilla de firma con su declaración, y el aviso de que no se manda al IRS
- [x] C3 · Enchufarlo en «Mi tienda», con su aviso cuando falta
- [x] C4 · Textos en los dos idiomas

## Bloque D — El documento

- [x] D1 · La página imprimible del formulario, con los datos y la firma
- [x] D2 · Que se pueda descargar desde la ficha del comercio

## Bloque E — El candado que lo hace real

- [x] E1 · No se pide un retiro a un país extranjero sin el formulario al día
- [x] E2 · Comprobado en el SERVIDOR, no solo en la pantalla
- [x] E3 · Prueba en rojo del candado

## Bloque F — El resto de PLAN-CONTABILIDAD.md que es código

- [x] F1 · Exportar el asiento mensual para Xero (bruto, comisión, costo)
- [x] F2 · Guardar la factura de CJ de cada compra al proveedor
      _(la casilla estuvo marcada con solo la tabla creada; se cerró de verdad
      el 21 ago 2026, con su pantalla y su candado en `/media`)_

## Bloque G — Cerrar

- [x] G1 · Documentar en CLAUDE.md
- [x] G2 · Marcar PLAN-CONTABILIDAD.md y dejar escrito lo que solo puede hacer él
