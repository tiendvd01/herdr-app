// Claude Code's saved conversations ("threads") of one folder (spec 031): ~/.claude/projects/<slug>/<uuid>.jsonl.
// Single source for the Threads panel (synced copy in mods/threads/). No `herdr` import:
// exec(cmd, args, opts?) -> Promise<{ code, stdout, stderr }>, read(path) -> Promise<string|null>.
// Nothing here writes, except deleteThread.

// Claude's folder name for a path: every character that is not a letter or digit becomes "-".
export const slugOf = (path) => String(path ?? "").replace(/[^A-Za-z0-9]/g, "-");
export const threadsDir = (home, folder) => `${home}/.claude/projects/${slugOf(folder)}`;
export const validId = (id) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const oneLine = (s, max = 160) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

// Commands that manage the session rather than ask anything; not a prompt.
const SESSION_COMMANDS = new Set(["/clear", "/exit", "/compact", "/resume", "/cost", "/status", "/model", "/config", "/login", "/logout", "/help", "/doctor", "/context", "/usage"]);

// A typed prompt as one line, or null when the text is not something the person typed
// (command output, caveats, reminders, interrupted-request notes).
export function cleanPrompt(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  const cmd = t.match(/<command-name>\s*([^<]*?)\s*<\/command-name>/);
  if (cmd) {
    const args = t.match(/<command-args>([\s\S]*?)<\/command-args>/)?.[1]?.trim();
    const name = cmd[1].startsWith("/") ? cmd[1] : `/${cmd[1]}`;
    if (!args && SESSION_COMMANDS.has(name)) return null;
    return oneLine(args ? `${name} ${args}` : name);
  }
  if (/^<(local-command-|system-reminder|command-message|bash-|task-notification)/.test(t)) return null;
  if (/^Caveat:/.test(t) || /^\[Request interrupted/.test(t)) return null;
  return oneLine(t);
}

// The summary of one thread from its records (already parsed objects, any order as written).
export function parseLines(records) {
  let custom = null, ai = null, first = null, last = null, prompts = 0, branch = null, cwd = null;
  for (const r of records) {
    if (!r || typeof r !== "object") continue;
    if (r.type === "custom-title" && r.customTitle) custom = r.customTitle;
    else if (r.type === "ai-title" && r.aiTitle) ai = r.aiTitle;
    else if (r.type === "last-prompt" && r.lastPrompt) last = r.lastPrompt;
    else if (r.type === "user" && !r.isMeta && !r.isSidechain) {
      const c = r.message?.content;
      const text = typeof c === "string" ? c : Array.isArray(c) ? c.filter((x) => x?.type === "text").map((x) => x.text).join(" ") : "";
      const p = cleanPrompt(text);
      if (!p) continue;
      prompts++;
      if (first == null) { first = p; branch = r.gitBranch || null; cwd = r.cwd || null; }
    }
  }
  const lastPrompt = last ? cleanPrompt(last) ?? oneLine(last) : null;
  const title = oneLine(custom || ai || first || lastPrompt || "Untitled thread", 120);
  return { title, firstPrompt: first, lastPrompt, prompts, branch, cwd };
}

// Every <uuid>.jsonl directly in dir: [{ id, path, mtime, size }]; [] when the folder is missing.
export async function listFiles(dir, exec) {
  const r = await exec("find", [dir, "-maxdepth", "1", "-type", "f", "-name", "*.jsonl", "-exec", "stat", "-f", "%m %z %N", "{}", "+"]);
  if (r.code !== 0 && !r.stdout) return [];
  const out = [];
  for (const line of r.stdout.split("\n")) {
    const m = line.match(/^(\d+) (\d+) (.+)$/);
    if (!m) continue;
    const path = m[3], id = path.slice(path.lastIndexOf("/") + 1).replace(/\.jsonl$/, "");
    if (validId(id)) out.push({ id, path, mtime: Number(m[1]), size: Number(m[2]) });
  }
  return out;
}

// The few record kinds a summary needs, from many files in one rg call. Map<path, summary>.
// Typed prompts are user records with string content, or an array of text (and image) items.
const PATTERNS = ['"type":"(custom-title|ai-title|last-prompt)"', '"type":"user","message":\\{"role":"user","content":("|\\[\\{"type":"text")'];
export async function summarize(paths, exec) {
  const res = new Map();
  if (!paths.length) return res;
  const args = ["--no-heading", "--with-filename", "--no-line-number", "--no-messages"];
  for (const p of PATTERNS) args.push("-e", p);
  const r = await exec("rg", [...args, "--", ...paths]);
  const byFile = new Map(paths.map((p) => [p, []]));
  for (const line of String(r.stdout ?? "").split("\n")) {
    const at = line.indexOf(".jsonl:");
    if (at < 0) continue;
    const path = line.slice(0, at + 6), rest = line.slice(at + 7);
    try { byFile.get(path)?.push(JSON.parse(rest)); } catch { /* half-written line */ }
  }
  for (const [p, recs] of byFile) res.set(p, parseLines(recs));
  return res;
}

// Summaries cached by path and mtime:size, so only threads that grew are read again.
export class ThreadCache {
  constructor() { this.dirs = new Map(); }
  async load(dir, exec) {
    const files = await listFiles(dir, exec);
    const cache = this.dirs.get(dir) ?? new Map();
    const stale = files.filter((f) => cache.get(f.path)?.stamp !== `${f.mtime}:${f.size}`);
    // One rg call per 100 files keeps the argument list short.
    for (let i = 0; i < stale.length; i += 100) {
      const part = stale.slice(i, i + 100), sums = await summarize(part.map((f) => f.path), exec);
      for (const f of part) cache.set(f.path, { stamp: `${f.mtime}:${f.size}`, sum: sums.get(f.path) ?? parseLines([]) });
    }
    const live = new Set(files.map((f) => f.path));
    for (const p of [...cache.keys()]) if (!live.has(p)) cache.delete(p);
    this.dirs.set(dir, cache);
    return files.map((f) => ({ ...f, ...cache.get(f.path).sum }))
      .filter((t) => t.prompts > 0)
      .sort((a, b) => b.mtime - a.mtime || a.id.localeCompare(b.id));
  }
}

// Map<sessionId, address> of threads live in a terminal: [{ address, pid }] (the terminal's foreground
// pid, which is Claude's own) against Claude's ~/.claude/sessions/<pid>.json.
export async function liveMap(agentPids, read, home) {
  const map = new Map();
  for (const { address, pid } of agentPids) {
    if (!pid) continue;
    const text = await read(`${home}/.claude/sessions/${pid}.json`).catch(() => null);
    try {
      const s = JSON.parse(text ?? "null");
      if (s?.sessionId && Number(s.pid ?? pid) === Number(pid)) map.set(s.sessionId, address);
    } catch { /* being written */ }
  }
  return map;
}

export function filterThreads(list, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((t) => [t.title, t.firstPrompt, t.lastPrompt].some((s) => s && s.toLowerCase().includes(q)));
}

// Removes a thread's file and its side folder (sub-agents, tool results).
export async function deleteThread(dir, id, exec) {
  if (!validId(id)) throw new Error(`Not a thread id: ${id}`);
  const a = await exec("rm", ["-f", `${dir}/${id}.jsonl`]);
  if (a.code !== 0) throw new Error((a.stderr || "rm failed").trim());
  const b = await exec("rm", ["-rf", `${dir}/${id}`]);
  if (b.code !== 0) throw new Error((b.stderr || "rm failed").trim());
}

// Short age of a time in seconds.
export function ago(seconds, now = Date.now() / 1000) {
  const d = Math.max(0, now - seconds);
  if (d < 60) return "now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 86400 * 7) return `${Math.floor(d / 86400)}d`;
  if (d < 86400 * 35) return `${Math.floor(d / 86400 / 7)}w`;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}
