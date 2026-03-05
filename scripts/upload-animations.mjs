#!/usr/bin/env node

/**
 * upload-animations.mjs
 *
 * Uploads rendered Manim MP4 animation files to a Supabase storage bucket.
 *
 * Usage:
 *   node scripts/upload-animations.mjs --unit 6 --lesson 4
 *   node scripts/upload-animations.mjs --unit 6 --lesson 4 --bucket my-bucket
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    unit: { type: "string", short: "u" },
    lesson: { type: "string", short: "l" },
    bucket: { type: "string", short: "b", default: "animations" },
  },
  strict: true,
});

if (!args.unit || !args.lesson) {
  console.error("Usage: node scripts/upload-animations.mjs --unit <N> --lesson <N> [--bucket <name>]");
  process.exit(1);
}

const unit = args.unit;
const lesson = args.lesson;
const bucket = args.bucket;
const pattern = `apstat_${unit}${lesson}_`;

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
// MP4 discovery
// ---------------------------------------------------------------------------

/**
 * Recursively collect all files under `dir` whose name matches the filter.
 */
function walk(dir, filter) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, filter));
    } else if (filter(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function findMp4s() {
  const isMatch = (name) =>
    name.endsWith(".mp4") && name.startsWith(pattern);

  const found = new Map(); // filename -> absolute path (dedup by name)

  // 1. media/videos/*/<quality>/ (Manim default output dirs)
  const mediaVideos = join(repoRoot, "media", "videos");
  if (existsSync(mediaVideos)) {
    for (const f of walk(mediaVideos, isMatch)) {
      found.set(basename(f), f);
    }
  }

  // 2. rendered/ directory
  const rendered = join(repoRoot, "rendered");
  if (existsSync(rendered)) {
    for (const f of walk(rendered, isMatch)) {
      found.set(basename(f), f);
    }
  }

  // 3. animations/ directory - look for .py files matching pattern, then
  //    check Manim default output dirs for their rendered MP4s
  const animations = join(repoRoot, "animations");
  if (existsSync(animations)) {
    const pyPattern = `apstat_${unit}${lesson}_`;
    for (const entry of readdirSync(animations)) {
      if (entry.startsWith(pyPattern) && entry.endsWith(".py")) {
        const stem = entry.replace(/\.py$/, "");
        const qualities = ["480p15", "720p30", "1080p60"];
        for (const q of qualities) {
          const candidate = join(mediaVideos, stem, q);
          if (existsSync(candidate)) {
            for (const f of walk(candidate, (n) => n.endsWith(".mp4"))) {
              found.set(basename(f), f);
            }
          }
        }
      }
    }
  }

  return [...found.entries()]; // [[filename, absPath], ...]
}

// ---------------------------------------------------------------------------
// Supabase upload via REST API
// ---------------------------------------------------------------------------

async function uploadFile(filename, filePath) {
  const objectPath = `apstats-u${unit}/${filename}`;
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
    throw new Error(`Upload failed for ${filename}: ${res.status} ${text}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
  return publicUrl;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const files = findMp4s();

  if (files.length === 0) {
    console.error(
      `No MP4 files found matching pattern "${pattern}*.mp4".\n` +
        "Checked: media/videos/, rendered/, and animations/ (via Manim output dirs)."
    );
    process.exit(1);
  }

  console.log(`Found ${files.length} MP4(s) for unit ${unit}, lesson ${lesson}:\n`);

  for (const [filename, filePath] of files) {
    const sizeMB = (statSync(filePath).size / 1_048_576).toFixed(2);
    console.log(`  Uploading ${filename} (${sizeMB} MB) ...`);
    try {
      const publicUrl = await uploadFile(filename, filePath);
      console.log(`  -> ${publicUrl}\n`);
    } catch (err) {
      console.error(`  !! ${err.message}\n`);
    }
  }

  console.log("Done.");
}

main();
