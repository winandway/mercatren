#!/bin/bash
# Compila la app de iPhone para la tienda, la firma y la sube a App Store
# Connect, sin contraseña: con la llave de la API de la cuenta, que vive FUERA
# del repositorio en ~/.config/mercatren/apple-asc. Ver app-ios/LEEME.md.
set -euo pipefail
cd "$(dirname "$0")"
LLAVE="$HOME/.config/mercatren/apple-asc"
SALIDA="${SALIDA:-$PWD/salida}"
mkdir -p "$SALIDA"
AUTH=(-allowProvisioningUpdates
  -authenticationKeyPath "$LLAVE/AuthKey.p8"
  -authenticationKeyID "$(cat "$LLAVE/key-id")"
  -authenticationKeyIssuerID "$(cat "$LLAVE/issuer-id")")

xcodegen generate
# SIN FIRMAR AL ARCHIVAR (31 oct 2026): con firma automática, el archivo se
# firma primero «de desarrollo», y eso exige un iPhone registrado en la cuenta.
# La firma de tienda (Apple Distribution) la pone la exportación de abajo.
xcodebuild -project Mercatren.xcodeproj -scheme Mercatren -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$SALIDA/Mercatren.xcarchive" \
  CODE_SIGNING_ALLOWED=NO archive
xcodebuild -exportArchive -archivePath "$SALIDA/Mercatren.xcarchive" \
  -exportOptionsPlist ExportOptions.plist -exportPath "$SALIDA/exportado" "${AUTH[@]}"
