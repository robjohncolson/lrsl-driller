#!/usr/bin/env node
/**
 * cleanup-users.mjs — users-table cleanup for the lrsl-driller Supabase project.
 *
 * Talks straight to the PostgREST API with native fetch (Node 18+, no deps).
 *
 * Usage:
 *   node scripts/cleanup-users.mjs                          # DRY RUN: classify + report (default)
 *   node scripts/cleanup-users.mjs --bucket=test_noise      # DRY RUN scoped to one bucket
 *   node scripts/cleanup-users.mjs --archive --bucket=test_noise
 *                                                           # archive JSON exports, no deletion
 *   node scripts/cleanup-users.mjs --archive --execute --bucket=test_noise,anon
 *                                                           # archive THEN delete
 *   node scripts/cleanup-users.mjs --no-archive --execute --bucket=test_cartridges
 *                                                           # delete without archiving (explicit opt-out)
 *
 * Buckets:
 *   test_noise      username/real_name matches /test|mrcolson|colsonmr|^bob$|^bbobby$|demo|dummy|sample/i
 *                   OR password === 'auto-created'
 *   lettered        class_period in A/B/E/F (and not test_noise)
 *   null_named      no class_period but has real_name (and not test_noise)
 *   anon            no class_period AND no real_name (and not test_noise)
 *   all             every row in users
 *   test_cartridges special: deletes user_progress rows where cartridge_id in ('test-cartridge'),
 *                   regardless of user. Touches no other table.
 *
 * Users that fit none of the above (e.g. class_period C/D/G) are reported as
 * 'unclassified' and are only ever touched via --bucket=all.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   (get them with: railway variables --service lrsl-driller)
 *
 * Deletion order (per schema files in supabase_schema.sql, railway-server/migrations/*.sql,
 * railway-server/schema-*.sql):
 *   1. Explicit deletes from tables that store usernames as PLAIN TEXT (no FK to users).
 *   2. DELETE from users — FK cascades clean lsrl_progress, user_settings, teacher_reviews,
 *      grid_wars_players, grid_wars_structures; api_keys_pool.contributed_by and
 *      grid_wars_territories.owner/contested_by are SET NULL.
 *
 * Idempotent: re-running after a successful execute finds empty buckets and exits cleanly.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVE_ROOT = path.join(SCRIPT_DIR, '..', 'state', 'archive');

const CHUNK_SIZE = 50;    // usernames per in.(...) filter
const PAGE_SIZE = 1000;   // rows per paginated GET

const TEST_NOISE_RE = /test|mrcolson|colsonmr|^bob$|^bbobby$|demo|dummy|sample/i;
const LETTERED_PERIODS = new Set(['A', 'B', 'E', 'F']);
const TEST_CARTRIDGE_IDS = ['test-cartridge'];

const VALID_BUCKETS = ['test_noise', 'lettered', 'null_named', 'anon', 'all', 'test_cartridges'];
const USER_BUCKETS = ['test_noise', 'lettered', 'null_named', 'anon'];

// Tables that store usernames as PLAIN TEXT columns with NO foreign key to
// users(username). These MUST be deleted explicitly, BEFORE deleting users.
// Order matters only for readability; none of these reference each other.
const TEXT_TABLES = [
  { table: 'user_progress',          columns: ['username'] },
  { table: 'time_sessions',          columns: ['username'] },
  { table: 'time_problems',          columns: ['username'] },
  { table: 'ghost_profiles',         columns: ['username'] },
  { table: 'ghost_battles',          columns: ['challenger_username', 'defender_username'] }, // TWO username columns (014)
  { table: 'ghost_ratings',          columns: ['username'] },
  { table: 'ghost_orbits_stats',     columns: ['username'] },
  { table: 'point_events',           columns: ['player_id'] },          // renamed from username in v1.6.2 (001)
  { table: 'grid_wars_gifts',        columns: ['from_username', 'to_username'] }, // (005)
  { table: 'pong_stats',             columns: ['username'] },           // (006)
  { table: 'pong_duels',             columns: ['attacker_username', 'defender_username'] },
  { table: 'pong_matches',           columns: ['attacker_username', 'defender_username'] },
  { table: 'pong_duel_log',          columns: ['username'] },
  { table: 'ctf_players',            columns: ['username'] },           // (009/011, deprecated but data retained)
  { table: 'ctf_tiebreaker_matches', columns: ['blue_player', 'red_player'] },
  { table: 'koth_players',           columns: ['username'] },           // (012)
  { table: 'koth_point_events',      columns: ['username'] },
  { table: 'tiebreaker_matches',     columns: ['blue_player', 'red_player'] },
  { table: 'tiebreaker_champions',   columns: ['username'] },
];

// FK -> users(username) ON DELETE CASCADE. Deleted automatically by Postgres
// when the users row goes away. Archived (and counted) for safety, never
// deleted directly by this script.
const CASCADE_TABLES = [
  { table: 'lsrl_progress',        columns: ['username'] },
  { table: 'user_settings',        columns: ['username'] },
  { table: 'teacher_reviews',      columns: ['username'] },
  { table: 'grid_wars_players',    columns: ['username'] },
  { table: 'grid_wars_structures', columns: ['owner'] },
];

// FK -> users(username) ON DELETE SET NULL. Rows survive with the reference
// nulled. Archived so the original attribution is recoverable.
const SET_NULL_TABLES = [
  { table: 'api_keys_pool',        columns: ['contributed_by'] },
  { table: 'grid_wars_territories', columns: ['owner', 'contested_by'] },
];

// Plain-text username references inside SHARED multi-player records.
// Deleting these rows would erase history that belongs to other students,
// so they are reported but never deleted (the dangling name is harmless —
// there is no FK).
const REFERENCE_ONLY_TABLES = [
  { table: 'ghost_orbits_sessions', columns: ['winner_username'] },
  { table: 'round_history',         columns: ['winner_id', 'runner_up_id', 'third_place_id'] },
  { table: 'progression_overrides', columns: ['updated_by'] },
];

const ALL_RELATED_TABLES = [...TEXT_TABLES, ...CASCADE_TABLES, ...SET_NULL_TABLES];

// ---------------------------------------------------------------------------
// CLI parsing + help (works without env vars)
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`cleanup-users.mjs — Supabase users-table cleanup (dry run by default)

USAGE
  node scripts/cleanup-users.mjs [flags]

FLAGS
  --help                 Show this help.
  --bucket=<a,b,...>     Scope to bucket(s): ${VALID_BUCKETS.join(', ')}.
  --archive              Export full JSON of every row that would be deleted to
                         state/archive/<ISO-timestamp>/<table>.json
  --execute              Actually delete. REQUIRES --bucket and REQUIRES either
                         --archive or --no-archive in the same invocation.
  --no-archive           Explicitly skip archiving when executing.

ENV
  SUPABASE_URL                 e.g. https://xyzcompany.supabase.co
  SUPABASE_SERVICE_ROLE_KEY    service role key (bypasses RLS)
  Get both with: railway variables --service lrsl-driller

EXAMPLES
  node scripts/cleanup-users.mjs
  node scripts/cleanup-users.mjs --archive --bucket=test_noise
  node scripts/cleanup-users.mjs --archive --execute --bucket=test_noise,anon
  node scripts/cleanup-users.mjs --no-archive --execute --bucket=test_cartridges`);
}

function parseArgs(argv) {
  const opts = { help: false, archive: false, noArchive: false, execute: false, buckets: [] };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--archive') opts.archive = true;
    else if (arg === '--no-archive') opts.noArchive = true;
    else if (arg === '--execute') opts.execute = true;
    else if (arg.startsWith('--bucket=')) {
      const names = arg.slice('--bucket='.length).split(',').map((s) => s.trim()).filter(Boolean);
      for (const name of names) {
        if (!VALID_BUCKETS.includes(name)) {
          console.error(`ERROR: unknown bucket '${name}'. Valid buckets: ${VALID_BUCKETS.join(', ')}`);
          process.exit(1);
        }
        if (!opts.buckets.includes(name)) opts.buckets.push(name);
      }
    } else {
      console.error(`ERROR: unknown flag '${arg}'. Run with --help for usage.`);
      process.exit(1);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const T0 = Date.now();
function log(msg) {
  const secs = ((Date.now() - T0) / 1000).toFixed(1).padStart(6);
  console.log(`[${secs}s] ${msg}`);
}

// ---------------------------------------------------------------------------
// PostgREST helpers
// ---------------------------------------------------------------------------

let SUPABASE_URL = '';
let SERVICE_KEY = '';

function authHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function isMissingTableError(status, text) {
  return (status === 404 || status === 400) &&
    /PGRST205|42P01|Could not find the table|does not exist/i.test(text);
}

/**
 * Low-level PostgREST call. Returns { ok, missing, status, data, headers }.
 * `missing: true` means the table does not exist in this database (some
 * migrations were never applied) — callers should skip gracefully.
 */
async function rest(query, { method = 'GET', headers = {} } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const res = await fetch(url, { method, headers: { ...authHeaders(), ...headers } });
  const text = await res.text();
  if (res.ok) {
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    return { ok: true, missing: false, status: res.status, data, headers: res.headers };
  }
  if (res.status === 416) {
    // Range Not Satisfiable — paginated past the end; treat as empty page.
    return { ok: true, missing: false, status: res.status, data: [], headers: res.headers };
  }
  if (isMissingTableError(res.status, text)) {
    return { ok: false, missing: true, status: res.status, data: null, headers: res.headers };
  }
  throw new Error(`${method} ${url} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
}

/** GET with Range-header pagination. Returns { missing, rows }. */
async function fetchAll(queryBase) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const r = await rest(queryBase, {
      headers: { 'Range-Unit': 'items', Range: `${offset}-${offset + PAGE_SIZE - 1}` },
    });
    if (r.missing) return { missing: true, rows: [] };
    const page = Array.isArray(r.data) ? r.data : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return { missing: false, rows };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Quote a value for PostgREST in.(...) lists — handles commas/spaces/quotes. */
function quoteVal(v) {
  return `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function inList(values) {
  return `(${values.map(quoteVal).join(',')})`;
}

/** Build a URL-encoded filter for one or more columns matching a username chunk. */
function buildFilter(columns, values) {
  const list = inList(values);
  if (columns.length === 1) {
    return `${columns[0]}=${encodeURIComponent(`in.${list}`)}`;
  }
  const parts = columns.map((c) => `${c}.in.${list}`).join(',');
  return `or=${encodeURIComponent(`(${parts})`)}`;
}

function rowKey(row) {
  return row && row.id !== undefined ? `id:${row.id}` : JSON.stringify(row);
}

/**
 * Fetch every row in spec.table where any of spec.columns matches one of the
 * usernames. Chunked at CHUNK_SIZE, deduped (two-column tables can match twice).
 */
async function fetchMatching(spec, usernames, select = '*') {
  const seen = new Map();
  for (const col of spec.columns) {
    for (const group of chunk(usernames, CHUNK_SIZE)) {
      const filter = `${col}=${encodeURIComponent(`in.${inList(group)}`)}`;
      const res = await fetchAll(`${spec.table}?select=${encodeURIComponent(select)}&${filter}`);
      if (res.missing) return { missing: true, rows: [] };
      for (const row of res.rows) seen.set(rowKey(row), row);
    }
  }
  return { missing: false, rows: [...seen.values()] };
}

/** DELETE rows matching usernames in any of spec.columns. Returns { missing, deleted }. */
async function deleteMatching(spec, usernames) {
  let deleted = 0;
  for (const group of chunk(usernames, CHUNK_SIZE)) {
    const filter = buildFilter(spec.columns, group);
    const r = await rest(`${spec.table}?select=${encodeURIComponent(spec.columns[0])}&${filter}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
    if (r.missing) return { missing: true, deleted };
    deleted += Array.isArray(r.data) ? r.data.length : 0;
  }
  return { missing: false, deleted };
}

/**
 * Exact count of rows in spec.table matching usernames in any of spec.columns,
 * via HEAD + Prefer: count=exact per chunk. fetchMatching is NOT suitable for
 * counting when the select excludes the PK: identical projected rows collapse
 * in its dedup Map (e.g. 9,887 time_problems rows would report as ~119).
 * Note: a row matching usernames in two different chunks counts twice — fine
 * for reporting; verification only cares about 0 vs non-zero.
 */
async function countMatching(spec, usernames) {
  let total = 0;
  for (const group of chunk(usernames, CHUNK_SIZE)) {
    const filter = buildFilter(spec.columns, group);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${spec.table}?select=*&${filter}`, {
      method: 'HEAD',
      headers: { ...authHeaders(), Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' },
    });
    if (!res.ok && res.status !== 416 && res.status !== 206) {
      if (res.status === 404 || res.status === 400) return { missing: true, count: total };
      throw new Error(`HEAD ${spec.table} -> HTTP ${res.status}`);
    }
    const cr = res.headers.get('content-range');
    if (cr && cr.includes('/') && cr.split('/')[1] !== '*') total += Number(cr.split('/')[1]);
  }
  return { missing: false, count: total };
}

/** Total row count for a table via HEAD + Prefer: count=exact. null if table missing. */
async function totalCount(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    method: 'HEAD',
    headers: { ...authHeaders(), Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' },
  });
  if (!res.ok && res.status !== 416 && res.status !== 206) {
    if (res.status === 404 || res.status === 400) return null;
    throw new Error(`HEAD ${table} -> HTTP ${res.status}`);
  }
  const cr = res.headers.get('content-range'); // "0-0/123" or "*/0"
  if (!cr || !cr.includes('/')) return null;
  const total = cr.split('/')[1];
  return total === '*' ? null : Number(total);
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function classifyUser(u) {
  const username = u.username || '';
  const realName = u.real_name || '';
  const period = (u.class_period || '').toUpperCase();
  if (TEST_NOISE_RE.test(username) || TEST_NOISE_RE.test(realName) || u.password === 'auto-created') {
    return 'test_noise';
  }
  if (period && LETTERED_PERIODS.has(period)) return 'lettered';
  if (!period && realName) return 'null_named';
  if (!period && !realName) return 'anon';
  return 'unclassified'; // e.g. class_period C/D/G — only reachable via --bucket=all
}

function bucketize(users) {
  const buckets = { test_noise: [], lettered: [], null_named: [], anon: [], unclassified: [] };
  for (const u of users) buckets[classifyUser(u)].push(u);
  buckets.all = users.slice();
  return buckets;
}

/** Resolve the union of users targeted by the selected user-buckets. */
function resolveTargets(buckets, selected) {
  if (selected.includes('all')) return buckets.all.slice();
  const seen = new Set();
  const out = [];
  for (const name of selected) {
    if (!USER_BUCKETS.includes(name)) continue; // test_cartridges handled separately
    for (const u of buckets[name]) {
      if (!seen.has(u.username)) {
        seen.add(u.username);
        out.push(u);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function printUserTable(users) {
  if (users.length === 0) {
    console.log('  (empty)');
    return;
  }
  const headers = ['username', 'real_name', 'period', 'created_at'];
  const rows = users.map((u) => [
    String(u.username ?? ''),
    String(u.real_name ?? ''),
    String(u.class_period ?? ''),
    String(u.created_at ?? ''),
  ]);
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (cells) => '  ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ');
  console.log(line(headers));
  console.log('  ' + widths.map((w) => '-'.repeat(w)).join('-+-'));
  for (const r of rows) console.log(line(r));
}

async function reportRelatedCounts(usernames) {
  const groups = [
    ['explicit delete (plain-text username, no FK)', TEXT_TABLES],
    ['FK cascade (deleted with users row)', CASCADE_TABLES],
    ['FK set-null (rows kept, reference nulled)', SET_NULL_TABLES],
    ['reference-only (shared records, never deleted)', REFERENCE_ONLY_TABLES],
  ];
  for (const [label, specs] of groups) {
    console.log(`  -- ${label} --`);
    for (const spec of specs) {
      const res = await countMatching(spec, usernames);
      if (res.missing) {
        console.log(`  ${spec.table.padEnd(24)} (table not found — skipped)`);
      } else {
        console.log(`  ${spec.table.padEnd(24)} ${res.count} row(s)`);
      }
    }
  }
}

async function reportTestCartridges() {
  const filter = `cartridge_id=${encodeURIComponent(`in.${inList(TEST_CARTRIDGE_IDS)}`)}`;
  const res = await fetchAll(`user_progress?select=username,cartridge_id&${filter}`);
  if (res.missing) {
    console.log('  user_progress table not found — skipped');
    return 0;
  }
  console.log(`  user_progress rows with cartridge_id in (${TEST_CARTRIDGE_IDS.join(', ')}): ${res.rows.length}`);
  return res.rows.length;
}

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------

async function archiveRows(dir, table, rows) {
  const file = path.join(dir, `${table}.json`);
  await writeFile(file, JSON.stringify(rows, null, 2), 'utf8');
  log(`  archived ${String(rows.length).padStart(5)} row(s) -> ${file}`);
}

async function runArchive(targets, selectedBuckets, includeTestCartridges) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-'); // Windows-safe ISO timestamp
  const dir = path.join(ARCHIVE_ROOT, stamp);
  await mkdir(dir, { recursive: true });
  log(`Archiving to ${dir}`);

  const manifest = {
    created_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    buckets: selectedBuckets,
    usernames: targets.map((u) => u.username),
    test_cartridge_ids: includeTestCartridges ? TEST_CARTRIDGE_IDS : [],
    tables: {},
  };

  if (targets.length > 0) {
    const usernames = targets.map((u) => u.username);
    await archiveRows(dir, 'users', targets);
    manifest.tables.users = { action: 'delete', rows: targets.length };

    for (const spec of TEXT_TABLES) {
      const res = await fetchMatching(spec, usernames);
      if (res.missing) {
        manifest.tables[spec.table] = { action: 'skip', reason: 'table not found' };
        log(`  ${spec.table}: table not found — skipped`);
        continue;
      }
      await archiveRows(dir, spec.table, res.rows);
      manifest.tables[spec.table] = { action: 'explicit-delete', rows: res.rows.length };
    }
    for (const spec of CASCADE_TABLES) {
      const res = await fetchMatching(spec, usernames);
      if (res.missing) {
        manifest.tables[spec.table] = { action: 'skip', reason: 'table not found' };
        log(`  ${spec.table}: table not found — skipped`);
        continue;
      }
      await archiveRows(dir, spec.table, res.rows);
      manifest.tables[spec.table] = { action: 'fk-cascade-delete', rows: res.rows.length };
    }
    for (const spec of SET_NULL_TABLES) {
      const res = await fetchMatching(spec, usernames);
      if (res.missing) {
        manifest.tables[spec.table] = { action: 'skip', reason: 'table not found' };
        log(`  ${spec.table}: table not found — skipped`);
        continue;
      }
      await archiveRows(dir, spec.table, res.rows);
      manifest.tables[spec.table] = { action: 'fk-set-null (rows kept, archived for attribution)', rows: res.rows.length };
    }
  }

  if (includeTestCartridges) {
    const filter = `cartridge_id=${encodeURIComponent(`in.${inList(TEST_CARTRIDGE_IDS)}`)}`;
    const res = await fetchAll(`user_progress?select=*&${filter}`);
    if (!res.missing) {
      await archiveRows(dir, 'user_progress.test_cartridges', res.rows);
      manifest.tables['user_progress (test_cartridges)'] = { action: 'explicit-delete', rows: res.rows.length };
    }
  }

  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  log(`Archive manifest written: ${path.join(dir, 'manifest.json')}`);
  return dir;
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

async function runExecute(targets, includeTestCartridges) {
  // Step 1: explicit deletes from NO-FK plain-text tables, BEFORE users.
  if (targets.length > 0) {
    const usernames = targets.map((u) => u.username);
    log(`Deleting related rows for ${usernames.length} user(s) from ${TEXT_TABLES.length} plain-text tables...`);
    for (const spec of TEXT_TABLES) {
      const res = await deleteMatching(spec, usernames);
      if (res.missing) {
        log(`  ${spec.table}: table not found — skipped`);
      } else {
        log(`  ${spec.table}: deleted ${res.deleted} row(s) [cols: ${spec.columns.join(', ')}]`);
      }
    }

    // Step 2: delete users. FK cascades clean lsrl_progress, user_settings,
    // teacher_reviews, grid_wars_players, grid_wars_structures.
    // api_keys_pool.contributed_by / grid_wars_territories.owner+contested_by -> SET NULL.
    log('Deleting users (FK cascades + set-null fire here)...');
    const res = await deleteMatching({ table: 'users', columns: ['username'] }, usernames);
    log(`  users: deleted ${res.deleted} row(s)`);
  }

  // Step 3: test_cartridges special bucket.
  if (includeTestCartridges) {
    log(`Deleting user_progress rows with cartridge_id in (${TEST_CARTRIDGE_IDS.join(', ')})...`);
    const filter = `cartridge_id=${encodeURIComponent(`in.${inList(TEST_CARTRIDGE_IDS)}`)}`;
    const r = await rest(`user_progress?select=username&${filter}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    });
    if (r.missing) log('  user_progress: table not found — skipped');
    else log(`  user_progress: deleted ${Array.isArray(r.data) ? r.data.length : 0} row(s)`);
  }
}

async function runVerification(targets, includeTestCartridges) {
  console.log('\n=== VERIFICATION ===');
  const usernames = targets.map((u) => u.username);

  if (usernames.length > 0) {
    const remainingUsers = await countMatching({ table: 'users', columns: ['username'] }, usernames);
    console.log(`users rows still matching targets: ${remainingUsers.count} (expected 0)`);

    for (const group of [TEXT_TABLES, CASCADE_TABLES, SET_NULL_TABLES]) {
      for (const spec of group) {
        const res = await countMatching(spec, usernames);
        if (res.missing) {
          console.log(`  ${spec.table.padEnd(24)} table not found — skipped`);
        } else {
          const note = res.count === 0 ? 'OK' : 'WARNING: rows remain';
          console.log(`  ${spec.table.padEnd(24)} ${res.count} matching row(s) remain (expected 0) ${note}`);
        }
      }
    }
    for (const spec of REFERENCE_ONLY_TABLES) {
      const res = await countMatching(spec, usernames);
      if (!res.missing) {
        console.log(`  ${spec.table.padEnd(24)} ${res.count} row(s) still reference targets (reference-only, intentionally kept)`);
      }
    }
  }

  if (includeTestCartridges) {
    const filter = `cartridge_id=${encodeURIComponent(`in.${inList(TEST_CARTRIDGE_IDS)}`)}`;
    const res = await fetchAll(`user_progress?select=username&${filter}`);
    if (!res.missing) {
      console.log(`  user_progress test-cartridge rows remaining: ${res.rows.length} (expected 0)`);
    }
  }

  console.log('\nTotal row counts per table:');
  const tables = ['users', ...ALL_RELATED_TABLES.map((s) => s.table), ...REFERENCE_ONLY_TABLES.map((s) => s.table)];
  for (const table of tables) {
    const n = await totalCount(table);
    console.log(`  ${table.padEnd(24)} ${n === null ? '(not found)' : n}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('ERROR: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are not set.');
    console.error('Fetch them with:  railway variables --service lrsl-driller');
    console.error('Then export them, e.g. (PowerShell):');
    console.error('  $env:SUPABASE_URL = "https://<project>.supabase.co"');
    console.error('  $env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"');
    process.exit(1);
  }

  // Flag sanity checks.
  if (opts.execute) {
    if (opts.buckets.length === 0) {
      console.error('ERROR: --execute requires --bucket=<name,...>. Refusing to run.');
      process.exit(1);
    }
    if (!opts.archive && !opts.noArchive) {
      console.error('ERROR: --execute requires --archive (recommended) or an explicit --no-archive');
      console.error('       in the SAME invocation. Refusing to run.');
      process.exit(1);
    }
    if (opts.archive && opts.noArchive) {
      console.error('ERROR: --archive and --no-archive are mutually exclusive.');
      process.exit(1);
    }
  }

  // --archive with no --bucket means "archive everything" (no deletion without
  // --execute anyway) — an empty archive here would be a silent footgun.
  if (opts.archive && !opts.execute && opts.buckets.length === 0) {
    log('--archive with no --bucket: defaulting to --bucket=all,test_cartridges (archive only).');
    opts.buckets = ['all', 'test_cartridges'];
  }

  const includeTestCartridges = opts.buckets.includes('test_cartridges');
  const selectedUserBuckets = opts.buckets.filter((b) => b !== 'test_cartridges');

  log(`Mode: ${opts.execute ? 'EXECUTE' : 'DRY RUN'}${opts.archive ? ' + archive' : ''}`);
  log(`Target: ${SUPABASE_URL}`);

  log('Fetching users...');
  const usersRes = await fetchAll('users?select=*&order=created_at.asc');
  if (usersRes.missing) {
    console.error('ERROR: users table not found — wrong project?');
    process.exit(1);
  }
  const users = usersRes.rows;
  log(`Fetched ${users.length} user row(s).`);

  const buckets = bucketize(users);
  const targets = resolveTargets(buckets, selectedUserBuckets);

  // ---- Dry-run report (always printed) ----
  const reportBuckets = selectedUserBuckets.length > 0
    ? selectedUserBuckets
    : [...USER_BUCKETS, 'unclassified'];

  console.log('\n=== CLASSIFICATION REPORT ===');
  console.log(`Counts: ${USER_BUCKETS.map((b) => `${b}=${buckets[b].length}`).join(', ')}, unclassified=${buckets.unclassified.length}, all=${buckets.all.length}`);
  for (const name of reportBuckets) {
    const list = name === 'all' ? buckets.all : buckets[name];
    console.log(`\n--- bucket: ${name} (${list.length} user(s)) ---`);
    printUserTable(list);
    const teachers = list.filter((u) => u.user_type === 'teacher');
    if (teachers.length > 0) {
      console.log(`  WARNING: bucket includes ${teachers.length} TEACHER account(s): ${teachers.map((t) => t.username).join(', ')}`);
    }
    if (list.length > 0) {
      console.log('  Related row counts:');
      await reportRelatedCounts(list.map((u) => u.username));
    }
  }

  if (includeTestCartridges || selectedUserBuckets.length === 0) {
    console.log('\n--- bucket: test_cartridges ---');
    await reportTestCartridges();
  }

  // ---- Archive ----
  if (opts.archive) {
    console.log('');
    await runArchive(targets, opts.buckets, includeTestCartridges);
  }

  // ---- Execute ----
  if (!opts.execute) {
    console.log('\nDRY RUN complete — nothing was deleted.');
    console.log('To delete: re-run with --archive --execute --bucket=<name,...>');
    return;
  }

  if (targets.length === 0 && !includeTestCartridges) {
    console.log('\nSelected bucket(s) are empty — nothing to delete. (Idempotent: already clean.)');
    return;
  }

  console.log('');
  log(`EXECUTING deletion for bucket(s): ${opts.buckets.join(', ')} (${targets.length} user(s))${opts.noArchive ? ' [NO ARCHIVE]' : ''}`);
  await runExecute(targets, includeTestCartridges);
  await runVerification(targets, includeTestCartridges);
  log('Done.');
}

main().catch((err) => {
  console.error(`\nFATAL: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
