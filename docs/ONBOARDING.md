# Project Onboarding Guide

This document explains how to add new construction projects to the Meghana Manoj
Constructions website.

---

## Overview

All project content is driven by two pairs of data files:

| File | Purpose |
|------|---------|
| `data/projects/completed.js` | Completed projects — loaded by the browser as a global JS variable |
| `data/projects/completed.json` | Same data as JSON — kept in sync for tooling / future API use |
| `data/projects/ongoing.js` | Ongoing projects — same pattern |
| `data/projects/ongoing.json` | Same data as JSON |
| `data/projects/maps.js` | **Auto-generated.** Map embed URLs keyed by project ID. Never edit manually. |

The UI reads from the `.js` files. The `.json` files are the canonical source of
truth for scripts. Both must always be in sync — the onboarding script writes to
both at the same time.

---

## Adding a New Project (the easy way)

1. **Get the project brochure PDF.**

2. **Drop it into the right folder:**
   - Completed project → `data/Completed/`
   - Ongoing project   → `data/Ongoing/`
   - The filename doesn't matter — the script will rename it `brochure.pdf`.

3. **Run the onboarding script** — choose whichever suits your machine:

   **Python (any OS — no npm/Node required):**
   ```bash
   python3 scripts/onboard.py
   ```

   **macOS / Linux (bash wrapper — requires Node.js):**
   ```bash
   ./scripts/onboard.sh
   ```

   **Windows (PowerShell wrapper — requires Node.js):**
   ```powershell
   .\scripts\onboard.ps1
   ```

4. **Answer the prompts.** The script shows you the first 40 lines of PDF text to
   help you fill in the details. Required fields are marked — press Enter to accept
   a suggested default.

5. **Done.** The script will:
   - Create `data/Completed/<id>/` or `data/Ongoing/<id>/`
   - Copy the PDF as `brochure.pdf` inside that folder
   - Extract `page-1.jpg`, `page-2.jpg`, `building.png` from the PDF
   - Append the project entry to both `.js` and `.json` data files
   - Move the original PDF to `data/Processed/Completed/` or `data/Processed/Ongoing/`
   - Run `node scripts/resolve-maps.js` to geocode the new project's location

---

## Dependencies

### Python script (`onboard.py`) — recommended

| Tool | Purpose | Install |
|------|---------|---------|
| `python3` ≥ 3.8 | Runs the script | [python.org](https://www.python.org/downloads/) — usually pre-installed |
| `pdftotext` | Extracts text from PDFs for preview | Part of **poppler** |
| `pdftoppm` | Renders PDF pages as JPG images | Part of **poppler** |

No pip packages required — only Python standard library.

### Node.js scripts (`onboard.sh` / `onboard.ps1`)

| Tool | Purpose | Install |
|------|---------|---------|
| `node` ≥ 14 | Runs the onboarding and map scripts | [nodejs.org](https://nodejs.org) |
| `pdftotext` | Extracts text from PDFs for preview | Part of **poppler** |
| `pdftoppm` | Renders PDF pages as JPG images | Part of **poppler** |

### Installing poppler

**macOS:**
```bash
brew install poppler
```

**Ubuntu / Debian:**
```bash
sudo apt-get install poppler-utils
```

**Windows:**
1. Download from [github.com/oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases)
2. Extract to e.g. `C:\poppler`
3. Add `C:\poppler\Library\bin` to your system `PATH`
4. Restart PowerShell

Alternative Windows installers:
```powershell
scoop install poppler        # via Scoop
conda install -c conda-forge poppler  # via conda
```

---

## Folder Structure

```
data/
├── Completed/
│   ├── manoj-heights/          ← one folder per project (named by ID)
│   │   ├── brochure.pdf        ← full brochure PDF
│   │   ├── building.png        ← cover image (= page-1.jpg copy)
│   │   ├── page-1.jpg          ← brochure cover page
│   │   └── page-2.jpg          ← floor plan page
│   └── ...
│
├── Ongoing/
│   └── manoj-castle/
│       ├── brochure.pdf
│       ├── building.png
│       ├── page-1.jpg
│       └── page-2.jpg
│
├── Processed/
│   ├── Completed/              ← original PDFs moved here after onboarding
│   └── Ongoing/                ← original PDFs moved here after onboarding
│
└── projects/
    ├── completed.js            ← browser data (global COMPLETED_PROJECTS array)
    ├── completed.json          ← same data as JSON
    ├── ongoing.js              ← browser data (global ONGOING_PROJECTS array)
    ├── ongoing.json            ← same data as JSON
    └── maps.js                 ← AUTO-GENERATED — do not edit manually
```

---

## Project ID Rules

- IDs are **unique slugs** across ALL projects (completed + ongoing).
- Format: lowercase letters, digits, hyphens only. Example: `manoj-enclave`.
- The ID becomes the folder name under `data/Completed/` or `data/Ongoing/`.
- The ID is used in `maps.js` as the key for the map embed URL.
- **Never reuse an ID**, even after a project moves from Ongoing → Completed.

If the onboarding script detects a duplicate ID it will ask you to choose a
different one before continuing.

---

## Data File Schema

### Completed project entry

```js
{
  id:        "manoj-enclave",             // unique slug
  name:      "Meghana Manoj Enclave",     // display name
  tag:       "Residential",              // card badge
  shortLoc:  "Dindayal Nagar, Malkajgiri", // shown on card
  motto:     '"Not Just A Home, Also Your Dream"', // shown in modal header
  location:  "Dindayal Nagar, Road No-6, Malkajgiri, Secunderabad",
  mapsQuery: "Dindayal+Nagar+Malkajgiri+Secunderabad+Hyderabad", // geocoding fallback
  mapsUrl:   "https://maps.app.goo.gl/...",  // optional — precise pin
  dataDir:   "data/Completed/manoj-enclave",
  pdf:       "data/Completed/manoj-enclave/brochure.pdf",
  floorplan: ["data/Completed/manoj-enclave/page-2.jpg"],
  brochure:  ["data/Completed/manoj-enclave/page-1.jpg",
              "data/Completed/manoj-enclave/page-2.jpg"],
  desc:      "One-paragraph description shown in the modal.",
  specs: [
    ["Type",     "Residential Apartments — 2 BHK"],
    ["Location", "Dindayal Nagar, Road No-6, Malkajgiri"],
    ["Status",   "Completed & Handed Over"],
    // ... add as many rows as needed
  ]
}
```

### Ongoing project entry (additional fields)

```js
{
  // ... same base fields as above ...
  thumbnail: "data/Ongoing/manoj-castle/building.png", // card image
  meta: [
    ["SaiRam, Malkajgiri", "Location"],
    ["Units 1 & 2",        "Availability"],
    ["1200 SFT",           "Area"]
  ],
  progress: {
    label:   "Finishing works",
    percent: 92,              // 0–100
    note:    "Structure complete. Final painting in progress."
  }
}
```

---

## Refreshing Map Coordinates

Map embed URLs are stored in `data/projects/maps.js` and are **auto-generated**.
The onboarding script runs this automatically, but you can also run it manually
at any time:

```bash
node scripts/resolve-maps.js
```

This script:
1. Reads all projects from both data files
2. For projects with a `mapsUrl` (short Google Maps link): follows the redirect to
   extract precise lat/lng coordinates
3. For projects with only `mapsQuery`: geocodes the address via Nominatim
4. Writes `data/projects/maps.js` with all embed URLs keyed by project ID

**When to run manually:**
- After adding a `mapsUrl` to a project that previously only had `mapsQuery`
- If a project's map pin looks wrong (re-geocoding may give better results)

---

## Keeping JS and JSON in Sync

The `.js` and `.json` files must always contain the same entries in the same order.
The onboarding script writes to both simultaneously.

**If you ever need to edit a project manually:**
1. Edit `completed.json` (valid JSON is easier to validate)
2. Regenerate `completed.js` from the JSON:
   ```bash
   node scripts/sync-data.js    # (see scripts/ for this utility)
   ```
   Or edit both files manually and keep them consistent.

> The browser uses the `.js` files. The `.json` files are for tooling.
> If they diverge, the site shows what's in `.js` and scripts work from `.json`.

---

## Running Locally

The site is static HTML. Because of browser security restrictions, the data files
**cannot be loaded via `file://`** (CORS). Use a local HTTP server:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080).

---

## Scripts Reference

| Script | How to run | Runtime | What it does |
|--------|-----------|---------|-------------|
| `scripts/onboard.py` | `python3 scripts/onboard.py` | Python 3 | **Recommended.** Standalone onboarding — no npm needed |
| `scripts/onboard.sh` | `./scripts/onboard.sh` | Node.js | Mac/Linux: check deps + run onboarding |
| `scripts/onboard.ps1` | `.\scripts\onboard.ps1` | Node.js | Windows: check deps + run onboarding |
| `scripts/onboard.js` | `node scripts/onboard.js` | Node.js | Core interactive onboarding logic (called by .sh/.ps1) |
| `scripts/resolve-maps.js` | `node scripts/resolve-maps.js` | Node.js | Regenerate `data/projects/maps.js` |

> `onboard.py` and `onboard.js` are functionally identical — use whichever runtime is available on your machine. Both write the same output.
