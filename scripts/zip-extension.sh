#!/bin/bash
set -e

# Emplacement des fichiers de ton extension
EXT_DIR="."  # ou "extension" si tu les as mis dans un sous-dossier
OUTPUT_DIR="dist"
OUTPUT="$OUTPUT_DIR/rythmos-extension.zip"

# Crée le dossier de sortie s’il n’existe pas
mkdir -p "$OUTPUT_DIR"

# Supprime le zip précédent s’il existe
rm -f "$OUTPUT"

echo "📦 Zippage de l’extension depuis $EXT_DIR → $OUTPUT"

# Compression
zip -r "$OUTPUT" "$EXT_DIR"/* -x "*.DS_Store" "*.git*" "node_modules/*" "scripts/*" "$OUTPUT_DIR/*"

echo "✅ Extension empaquetée avec succès : $OUTPUT"
