// GENERATED from lib/codegraph.js by scripts/sync-github-lib.sh. Do not edit here.
// Codebase index of a git project (spec 026): is there a CodeGraph index (<main>/.codegraph/), make one
// with `codegraph init`, refresh it with `codegraph sync`, and keep `.codegraph/` out of git through the
// repository's local exclude list (info/exclude, shared by every worktree; the tracked .gitignore is
// never touched). Single source for Project Settings › Index (synced copy in mods/project-settings/).
// No `herdr` import: exec(cmd, args, opts?) -> Promise<{ code, stdout, stderr }>,
// io = { read(path) -> Promise<string|null>, write(path, text, expected) -> Promise }.

const ENTRY = ".codegraph/";
const SPELLINGS = new Set([".codegraph", ".codegraph/", "/.codegraph", "/.codegraph/"]);
const LONG = 30 * 60 * 1000; // indexing a big repo takes minutes

// Does an exclude/ignore text already ignore .codegraph?
export function hasEntry(text) {
  return (text ?? "").split("\n").some((l) => { const s = l.trim(); return !s.startsWith("#") && SPELLINGS.has(s); });
}

// The text with `.codegraph/` on its own last line (unchanged when already there).
export function addEntry(text) {
  const t = text ?? "";
  if (hasEntry(t)) return t;
  return `${t}${t && !t.endsWith("\n") ? "\n" : ""}${ENTRY}\n`;
}

// The codegraph command: on PATH, the installer's ~/.local/bin, or the login shell's PATH (Herdr's exec
// may not have it). A found command is kept; "not found" is asked again next time.
let tool = null;
export async function findTool(exec, home) {
  if (tool) return tool;
  const works = async (cmd) => (await exec(cmd, ["--version"]).catch(() => null))?.code === 0;
  for (const cmd of ["codegraph", `${home}/.local/bin/codegraph`]) if (await works(cmd)) return (tool = cmd);
  const r = await exec("zsh", ["-ilc", "command -v codegraph"]).catch(() => null);
  const p = r?.code === 0 ? r.stdout.trim().split("\n").pop()?.trim() : "";
  if (p && p.startsWith("/") && await works(p)) return (tool = p);
  return null;
}
export function resetTool() { tool = null; } // tests

// Absolute path of the repository's local exclude list (the common one for a worktree).
export async function excludeFile(main, exec) {
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-path", "info/exclude"], { cwd: main });
  if (r.code !== 0) throw new Error((r.stderr || "git rev-parse failed").trim());
  return r.stdout.trim();
}

// Add `.codegraph/` to the local exclude list when no equivalent line is there.
export async function ensureExcluded(main, exec, io) {
  const file = await excludeFile(main, exec);
  const old = await io.read(file).catch(() => null);
  if (hasEntry(old)) return { added: false, file };
  await exec("mkdir", ["-p", file.slice(0, file.lastIndexOf("/"))]);
  await io.write(file, addEntry(old), old);
  return { added: true, file };
}

// Why the index action is refused for this folder, or null.
export function blockedReason(main, home) {
  const m = (main ?? "").replace(/\/+$/, "") || "/";
  if (m === "/") return "the filesystem root";
  if (m === (home ?? "").replace(/\/+$/, "")) return "your home folder";
  return null;
}

// State of a project's index: see specs/026-codebase-index/data-model.md.
export async function indexState(main, exec, home) {
  const [found, dir, tracked, ign, file] = await Promise.all([
    findTool(exec, home),
    exec("test", ["-d", `${main}/.codegraph`]).catch(() => null),
    exec("git", ["ls-files", "--", ".codegraph"], { cwd: main }).catch(() => null),
    exec("git", ["check-ignore", "-q", ".codegraph/"], { cwd: main }).catch(() => null),
    excludeFile(main, exec).catch(() => null),
  ]);
  const s = {
    tool: found, indexed: dir?.code === 0, files: null, symbols: null, lastIndexed: null, pending: 0,
    tracked: tracked?.code === 0 && tracked.stdout.trim() !== "", ignored: ign?.code === 0,
    excludeFile: file, blocked: blockedReason(main, home),
  };
  if (s.indexed && found) {
    const r = await exec(found, ["status", "--json", main], { cwd: main }).catch(() => null);
    try {
      const j = JSON.parse(r?.stdout ?? "");
      const p = j.pendingChanges ?? {};
      Object.assign(s, { files: j.fileCount ?? null, symbols: j.nodeCount ?? null, lastIndexed: j.lastIndexed ?? null,
        pending: (p.added ?? 0) + (p.modified ?? 0) + (p.removed ?? 0) });
    } catch (_e) { /* indexed, details unknown */ }
  }
  return s;
}

// Last few lines of a failed run, without terminal colours or box drawing.
export function errorText(r) {
  const out = `${r?.stderr ?? ""}\n${r?.stdout ?? ""}`.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
  const ls = out.split("\n").map((l) => l.replace(/^[\s│┌└●◆◇■▲]+/, "").trim()).filter(Boolean);
  return ls.slice(-3).join(" · ") || `exit ${r?.code ?? "?"}`;
}

// One run per project at a time: main -> { mode, promise }.
const runs = new Map();
export function running(main) { return runs.get(main)?.mode ?? null; }

// mode "init": exclude entry first, then `codegraph init <main>`; "sync": `codegraph sync <main>`.
export function runIndex(main, exec, io, home, mode) {
  const cur = runs.get(main);
  if (cur) return cur.promise;
  const promise = (async () => {
    const why = blockedReason(main, home);
    if (why) return { ok: false, error: `Not indexing ${why}` };
    const cmd = await findTool(exec, home);
    if (!cmd) return { ok: false, error: "codegraph command not found" };
    try {
      if (mode === "init") await ensureExcluded(main, exec, io);
      const r = await exec(cmd, [mode === "init" ? "init" : "sync", main], { cwd: main, timeout: LONG });
      return r.code === 0 ? { ok: true } : { ok: false, error: errorText(r) };
    } catch (e) {
      return { ok: false, error: String(e?.message ?? e) };
    }
  })().finally(() => runs.delete(main));
  runs.set(main, { mode, promise });
  return promise;
}
