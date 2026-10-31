import SwiftUI
import WebKit

/// Una pestaña: la página del sitio, la barra de carga y el aviso nativo de
/// «sin conexión» con su botón para reintentar.
struct PestanaWeb: View {
    let inicial: URL
    let volverAlInicio: Int
    let textos: Textos

    @StateObject private var estado = EstadoWeb()

    var body: some View {
        ZStack(alignment: .top) {
            NavegadorWeb(inicial: inicial, volverAlInicio: volverAlInicio, estado: estado)
                .ignoresSafeArea(edges: .bottom)

            if estado.progreso > 0 && estado.progreso < 1 {
                ProgressView(value: estado.progreso)
                    .progressViewStyle(.linear)
                    .tint(Color(red: 1.0, green: 0.42, blue: 0.10))
                    .frame(height: 2)
            }

            if estado.sinConexion {
                VStack(spacing: 14) {
                    Image(systemName: "wifi.slash")
                        .font(.system(size: 44, weight: .regular))
                        .foregroundStyle(.secondary)
                    Text(textos.sinConexionTitulo).font(.title3.bold())
                    Text(textos.sinConexionTexto)
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button(textos.reintentar) { estado.pedirReintento() }
                        .buttonStyle(.borderedProminent)
                        .tint(Color(red: 1.0, green: 0.42, blue: 0.10))
                }
                .padding(32)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(.systemBackground))
            }
        }
    }
}

final class EstadoWeb: ObservableObject {
    @Published var progreso: Double = 0
    @Published var sinConexion = false
    @Published var reintentos = 0

    func pedirReintento() {
        sinConexion = false
        reintentos += 1
    }
}

/// La página en sí (WKWebView), con todo lo que hace que se sienta de la casa.
struct NavegadorWeb: UIViewRepresentable {
    let inicial: URL
    let volverAlInicio: Int
    @ObservedObject var estado: EstadoWeb

    func makeCoordinator() -> Coordinador { Coordinador(estado: estado) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        // La misma sesión en las cuatro pestañas y entre aperturas de la app.
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        // El sitio puede saber que lo abre la app (sin tocar nada más).
        config.applicationNameForUserAgent = "MercatrenApp-iOS/1.0"

        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.allowsBackForwardNavigationGestures = true
        web.scrollView.contentInsetAdjustmentBehavior = .automatic

        let recargar = UIRefreshControl()
        recargar.addTarget(context.coordinator, action: #selector(Coordinador.recargar(_:)), for: .valueChanged)
        web.scrollView.refreshControl = recargar

        context.coordinator.web = web
        context.coordinator.inicial = inicial
        context.coordinator.observarProgreso()
        web.load(URLRequest(url: inicial))
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        let c = context.coordinator
        if c.ultimoVolver != volverAlInicio {
            c.ultimoVolver = volverAlInicio
            web.load(URLRequest(url: inicial))
        }
        if c.ultimoReintento != estado.reintentos {
            c.ultimoReintento = estado.reintentos
            if web.url == nil { web.load(URLRequest(url: inicial)) } else { web.reload() }
        }
    }

    final class Coordinador: NSObject, WKNavigationDelegate, WKUIDelegate {
        let estado: EstadoWeb
        weak var web: WKWebView?
        var inicial: URL?
        var ultimoVolver = 0
        var ultimoReintento = 0
        private var observador: NSKeyValueObservation?

        init(estado: EstadoWeb) { self.estado = estado }

        func observarProgreso() {
            observador = web?.observe(\.estimatedProgress, options: [.new]) { [weak self] web, _ in
                DispatchQueue.main.async { self?.estado.progreso = web.estimatedProgress }
            }
        }

        @objc func recargar(_ control: UIRefreshControl) {
            web?.reload()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { control.endRefreshing() }
        }

        /// Lo de Mercatren y el pago se abren aquí; lo demás (WhatsApp,
        /// correo, teléfono, otros sitios), en su app o en Safari.
        func webView(_ webView: WKWebView, decidePolicyFor accion: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = accion.request.url else { return decisionHandler(.allow) }
            let esquema = url.scheme?.lowercased() ?? ""

            if ["tel", "mailto", "sms", "whatsapp", "itms-apps"].contains(esquema) {
                UIApplication.shared.open(url)
                return decisionHandler(.cancel)
            }
            // Los marcos internos (el pago, los videos) siempre cargan.
            if accion.targetFrame?.isMainFrame == false { return decisionHandler(.allow) }
            if esquema == "about" || esquema == "blob" || esquema == "data" { return decisionHandler(.allow) }
            if Sitio.esPropia(url) || Sitio.esDelPago(url) { return decisionHandler(.allow) }

            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        }

        /// Un enlace «en otra pestaña»: si es del sitio se abre aquí mismo.
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for accion: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = accion.request.url {
                if Sitio.esPropia(url) || Sitio.esDelPago(url) {
                    webView.load(accion.request)
                } else {
                    UIApplication.shared.open(url)
                }
            }
            return nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            estado.sinConexion = false
            webView.scrollView.refreshControl?.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            fallo(error)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            fallo(error)
        }

        /// Solo los fallos de red enseñan el aviso; cancelar una carga
        /// (tocar otro enlace a mitad de camino) no es un error.
        private func fallo(_ error: Error) {
            web?.scrollView.refreshControl?.endRefreshing()
            let e = error as NSError
            guard e.domain == NSURLErrorDomain, e.code != NSURLErrorCancelled else { return }
            let deRed = [NSURLErrorNotConnectedToInternet, NSURLErrorNetworkConnectionLost,
                         NSURLErrorTimedOut, NSURLErrorCannotFindHost, NSURLErrorCannotConnectToHost,
                         NSURLErrorDNSLookupFailed, NSURLErrorDataNotAllowed]
            if deRed.contains(e.code) { estado.sinConexion = true }
        }

        // Las ventanas de JavaScript del sitio (confirmar, avisos) como
        // ventanas nativas: sin esto, un «¿seguro?» se queda sin respuesta.
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage mensaje: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            presentar(mensaje, botones: [("OK", { completionHandler() })])
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage mensaje: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let es = Idioma.delTelefono == .es
            presentar(mensaje, botones: [
                (es ? "Cancelar" : "Cancel", { completionHandler(false) }),
                ("OK", { completionHandler(true) }),
            ])
        }

        private func presentar(_ mensaje: String, botones: [(String, () -> Void)]) {
            let alerta = UIAlertController(title: nil, message: mensaje, preferredStyle: .alert)
            for (titulo, accion) in botones {
                alerta.addAction(UIAlertAction(title: titulo, style: .default) { _ in accion() })
            }
            let escena = UIApplication.shared.connectedScenes.first as? UIWindowScene
            var arriba = escena?.windows.first(where: { $0.isKeyWindow })?.rootViewController
            while let siguiente = arriba?.presentedViewController { arriba = siguiente }
            if let arriba { arriba.present(alerta, animated: true) } else { botones.first?.1() }
        }
    }
}
