const { execFileSync } = require("child_process");

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function isGitCommit(command) {
  return /\bgit\s+commit\b/i.test(command);
}

function listUntrackedAssets() {
  const patterns = [
    "*.mp3",
    "*.wav",
    "*.png",
    "*.jpg",
    "*.svg",
    "*.gif",
    "*.ico",
    "*.woff",
    "*.woff2",
    "*.ttf"
  ];

  try {
    const output = execFileSync(
      "git",
      ["ls-files", "--others", "--exclude-standard", "--", ...patterns],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );

    return output
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const command = payload.tool_input && typeof payload.tool_input.command === "string"
    ? payload.tool_input.command
    : "";

  if (!isGitCommit(command)) {
    return;
  }

  const untrackedAssets = listUntrackedAssets();
  if (untrackedAssets.length === 0) {
    return;
  }

  const warning = [
    "Warning: untracked asset files detected before git commit:",
    ...untrackedAssets.map((file) => `- ${file}`),
    "Consider staging or ignoring them if they belong in this change."
  ].join("\n");

  process.stdout.write(
    JSON.stringify({
      systemMessage: warning,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: "Untracked asset reminder",
        additionalContext: warning
      }
    })
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
