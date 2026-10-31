import SwiftUI

/// Las cuatro pestañas. Cada una tiene su propia página, y todas comparten la
/// sesión: se entra una vez y se está dentro en las cuatro.
struct ContentView: View {
    private let idioma = Idioma.delTelefono
    private var textos: Textos { Textos.de(idioma) }

    @State private var pestana = 0
    /// Tocar la pestaña en la que ya se está la devuelve a su inicio.
    @State private var volverAlInicio = [0, 0, 0, 0]

    var body: some View {
        TabView(selection: seleccion) {
            PestanaWeb(inicial: Sitio.url("", idioma), volverAlInicio: volverAlInicio[0], textos: textos)
                .tabItem { Label(textos.inicio, systemImage: "house") }
                .tag(0)
            PestanaWeb(inicial: Sitio.url("/catalogo", idioma), volverAlInicio: volverAlInicio[1], textos: textos)
                .tabItem { Label(textos.buscar, systemImage: "magnifyingglass") }
                .tag(1)
            PestanaWeb(inicial: Sitio.url("/carrito", idioma), volverAlInicio: volverAlInicio[2], textos: textos)
                .tabItem { Label(textos.carrito, systemImage: "cart") }
                .tag(2)
            PestanaWeb(inicial: Sitio.url("/cuenta", idioma), volverAlInicio: volverAlInicio[3], textos: textos)
                .tabItem { Label(textos.cuenta, systemImage: "person.crop.circle") }
                .tag(3)
        }
        .tint(Color(red: 1.0, green: 0.42, blue: 0.10))
    }

    private var seleccion: Binding<Int> {
        Binding(
            get: { pestana },
            set: { nueva in
                if nueva == pestana { volverAlInicio[nueva] += 1 }
                pestana = nueva
            }
        )
    }
}
