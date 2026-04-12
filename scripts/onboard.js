#!/usr/bin/env node
/**
 * onboard.js
 * ----------
 * Interactive onboarding script for new project brochure PDFs.
 *
 * DROP new PDFs into:
 *   data/Completed/   ← completed project brochures
 *   data/Ongoing/     ← ongoing project brochures
 *
 * Then run:  node scripts/onboard.js
 *
 * For each loose PDF found the script will:
 *   1. Extract text so you can read project details
 *   2. Prompt you for the required fields (ID, name, location, etc.)
 *   3. Create the project folder and extract page images
 *   4. Add the entry to both the .js and .json data files
 *   5. Move the original PDF to data/Processed/<Completed|Ongoing>/
 *
 * After all PDFs are processed it runs resolve-maps.js to refresh
 * map embed coordinates for every project.
 *
 * Dependencies (must be on PATH):
 *   node       >= 14
 *   pdftotext  (poppler-utils)
 *   pdftoppm   (poppler-utils)
 */

'use strict';

const fs            = require('fs');
const path          = require('path');
const readline      = require('readline');
const { execSync, spawnSync } = require('child_process');

// ── Paths ────────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..');
const COMPLETED_DIR = path.join(ROOT, 'data', 'Completed');
const ONGOING_DIR   = path.join(ROOT, 'data', 'Ongoing');
const PROCESSED_DIR = path.join(ROOT, 'data', 'Processed');

const DATA_FILES = {
  completed: {
    js:   path.join(ROOT, 'data', 'projects', 'completed.js'),
    json: path.join(ROOT, 'data', 'projects', 'completed.json'),
    jsVar: 'COMPLETED_PROJECTS',
    projectDir: COMPLETED_DIR,
    processedDir: path.join(PROCESSED_DIR, 'Completed'),
  },
  ongoing: {
    js:   path.join(ROOT, 'data', 'projects', 'ongoing.js'),
    json: path.join(ROOT, 'data', 'projects', 'ongoing.json'),
    jsVar: 'ONGOING_PROJECTS',
    projectDir: ONGOING_DIR,
    processedDir: path.join(PROCESSED_DIR, 'Ongoing'),
  },
};

// ── Readline helper ───────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const hint = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`  ${question}${hint}: `, (ans) => {
      resolve(ans.trim() || defaultValue);
    });
  });
}

function askRequired(question) {
  return new Promise((resolve) => {
    const retry = () => {
      rl.question(`  ${question}: `, (ans) => {
        if (ans.trim()) resolve(ans.trim());
        else { console.log('  (required — please enter a value)'); retry(); }
      });
    };
    retry();
  });
}

// ── ID helpers ────────────────────────────────────────────────────────────────

/** Convert "Manoj Enclave" → "manoj-enclave" */
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Load all existing IDs from the JSON data file. */
function loadExistingIds(jsonPath) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return new Set(data.map(p => p.id));
  } catch { return new Set(); }
}

/** Check across BOTH completed and ongoing JSON files. */
function allExistingIds() {
  return new Set([
    ...loadExistingIds(DATA_FILES.completed.json),
    ...loadExistingIds(DATA_FILES.ongoing.json),
  ]);
}

// ── PDF tools ─────────────────────────────────────────────────────────────────

function checkDeps() {
  const missing = [];
  for (const cmd of ['pdftotext', 'pdftoppm']) {
    const r = spawnSync(cmd, ['--version'], { stdio: 'pipe' });
    if (r.error || r.status === null) missing.push(cmd);
  }
  if (missing.length) {
    console.error(`\nMissing dependencies: ${missing.join(', ')}`);
    console.error('Install poppler:');
    console.error('  macOS:  brew install poppler');
    console.error('  Ubuntu: sudo apt-get install poppler-utils');
    console.error('  Windows: download from https://github.com/oschwartz10612/poppler-windows/releases\n');
    process.exit(1);
  }
}

function extractPdfText(pdfPath) {
  try {
    return execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch { return ''; }
}

function extractImages(pdfPath, outDir) {
  // Extract all pages as JPG at 150 DPI
  execSync(`pdftoppm -jpeg -r 150 "${pdfPath}" "${path.join(outDir, 'page')}"`, { stdio: 'pipe' });

  // Rename page-01.jpg → page-1.jpg, page-02.jpg → page-2.jpg, etc.
  const files = fs.readdirSync(outDir).filter(f => /^page-\d+\.jpg$/.test(f));
  for (const f of files) {
    const num = parseInt(f.replace(/^page-0*/, '').replace('.jpg', ''));
    const renamed = `page-${num}.jpg`;
    if (f !== renamed) {
      fs.renameSync(path.join(outDir, f), path.join(outDir, renamed));
    }
  }

  // building.png = copy of page-1.jpg (the cover)
  const cover = path.join(outDir, 'page-1.jpg');
  if (fs.existsSync(cover)) {
    fs.copyFileSync(cover, path.join(outDir, 'building.png'));
  }

  // Return list of page files
  return fs.readdirSync(outDir)
    .filter(f => /^page-\d+\.jpg$/.test(f))
    .sort()
    .map(f => f.replace('.jpg', ''));  // ['page-1', 'page-2', ...]
}

// ── Scan for loose PDFs ───────────────────────────────────────────────────────

function findLoosePdfs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.pdf') &&
                 fs.statSync(path.join(dir, f)).isFile())
    .map(f => path.join(dir, f));
}

// ── Data file writers ─────────────────────────────────────────────────────────

/** Append one entry object to the JS data file. */
function appendToJs(jsPath, jsVar, entry) {
  let src = fs.readFileSync(jsPath, 'utf8');

  // Serialise entry as indented JS (not JSON — uses single quotes, no trailing comma issues)
  const entryStr = jsObjectToSource(entry, 2);

  // Insert before the closing ];
  const closeIdx = src.lastIndexOf('];');
  if (closeIdx === -1) throw new Error(`Cannot find ]; in ${jsPath}`);

  const before = src.slice(0, closeIdx).trimEnd();
  // Add comma after the last entry if needed
  const withComma = before.endsWith('}') ? before + ',' : before;
  src = withComma + '\n' + entryStr + '\n];\n';

  fs.writeFileSync(jsPath, src, 'utf8');
}

/** Append one entry object to the JSON data file. */
function appendToJson(jsonPath, entry) {
  const arr = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  arr.push(entry);
  fs.writeFileSync(jsonPath, JSON.stringify(arr, null, 2) + '\n', 'utf8');
}

/** Convert a plain JS object to nicely formatted JS source (not JSON). */
function jsObjectToSource(obj, indentLevel) {
  const pad  = '  '.repeat(indentLevel);
  const pad2 = '  '.repeat(indentLevel + 1);
  const lines = ['{'];

  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    lines.push(`${pad2}${k}: ${valueToSource(v, indentLevel + 1)},`);
  }

  // Remove trailing comma on last line
  if (lines.length > 1) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  }
  lines.push(`${pad}}`);
  return lines.map(l => pad + l).join('\n').replace(new RegExp(`^${pad}`), pad);
}

function valueToSource(v, depth) {
  if (typeof v === 'string')  return `"${v.replace(/"/g, '\\"')}"`;
  if (typeof v === 'number')  return String(v);
  if (typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    // Array of arrays (specs/meta)
    if (Array.isArray(v[0])) {
      const pad = '  '.repeat(depth + 1);
      const rows = v.map(row => `${pad}[${row.map(c => `"${c.replace(/"/g, '\\"')}"`).join(', ')}]`);
      return `[\n${rows.join(',\n')}\n${'  '.repeat(depth)}]`;
    }
    // Array of strings
    if (v.length <= 2) return `[${v.map(s => `"${s.replace(/"/g, '\\"')}"`).join(', ')}]`;
    const pad = '  '.repeat(depth + 1);
    return `[\n${v.map(s => `${pad}"${s.replace(/"/g, '\\"')}"`).join(',\n')}\n${'  '.repeat(depth)}]`;
  }
  if (typeof v === 'object' && v !== null) {
    const pad = '  '.repeat(depth + 1);
    const entries = Object.entries(v).map(([k2, v2]) => `${pad}${k2}: ${valueToSource(v2, depth + 1)}`);
    return `{\n${entries.join(',\n')}\n${'  '.repeat(depth)}}`;
  }
  return JSON.stringify(v);
}

// ── Interactive prompts ───────────────────────────────────────────────────────

async function promptCompletedFields(pdfText, suggestedId, existingIds) {
  console.log('\n' + '─'.repeat(60));
  console.log('PDF CONTENT PREVIEW (first 40 lines):');
  console.log('─'.repeat(60));
  pdfText.split('\n').slice(0, 40).forEach(l => console.log('  ' + l));
  console.log('─'.repeat(60) + '\n');

  let id;
  while (true) {
    id = await ask('Project ID (unique slug)', suggestedId);
    id = slugify(id);
    if (!id) { console.log('  (ID cannot be empty)'); continue; }
    if (existingIds.has(id)) {
      console.log(`  ✗ ID "${id}" already exists. Choose a different one.`);
    } else break;
  }

  const name     = await askRequired('Project Name (e.g. Meghana Manoj Enclave)');
  const tag      = await ask('Tag', 'Residential');
  const shortLoc = await askRequired('Short Location (e.g. Dindayal Nagar, Malkajgiri)');
  const location = await askRequired('Full Location (e.g. Dindayal Nagar, Road No-6, Malkajgiri)');
  const motto    = await ask('Motto / Tagline', 'Not Just A Home, Also Your Dream');
  const mapsQuery = await ask('Maps Query (words joined by + for geocoding)',
                              slugify(location).replace(/-/g, '+'));
  const mapsUrl  = await ask('Google Maps share URL (optional, maps.app.goo.gl/...)');
  const desc     = await askRequired('Short description (1–2 sentences)');

  console.log('\n  Add project specs (key–value pairs). Leave Key blank to finish.');
  const specs = [
    ['Type', tag + ' Apartments'],
    ['Location', location],
    ['Status', 'Completed & Handed Over'],
  ];
  while (true) {
    const key = await ask('  Spec key (or press Enter to finish)');
    if (!key) break;
    const val = await askRequired('  Spec value');
    specs.push([key, val]);
  }

  return { id, name, tag, shortLoc, motto, location, mapsQuery,
           ...(mapsUrl ? { mapsUrl } : {}), desc, specs };
}

async function promptOngoingFields(pdfText, suggestedId, existingIds) {
  console.log('\n' + '─'.repeat(60));
  console.log('PDF CONTENT PREVIEW (first 40 lines):');
  console.log('─'.repeat(60));
  pdfText.split('\n').slice(0, 40).forEach(l => console.log('  ' + l));
  console.log('─'.repeat(60) + '\n');

  let id;
  while (true) {
    id = await ask('Project ID (unique slug)', suggestedId);
    id = slugify(id);
    if (!id) { console.log('  (ID cannot be empty)'); continue; }
    if (existingIds.has(id)) {
      console.log(`  ✗ ID "${id}" already exists. Choose a different one.`);
    } else break;
  }

  const name       = await askRequired('Project Name');
  const tag        = await ask('Tag', 'Residential');
  const shortLoc   = await askRequired('Short Location');
  const location   = await askRequired('Full Location');
  const motto      = await ask('Motto / Tagline', 'Quality Homes, Trusted Builder');
  const mapsQuery  = await ask('Maps Query', slugify(location).replace(/-/g, '+'));
  const mapsUrl    = await ask('Google Maps share URL (optional)');
  const desc       = await askRequired('Short description');
  const progressPct   = parseInt(await ask('Construction progress %', '50'));
  const progressLabel = await ask('Progress label', 'Construction in progress');
  const progressNote  = await ask('Progress note', 'Structure and finishing works underway.');
  const unitArea   = await ask('Unit area (e.g. 1200 SFT)');
  const unitType   = await ask('Unit type (e.g. 2 & 3 BHK Apartments)');

  console.log('\n  Add project specs. Leave Key blank to finish.');
  const specs = [
    ['Location', location],
    ['Type', tag + ' Apartments'],
    ['Status', 'Ongoing — Limited Units Available'],
  ];
  while (true) {
    const key = await ask('  Spec key (or press Enter to finish)');
    if (!key) break;
    const val = await askRequired('  Spec value');
    specs.push([key, val]);
  }

  const meta = [
    [shortLoc, 'Location'],
    ['Limited Units', 'Availability'],
    [unitArea || 'Spacious', unitArea ? 'Area' : 'Apartments'],
  ];

  return {
    id, name, tag, shortLoc, motto, location, mapsQuery,
    ...(mapsUrl ? { mapsUrl } : {}), desc,
    meta,
    progress: { label: progressLabel, percent: progressPct, note: progressNote },
    specs,
  };
}

// ── Build final entry objects ─────────────────────────────────────────────────

function buildCompletedEntry(fields, projectId, pages) {
  const dir = `data/Completed/${projectId}`;
  return {
    id:       fields.id,
    name:     fields.name,
    tag:      fields.tag,
    shortLoc: fields.shortLoc,
    motto:    `"${fields.motto}"`,
    location: fields.location,
    mapsQuery: fields.mapsQuery,
    ...(fields.mapsUrl ? { mapsUrl: fields.mapsUrl } : {}),
    dataDir:  dir,
    pdf:      `${dir}/brochure.pdf`,
    floorplan: [`${dir}/page-2.jpg`],
    brochure:  pages.map(p => `${dir}/${p}.jpg`),
    desc:     fields.desc,
    specs:    fields.specs,
  };
}

function buildOngoingEntry(fields, projectId, pages) {
  const dir = `data/Ongoing/${projectId}`;
  return {
    id:        fields.id,
    name:      fields.name,
    tag:       fields.tag,
    shortLoc:  fields.shortLoc,
    motto:     `"${fields.motto}"`,
    location:  fields.location,
    mapsQuery: fields.mapsQuery,
    ...(fields.mapsUrl ? { mapsUrl: fields.mapsUrl } : {}),
    dataDir:   dir,
    pdf:       `${dir}/brochure.pdf`,
    thumbnail: `${dir}/building.png`,
    floorplan: [`${dir}/page-2.jpg`],
    brochure:  pages.map(p => `${dir}/${p}.jpg`),
    desc:      fields.desc,
    meta:      fields.meta,
    progress:  fields.progress,
    specs:     fields.specs,
  };
}

// ── Process a single PDF ──────────────────────────────────────────────────────

async function processPdf(pdfPath, type) {
  const cfg = DATA_FILES[type];
  const existingIds = allExistingIds();

  const pdfName    = path.basename(pdfPath);
  const pdfText    = extractPdfText(pdfPath);
  const suggestId  = slugify(pdfName.replace(/\.pdf$/i, '').replace(/^\d+-/, ''));

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Processing [${type.toUpperCase()}]: ${pdfName}`);
  console.log('═'.repeat(60));

  const fields = type === 'completed'
    ? await promptCompletedFields(pdfText, suggestId, existingIds)
    : await promptOngoingFields(pdfText, suggestId, existingIds);

  const projectId  = fields.id;
  const projectDir = path.join(cfg.projectDir, projectId);

  // Create folder
  fs.mkdirSync(projectDir, { recursive: true });

  // Copy PDF as brochure.pdf
  const brochureDest = path.join(projectDir, 'brochure.pdf');
  fs.copyFileSync(pdfPath, brochureDest);
  console.log(`\n  ✔ Copied PDF → ${path.relative(ROOT, brochureDest)}`);

  // Extract images
  console.log('  ✔ Extracting page images...');
  const pages = extractImages(brochureDest, projectDir);
  console.log(`    ${pages.length} page(s): ${pages.join(', ')}`);

  // Build entry
  const entry = type === 'completed'
    ? buildCompletedEntry(fields, projectId, pages)
    : buildOngoingEntry(fields, projectId, pages);

  // Update data files
  appendToJs(cfg.js, cfg.jsVar, entry);
  appendToJson(cfg.json, entry);
  console.log(`  ✔ Added to ${path.relative(ROOT, cfg.js)}`);
  console.log(`  ✔ Added to ${path.relative(ROOT, cfg.json)}`);

  // Move original PDF to Processed/
  fs.mkdirSync(cfg.processedDir, { recursive: true });
  const dest = path.join(cfg.processedDir, pdfName);
  fs.renameSync(pdfPath, dest);
  console.log(`  ✔ Moved original PDF → ${path.relative(ROOT, dest)}`);

  console.log(`\n  ✅ Project "${fields.name}" (${projectId}) onboarded successfully.\n`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     Meghana Manoj Constructions — Project Onboarding     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  checkDeps();

  const completedPdfs = findLoosePdfs(COMPLETED_DIR);
  const ongoingPdfs   = findLoosePdfs(ONGOING_DIR);
  const total         = completedPdfs.length + ongoingPdfs.length;

  if (total === 0) {
    console.log('No new PDFs found in data/Completed/ or data/Ongoing/.');
    console.log('Drop brochure PDFs into those folders and re-run.\n');
    rl.close();
    return;
  }

  console.log(`Found ${total} new PDF(s) to onboard:`);
  completedPdfs.forEach(p => console.log(`  [completed] ${path.basename(p)}`));
  ongoingPdfs.forEach(p  => console.log(`  [ongoing]   ${path.basename(p)}`));
  console.log('');

  let processed = 0;

  for (const pdf of completedPdfs) {
    try {
      await processPdf(pdf, 'completed');
      processed++;
    } catch (err) {
      console.error(`  ✗ Error processing ${path.basename(pdf)}: ${err.message}`);
    }
  }

  for (const pdf of ongoingPdfs) {
    try {
      await processPdf(pdf, 'ongoing');
      processed++;
    } catch (err) {
      console.error(`  ✗ Error processing ${path.basename(pdf)}: ${err.message}`);
    }
  }

  rl.close();

  if (processed > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Refreshing map coordinates for all projects...');
    try {
      execSync('node scripts/resolve-maps.js', { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error('  Warning: resolve-maps.js failed:', err.message);
    }
    console.log(`\n✅ Onboarding complete. ${processed}/${total} PDF(s) processed.`);
    console.log('   Reload index.html in your browser to see the new projects.\n');
  }
}

main().catch(err => {
  console.error('\nFatal error:', err);
  rl.close();
  process.exit(1);
});
