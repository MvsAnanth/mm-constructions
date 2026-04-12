#!/usr/bin/env bash
# =============================================================================
# onboard.sh — Mac / Linux project onboarding wrapper
# =============================================================================
# Drop new brochure PDFs into:
#   data/Completed/   ← completed project brochures
#   data/Ongoing/     ← ongoing project brochures
#
# Then run:
#   chmod +x scripts/onboard.sh   # first time only
#   ./scripts/onboard.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*"; }

# ── Dependency checks ─────────────────────────────────────────────────────────
check_dep() {
  if ! command -v "$1" &>/dev/null; then
    err "Missing: $1"
    return 1
  fi
  ok "$1 found"
}

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Meghana Manoj Constructions — Project Onboarding     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Checking dependencies..."

MISSING=0

check_dep node        || MISSING=1
check_dep pdftotext   || MISSING=1
check_dep pdftoppm    || MISSING=1

if [[ $MISSING -eq 1 ]]; then
  echo ""
  echo "Install missing tools:"
  echo ""
  echo "  macOS:"
  echo "    brew install node poppler"
  echo ""
  echo "  Ubuntu / Debian:"
  echo "    sudo apt-get install nodejs poppler-utils"
  echo ""
  exit 1
fi

echo ""
echo "Running onboarding script..."
echo ""
cd "$ROOT"
node scripts/onboard.js
