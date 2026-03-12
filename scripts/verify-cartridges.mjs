#!/usr/bin/env node
/**
 * verify-cartridges.mjs — Structural integrity checks for all cartridges
 *
 * Checks:
 *  1. Topic ordering: modes grouped by topic, topics in ascending order
 *  2. Progression alignment: progression.tiers IDs match modes array order
 *  3. File existence: generator.js, grading-rules.js, aiPromptFile all exist
 *  4. Mode ID uniqueness: no duplicate IDs within a cartridge
 *  5. Registry coverage: every cartridge folder has a registry.json entry
 *
 * Usage:
 *   node scripts/verify-cartridges.mjs           # check all cartridges
 *   node scripts/verify-cartridges.mjs u6         # check only cartridges matching "u6"
 *   node scripts/verify-cartridges.mjs --fix      # (future) auto-fix ordering issues
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const CARTRIDGES_DIR = join(ROOT, 'cartridges');

const filter = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

let totalErrors = 0;
let totalWarnings = 0;

function error(cartridge, msg) {
  console.error(`  ✗ [${cartridge}] ${msg}`);
  totalErrors++;
}

function warn(cartridge, msg) {
  console.warn(`  ⚠ [${cartridge}] ${msg}`);
  totalWarnings++;
}

function ok(cartridge, msg) {
  console.log(`  ✓ [${cartridge}] ${msg}`);
}

/**
 * Extract topic string from mode name, e.g. "6.4a: State the Null" → "6.4"
 * Handles multi-digit sub-topics like 6.10, 6.11.
 * Returns null if no topic pattern found.
 * Returns { topic, isCapstone, capstoneRange } for richer checking.
 */
function extractTopicInfo(modeName) {
  // Multi-topic capstone: "4.1-4.2 Capstone" → range [4.1, 4.2]
  const rangeCapstone = modeName.match(/^(\d+\.\d+)-(\d+\.\d+)\s+Capstone/i);
  if (rangeCapstone) {
    return { topic: rangeCapstone[2], isCapstone: true, capstoneRange: [rangeCapstone[1], rangeCapstone[2]] };
  }
  // Single-topic capstone: "6.4 Capstone"
  const singleCapstone = modeName.match(/^(\d+\.\d+)\s+Capstone/i);
  if (singleCapstone) {
    return { topic: singleCapstone[1], isCapstone: true, capstoneRange: null };
  }
  // Regular mode: "6.4a: State the Null"
  const match = modeName.match(/^(\d+\.\d+)/);
  if (match) return { topic: match[1], isCapstone: false, capstoneRange: null };
  return null;
}

function extractTopic(modeName) {
  const info = extractTopicInfo(modeName);
  return info ? info.topic : null;
}

/** Compare topic strings numerically: "6.2" < "6.10" < "6.11" */
function compareTopic(a, b) {
  const [aMaj, aMin] = a.split('.').map(Number);
  const [bMaj, bMin] = b.split('.').map(Number);
  if (aMaj !== bMaj) return aMaj - bMaj;
  return aMin - bMin;
}

/** Check if two topic strings are the same topic */
function sameTopic(a, b) {
  return compareTopic(a, b) === 0;
}

/**
 * Check that topics are grouped (contiguous) and in ascending order.
 * Capstones are allowed after their topic group.
 */
function checkTopicOrdering(cartridgeId, modes) {
  const topics = modes.map(m => {
    const info = extractTopicInfo(m.name);
    return {
      id: m.id,
      name: m.name,
      topic: info ? info.topic : null,
      isCapstone: info?.isCapstone || false,
      capstoneRange: info?.capstoneRange || null
    };
  });

  // Skip cartridges where modes don't follow topic patterns (e.g., algebra)
  const hasTopic = topics.filter(t => t.topic !== null);
  if (hasTopic.length < 2) return;

  // Check grouping: once we leave a topic, we shouldn't come back to it
  // Multi-topic capstones (e.g., "4.1-4.2 Capstone") are allowed at boundaries
  const seenTopics = [];  // array of topic strings already seen
  let currentTopic = null;
  const violations = [];

  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    if (t.topic === null) continue;

    // Multi-topic capstones sit at boundaries — they reference their start topic
    // which was already seen. This is intentional, not a violation.
    if (t.capstoneRange) continue;

    if (!currentTopic || !sameTopic(t.topic, currentTopic)) {
      // Switching to a new topic — check if we've seen it before
      const alreadySeen = seenTopics.some(s => sameTopic(s, t.topic));
      if (alreadySeen) {
        violations.push({
          index: i + 1,
          id: t.id,
          name: t.name,
          topic: t.topic
        });
      }
      if (!alreadySeen) seenTopics.push(t.topic);
      currentTopic = t.topic;
    }
  }

  if (violations.length > 0) {
    for (const v of violations) {
      error(cartridgeId,
        `Topic ${v.topic} reappears at position ${v.index} (${v.name}) — ` +
        `modes for the same topic should be contiguous`
      );
    }
  } else {
    ok(cartridgeId, `Topic grouping: all topics are contiguous`);
  }

  // Check ascending order of first appearance
  const firstAppearance = [];
  for (const t of topics) {
    if (t.topic !== null && !firstAppearance.some(s => sameTopic(s, t.topic))) {
      firstAppearance.push(t.topic);
    }
  }

  let orderOk = true;
  for (let i = 1; i < firstAppearance.length; i++) {
    if (compareTopic(firstAppearance[i], firstAppearance[i - 1]) < 0) {
      warn(cartridgeId,
        `Topic ${firstAppearance[i]} appears after ${firstAppearance[i - 1]} — ` +
        `topics are not in ascending order (may be intentional)`
      );
      orderOk = false;
    }
  }
  if (orderOk && firstAppearance.length > 1) {
    ok(cartridgeId, `Topic order: ascending (${firstAppearance.join(' → ')})`);
  }
}

/**
 * Check that progression tier IDs match mode IDs in the same order.
 */
function checkProgressionAlignment(cartridgeId, manifest) {
  const modes = manifest.modes || [];
  const tiers = manifest.progression?.tiers || [];

  if (tiers.length === 0) {
    warn(cartridgeId, 'No progression tiers defined');
    return;
  }

  const modeIds = modes.map(m => m.id);
  const tierIds = tiers.map(t => t.id);

  if (modeIds.length !== tierIds.length) {
    error(cartridgeId,
      `Mode count (${modeIds.length}) ≠ tier count (${tierIds.length})`
    );
  }

  const minLen = Math.min(modeIds.length, tierIds.length);
  const mismatches = [];
  for (let i = 0; i < minLen; i++) {
    if (modeIds[i] !== tierIds[i]) {
      mismatches.push({ index: i + 1, mode: modeIds[i], tier: tierIds[i] });
    }
  }

  if (mismatches.length > 0) {
    error(cartridgeId,
      `Progression/mode mismatch at ${mismatches.length} positions. First: ` +
      `#${mismatches[0].index} mode=${mismatches[0].mode} tier=${mismatches[0].tier}`
    );
  } else {
    ok(cartridgeId, `Progression alignment: ${minLen} tiers match modes`);
  }
}

/**
 * Check that all referenced files exist on disk.
 */
function checkFileExistence(cartridgeId, manifest, cartridgePath) {
  const files = [
    { key: 'generator.js', path: join(cartridgePath, 'generator.js') },
    { key: 'manifest.json', path: join(cartridgePath, 'manifest.json') }
  ];

  if (manifest.grading?.rubricFile) {
    files.push({
      key: manifest.grading.rubricFile,
      path: join(cartridgePath, manifest.grading.rubricFile)
    });
  }

  if (manifest.grading?.aiPromptFile) {
    files.push({
      key: manifest.grading.aiPromptFile,
      path: join(cartridgePath, manifest.grading.aiPromptFile)
    });
  }

  if (manifest.config?.contextsFile) {
    files.push({
      key: manifest.config.contextsFile,
      path: join(cartridgePath, manifest.config.contextsFile)
    });
  }

  let allExist = true;
  for (const f of files) {
    if (!existsSync(f.path)) {
      error(cartridgeId, `Missing file: ${f.key}`);
      allExist = false;
    }
  }

  if (allExist) {
    ok(cartridgeId, `File existence: all ${files.length} referenced files present`);
  }
}

/**
 * Check for duplicate mode IDs.
 */
function checkModeIdUniqueness(cartridgeId, modes) {
  const seen = new Map();
  const dupes = [];

  for (let i = 0; i < modes.length; i++) {
    const id = modes[i].id;
    if (seen.has(id)) {
      dupes.push({ id, first: seen.get(id) + 1, second: i + 1 });
    } else {
      seen.set(id, i);
    }
  }

  if (dupes.length > 0) {
    for (const d of dupes) {
      error(cartridgeId,
        `Duplicate mode ID "${d.id}" at positions ${d.first} and ${d.second}`
      );
    }
  } else {
    ok(cartridgeId, `Mode IDs: ${modes.length} unique IDs`);
  }
}

/**
 * Check that git tracks all required files (warns about untracked).
 */
function checkGitTracking(cartridgeId, manifest, cartridgePath) {
  // This is a lightweight check — just verify files exist.
  // A full git-status check would require spawning a process.
  // The file existence check already covers the critical case.
}

// ─── Main ───

console.log('Cartridge Verification\n');

// Load registry
const registryPath = join(CARTRIDGES_DIR, 'registry.json');
let registry = [];
if (existsSync(registryPath)) {
  const data = JSON.parse(readFileSync(registryPath, 'utf-8'));
  registry = data.cartridges || [];
}
const registryIds = new Set(registry.map(r => r.id));

// Discover cartridge folders
const folders = readdirSync(CARTRIDGES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(name => existsSync(join(CARTRIDGES_DIR, name, 'manifest.json')));

for (const folder of folders) {
  if (filter && !folder.includes(filter)) continue;

  const cartridgePath = join(CARTRIDGES_DIR, folder);
  const manifestPath = join(cartridgePath, 'manifest.json');

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    error(folder, `Invalid JSON in manifest.json: ${e.message}`);
    continue;
  }

  const cartridgeId = manifest.meta?.id || folder;
  console.log(`── ${cartridgeId} (${manifest.meta?.name || 'unnamed'}) ──`);

  // Registry check
  if (!registryIds.has(cartridgeId)) {
    error(cartridgeId, 'Not in registry.json — will not appear in picker');
  } else {
    ok(cartridgeId, 'Registry: entry exists');
  }

  const modes = manifest.modes || [];

  checkFileExistence(cartridgeId, manifest, cartridgePath);
  checkModeIdUniqueness(cartridgeId, modes);
  checkTopicOrdering(cartridgeId, modes);
  checkProgressionAlignment(cartridgeId, manifest);

  console.log();
}

// Summary
console.log('─'.repeat(50));
if (totalErrors === 0 && totalWarnings === 0) {
  console.log('All checks passed!');
} else {
  if (totalErrors > 0) console.error(`${totalErrors} error(s)`);
  if (totalWarnings > 0) console.warn(`${totalWarnings} warning(s)`);
}

process.exit(totalErrors > 0 ? 1 : 0);
