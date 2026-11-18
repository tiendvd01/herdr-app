// GENERATED from lib/claude-memory.js by scripts/sync-github-lib.sh. Do not edit here.
// Claude Code's auto-memory of a git project (spec 029): ~/.claude/projects/<slug>/memory/, one note per
// fact (`---` header with name, description, type) plus the index MEMORY.md that Claude loads each
// session. Single source for Project Settings › Memory (synced copy in mods/project-settings/).
// No `herdr` import: exec(cmd, args, opts?) -> Promise<{ code, stdout, stderr }>,
// io = { read(path) -> Promise<string|null>, write(path, text, expected) -> Promise } (write rejects
// when the file no longer equals `expected`; null creates). Every write stays inside `dir`.

export const INDEX = "MEMORY.md";
export const TYPES = ["user", "feedback", "project", "reference"];

// Claude's folder name for a path: every character that is not a letter or digit becomes "-".
export const slugOf = (path) => String(path ?? "").replace(/[^A-Za-z0-9]/g, "-");
export const memoryDir = (home, main) => `${home}/.claude/projects/${slugOf(main)}/memory`;

// A note file this tab may write: a plain basename ending in .md, never the index.
export const safeFile = (file) => typeof file === "string" && file !== INDEX && /^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/.test(file) && !file.includes("..");

// Why a new note name is refused, or null.
export function validName(name, existing = []) {
  const n = String(name ?? "").trim();
  if (!n) return "Name is empty";
  if (n.length > 64) return "Name is longer than 64 characters";
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(n)) return "Use lowercase letters, digits, - and _ only";
  if (`${n}.md` === INDEX.toLowerCase() || existing.some((f) => f.toLowerCase() === `${n}.md`)) return "A note with this name already exists";
  return null;
}

const unquote = (s) => s.trim().replace(/^(["'])(.*)\1$/, "$2");

// { file, name, description, type, header, body, text } of one note.
export function parseNote(file, text) {
  const t = String(text ?? "");
  const stem = file.replace(/\.md$/, "");
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  const fields = {};
  if (m) {
    let block = null;
    for (const line of m[1].split(/\r?\n/)) {
      const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      const sub = line.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
      if (top) { block = top[2].trim() ? null : top[1]; if (top[2].trim()) fields[top[1]] = unquote(top[2]); }
      else if (sub && block === "metadata" && !(sub[1] in fields)) fields[sub[1]] = unquote(sub[2]);
    }
  }
  const body = m ? t.slice(m[0].length) : t;
  const first = body.split("\n").map((l) => l.replace(/^#+\s*/, "").trim()).find(Boolean) ?? "";
  const type = TYPES.includes(fields.type) ? fields.type : "unknown";
  return { file, name: fields.name || stem, description: fields.description || first, type, header: !!m, body, text: t };
}

// Index entries: lines that link a note file in this folder, `[Title](file.md)`.
export function parseIndex(text) {
  const out = [];
  String(text ?? "").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/\[([^\]]*)\]\(([^)\s]+\.md)\)/g)) {
      if (m[2].includes("/")) continue;
      const hook = line.slice(m.index + m[0].length).replace(/^\s*[—–:-]\s*/, "").trim();
      out.push({ line: i, title: m[1], file: m[2], hook });
    }
  });
  return out;
}

// Claude's note format.
export function noteText({ name, description, type, body }) {
  const one = (s) => String(s ?? "").replace(/\s*\n\s*/g, " ").trim();
  return `---\nname: ${one(name)}\ndescription: ${one(description)}\nmetadata:\n  type: ${TYPES.includes(type) ? type : "project"}\n---\n\n${String(body ?? "").trim()}\n`;
}

const titleOf = (name) => { const s = String(name).replace(/[-_]+/g, " ").trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
export const indexLine = (note) => `- [${titleOf(note.name)}](${note.file})${note.description ? ` — ${note.description}` : ""}`;

// The index text with `line` appended on its own line.
export function withLine(text, line) {
  const t = text ?? "";
  return `${t}${t && !t.endsWith("\n") ? "\n" : ""}${line}\n`;
}

// The index text without the lines that link `file`; every other line kept as it was.
export function withoutFile(text, file) {
  const drop = new Set(parseIndex(text).filter((e) => e.file === file).map((e) => e.line));
  return String(text ?? "").split("\n").filter((_l, i) => !drop.has(i)).join("\n");
}

// Note files with mtime (seconds), newest first; [] when the folder is missing.
async function listFiles(dir, exec) {
  const r = await exec("find", [dir, "-maxdepth", "1", "-type", "f", "-name", "*.md", "-exec", "stat", "-f", "%m %N", "{}", "+"]);
  if (r.code !== 0) {
    if (/No such file/i.test(r.stderr)) return null;
    throw new Error((r.stderr || "find failed").trim());
  }
  return r.stdout.split("\n").map((l) => l.match(/^(\d+) (.+)$/)).filter(Boolean)
    .map((m) => ({ file: m[2].slice(m[2].lastIndexOf("/") + 1), mtime: +m[1] }));
}

// Cheap change check: the folder's files and mtimes as one string.
export async function memoryStamp(dir, exec) {
  const files = await listFiles(dir, exec);
  return files ? files.map((f) => `${f.file}:${f.mtime}`).sort().join("|") : "none";
}

// The whole memory of a folder: notes, index, and index problems.
export async function loadMemory(dir, exec, io) {
  const files = await listFiles(dir, exec);
  if (!files) return { dir, exists: false, notes: [], index: null, unlisted: [], dead: [], stamp: "none" };
  const stamp = files.map((f) => `${f.file}:${f.mtime}`).sort().join("|");
  const notes = [];
  let index = null;
  for (const f of files) {
    const text = await io.read(`${dir}/${f.file}`).catch(() => null);
    if (text == null) continue;
    if (f.file === INDEX) index = { text, entries: parseIndex(text) };
    else notes.push({ ...parseNote(f.file, text), mtime: f.mtime });
  }
  notes.sort((a, b) => b.mtime - a.mtime || a.file.localeCompare(b.file));
  const listed = new Set((index?.entries ?? []).map((e) => e.file));
  const have = new Set(notes.map((n) => n.file));
  return {
    dir, exists: true, notes, index, stamp,
    unlisted: notes.filter((n) => !listed.has(n.file)).map((n) => n.file),
    dead: (index?.entries ?? []).filter((e) => !have.has(e.file)),
  };
}

const must = (file) => { if (!safeFile(file)) throw new Error(`Refused: ${file} is not a note file`); };

// Write a note's whole text; refused when the file changed since `expected` was read.
export async function saveNote(dir, file, text, expected, io) {
  must(file);
  try { await io.write(`${dir}/${file}`, text, expected); }
  catch (e) {
    const now = await io.read(`${dir}/${file}`).catch(() => expected);
    throw new Error(now !== expected ? "Changed on disk since it was opened" : String(e?.message ?? e));
  }
}

// Rewrite the index with `edit(text)`; nothing written when it does not change.
async function editIndex(dir, io, edit) {
  const path = `${dir}/${INDEX}`;
  const old = await io.read(path).catch(() => null);
  const next = edit(old);
  if (next !== (old ?? "")) await io.write(path, next, old);
}

// Remove a note and every index line that links it.
export async function deleteNote(dir, file, exec, io) {
  must(file);
  const r = await exec("rm", ["-f", `${dir}/${file}`]);
  if (r.code !== 0) throw new Error((r.stderr || "rm failed").trim());
  await editIndex(dir, io, (t) => withoutFile(t ?? "", file));
}

// Index line for a note the index does not link yet (built from its header).
export async function addToIndex(dir, file, io) {
  must(file);
  const text = await io.read(`${dir}/${file}`);
  if (text == null) throw new Error(`${file} is gone`);
  const note = parseNote(file, text);
  await editIndex(dir, io, (t) => (parseIndex(t).some((e) => e.file === file) ? t ?? "" : withLine(t, indexLine(note))));
}

// Drop the index lines of a note file that no longer exists.
export async function dropDead(dir, file, io) {
  if (typeof file !== "string" || file.includes("/")) throw new Error(`Refused: ${file}`);
  await editIndex(dir, io, (t) => withoutFile(t ?? "", file));
}

// A new note in Claude's format plus its index line; makes the folder and the index when missing.
export async function addNote(dir, note, exec, io) {
  const name = String(note.name ?? "").trim();
  const existing = (await listFiles(dir, exec).catch(() => null) ?? []).map((f) => f.file);
  const bad = validName(name, existing);
  if (bad) throw new Error(bad);
  const file = `${name}.md`;
  must(file);
  const m = await exec("mkdir", ["-p", dir]);
  if (m.code !== 0) throw new Error((m.stderr || "mkdir failed").trim());
  await io.write(`${dir}/${file}`, noteText({ ...note, name }), null);
  await editIndex(dir, io, (t) => withLine(t, indexLine({ name, file, description: String(note.description ?? "").trim() })));
  return { file };
}
