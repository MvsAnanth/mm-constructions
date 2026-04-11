#!/usr/bin/env node
/**
 * resolve-maps.js
 * ---------------
 * Reads all project data files and resolves a Google Maps embed URL
 * for every project, using whichever source is available:
 *
 *   1. mapsUrl  (maps.app.goo.gl short link) → follow redirect → extract lat/lng
 *   2. mapsQuery (address string)             → Nominatim geocode → lat/lng
 *
 * Writes: data/projects/maps.js
 *   const MAPS_EMBEDS = { "project-id": "https://maps.google.com/maps?q=lat,lng&z=17&output=embed", ... }
 *
 * Usage:
 *   node scripts/resolve-maps.js
 *
 * Run once after adding any new project. Re-run to refresh all pins.
 * The data files (completed.js / ongoing.js) do NOT need mapsEmbed — this
 * script generates the embed URLs automatically.
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

// ── Config ──────────────────────────────────────────────────────────────────

const DATA_FILES = [
  'data/projects/completed.js',
  'data/projects/ongoing.js',
];
const OUT_FILE  = 'data/projects/maps.js';
const EMBED_ZOOM = 17;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Follow all redirects and return the final URL. */
function resolveRedirect(shortUrl) {
  return new Promise((resolve) => {
    const parsed = url.parse(shortUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      { hostname: parsed.hostname, path: parsed.path, method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolveRedirect(res.headers.location).then(resolve);
        } else {
          resolve(shortUrl); // no more redirects — use as-is (GET fallback)
        }
      }
    );
    req.on('error', () => resolve(null));
    req.end();
  });
}

/** Follow redirects via GET (needed when HEAD doesn't expose final URL). */
function resolveRedirectGet(shortUrl) {
  return new Promise((resolve) => {
    const parsed = url.parse(shortUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      { hostname: parsed.hostname, path: parsed.path, method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          resolve(shortUrl);
        }
        res.destroy();
      }
    );
    req.on('error', () => resolve(null));
    req.end();
  });
}

/** Extract lat,lng from a resolved Google Maps URL. */
function extractCoords(fullUrl) {
  // /@lat,lng,zoom
  let m = fullUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return [m[1], m[2]];
  // /place/lat,lng
  m = fullUrl.match(/\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return [m[1], m[2]];
  // ?q=lat,lng
  m = fullUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return [m[1], m[2]];
  return null;
}

/** Geocode an address string via Nominatim. Returns [lat, lng] or null. */
function geocode(address) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(address + ', India');
    const reqUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    https.get(reqUrl, { headers: { 'User-Agent': 'resolve-maps/1.0 (mm-constructions-website)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length) resolve([results[0].lat, results[0].lon]);
          else resolve(null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function buildEmbedUrl(lat, lng, zoom = EMBED_ZOOM) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

/** Parse project objects from a JS data file using regex (no eval). */
function extractProjects(content) {
  const projects = [];
  // Match each { ... } object block at the top level of the array
  const blockRe = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let m;
  while ((m = blockRe.exec(content)) !== null) {
    const block = m[0];
    const getField = (key) => {
      const r = new RegExp(`${key}:\\s*"([^"]+)"`);
      const fm = block.match(r);
      return fm ? fm[1] : null;
    };
    const id = getField('id');
    if (!id) continue;
    projects.push({
      id,
      mapsUrl:   getField('mapsUrl'),
      mapsQuery: getField('mapsQuery'),
    });
  }
  return projects;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function resolveProject(p) {
  // Strategy 1: short URL redirect
  if (p.mapsUrl) {
    console.log(`  [${p.id}] Resolving mapsUrl: ${p.mapsUrl}`);
    let finalUrl = await resolveRedirectGet(p.mapsUrl);
    if (finalUrl) {
      // May need another hop
      if (finalUrl.includes('maps.app.goo.gl') || finalUrl.includes('goo.gl')) {
        finalUrl = await resolveRedirectGet(finalUrl);
      }
      const coords = finalUrl ? extractCoords(finalUrl) : null;
      if (coords) {
        console.log(`    → ${coords[0]}, ${coords[1]}`);
        return buildEmbedUrl(coords[0], coords[1]);
      }
      console.log(`    Redirect resolved to: ${finalUrl}`);
      console.log(`    Could not extract coordinates — falling back to geocoding`);
    }
  }

  // Strategy 2: geocode the address
  if (p.mapsQuery) {
    const address = p.mapsQuery.replace(/\+/g, ' ');
    console.log(`  [${p.id}] Geocoding: ${address}`);
    await sleep(1100); // Nominatim rate limit: 1 req/sec
    const coords = await geocode(address);
    if (coords) {
      console.log(`    → ${coords[0]}, ${coords[1]}`);
      return buildEmbedUrl(coords[0], coords[1]);
    }
    // Try with shortened city name as fallback
    const parts = address.split(' ');
    const fallback = parts.slice(Math.max(0, parts.length - 3)).join(' ');
    if (fallback !== address) {
      console.log(`    Retrying with: ${fallback}`);
      await sleep(1100);
      const coords2 = await geocode(fallback);
      if (coords2) {
        console.log(`    → ${coords2[0]}, ${coords2[1]}`);
        return buildEmbedUrl(coords2[0], coords2[1]);
      }
    }
    console.log(`    Could not geocode`);
  }

  return null;
}

async function main() {
  const embeds = {};

  for (const file of DATA_FILES) {
    console.log(`\nProcessing ${file}`);
    const content = fs.readFileSync(file, 'utf8');
    const projects = extractProjects(content);
    console.log(`  Found ${projects.length} projects`);

    for (const p of projects) {
      const embedUrl = await resolveProject(p);
      if (embedUrl) embeds[p.id] = embedUrl;
    }
  }

  // Write output file
  const lines = Object.entries(embeds).map(
    ([id, u]) => `  "${id}": "${u}"`
  );
  const output = [
    '// Auto-generated by scripts/resolve-maps.js — do not edit manually.',
    '// Run: node scripts/resolve-maps.js',
    `// Generated: ${new Date().toISOString()}`,
    'const MAPS_EMBEDS = {',
    lines.join(',\n'),
    '};',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_FILE, output);
  console.log(`\nWrote ${Object.keys(embeds).length} embed URLs to ${OUT_FILE}`);
  console.log('Done. Reload the page to see updated maps.');
}

main().catch(err => { console.error(err); process.exit(1); });
