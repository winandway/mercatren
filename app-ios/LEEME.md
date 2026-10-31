# App de iPhone de Mercatren (App Store)

Una app nativa pequeña en SwiftUI que muestra mercatren.com con pestañas
propias (Inicio, Buscar, Carrito, Cuenta), deslizar para recargar, volver con
el gesto y una pantalla de «sin conexión». Cada publicación del sitio
actualiza la app sin pasar por la tienda, igual que la app de Android.

- Bundle ID: `com.mercatren.app` · equipo `7KM9P6R682` (Windoce LLC)
- El proyecto de Xcode NO se guarda: se genera con `xcodegen generate` desde
  `project.yml`.
- Compilar, firmar y subir a App Store Connect, en un comando:

```bash
cd /Users/windocellc/Mercatren.com && ./app-ios/subir.sh
```

La receta completa, la ficha, las capturas, la privacidad y las trampas:
`tienda-apps/app-store/PUBLICAR-EN-APPLE.md`.
