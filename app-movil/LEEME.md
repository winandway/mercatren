# La app de Mercatren (iPhone y Android)

La app nativa de Mercatren, hecha con Expo (SDK 58, React Native, Expo Router).
Es la pieza principal del plan `docs/PLAN-UNA-SOLA-MERCATREN.md` (sección 10):
un solo Mercatren, el país lo elige la persona, y todo pasa en la app.

## Qué hace hoy (Parte 2, 5 nov 2026)

1. **Bienvenida:** la persona elige su país (solo los encendidos; los demás
   dicen «Muy pronto») y el idioma con el selector estilo Amazon.
2. **Inicio:** el catálogo del país, de a 24, que carga solo al bajar.
3. **Buscar:** la búsqueda sale medio segundo después de dejar de escribir.
4. **Ficha:** fotos que se pasan con el dedo, precio, tienda y descripción.
5. **Cuenta:** país, idioma, ayuda, privacidad y términos.

Lo que falta (entrar, carrito, pago, crear tienda, avisos) está en
`PENDIENTES.md`, sección de la app nativa.

## De dónde saca los datos

De la puerta de datos del sitio: `/datos/app/v1/paises`, `/catalogo` y
`/producto/[slug]` (código en `src/app/datos/app/v1/` y
`src/lib/app-movil/datos.ts` del sitio). Las respuestas se guardan 5 minutos
en el borde: un millón de aperturas no son un millón de consultas a la base.

Un país que el servidor apaga devuelve a la persona a la bienvenida la próxima
vez que abre la app.

## Cómo se prueba

- Las piezas puras (precio, direcciones, textos, reglas de la casa) las prueba
  el sitio: `tests/unit/app-movil-pantallas.test.ts` (corre en `npm run verify`).
- Tipos: `npm run typecheck` dentro de esta carpeta.
- En el simulador, contra el servidor local: crear `.env.local` con
  `EXPO_PUBLIC_API_URL=http://localhost:3000` (no se sube al repositorio),
  levantar el sitio con `npm run dev` en la raíz y aquí `npm run ios`.
- **La configuración de tipos hereda de `tsconfig.base.json`, una copia local
  de la de Expo.** No se cambia por `expo/tsconfig.base`: en GitHub la app no
  tiene sus paquetes y las pruebas del sitio se caen (pasó el 5 nov 2026). Hay
  prueba que lo vigila.

## La cuenta de Expo

La de la empresa, **windoce-llc**. La llave está en
`~/.config/mercatren/expo-token` (fuera del repositorio):

```bash
cd /Users/windocellc/Mercatren.com/app-movil && EXPO_TOKEN=$(cat ~/.config/mercatren/expo-token) npx eas-cli whoami
```

**Nada sube a las tiendas** hasta que Apple apruebe Divoox (orden de Gerencia)
y el auditor de tiendas dé su APTO.

### ⛔ Ninguna compilación de EAS sin permiso de Gerencia (5 nov 2026)

La cuenta windoce-llc llevaba **83 compilaciones por encima de lo incluido**
(unos 100 dólares de más). Desde el 5 nov 2026: **ningún `eas build` (ni
`eas update`, ni `eas submit`) sin el permiso escrito de Gerencia**, ni a mano
ni desde una tarea programada. Todo se prueba en el **simulador local**, que
es gratis: `npm run start` en esta carpeta y la app de desarrollo ya
instalada en el simulador.
