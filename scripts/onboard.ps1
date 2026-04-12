# =============================================================================
# onboard.ps1 — Windows PowerShell project onboarding wrapper
# =============================================================================
# Drop new brochure PDFs into:
#   data\Completed\   <- completed project brochures
#   data\Ongoing\     <- ongoing project brochures
#
# Then run (from the repo root in PowerShell):
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # first time only
#   .\scripts\onboard.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir

# ── Colour helpers ────────────────────────────────────────────────────────────
function ok   { param($msg) Write-Host "  [OK] $msg"      -ForegroundColor Green  }
function warn { param($msg) Write-Host "  [!]  $msg"      -ForegroundColor Yellow }
function err  { param($msg) Write-Host "  [X]  $msg"      -ForegroundColor Red    }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║     Meghana Manoj Constructions — Project Onboarding     ║"
Write-Host "╚══════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "Checking dependencies..."

$missing = @()

# Check Node.js
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) { ok "node found ($($nodeCmd.Source))" }
else          { err "node not found"; $missing += "node" }

# Check pdftotext
$pdftotextCmd = Get-Command pdftotext -ErrorAction SilentlyContinue
if ($pdftotextCmd) { ok "pdftotext found" }
else               { err "pdftotext not found"; $missing += "pdftotext" }

# Check pdftoppm
$pdftoppmCmd = Get-Command pdftoppm -ErrorAction SilentlyContinue
if ($pdftoppmCmd) { ok "pdftoppm found" }
else              { err "pdftoppm not found"; $missing += "pdftoppm" }

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing dependencies: $($missing -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install instructions:"
    Write-Host ""

    if ($missing -contains "node") {
        Write-Host "  Node.js:"
        Write-Host "    Download from https://nodejs.org/en/download"
        Write-Host "    Or via winget: winget install OpenJS.NodeJS"
        Write-Host ""
    }

    if (($missing -contains "pdftotext") -or ($missing -contains "pdftoppm")) {
        Write-Host "  Poppler (pdftotext + pdftoppm):"
        Write-Host "    1. Download the latest release from:"
        Write-Host "       https://github.com/oschwartz10612/poppler-windows/releases"
        Write-Host "    2. Extract the zip, e.g. to C:\poppler"
        Write-Host "    3. Add C:\poppler\Library\bin to your PATH:"
        Write-Host "       System Properties > Environment Variables > Path > New"
        Write-Host "    4. Restart PowerShell and re-run this script."
        Write-Host ""
        Write-Host "    Or via conda:  conda install -c conda-forge poppler"
        Write-Host "    Or via scoop:  scoop install poppler"
        Write-Host ""
    }

    exit 1
}

Write-Host ""
Write-Host "Running onboarding script..."
Write-Host ""

Set-Location $Root
node scripts/onboard.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    err "Onboarding script exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
