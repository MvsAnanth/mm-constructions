# Meghana Manoj Constructions — Agent Guidelines & Rules

## Project Onboarding & Image Rules
- **Building Render Requirement:** When onboarding project brochures (into `data/Completed/<id>/` or `data/Ongoing/<id>/`), `building.png` and `thumbnail.png` / `thumbnail.jpg` **MUST** be the standalone 3D elevation/rendering of the building, **NOT** the full brochure cover or a raw copy of `page-1.jpg`.
- **Image Extraction:** Extract the standalone building rendering asset directly from the PDF (e.g. using `pdfimages -png -f 1 -l 1 brochure.pdf extracted/img`) or crop the building frame.
- **Data Sync:** Always keep `.json` and `.js` data files in `data/projects/` completely synchronized.
- **Maps:** Run `resolve-maps.js` or geocode addresses to update `data/projects/maps.js` whenever adding new projects.

## Git & Commit Conventions
- **No AI Attribution:** Never add `Co-Authored-By` or AI attribution trailers (e.g. Claude, Antigravity, Gemini) to git commit messages.
- **Confirmation:** Ensure commit messages and staged changes are clearly presented.
- **Versioning:** Always keep `VERSION` in sync with git release tags (`vX.Y.Z`).
