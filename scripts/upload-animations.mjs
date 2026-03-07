#!/usr/bin/env node

/**
 * upload-animations.mjs
 *
 * Reads a cartridge manifest.json to discover expected animation assets,
 * finds the corresponding rendered Manim MP4s, and uploads them to Supabase
 * storage with the correct asset name.
 *
 * Usage:
 *   node scripts/upload-animations.mjs --unit 6 --lesson 5
 *   node scripts/upload-animations.mjs --unit 6 --lesson 5 --bucket videos
 *   node scripts/upload-animations.mjs --unit 6 --lesson 5 --cartridge apstats-u6-inference-prop
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// Cartridge map: unit number → cartridge ID
// ---------------------------------------------------------------------------

const CARTRIDGE_MAP = {
  "5": "apstats-u5-sampling-dist",
  "6": "apstats-u6-inference-prop",
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    unit: { type: "string", short: "u" },
    lesson: { type: "string", short: "l" },
    bucket: { type: "string", short: "b", default: "videos" },
    cartridge: { type: "string", short: "c" },
  },
  strict: true,
});

if (!args.unit || !args.lesson) {
  console.error(
    "Usage: node scripts/upload-animations.mjs --unit <N> --lesson <N> [--bucket <name>] [--cartridge <id>]"
  );
  process.exit(1);
}

const unit = args.unit;
const lesson = args.lesson;
const bucket = args.bucket;
const cartridgeId = args.cartridge || CARTRIDGE_MAP[unit];

if (!cartridgeId) {
  console.error(
    `Error: No cartridge mapping for unit ${unit}.\n` +
      `Either add it to CARTRIDGE_MAP or pass --cartridge <id>.`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// .env loading (lightweight, no dependency)
// ---------------------------------------------------------------------------

const repoRoot = resolve(import.meta.dirname, "..");

function loadEnv() {
  const envPath = join(repoRoot, ".env");
  if (!existsSync(envPath)) {
    console.error(
      "Error: .env file not found in repo root.\n" +
        "Copy .env.example to .env and fill in your Supabase credentials:\n" +
        "  cp .env.example .env"
    );
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env\n" +
      "See .env.example for the required variables."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Manifest-driven asset discovery
// ---------------------------------------------------------------------------

/**
 * Read the cartridge manifest and extract animation asset names for modes
 * belonging to the requested lesson (e.g. lesson "5" matches modes with
 * "6.5" in their name).
 *
 * Returns an array of asset basenames, e.g. ["TestStatistic.mp4", "CalculatePValue.mp4"]
 */
function getExpectedAssets() {
  const manifestPath = join(
    repoRoot,
    "cartridges",
    cartridgeId,
    "manifest.json"
  );
  if (!existsSync(manifestPath)) {
    console.error(`Error: Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const lessonPattern = `${unit}.${lesson}`;
  const assets = [];

  for (const mode of manifest.modes || []) {
    // Match modes whose name contains the lesson pattern (e.g. "6.5")
    if (mode.name && mode.name.includes(lessonPattern) && mode.animation) {
      // mode.animation is like "assets/TestStatistic.mp4"
      const assetFile = basename(mode.animation);
      assets.push(assetFile);
    }
  }

  return assets;
}

/**
 * For a given asset name (e.g. "TestStatistic.mp4"), find the best matching
 * rendered MP4 in Manim's output directories.
 *
 * Manim renders to: media/videos/{script_name}/{quality}/{SceneClass}.mp4
 * We look in directories matching the unit+lesson pattern (e.g. apstat_65_*).
 *
 * Matching strategy:
 *   1. Exact filename match (e.g. "CalculatePValue.mp4" === "CalculatePValue.mp4")
 *   2. Rendered filename starts with the asset stem
 *      (e.g. "TestStatistic" matches "TestStatisticZScore.mp4")
 *   3. Rendered filename contains the asset stem
 *      (e.g. "Capstone65" — look for "Capstone" in rendered names from 6.5 dirs)
 *
 * Returns { assetName, renderedPath } or null if not found.
 */
function findRenderedFile(assetName) {
  const assetStem = assetName.replace(/\.mp4$/i, "");
  const mediaVideos = join(repoRoot, "media", "videos");

  if (!existsSync(mediaVideos)) return null;

  const dirPrefix = `apstat_${unit}${lesson}_`;
  const sceneDirs = readdirSync(mediaVideos).filter((d) =>
    d.startsWith(dirPrefix)
  );
  const qualities = ["1080p60", "720p30", "480p15"];

  // Collect all rendered MP4s from matching directories
  const allRendered = [];
  for (const sceneDir of sceneDirs) {
    for (const quality of qualities) {
      const qualityDir = join(mediaVideos, sceneDir, quality);
      if (!existsSync(qualityDir)) continue;

      const mp4s = readdirSync(qualityDir).filter(
        (f) => f.endsWith(".mp4") && !f.match(/^\d{5,}/)
      );
      for (const mp4 of mp4s) {
        allRendered.push({ name: mp4, stem: mp4.replace(/\.mp4$/i, ""), dir: qualityDir });
      }
    }
  }

  // Priority 1: exact match
  const exact = allRendered.find((r) => r.stem === assetStem);
  if (exact) {
    return { assetName, renderedPath: join(exact.dir, exact.name) };
  }

  // Priority 2: Scene-class-aware repair
  const animationsDir = join(repoRoot, "animations");
  if (existsSync(animationsDir)) {
    const pyFiles = readdirSync(animationsDir).filter(
      (f) => f.startsWith(dirPrefix) && f.endsWith(".py")
    );

    for (const pyFile of pyFiles) {
      const content = readFileSync(join(animationsDir, pyFile), "utf-8");
      const classMatches = [...content.matchAll(/class\s+(\w+)\s*\(\s*Scene\s*\)/g)];

      for (const cm of classMatches) {
        const actualClass = cm[1];
        const rendered = allRendered.find((r) => r.stem === actualClass);
        if (rendered) {
          console.log(
            `  Scene-class repair: manifest expects "${assetStem}" but .py defines "${actualClass}" — using ${rendered.name}`
          );
          return { assetName, renderedPath: join(rendered.dir, rendered.name) };
        }
      }
    }
  }

  // Priority 3: single-file fallback
  if (allRendered.length === 1) {
    console.log(
      `  Single-file fallback: using "${allRendered[0].name}" for "${assetName}"`
    );
    return { assetName, renderedPath: join(allRendered[0].dir, allRendered[0].name) };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Supabase upload via REST API
// ---------------------------------------------------------------------------

async function uploadFile(assetName, filePath) {
  const objectPath = `animations/${cartridgeId}/${assetName}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;

  const body = readFileSync(filePath);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${assetName}: ${res.status} ${text}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
  return publicUrl;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `Cartridge: ${cartridgeId}\n` +
      `Lesson:    ${unit}.${lesson}\n` +
      `Bucket:    ${bucket}\n`
  );

  // Step 1: Read manifest to find expected assets for this lesson
  const expectedAssets = getExpectedAssets();

  if (expectedAssets.length === 0) {
    console.error(
      `No animation assets found in manifest for lesson ${unit}.${lesson}.\n` +
        `Check that modes with "${unit}.${lesson}" in their name have "animation" fields.`
    );
    process.exit(1);
  }

  console.log(
    `Found ${expectedAssets.length} animation asset(s) in manifest:\n` +
      expectedAssets.map((a) => `  - ${a}`).join("\n") +
      "\n"
  );

  // Step 2: Match each expected asset to a rendered MP4
  const matches = [];
  const missing = [];

  for (const assetName of expectedAssets) {
    const match = findRenderedFile(assetName);
    if (match) {
      matches.push(match);
    } else {
      missing.push(assetName);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `Warning: Could not find rendered files for:\n` +
        missing.map((a) => `  - ${a}`).join("\n") +
        "\n"
    );
  }

  if (matches.length === 0) {
    console.error("No rendered MP4 files matched any manifest assets.");
    process.exit(1);
  }

  // Step 3: Upload each matched file
  console.log(`Uploading ${matches.length} file(s):\n`);

  let uploaded = 0;
  let failed = 0;

  for (const { assetName, renderedPath } of matches) {
    const sizeBytes = statSync(renderedPath).size;
    const sizeKB = (sizeBytes / 1024).toFixed(0);
    const objectPath = `animations/${cartridgeId}/${assetName}`;

    console.log(
      `Uploading ${assetName} (${sizeKB} KB) -> ${objectPath}`
    );

    try {
      const publicUrl = await uploadFile(assetName, renderedPath);
      console.log(`  -> ${publicUrl}\n`);
      uploaded++;
    } catch (err) {
      console.error(`  !! ${err.message}\n`);
      failed++;
    }
  }

  console.log(
    `Done. ${uploaded} uploaded, ${failed} failed, ${missing.length} not found.`
  );

  if (failed > 0 || missing.length > 0) {
    process.exit(1);
  }
}

main();
