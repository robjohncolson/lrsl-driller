#!/usr/bin/env node
/**
 * validate-animations.mjs — Post-render, pre-upload animation validation
 *
 * Implements Phase 6 checks from docs/ANIMATION-PRECISION-SPEC.md:
 *   6c: File size, duration, and codec checks
 *   6d: Manifest/asset cross-references and uniqueness
 *
 * Usage:
 *   node scripts/validate-animations.mjs --cartridge a2t4l1-inverse-variation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';

// ─── CLI Args ────────────────────────────────────────────────────────────────

const { values } = parseArgs({
  options: {
    cartridge: { type: 'string', short: 'c' },
  },
  strict: true,
});

if (!values.cartridge) {
  console.error('Usage: node scripts/validate-animations.mjs --cartridge <id>');
  process.exit(1);
}

const cartridgeId = values.cartridge;

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '..');
const CARTRIDGE_DIR = join(ROOT, 'cartridges', cartridgeId);
const MANIFEST_PATH = join(CARTRIDGE_DIR, 'manifest.json');
const ASSETS_DIR = join(CARTRIDGE_DIR, 'assets');

// ─── ANSI Colors ─────────────────────────────────────────────────────────────

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

// ─── Counters ────────────────────────────────────────────────────────────────

let errors = 0;
let warnings = 0;

function ok(msg) {
  console.log(`  ${GREEN}OK${RESET}   ${msg}`);
}

function warn(msg) {
  console.warn(`  ${YELLOW}WARN${RESET} ${msg}`);
  warnings++;
}

function error(msg) {
  console.error(`  ${RED}ERR${RESET}  ${msg}`);
  errors++;
}

// ─── Preflight: cartridge exists? ────────────────────────────────────────────

if (!existsSync(MANIFEST_PATH)) {
  console.error(`Cartridge not found: ${CARTRIDGE_DIR}`);
  process.exit(1);
}

// ─── Load manifest ──────────────────────────────────────────────────────────

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
} catch (e) {
  console.error(`Invalid manifest.json: ${e.message}`);
  process.exit(1);
}

const modes = manifest.modes || [];

console.log(`\nValidating animations for: ${cartridgeId}\n`);

// ─── 1. Manifest/Asset Cross-Check (Phase 6d) ───────────────────────────────

console.log('--- Manifest / Asset Cross-Check ---\n');

// 1a. Collect animation references from manifest modes
const modeAnimations = [];
for (const mode of modes) {
  if (mode.animation) {
    modeAnimations.push({ modeId: mode.id, modeName: mode.name, animation: mode.animation });
  }
}

// 1b. Collect actual files in assets/
const assetFiles = existsSync(ASSETS_DIR)
  ? readdirSync(ASSETS_DIR).filter(f => f.endsWith('.mp4'))
  : [];

// Check: every mode animation has a corresponding file
const referencedFiles = new Set();
for (const { modeId, animation } of modeAnimations) {
  const filePath = join(CARTRIDGE_DIR, animation);
  referencedFiles.add(animation);

  if (!existsSync(filePath)) {
    error(`Mode "${modeId}" references "${animation}" but file does not exist`);
  } else {
    ok(`Mode "${modeId}" -> ${animation} exists`);
  }
}

// Check: every file in assets/ is referenced by at least one mode
for (const file of assetFiles) {
  const assetRef = `assets/${file}`;
  if (!referencedFiles.has(assetRef)) {
    error(`Orphan asset: ${file} is not referenced by any mode`);
  }
}

if (assetFiles.length > 0 && assetFiles.every(f => referencedFiles.has(`assets/${f}`))) {
  ok(`All ${assetFiles.length} asset files are referenced`);
}

// Check: no two modes share the same animation filename (uniqueness)
const animationToModes = new Map();
for (const { modeId, animation } of modeAnimations) {
  const list = animationToModes.get(animation) || [];
  list.push(modeId);
  animationToModes.set(animation, list);
}

let allUnique = true;
for (const [animation, modeIds] of animationToModes) {
  if (modeIds.length > 1) {
    error(`Animation "${animation}" is shared by ${modeIds.length} modes: ${modeIds.join(', ')}`);
    allUnique = false;
  }
}

if (allUnique && modeAnimations.length > 0) {
  ok(`All ${modeAnimations.length} animation references are unique`);
}

// ─── 2. File Size Check (Phase 6c) ──────────────────────────────────────────

console.log('\n--- File Size Check ---\n');

const MAX_SIZE_BYTES = 2 * 1024 * 1024;       // 2 MB
const WARN_SIZE_BYTES = 1.5 * 1024 * 1024;    // 1.5 MB

for (const file of assetFiles) {
  const filePath = join(ASSETS_DIR, file);
  const stat = statSync(filePath);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

  if (stat.size > MAX_SIZE_BYTES) {
    error(`${file}: ${sizeMB} MB exceeds 2 MB limit`);
  } else if (stat.size > WARN_SIZE_BYTES) {
    warn(`${file}: ${sizeMB} MB is close to 2 MB limit`);
  } else {
    ok(`${file}: ${sizeMB} MB`);
  }
}

if (assetFiles.length === 0) {
  warn('No MP4 files found in assets/ — nothing to check');
}

// ─── Resolve ffprobe before duration/codec checks ────────────────────────────

const ffprobeBin = resolveFfprobe();

// ─── 3. Duration Check (Phase 6c) — requires ffprobe ────────────────────────

console.log('\n--- Duration Check ---\n');

const ffprobeAvailable = checkFfprobe();

if (!ffprobeAvailable) {
  warn('ffprobe not found — skipping duration checks');
} else {
  for (const file of assetFiles) {
    const filePath = join(ASSETS_DIR, file);
    const duration = getDuration(filePath);

    if (duration === null) {
      warn(`${file}: could not read duration`);
      continue;
    }

    const durationStr = duration.toFixed(1);

    if (duration < 20 || duration > 60) {
      error(`${file}: ${durationStr}s is outside hard bounds (20-60s)`);
    } else if (duration < 30 || duration > 50) {
      warn(`${file}: ${durationStr}s is outside recommended range (30-50s)`);
    } else {
      ok(`${file}: ${durationStr}s`);
    }
  }
}

// ─── 4. Codec Check (Phase 6c) — requires ffprobe ───────────────────────────

console.log('\n--- Codec Check ---\n');

if (!ffprobeAvailable) {
  warn('ffprobe not found — skipping codec checks');
} else {
  for (const file of assetFiles) {
    const filePath = join(ASSETS_DIR, file);
    const codec = getVideoCodec(filePath);

    if (codec === null) {
      warn(`${file}: could not read codec`);
      continue;
    }

    if (codec === 'h264') {
      ok(`${file}: codec is h264`);
    } else {
      error(`${file}: codec is "${codec}", expected h264`);
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '-'.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log(`${GREEN}All checks passed.${RESET}`);
} else {
  if (errors > 0) console.error(`${RED}${errors} error(s)${RESET}`);
  if (warnings > 0) console.warn(`${YELLOW}${warnings} warning(s)${RESET}`);
}

process.exit(errors > 0 ? 1 : 0);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve the ffprobe binary path. Checks PATH first, then the known
 * ffmpeg install location at C:\Users\ColsonR\ffmpeg\bin\.
 */
function resolveFfprobe() {
  // Try PATH first
  try {
    execSync('ffprobe -version', { stdio: 'pipe' });
    return 'ffprobe';
  } catch { /* not on PATH */ }

  // Try known local install
  const localPath = 'C:\\Users\\ColsonR\\ffmpeg\\bin\\ffprobe.exe';
  if (existsSync(localPath)) {
    try {
      execSync(`"${localPath}" -version`, { stdio: 'pipe' });
      return `"${localPath}"`;
    } catch { /* exists but broken */ }
  }

  return null;
}

/**
 * Check if ffprobe is available.
 */
function checkFfprobe() {
  return ffprobeBin !== null;
}

/**
 * Get the duration of a video file in seconds. Returns null on failure.
 */
function getDuration(filePath) {
  if (!ffprobeBin) return null;
  try {
    const output = execSync(
      `${ffprobeBin} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const seconds = parseFloat(output.trim());
    if (Number.isNaN(seconds)) return null;
    return seconds;
  } catch {
    return null;
  }
}

/**
 * Get the video codec name (e.g. "h264"). Returns null on failure.
 */
function getVideoCodec(filePath) {
  if (!ffprobeBin) return null;
  try {
    const output = execSync(
      `${ffprobeBin} -v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const codec = output.trim();
    if (!codec) return null;
    return codec;
  } catch {
    return null;
  }
}
