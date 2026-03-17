#!/usr/bin/env bash
set -euo pipefail

OUTFILE="arc.zip"
FILES=(
    manifest.json
    popup.html
    popup.js
    popup.css
    background.js
    lib/
    images/
)

rm -f "$OUTFILE"

echo "Packing:"
zip -r "$OUTFILE" "${FILES[@]}" | sed 's/^/  /'

SIZE=$(du -sh "$OUTFILE" | cut -f1)
echo ""
echo "Created $OUTFILE ($SIZE)"
