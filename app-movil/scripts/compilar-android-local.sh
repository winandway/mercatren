#!/usr/bin/env bash
# COMPILAR LA APP DE ANDROID EN ESTA COMPUTADORA, SIN EAS (7 nov 2026).
#
# Gerencia prohibió las compilaciones de EAS sin su permiso (5 nov 2026: 83 de
# más, unos 100 USD). Esta máquina tiene el SDK de Android y Java 17, así que el
# paquete para Google Play se arma aquí, gratis. Uso:
#   cd /Users/windocellc/Mercatren.com/app-movil && bash scripts/compilar-android-local.sh
# Deja el paquete firmado en app-movil/salidas/ (fuera de git).
#
# - La firma sale de ~/.config/mercatren/play-upload.properties (la misma llave
#   de subida de la app de Google Play, com.mercatren.app). Nunca entra al repo.
# - La dirección del servidor se FUERZA a producción: .env.local apunta a la
#   computadora local y, sin esto, el paquete saldría hablándole a localhost.
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export EXPO_PUBLIC_API_URL="https://mercatren.com"
export NODE_ENV=production
FIRMA="$HOME/.config/mercatren/play-upload.properties"
[ -f "$FIRMA" ] || { echo "Falta $FIRMA (la llave de subida de Google Play)"; exit 1; }

# 1. Lo nativo, generado de cero desde app.json (y package.json como estaba).
cp package.json /tmp/mercatren-package.json.bak
npx expo prebuild --platform android --clean --no-install
cp /tmp/mercatren-package.json.bak package.json

# 2. La firma de subida en el paquete de producción.
python3 -I - "$FIRMA" <<'PY'
import sys, re
p = "android/app/build.gradle"; s = open(p).read()
firma = sys.argv[1]
bloque = f'''
        subida {{
            def props = new Properties()
            file("{firma}").withInputStream {{ props.load(it) }}
            storeFile file(props["storeFile"])
            storePassword props["storePassword"]
            keyAlias props["keyAlias"]
            keyPassword props["keyPassword"]
        }}
'''
s = s.replace("    signingConfigs {\n", "    signingConfigs {\n" + bloque, 1)
i = s.index("        release {")
j = s.index("signingConfig signingConfigs.debug", i)
s = s[:j] + "signingConfig signingConfigs.subida" + s[j + len("signingConfig signingConfigs.debug"):]
open(p, "w").write(s)
PY

# 2b. Stripe trae una función de tarjetas para billeteras (push provisioning)
#     que no usamos y cuyas clases no vienen en el paquete: R8 se detiene si no
#     se le dice que las ignore.
printf '\n# Stripe: push provisioning no se usa (7 nov 2026)\n-dontwarn com.stripe.android.pushProvisioning.**\n' >> android/app/proguard-rules.pro

# 3. Compilar el paquete para la tienda (.aab) y uno instalable (.apk) para probarlo.
#    La revisión «lint» de la librería de Stripe pide una pieza privada de
#    Google (play-services-tapandpay) que no está en ningún repositorio público:
#    se salta esa revisión, no el código.
(cd android && ./gradlew --no-daemon bundleRelease assembleRelease \
  -x :stripe_stripe-react-native:lintVitalAnalyzeRelease)

mkdir -p salidas
VERSION=$(node -p "require('./app.json').expo.android.versionCode")
cp android/app/build/outputs/bundle/release/app-release.aab "salidas/mercatren-$VERSION.aab"
cp android/app/build/outputs/apk/release/app-release.apk "salidas/mercatren-$VERSION.apk"
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | tail -1)
"$BT/apksigner" verify --print-certs "salidas/mercatren-$VERSION.apk" | grep -i "SHA-256" | head -1
ls -la salidas/
