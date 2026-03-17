import { spawnSync } from 'node:child_process';

async function readStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input;
}

function isGitCommitCommand(command) {
  return /\bgit\b[\s\S]*\bcommit\b/.test(command);
}

function listUntrackedAssets(cwd) {
  const result = spawnSync(
    'git',
    [
      'ls-files',
      '--others',
      '--exclude-standard',
      '--',
      '*.mp3',
      '*.wav',
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.svg',
      '*.gif',
      '*.ico',
      '*.woff',
      '*.woff2',
      '*.ttf'
    ],
    {
      cwd,
      encoding: 'utf8',
      windowsHide: true
    }
  );

  if (result.error || result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

const rawInput = (await readStdin()).trim();
if (!rawInput) {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(rawInput);
} catch {
  process.exit(0);
}

const command = payload?.tool_input?.command;
if (typeof command !== 'string' || !isGitCommitCommand(command)) {
  process.exit(0);
}

const files = listUntrackedAssets(payload?.cwd || process.cwd());
if (files.length === 0) {
  process.exit(0);
}

const message = [
  'WARNING: Untracked asset files detected before commit:',
  ...files,
  'Consider staging these before committing.'
].join('\n');

process.stdout.write(
  JSON.stringify({
    systemMessage: message,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow'
    }
  })
);
