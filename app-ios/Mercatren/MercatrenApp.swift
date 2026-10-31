import SwiftUI

/// La app de Mercatren para iPhone (31 oct 2026).
///
/// Es el sitio mercatren.com con una barra de pestañas nativa: cada
/// publicación del sitio actualiza la app sin pasar por la tienda, igual que
/// la app de Android. Lo nativo es lo que el sitio no puede hacer solo: las
/// pestañas, deslizar para recargar, volver con el gesto y avisar cuando no
/// hay internet.
@main
struct MercatrenApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
