import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hasEntry, addEntry, findTool, resetTool, excludeFile, ensureExcluded, blockedReason, indexState, errorText, runIndex, running } from "../lib/codegraph.js";

// Fake exec: answers by "cmd arg0 arg1" prefix; a function answer gets (cmd, args, opts). Records calls.
const fakeExec = (answers) => {
  const calls = [];
  const exec = async (cmd, args = [], opts) => {
    const line = `${cmd} ${args.join(" ")}`;
    calls.push(line);
    const key = Object.keys(answers).find((k) => line.startsWith(k));
    if (!key) throw new Error(`unexpected exec: ${line}`);
    const a = answers[key];
    const r = typeof a === "function" ? await a(cmd, args, opts) : a;
    return { code: 0, stdout: "", stderr: "", ...r };
  };
  exec.calls = calls;
  return exec;
};

// In-memory files with writeTextFile's "expected" check.
const memIo = (files = {}) => ({
  files,
  read: async (p) => (p in files ? files[p] : null),
  write: async (p, text, expected) => {
    if ((p in files ? files[p] : null) !== expected) throw new Error("stale");
    files[p] = text;
  },
});

const EX = "/r/.git/info/exclude";
const base = {
  "codegraph --version": { stdout: "1.0.1" },
  "git rev-parse --path-format=absolute --git-path info/exclude": { stdout: `${EX}\n` },
  "mkdir -p": {},
};

beforeEach(() => resetTool());

test("hasEntry accepts each spelling, ignores comments and other paths", () => {
  for (const s of [".codegraph", ".codegraph/", "/.codegraph", "/.codegraph/", "  .codegraph/  "]) assert.ok(hasEntry(`# x\n${s}\n`), s);
  assert.equal(hasEntry(null), false);
  assert.equal(hasEntry("# .codegraph/\n"), false);
  assert.equal(hasEntry(".codegraph/db\nfoo.codegraph\n"), false);
});

test("addEntry appends on its own line and never twice", () => {
  assert.equal(addEntry(null), ".codegraph/\n");
  assert.equal(addEntry(""), ".codegraph/\n");
  assert.equal(addEntry("# c\n*.log"), "# c\n*.log\n.codegraph/\n");
  assert.equal(addEntry("*.log\n"), "*.log\n.codegraph/\n");
  assert.equal(addEntry("/.codegraph\n"), "/.codegraph\n");
});

test("findTool: PATH, then ~/.local/bin, then login shell; caches only a hit", async () => {
  assert.equal(await findTool(fakeExec({ "codegraph --version": {} }), "/h"), "codegraph");
  resetTool();
  const local = fakeExec({ "codegraph --version": { code: 127 }, "/h/.local/bin/codegraph --version": {} });
  assert.equal(await findTool(local, "/h"), "/h/.local/bin/codegraph");
  resetTool();
  const shell = fakeExec({ "codegraph --version": { code: 127 }, "/h/.local/bin/codegraph": { code: 127 },
    "zsh -ilc": { stdout: "motd\n/opt/cg/codegraph\n" }, "/opt/cg/codegraph --version": {} });
  assert.equal(await findTool(shell, "/h"), "/opt/cg/codegraph");
  resetTool();
  const none = fakeExec({ "codegraph": { code: 127 }, "/h/.local/bin/codegraph": { code: 127 }, "zsh -ilc": { code: 1 } });
  assert.equal(await findTool(none, "/h"), null);
  assert.equal(await findTool(fakeExec({ "codegraph --version": {} }), "/h"), "codegraph"); // miss not cached
});

test("excludeFile uses the repository's git-path (common dir for worktrees)", async () => {
  assert.equal(await excludeFile("/r", fakeExec(base)), EX);
  await assert.rejects(excludeFile("/x", fakeExec({ "git rev-parse": { code: 128, stderr: "not a git repository" } })), /not a git repository/);
});

test("ensureExcluded: missing file, no trailing newline, already there", async () => {
  const io = memIo();
  const exec = fakeExec(base);
  assert.deepEqual(await ensureExcluded("/r", exec, io), { added: true, file: EX });
  assert.equal(io.files[EX], ".codegraph/\n");
  assert.ok(exec.calls.includes("mkdir -p /r/.git/info"));
  assert.deepEqual(await ensureExcluded("/r", exec, io), { added: false, file: EX });
  assert.equal(io.files[EX], ".codegraph/\n");

  const io2 = memIo({ [EX]: "# keep\n*.tmp" });
  await ensureExcluded("/r", fakeExec(base), io2);
  assert.equal(io2.files[EX], "# keep\n*.tmp\n.codegraph/\n");

  const io3 = memIo({ [EX]: "/.codegraph\n" });
  assert.equal((await ensureExcluded("/r", fakeExec(base), io3)).added, false);
});

test("blockedReason: home and root only", () => {
  assert.equal(blockedReason("/", "/h"), "the filesystem root");
  assert.equal(blockedReason("/h/", "/h"), "your home folder");
  assert.equal(blockedReason("/h/proj", "/h"), null);
});

test("indexState: indexed project with status details", async () => {
  const exec = fakeExec({ ...base,
    "test -d /r/.codegraph": {},
    "git ls-files": { stdout: "" },
    "git check-ignore": { code: 1 },
    "codegraph status --json /r": { stdout: JSON.stringify({ initialized: true, fileCount: 12, nodeCount: 340, lastIndexed: "2026-11-17T07:00:00Z", pendingChanges: { added: 1, modified: 2, removed: 0 } }) },
  });
  assert.deepEqual(await indexState("/r", exec, "/h"), {
    tool: "codegraph", indexed: true, files: 12, symbols: 340, lastIndexed: "2026-11-17T07:00:00Z", pending: 3,
    tracked: false, ignored: false, excludeFile: EX, blocked: null,
  });
});

test("indexState: not indexed, tracked, tool missing", async () => {
  const exec = fakeExec({ ...base, "codegraph --version": { code: 127 }, "/h/.local/bin/codegraph": { code: 127 }, "zsh -ilc": { code: 1 },
    "test -d": { code: 1 }, "git ls-files": { stdout: ".codegraph/.gitignore\n" }, "git check-ignore": { code: 1 } });
  const s = await indexState("/r", exec, "/h");
  assert.equal(s.tool, null);
  assert.equal(s.indexed, false);
  assert.equal(s.tracked, true);
  assert.ok(!exec.calls.some((c) => c.includes("status")));
});

test("errorText keeps the last lines without colours", () => {
  assert.equal(errorText({ code: 1, stderr: "\x1b[31m│ Error: lock held\x1b[0m\n", stdout: "◆ start\n" }), "Error: lock held · start");
  assert.equal(errorText({ code: 2 }), "exit 2");
});

test("runIndex init: exclude entry before init, one run at a time", async () => {
  const io = memIo();
  let release;
  const gate = new Promise((r) => { release = r; });
  const exec = fakeExec({ ...base, "codegraph init /r": async () => { await gate; return {}; } });
  const a = runIndex("/r", exec, io, "/h", "init");
  const b = runIndex("/r", exec, io, "/h", "init");
  assert.equal(a, b);
  assert.equal(running("/r"), "init");
  release();
  assert.deepEqual(await a, { ok: true });
  assert.equal(running("/r"), null);
  assert.equal(io.files[EX], ".codegraph/\n");
  assert.equal(exec.calls.filter((c) => c.startsWith("codegraph init")).length, 1);
  assert.ok(exec.calls.indexOf("mkdir -p /r/.git/info") < exec.calls.indexOf("codegraph init /r"));
});

test("runIndex sync failure, and refusal for home", async () => {
  const exec = fakeExec({ ...base, "codegraph sync /r": { code: 1, stderr: "Error: database is locked\n" } });
  assert.deepEqual(await runIndex("/r", exec, memIo(), "/h", "sync"), { ok: false, error: "Error: database is locked" });
  assert.ok(!exec.calls.some((c) => c.startsWith("mkdir")));
  assert.deepEqual(await runIndex("/h", fakeExec(base), memIo(), "/h", "init"), { ok: false, error: "Not indexing your home folder" });
});
