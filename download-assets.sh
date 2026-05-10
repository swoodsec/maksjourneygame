#!/usr/bin/env bash
# ============================================================
# Maks' Journey – PixelLab asset downloader
# Run after assets finish generating (see PixelLab dashboard)
# Usage: ./download-assets.sh
# ============================================================
set -euo pipefail

SPRITES="assets/sprites"
TILES="assets/tilesets"
mkdir -p "$SPRITES" "$TILES"

dl() {
  local dest="$1"; shift
  local url="$1";  shift
  if [ -z "$url" ] || [ "$url" = "PENDING" ]; then
    echo "  ⏳  $dest – not ready yet, skipping"
    return
  fi
  echo "  ⬇  $dest"
  curl -fsSL "$url" -o "$dest"
}

echo "=== Maks (hero) ==="
# Replace these URLs with the ones from PixelLab after generation completes.
# Character ID: 7c3d5749-96cc-4b3d-bb01-36bf25f3e221
# Use the 'east' direction for all walking/fighting sprites.
dl "$SPRITES/maks-idle.png"   "PENDING"
dl "$SPRITES/maks-walk.png"   "PENDING"
dl "$SPRITES/maks-run.png"    "PENDING"
dl "$SPRITES/maks-jump.png"   "PENDING"
dl "$SPRITES/maks-attack.png" "PENDING"
dl "$SPRITES/maks-hurt.png"   "PENDING"
dl "$SPRITES/maks-death.png"  "PENDING"

echo "=== German Soldier (enemy) ==="
# Character ID: 78af6659-ead7-43f0-9aee-8c46ebf38b1f
dl "$SPRITES/enemy-idle.png"   "PENDING"
dl "$SPRITES/enemy-walk.png"   "PENDING"
dl "$SPRITES/enemy-attack.png" "PENDING"
dl "$SPRITES/enemy-block.png"  "PENDING"
dl "$SPRITES/enemy-hurt.png"   "PENDING"
dl "$SPRITES/enemy-death.png"  "PENDING"

echo "=== Owl Advisor ==="
# Character ID: 8407df99-a331-41cf-b00c-d820af3e3c81
dl "$SPRITES/owl.png" "PENDING"

echo "=== Objects ==="
# Key      ID: 64e2c495-e19e-49dd-ba37-c2876d496d8e
# Door     ID: ee6f263c-3320-4da3-92ad-1728b081a18d
# Log pile ID: e84fdbd9-e76e-4587-b91a-8f24b9f6c9c9
dl "$SPRITES/key.png"     "PENDING"
dl "$SPRITES/door.png"    "PENDING"
dl "$SPRITES/logpile.png" "PENDING"

echo ""
echo "✅ Done. Refresh index.html in your browser to see the real sprites."
