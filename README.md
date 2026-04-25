# Meghana Manoj Constructions & Builders

Official website for **Meghana Manoj Constructions & Builders**, Hyderabad — a premium construction firm established in 2015, building on experience since 2002 (Meghana Constructions).

## Overview

A single-page static website showcasing the company's services, completed projects, ongoing work, client testimonials, and a WhatsApp-integrated quote request form.

All project content is data-driven. Adding a new project requires only dropping a PDF into the right folder and running the onboarding script — no code changes needed.

## Repository Structure

```
index.html              — Main single-page site
styles.css              — All styles
js/
  app.js                — Scroll reveal, nav behaviour, quote form, PDF.js viewer
  projects.js           — Project card rendering and modal logic
data/
  Completed/
    <id>/               — One folder per completed project
      brochure.pdf      — Full brochure PDF
      building.png      — Cover image (shown on card)
      page-1.jpg        — Brochure cover page
      page-2.jpg        — Floor plan page
  Ongoing/
    <id>/               — One folder per ongoing project (same layout)
  Processed/
    Completed/          — Original PDFs after onboarding (archive)
    Ongoing/            — Original PDFs after onboarding (archive)
  projects/
    completed.js        — Completed project data (browser global)
    completed.json      — Same data as JSON (tooling / sync source)
    ongoing.js          — Ongoing project data (browser global)
    ongoing.json        — Same data as JSON
    maps.js             — AUTO-GENERATED map embed URLs (do not edit)
  Meghana_Manoj_Logo.PNG
scripts/
  onboard.py            — Standalone onboarding script (Python 3, no npm needed)
  onboard.js            — Core interactive onboarding script (Node.js)
  onboard.sh            — Mac/Linux onboarding wrapper (Node.js)
  onboard.ps1           — Windows onboarding wrapper (Node.js)
  resolve-maps.js       — Regenerates data/projects/maps.js
docs/
  ONBOARDING.md         — Full onboarding guide for developers
VERSION                 — Current release version
```

## Adding a New Project

Drop the brochure PDF into `data/Completed/` or `data/Ongoing/` and run:

```bash
# Python — works on any OS, no Node.js needed (recommended)
python3 scripts/onboard.py

# macOS / Linux (requires Node.js)
./scripts/onboard.sh

# Windows PowerShell (requires Node.js)
.\scripts\onboard.ps1
```

The script guides you through the required fields, creates the folder structure,
extracts page images, updates the data files, and moves the PDF to `data/Processed/`.

See [docs/ONBOARDING.md](docs/ONBOARDING.md) for the full guide, schema reference,
and dependency installation instructions.

## Running Locally

The data files use `<script>` tags and cannot be opened via `file://`. Use a local server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080).

## Key Features

- Completed & ongoing project galleries with modal detail view (floor plans, brochure PDF, location map)
- PDF viewer powered by PDF.js (in-browser, no download required)
- Brochure download saves as `<Project Name>-brochure.pdf`
- Precise Google Maps pins for every project (auto-resolved from share URLs or geocoded)
- Quote form that composes a structured WhatsApp message
- Scroll-reveal animations, sticky nav, floating WhatsApp button

## Scripts Reference

| Script            | Command                        | Purpose                                      |
| ----------------- | ------------------------------ | -------------------------------------------- |
| `onboard.py`      | `python3 scripts/onboard.py`   | **Any OS:** onboard new PDFs (no npm needed) |
| `onboard.sh`      | `./scripts/onboard.sh`         | Mac/Linux: onboard new PDFs (Node.js)        |
| `onboard.ps1`     | `.\scripts\onboard.ps1`        | Windows: onboard new PDFs (Node.js)          |
| `resolve-maps.js` | `node scripts/resolve-maps.js` | Refresh all map embed URLs                   |

## Version

See [VERSION](VERSION) for the current release. Versioned via git tags (`vX.Y.Z`).
