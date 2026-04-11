#!/usr/bin/env python3
"""
resolve-maps.py
---------------
Scans data/projects/completed.js and ongoing.js for any project that has
a mapsUrl but no mapsEmbed. Resolves the short link to coordinates and
injects a coordinate-based mapsEmbed so the embedded map shows a precise pin.

For projects that have mapsQuery but no mapsUrl/mapsEmbed, falls back to
geocoding via Nominatim (OpenStreetMap) to inject a coordinate-based embed.

Usage:
    python3 scripts/resolve-maps.py

Run this once after adding a new project with a mapsUrl. The data files
are updated in place — no other code changes needed.
"""

import re
import sys
import json
import time
import urllib.request
import urllib.parse

DATA_FILES = [
    'data/projects/completed.js',
    'data/projects/ongoing.js',
]

def resolve_url(short_url):
    """Follow redirects and return the final URL."""
    try:
        req = urllib.request.Request(
            short_url,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        res = urllib.request.urlopen(req, timeout=10)
        return res.url
    except Exception as e:
        print(f'  ERROR resolving {short_url}: {e}')
        return None

def extract_coords(full_url):
    """Extract lat,lng from a resolved Google Maps URL."""
    # Format: /@lat,lng,zoom  or  /place/lat,lng/
    match = re.search(r'/@(-?\d+\.\d+),(-?\d+\.\d+)', full_url)
    if match:
        return match.group(1), match.group(2)
    # Fallback: plain coordinates in path
    match = re.search(r'/place/(-?\d+\.\d+),(-?\d+\.\d+)', full_url)
    if match:
        return match.group(1), match.group(2)
    # Fallback: q=lat,lng in query string
    match = re.search(r'[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)', full_url)
    if match:
        return match.group(1), match.group(2)
    return None, None

def geocode_query(maps_query):
    """Geocode a mapsQuery string via Nominatim and return (lat, lng) or (None, None)."""
    # Convert URL-encoded plus-separated query to plain text
    address = maps_query.replace('+', ' ')
    params = urllib.parse.urlencode({'q': address, 'format': 'json', 'limit': '1'})
    url = f'https://nominatim.openstreetmap.org/search?{params}'
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'resolve-maps/1.0 (construction-website)'}
        )
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode())
        if data:
            return data[0]['lat'], data[0]['lon']
    except Exception as e:
        print(f'  ERROR geocoding "{address}": {e}')
    return None, None

def build_embed_url(lat, lng, zoom=17):
    return f'https://maps.google.com/maps?q={lat},{lng}&z={zoom}&output=embed'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # ── Pass 1: resolve mapsUrl entries that have no mapsEmbed ──
    pattern = re.compile(
        r'(mapsUrl:\s*"(https://maps\.app\.goo\.gl/[^"]+)",'
        r'\s*\n(?!\s*mapsEmbed:))'
    )

    matches = list(pattern.finditer(content))
    if matches:
        offset = 0
        for m in matches:
            url = m.group(2)
            print(f'  Resolving mapsUrl: {url}')
            full_url = resolve_url(url)
            if not full_url:
                continue
            lat, lng = extract_coords(full_url)
            if not lat:
                print(f'    Could not extract coordinates from: {full_url}')
                continue
            print(f'    Coordinates: {lat}, {lng}')
            embed_url = build_embed_url(lat, lng)
            insert_after = m.end() + offset
            insert_text = f'    mapsEmbed: "{embed_url}",\n'
            content = content[:insert_after] + insert_text + content[insert_after:]
            offset += len(insert_text)
    else:
        print(f'  {filepath}: no mapsUrl entries need resolving.')

    # ── Pass 2: geocode mapsQuery entries that still have no mapsEmbed ──
    # Find all project blocks: look for mapsQuery lines not preceded by mapsEmbed anywhere in that project
    # Strategy: find each mapsQuery line, then check if mapsEmbed exists nearby (within ~10 lines)
    lines = content.split('\n')
    new_lines = []
    i = 0
    changed_in_pass2 = False
    while i < len(lines):
        line = lines[i]
        mq_match = re.match(r'(\s*)mapsQuery:\s*"([^"]+)",', line)
        if mq_match:
            indent = mq_match.group(1)
            maps_query = mq_match.group(2)
            # Check if mapsEmbed already exists within the next 15 lines
            window = lines[i+1:i+16]
            has_embed = any('mapsEmbed:' in l for l in window)
            # Also check the previous 15 lines
            prev_window = lines[max(0, i-15):i]
            has_embed = has_embed or any('mapsEmbed:' in l for l in prev_window)

            new_lines.append(line)
            if not has_embed:
                print(f'  Geocoding mapsQuery: {maps_query}')
                lat, lng = geocode_query(maps_query)
                time.sleep(1)  # Nominatim rate limit: 1 req/sec
                if lat and lng:
                    print(f'    Coordinates: {lat}, {lng}')
                    embed_url = build_embed_url(lat, lng)
                    new_lines.append(f'{indent}mapsEmbed: "{embed_url}",')
                    changed_in_pass2 = True
                else:
                    print(f'    Could not geocode: {maps_query}')
        else:
            new_lines.append(line)
        i += 1

    if changed_in_pass2:
        content = '\n'.join(new_lines)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f'  Updated: {filepath}')
    else:
        print(f'  No changes: {filepath}')

if __name__ == '__main__':
    print('Resolving map URLs...\n')
    for f in DATA_FILES:
        print(f'Processing {f}')
        process_file(f)
    print('\nDone. Reload the page to see updated maps.')
