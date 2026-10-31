import Foundation

/// El idioma del teléfono decide el del sitio y el de las pestañas: español
/// si el teléfono está en español, inglés en todo lo demás.
enum Idioma: String {
    case es, en

    static var delTelefono: Idioma {
        let primero = Locale.preferredLanguages.first?.lowercased() ?? "en"
        return primero.hasPrefix("es") ? .es : .en
    }
}

/// Lo que se lee en la pantalla nativa (el resto lo pone el sitio).
struct Textos {
    let inicio: String
    let buscar: String
    let carrito: String
    let cuenta: String
    let sinConexionTitulo: String
    let sinConexionTexto: String
    let reintentar: String

    static func de(_ idioma: Idioma) -> Textos {
        switch idioma {
        case .es:
            return Textos(
                inicio: "Inicio",
                buscar: "Buscar",
                carrito: "Carrito",
                cuenta: "Cuenta",
                sinConexionTitulo: "Sin conexión",
                sinConexionTexto: "Revisa tu internet y vuelve a intentarlo.",
                reintentar: "Reintentar"
            )
        case .en:
            return Textos(
                inicio: "Home",
                buscar: "Search",
                carrito: "Cart",
                cuenta: "Account",
                sinConexionTitulo: "You're offline",
                sinConexionTexto: "Check your internet connection and try again.",
                reintentar: "Try again"
            )
        }
    }
}

/// Las direcciones del sitio que abre cada pestaña.
enum Sitio {
    static let dominio = "mercatren.com"

    static func url(_ ruta: String, _ idioma: Idioma) -> URL {
        URL(string: "https://\(dominio)/\(idioma.rawValue)\(ruta)")!
    }

    /// ¿Esta dirección es de Mercatren? Lo demás se abre fuera de la app.
    static func esPropia(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return host == dominio || host.hasSuffix(".\(dominio)")
    }

    /// El pago con tarjeta corre en la página: Stripe necesita cargar sus
    /// marcos y, para algunos bancos, su verificación (3D Secure).
    static func esDelPago(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return ["stripe.com", "stripe.network", "stripecdn.com"].contains {
            host == $0 || host.hasSuffix(".\($0)")
        }
    }
}
