#!/usr/bin/env python3
"""
onboard.py — Meghana Manoj Constructions · Project Onboarding Script
---------------------------------------------------------------------
DROP new brochure PDFs into:
    data/Completed/   ← completed project brochures
    data/Ongoing/     ← ongoing project brochures

Then run:
    python3 scripts/onboard.py

For each loose PDF the script will:
  1. Extract and display PDF text so you can read project details
  2. Prompt for required fields (ID, name, location, specs …)
  3. Create the project folder and extract page images
  4. Append the entry to both the .js and .json data files (kept in sync)
  5. Move the original PDF to data/Processed/<Completed|Ongoing>/
  6. Geocode all new projects and refresh data/projects/maps.js

Requirements
------------
  Python  >= 3.8   (standard library only — no pip packages needed)
  poppler tools on PATH:
      macOS:   brew install poppler
      Linux:   sudo apt-get install poppler-utils
      Windows: https://github.com/oschwartz10612/poppler-windows/releases
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT          = Path(__file__).resolve().parent.parent
COMPLETED_DIR = ROOT / "data" / "Completed"
ONGOING_DIR   = ROOT / "data" / "Ongoing"
PROCESSED_DIR = ROOT / "data" / "Processed"

DATA = {
    "completed": {
        "js":           ROOT / "data" / "projects" / "completed.js",
        "json":         ROOT / "data" / "projects" / "completed.json",
        "js_var":       "COMPLETED_PROJECTS",
        "project_dir":  COMPLETED_DIR,
        "processed_dir": PROCESSED_DIR / "Completed",
    },
    "ongoing": {
        "js":           ROOT / "data" / "projects" / "ongoing.js",
        "json":         ROOT / "data" / "projects" / "ongoing.json",
        "js_var":       "ONGOING_PROJECTS",
        "project_dir":  ONGOING_DIR,
        "processed_dir": PROCESSED_DIR / "Ongoing",
    },
}

# ── Terminal colours (degrade gracefully on Windows) ──────────────────────────

def _supports_colour():
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty() and os.name != "nt"

def _c(code, text):
    return f"\033[{code}m{text}\033[0m" if _supports_colour() else text

ok   = lambda t: print(f"  {_c('32', '✔')} {t}")
warn = lambda t: print(f"  {_c('33', '⚠')} {t}")
err  = lambda t: print(f"  {_c('31', '✗')} {t}")

# ── Dependency check ──────────────────────────────────────────────────────────

def check_deps():
    missing = []
    for cmd in ("pdftotext", "pdftoppm"):
        if not shutil.which(cmd):
            missing.append(cmd)
    if missing:
        err(f"Missing tools: {', '.join(missing)}")
        print("\nInstall poppler:")
        print("  macOS:   brew install poppler")
        print("  Ubuntu:  sudo apt-get install poppler-utils")
        print("  Windows: https://github.com/oschwartz10612/poppler-windows/releases")
        sys.exit(1)

# ── Prompt helpers ────────────────────────────────────────────────────────────

def ask(prompt, default=""):
    hint = f" [{default}]" if default else ""
    try:
        val = input(f"  {prompt}{hint}: ").strip()
        return val or default
    except (EOFError, KeyboardInterrupt):
        print()
        sys.exit(0)

def ask_required(prompt):
    while True:
        val = ask(prompt)
        if val:
            return val
        print("  (required — please enter a value)")

# ── ID helpers ────────────────────────────────────────────────────────────────

def slugify(text):
    text = re.sub(r"[^a-z0-9\s-]", "", text.lower())
    text = re.sub(r"[\s_]+", "-", text.strip())
    return re.sub(r"-+", "-", text).strip("-")

def load_all_ids():
    ids = set()
    for cfg in DATA.values():
        try:
            entries = json.loads(cfg["json"].read_text(encoding="utf-8"))
            ids.update(e["id"] for e in entries)
        except Exception:
            pass
    return ids

# ── PDF tools ─────────────────────────────────────────────────────────────────

def pdf_to_text(pdf_path):
    try:
        result = subprocess.run(
            ["pdftotext", str(pdf_path), "-"],
            capture_output=True, text=True
        )
        return result.stdout
    except Exception:
        return ""

def extract_images(pdf_path, out_dir):
    """Run pdftoppm, rename outputs page-01.jpg → page-1.jpg, copy page-1 as building.png."""
    subprocess.run(
        ["pdftoppm", "-jpeg", "-r", "150", str(pdf_path), str(out_dir / "page")],
        check=True, capture_output=True
    )
    pages = []
    for f in sorted(out_dir.glob("page-*.jpg")):
        num = int(re.sub(r"^page-0*", "", f.stem))
        renamed = out_dir / f"page-{num}.jpg"
        if f != renamed:
            f.rename(renamed)
        pages.append(f"page-{num}")

    cover = out_dir / "page-1.jpg"
    if cover.exists():
        shutil.copy2(cover, out_dir / "building.png")

    return pages  # e.g. ["page-1", "page-2"]

# ── Loose PDF scanner ─────────────────────────────────────────────────────────

def find_loose_pdfs(directory):
    directory = Path(directory)
    if not directory.exists():
        return []
    return [
        f for f in directory.iterdir()
        if f.is_file() and f.suffix.lower() == ".pdf"
    ]

# ── JS / JSON writers ─────────────────────────────────────────────────────────

def append_to_json(json_path, entry):
    data = json.loads(json_path.read_text(encoding="utf-8"))
    data.append(entry)
    json_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def _py_to_js_value(val, depth=1):
    """Recursively serialise a Python value to JS source (not JSON)."""
    pad  = "  " * depth
    pad2 = "  " * (depth + 1)

    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, str):
        escaped = val.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    if isinstance(val, list):
        if not val:
            return "[]"
        # Array of arrays (specs / meta)
        if isinstance(val[0], list):
            rows = [f"{pad2}[{', '.join(_py_to_js_value(c) for c in row)}]" for row in val]
            return "[\n" + ",\n".join(rows) + f"\n{pad}]"
        # Short string array
        items = [f"{pad2}{_py_to_js_value(item, depth + 1)}" for item in val]
        return "[\n" + ",\n".join(items) + f"\n{pad}]"
    if isinstance(val, dict):
        lines = []
        for k, v in val.items():
            lines.append(f"{pad2}{k}: {_py_to_js_value(v, depth + 1)}")
        return "{\n" + ",\n".join(lines) + f"\n{pad}}}"
    return json.dumps(val)

def _entry_to_js_block(entry, indent=2):
    pad  = "  " * indent
    pad2 = "  " * (indent + 1)
    lines = [f"{pad}{{"]
    keys = list(entry.keys())
    for i, k in enumerate(keys):
        val_src = _py_to_js_value(entry[k], indent + 1)
        comma = "," if i < len(keys) - 1 else ""
        lines.append(f"{pad2}{k}: {val_src}{comma}")
    lines.append(f"{pad}}}")
    return "\n".join(lines)

def append_to_js(js_path, entry):
    src = js_path.read_text(encoding="utf-8")
    block = _entry_to_js_block(entry)

    # Insert before closing ];
    close_idx = src.rfind("];")
    if close_idx == -1:
        raise ValueError(f"Cannot find ]; in {js_path}")

    before = src[:close_idx].rstrip()
    # Ensure trailing comma after the previous entry
    if before.endswith("}"):
        before += ","
    new_src = before + "\n" + block + "\n];\n"
    js_path.write_text(new_src, encoding="utf-8")

# ── Maps resolution (no external deps) ───────────────────────────────────────

def resolve_redirect(short_url, max_hops=5):
    """Follow redirects and return the final URL."""
    current = short_url
    for _ in range(max_hops):
        try:
            req = urllib.request.Request(
                current,
                method="HEAD",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            # Don't follow automatically so we can inspect headers
            opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler())
            # Use GET for short URL services that don't respond to HEAD
            req2 = urllib.request.Request(current, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req2, timeout=10)
            return resp.url
        except urllib.error.HTTPError as e:
            if e.url:
                current = e.url
            else:
                break
        except Exception:
            break
    return current

def extract_coords(full_url):
    patterns = [
        r"/@(-?\d+\.\d+),(-?\d+\.\d+)",
        r"/place/(-?\d+\.\d+),(-?\d+\.\d+)",
        r"[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)",
    ]
    for pat in patterns:
        m = re.search(pat, full_url)
        if m:
            return m.group(1), m.group(2)
    return None, None

def geocode(address):
    query = urllib.parse.urlencode({"q": address + ", India", "format": "json", "limit": "1"})
    url   = f"https://nominatim.openstreetmap.org/search?{query}"
    try:
        req  = urllib.request.Request(url, headers={"User-Agent": "onboard.py/1.0 (mm-constructions)"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode())
        if data:
            return data[0]["lat"], data[0]["lon"]
    except Exception:
        pass
    return None, None

def build_embed_url(lat, lng, zoom=17):
    return f"https://maps.google.com/maps?q={lat},{lng}&z={zoom}&output=embed"

def refresh_maps():
    """Regenerate data/projects/maps.js from all project data files."""
    print("\nRefreshing map coordinates…")
    maps_out = ROOT / "data" / "projects" / "maps.js"
    embeds   = {}

    for type_key, cfg in DATA.items():
        try:
            projects = json.loads(cfg["json"].read_text(encoding="utf-8"))
        except Exception:
            continue

        for p in projects:
            pid = p.get("id")
            if not pid:
                continue

            lat, lng = None, None

            # Strategy 1: resolve mapsUrl short link
            if p.get("mapsUrl"):
                print(f"  [{pid}] Resolving mapsUrl…")
                final = resolve_redirect(p["mapsUrl"])
                lat, lng = extract_coords(final or "")
                if lat:
                    print(f"    → {lat}, {lng}")

            # Strategy 2: geocode mapsQuery
            if not lat and p.get("mapsQuery"):
                address = p["mapsQuery"].replace("+", " ")
                print(f"  [{pid}] Geocoding: {address}")
                time.sleep(1.1)  # Nominatim rate limit
                lat, lng = geocode(address)
                if lat:
                    print(f"    → {lat}, {lng}")
                else:
                    # Retry with last 3 words
                    parts    = address.split()
                    fallback = " ".join(parts[max(0, len(parts) - 3):])
                    if fallback != address:
                        print(f"    Retrying: {fallback}")
                        time.sleep(1.1)
                        lat, lng = geocode(fallback)
                        if lat:
                            print(f"    → {lat}, {lng}")

            if lat:
                embeds[pid] = build_embed_url(lat, lng)
            else:
                print(f"    Could not resolve coordinates for {pid}")

    lines     = [f'  "{pid}": "{url}"' for pid, url in embeds.items()]
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    content   = (
        "// Auto-generated by scripts/onboard.py — do not edit manually.\n"
        f"// Generated: {timestamp}\n"
        "const MAPS_EMBEDS = {\n"
        + ",\n".join(lines)
        + "\n};\n"
    )
    maps_out.write_text(content, encoding="utf-8")
    print(f"  Wrote {len(embeds)} embed URLs → data/projects/maps.js")

# ── Interactive field prompts ─────────────────────────────────────────────────

def prompt_id(suggested, existing_ids):
    while True:
        raw = ask("Project ID (unique slug)", suggested)
        pid = slugify(raw)
        if not pid:
            print("  (ID cannot be empty)")
            continue
        if pid in existing_ids:
            print(f'  ✗  ID "{pid}" already exists — choose a different one.')
        else:
            return pid

def show_pdf_preview(text):
    print("\n" + "─" * 60)
    print("PDF CONTENT PREVIEW (first 40 lines):")
    print("─" * 60)
    for line in text.splitlines()[:40]:
        print("  " + line)
    print("─" * 60 + "\n")

def prompt_specs(initial_rows):
    print("\n  Add project specs (key–value rows). Leave key blank to finish.")
    specs = list(initial_rows)
    while True:
        key = ask("  Spec key   (Enter to finish)")
        if not key:
            break
        val = ask_required("  Spec value")
        specs.append([key, val])
    return specs

def collect_completed_fields(pdf_text, pdf_name, existing_ids):
    suggested = slugify(re.sub(r"^\d+-", "", Path(pdf_name).stem))
    show_pdf_preview(pdf_text)

    pid      = prompt_id(suggested, existing_ids)
    name     = ask_required("Project Name  (e.g. Meghana Manoj Enclave)")
    tag      = ask("Tag", "Residential")
    short_loc = ask_required("Short Location  (e.g. Dindayal Nagar, Malkajgiri)")
    location = ask_required("Full Location   (e.g. Dindayal Nagar, Road No-6, Malkajgiri)")
    motto    = ask("Motto / Tagline", "Not Just A Home, Also Your Dream")
    maps_q   = ask("Maps Query  (words joined by +)", slugify(location).replace("-", "+"))
    maps_url = ask("Google Maps share URL  (optional)")
    desc     = ask_required("Description  (1–2 sentences)")

    specs = prompt_specs([
        ["Type",     f"{tag} Apartments"],
        ["Location", location],
        ["Status",   "Completed & Handed Over"],
    ])

    entry = {
        "id": pid, "name": name, "tag": tag, "shortLoc": short_loc,
        "motto": f'"{motto}"', "location": location, "mapsQuery": maps_q,
        "dataDir": f"data/Completed/{pid}",
        "pdf":     f"data/Completed/{pid}/brochure.pdf",
        "floorplan": [],  # filled after image extraction
        "brochure":  [],
        "desc": desc, "specs": specs,
    }
    if maps_url:
        entry["mapsUrl"] = maps_url
    return entry

def collect_ongoing_fields(pdf_text, pdf_name, existing_ids):
    suggested = slugify(re.sub(r"^\d+-", "", Path(pdf_name).stem))
    show_pdf_preview(pdf_text)

    pid       = prompt_id(suggested, existing_ids)
    name      = ask_required("Project Name")
    tag       = ask("Tag", "Residential")
    short_loc = ask_required("Short Location")
    location  = ask_required("Full Location")
    motto     = ask("Motto / Tagline", "Quality Homes, Trusted Builder")
    maps_q    = ask("Maps Query  (words joined by +)", slugify(location).replace("-", "+"))
    maps_url  = ask("Google Maps share URL  (optional)")
    desc      = ask_required("Description  (1–2 sentences)")
    pct       = int(ask("Construction progress %", "50"))
    label     = ask("Progress label", "Construction in progress")
    note      = ask("Progress note",  "Structure and finishing works underway.")
    unit_area = ask("Unit area  (e.g. 1200 SFT)")
    unit_type = ask("Unit type  (e.g. 2 & 3 BHK Apartments)")

    specs = prompt_specs([
        ["Location", location],
        ["Type",     f"{tag} Apartments"],
        ["Status",   "Ongoing — Limited Units Available"],
    ])

    meta = [
        [short_loc,           "Location"],
        ["Limited Units",     "Availability"],
        [unit_area or "Spacious", "Area" if unit_area else "Apartments"],
    ]

    entry = {
        "id": pid, "name": name, "tag": tag, "shortLoc": short_loc,
        "motto": f'"{motto}"', "location": location, "mapsQuery": maps_q,
        "dataDir":   f"data/Ongoing/{pid}",
        "pdf":       f"data/Ongoing/{pid}/brochure.pdf",
        "thumbnail": f"data/Ongoing/{pid}/building.png",
        "floorplan": [],
        "brochure":  [],
        "desc": desc, "meta": meta,
        "progress": {"label": label, "percent": pct, "note": note},
        "specs": specs,
    }
    if maps_url:
        entry["mapsUrl"] = maps_url
    return entry

# ── Process one PDF ───────────────────────────────────────────────────────────

def process_pdf(pdf_path, type_key):
    cfg         = DATA[type_key]
    existing_ids = load_all_ids()
    pdf_path    = Path(pdf_path)
    pdf_text    = pdf_to_text(pdf_path)

    print(f"\n{'═' * 60}")
    print(f"Processing [{type_key.upper()}]: {pdf_path.name}")
    print("═" * 60)

    if type_key == "completed":
        entry = collect_completed_fields(pdf_text, pdf_path.name, existing_ids)
    else:
        entry = collect_ongoing_fields(pdf_text, pdf_path.name, existing_ids)

    pid         = entry["id"]
    project_dir = cfg["project_dir"] / pid
    project_dir.mkdir(parents=True, exist_ok=True)

    # Copy PDF
    brochure_dest = project_dir / "brochure.pdf"
    shutil.copy2(pdf_path, brochure_dest)
    ok(f"Copied PDF → {brochure_dest.relative_to(ROOT)}")

    # Extract images
    print("  Extracting page images…")
    pages = extract_images(brochure_dest, project_dir)
    ok(f"{len(pages)} page(s): {', '.join(pages)}")

    # Fill image paths into entry
    dir_prefix      = entry["dataDir"]
    entry["floorplan"] = [f"{dir_prefix}/page-2.jpg"] if len(pages) >= 2 else [f"{dir_prefix}/page-1.jpg"]
    entry["brochure"]  = [f"{dir_prefix}/{p}.jpg" for p in pages]

    # Write data files
    append_to_json(cfg["json"], entry)
    append_to_js(cfg["js"], entry)
    ok(f"Added to {cfg['js'].relative_to(ROOT)}")
    ok(f"Added to {cfg['json'].relative_to(ROOT)}")

    # Move original PDF to Processed/
    cfg["processed_dir"].mkdir(parents=True, exist_ok=True)
    dest = cfg["processed_dir"] / pdf_path.name
    shutil.move(str(pdf_path), dest)
    ok(f"Moved original PDF → {dest.relative_to(ROOT)}")

    print(f'\n  ✅  "{entry["name"]}" ({pid}) onboarded successfully.')
    return True

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║     Meghana Manoj Constructions — Project Onboarding     ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    check_deps()

    # Change to repo root so relative paths in data files resolve correctly
    os.chdir(ROOT)

    completed_pdfs = find_loose_pdfs(COMPLETED_DIR)
    ongoing_pdfs   = find_loose_pdfs(ONGOING_DIR)
    total          = len(completed_pdfs) + len(ongoing_pdfs)

    if total == 0:
        print("No new PDFs found in data/Completed/ or data/Ongoing/.")
        print("Drop brochure PDFs into those folders and re-run.\n")
        return

    print(f"Found {total} new PDF(s) to onboard:")
    for p in completed_pdfs:
        print(f"  [completed] {p.name}")
    for p in ongoing_pdfs:
        print(f"  [ongoing]   {p.name}")
    print()

    processed = 0
    for pdf in completed_pdfs:
        try:
            process_pdf(pdf, "completed")
            processed += 1
        except KeyboardInterrupt:
            print("\n  Skipping…")
        except Exception as e:
            err(f"Error processing {pdf.name}: {e}")

    for pdf in ongoing_pdfs:
        try:
            process_pdf(pdf, "ongoing")
            processed += 1
        except KeyboardInterrupt:
            print("\n  Skipping…")
        except Exception as e:
            err(f"Error processing {pdf.name}: {e}")

    if processed:
        refresh_maps()
        print(f"\n✅  Onboarding complete. {processed}/{total} PDF(s) processed.")
        print("    Reload index.html in your browser to see the new projects.\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nAborted.\n")
        sys.exit(0)
