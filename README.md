# Meghana Manoj Constructions & Builders

Official website for **Meghana Manoj Constructions & Builders**, Hyderabad — a premium construction firm established in 2015, building on experience since 2002 (Meghna Constructions).

## Overview

A single-page static website showcasing the company's services, completed projects, ongoing work, client testimonials, and a WhatsApp-integrated quote request form.

## Structure

```
index.html          — Main single-page site
styles.css          — All styles
js/
  app.js            — Scroll reveal, nav behaviour, quote form (WhatsApp), PDF.js viewer
  projects.js       — Project card rendering and modal logic
data/
  projects/
    completed.js    — Completed project data
    ongoing.js      — Ongoing project data
    maps.js         — Google Maps embed URLs
  Meghana_Manoj_Logo.PNG
scripts/
  resolve-maps.js   — Utility: resolve Google Maps short URLs (Node)
  resolve-maps.py   — Utility: resolve Google Maps short URLs (Python)
VERSION             — Current release version
```

## Key Features

- Completed & ongoing project galleries with modal detail view (floor plans, brochure PDF, location map)
- PDF viewer powered by PDF.js (in-browser, no download required)
- Quote form that composes a structured WhatsApp message
- Scroll-reveal animations, sticky nav, floating WhatsApp button

## Version

See [VERSION](VERSION) for the current release. Versioned via git tags (`vX.Y.Z`).
