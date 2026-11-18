// GENERATED from lib/project-skills.js by scripts/sync-github-lib.sh. Do not edit here.
// Per-project skills for Claude sessions (spec 012).
// Single source, copied into mods/project-settings and mods/my-new-menu by scripts/sync-github-lib.sh.
//
// Library (tracked): ~/.config/herdr-app/.agents/skills/<name>/SKILL.md (hand-made, or installed with
// `npx skills add <repo> -a universal` from the Herdr home folder; spec 015) and mcp/<name>.json.
// Per project (gitignored): projects/<slug>/skills.json (the selection, source of truth) and
// projects/<slug>/claude-plugin/ (one shared plugin: symlinks into the library + .mcp.json), kept in
// sync in place on every switch and launch, passed to Claude as `claude --plugin-dir <that folder>`.
//
// Extra sources (specs 034, 035): skill folders listed per project in its skills.json (`sources`) are
// scanned after .agents/skills/; the first source with a name wins. Only the Skills tab writes that list.
//
// Invariant: nothing here ever writes under any skill source, mcp/ or ~/.claude/. Only symlinks inside
// claude-plugin/skills/ and unused feature-012 folders under claude-sessions/ are ever removed.
import { exec, readTextFile, writeTextFile, home, notify } from "herdr";

const NAME = /^[A-Za-z0-9._-]+$/;

export const appDir = () => `${home()}/.config/herdr-app`;
export const skillsDir = () => `${appDir()}/.agents/skills`;
export const mcpDir = () => `${appDir()}/mcp`;
export const globalSkillsDir = () => `${home()}/.claude/skills`;

const base = (p) => p.slice(p.lastIndexOf("/") + 1);
const slugOf = (main) => main.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");

// Repository of a folder (shared by all its worktrees), or null outside git.
export async function projectOf(folder) {
  if (!folder) return null;
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder }).catch(() => null);
  if (!r || r.code !== 0) return null;
  const common = r.stdout.trim();
  const main = common.endsWith("/.git") ? common.slice(0, -5) : common;
  const name = base(main);
  const slug = slugOf(main);
  const plugin = "herdr-" + (name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "project");
  return { main, name, slug, dir: `${appDir()}/projects/${slug}`, plugin };
}

// `name:` / `description:` from a SKILL.md frontmatter (plain, quoted, or folded with > / |).
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text ?? "");
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(lines[i]);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^[>|][-+]?$/.test(v)) {
      const parts = [];
      while (i + 1 < lines.length && (/^\s/.test(lines[i + 1]) || lines[i + 1] === "")) parts.push(lines[++i].trim());
      v = parts.join(" ").trim();
    } else if (/^".*"$/.test(v)) {
      try { v = JSON.parse(v); } catch { v = v.slice(1, -1); }
    } else if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/''/g, "'");
    out[kv[1]] = v;
  }
  return out;
}

async function listSkills(dir) {
  const r = await exec("find", ["-L", dir, "-mindepth", "1", "-maxdepth", "1", "-type", "d"]).catch(() => null);
  if (!r || r.code !== 0) return [];
  const out = [];
  for (const path of r.stdout.split("\n").filter(Boolean)) {
    const name = base(path);
    if (name.startsWith(".")) continue;
    const text = await readTextFile(`${path}/SKILL.md`).catch(() => null);
    const fm = frontmatter(text);
    const description = (fm.description ?? "").trim();
    const invalid = !NAME.test(name) ? "bad name" : text == null ? "no SKILL.md" : !description ? "no description" : null;
    out.push({ name, description, path, invalid, size: Math.ceil((name.length + description.length) / 4) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function listMcp(dir) {
  const r = await exec("find", ["-L", dir, "-mindepth", "1", "-maxdepth", "1", "-type", "f", "-name", "*.json"]).catch(() => null);
  if (!r || r.code !== 0) return [];
  const out = [];
  for (const path of r.stdout.split("\n").filter(Boolean)) {
    const name = base(path).slice(0, -5);
    let config = null, invalid = null;
    if (!NAME.test(name)) invalid = "bad name";
    else {
      try {
        config = JSON.parse((await readTextFile(path)) ?? "");
        if (!config || typeof config !== "object" || Array.isArray(config)) { invalid = "not an object"; config = null; }
      } catch { invalid = "bad JSON"; }
    }
    const description = config ? [config.command, ...(config.args ?? [])].filter(Boolean).join(" ") || config.url || config.type || "" : "";
    out.push({ name, description, path, config, invalid });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Extra skill sources (spec 034, per project since spec 035): the `sources` list in the project's
// skills.json, ["~/..."], in order. The app's own .agents/skills/ is always the first source.
export const expand = (p) => {
  const s = String(p ?? "").trim().replace(/\/+$/, "");
  return s === "~" ? home() : s.startsWith("~/") ? home() + s.slice(1) : s.replace(/^\$HOME(?=\/|$)/, home());
};
export const tilde = (p) => (p === home() || p.startsWith(home() + "/") ? "~" + p.slice(home().length) : p);

// Library of a project (own library + its sources; no project: own library only) + global set, scanned
// fresh each call. The first source that has a name provides it, a later folder of the same name goes to
// `hidden` and is never linked.
export async function scanLibrary(project) {
  const extra = project ? (await readSelection(project)).sources : [];
  const list = [{ path: tilde(skillsDir()), abs: skillsDir(), own: true }, ...extra.map((p) => ({ path: p, abs: expand(p), own: false }))];
  const [scans, mcp, global] = await Promise.all([
    Promise.all(list.map(async (src) => {
      if (!src.own) {
        const t = await exec("test", ["-d", src.abs]).catch(() => null);
        if (!t || t.code !== 0) return { ...src, missing: true, items: [] };
      }
      return { ...src, missing: false, items: await listSkills(src.abs) };
    })),
    listMcp(mcpDir()),
    listSkills(globalSkillsDir()),
  ]);
  const g = new Set(global.map((s) => s.name));
  const seen = new Map(), skills = [], hidden = [];
  const sources = scans.map(({ items, ...src }) => {
    let count = 0;
    for (const s of items) {
      s.source = src.path;
      if (seen.has(s.name)) { hidden.push({ ...s, hiddenBy: seen.get(s.name) }); continue; }
      seen.set(s.name, src.path);
      s.globalDuplicate = g.has(s.name);
      skills.push(s);
      if (!s.invalid) count++;
    }
    return { ...src, count };
  });
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return { sources, skills, hidden, mcp, global: global.filter((s) => !s.invalid) };
}

// Real path of a folder, or null when it is not an existing folder.
async function realDir(abs) {
  const t = await exec("test", ["-d", abs]).catch(() => null);
  if (!t || t.code !== 0) return null;
  const r = await exec("realpath", [abs]).catch(() => null);
  return r && r.code === 0 ? r.stdout.trim() : abs;
}

// Add a source folder to one project (Skills tab). Refused: not a folder, already a source of this
// project, or the app's own library (or a folder inside it).
export async function addSource(project, input) {
  const abs = expand(input);
  if (!abs.startsWith("/")) return { ok: false, error: "use a full path (~/... or /...)" };
  const real = await realDir(abs);
  if (!real) return { ok: false, error: `not a folder: ${tilde(abs)}` };
  const own = (await realDir(skillsDir())) ?? skillsDir();
  if (real === own || real.startsWith(own + "/")) return { ok: false, error: "that is Herdr's own library" };
  const sel = await readSelection(project);
  for (const p of sel.sources) if (((await realDir(expand(p))) ?? expand(p)) === real) return { ok: false, error: `already a source: ${p}` };
  const sources = [...sel.sources, tilde(abs)];
  const w = await writeSelection(project, { ...sel, sources }, sel.raw);
  return w.ok ? { ok: true, sources } : w;
}

// Remove a source from one project; `on` counts this project's turned-on skills it provided.
export async function removeSource(project, path) {
  const lib = await scanLibrary(project);
  const sel = await readSelection(project);
  const sources = sel.sources.filter((p) => p !== path);
  if (sources.length === sel.sources.length) return { ok: false, error: `not a source: ${path}` };
  const on = lib.skills.filter((s) => s.source === path && sel.skills.includes(s.name)).length;
  const w = await writeSelection(project, { ...sel, sources }, sel.raw);
  return w.ok ? { ok: true, sources, on } : w;
}

const selFile = (project) => `${project.dir}/skills.json`;
const strings = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.trim()) : []);

export async function readSelection(project) {
  const raw = await readTextFile(selFile(project)).catch(() => null);
  let skills = [], mcp = [], sources = [];
  try {
    const j = JSON.parse(raw ?? "{}");
    skills = strings(j.skills); mcp = strings(j.mcp); sources = strings(j.sources);
  } catch {}
  return { skills, mcp, sources, raw };
}

// Writes all three lists. A selection without `sources` keeps the file's current list, so a save of
// switches can never drop the project's folders.
export async function writeSelection(project, sel, expectedRaw) {
  const uniq = (a) => [...new Set(a)].sort();
  const sources = Array.isArray(sel.sources) ? [...new Set(sel.sources)] : (await readSelection(project)).sources;
  const text = JSON.stringify({ version: 2, sources, skills: uniq(sel.skills), mcp: uniq(sel.mcp) }, null, 2) + "\n";
  try {
    await exec("mkdir", ["-p", project.dir]);
    await writeTextFile(selFile(project), text, expectedRaw ?? null);
    return { ok: true, raw: text };
  } catch (e) { return { ok: false, error: String(e?.message ?? e) }; }
}

// One shared plugin folder per project: projects/<slug>/claude-plugin/. Every launch for the project
// uses it; switches update it in place (spec 013), so running sessions may see the change.
const bundleDir = (project) => `${project.dir}/claude-plugin`;
const lines = (r) => (r && r.code === 0 ? r.stdout.split("\n").filter(Boolean) : []);

// Write a generated file only when its text changes (or remove it when text is null).
async function putFile(path, text) {
  const old = await readTextFile(path).catch(() => null);
  if (old === text) return false;
  if (text == null) { await exec("rm", ["-f", path]); return true; }
  await writeTextFile(path, text, old);
  return true;
}

// Bring the project's folder in line with skills.json and the library: remove links that are no
// longer wanted or point elsewhere, add missing ones, leave the rest alone. Idempotent.
export async function syncBundle(project, library) {
  const lib = library ?? (await scanLibrary(project));
  const sel = await readSelection(project);
  const path = bundleDir(project), dir = `${path}/skills`;
  const skipped = [];
  let changed = false;
  const mk = await exec("mkdir", ["-p", `${path}/.claude-plugin`, dir]);
  if (mk.code !== 0) throw new Error(mk.stderr.trim() || "cannot create the project skills folder");

  // Wanted: selected skills that exist and are valid in the library.
  const byName = new Map(lib.skills.map((s) => [s.name, s]));
  const want = new Map();
  for (const name of [...new Set(sel.skills)].sort()) {
    const s = byName.get(name);
    if (!s) skipped.push({ name, reason: "missing from library" });
    else if (s.invalid) skipped.push({ name, reason: s.invalid });
    else want.set(name, s.path);
  }

  // What is there now: links (with targets) and anything else, which is never touched.
  const all = lines(await exec("find", [dir, "-mindepth", "1", "-maxdepth", "1"]));
  const links = new Set(lines(await exec("find", [dir, "-mindepth", "1", "-maxdepth", "1", "-type", "l"])));
  const have = new Map();
  for (const p of all) {
    const name = base(p);
    if (!links.has(p)) { skipped.push({ name, reason: "not a link, left alone" }); want.delete(name); continue; }
    const t = await exec("readlink", [p]);
    have.set(name, t.code === 0 ? t.stdout.trim() : "");
  }
  for (const [name, target] of have) {
    if (want.get(name) === target) continue;
    await exec("rm", [`${dir}/${name}`]);
    changed = true;
  }
  const linked = [];
  for (const [name, target] of want) {
    if (have.get(name) !== target) {
      const r = await exec("ln", ["-sfn", target, `${dir}/${name}`]);
      if (r.code !== 0) { skipped.push({ name, reason: r.stderr.trim() || "link failed" }); continue; }
      changed = true;
    }
    linked.push(name);
  }

  const manifest = { name: project.plugin, version: "1.0.0", description: `Herdr per-project skills for ${project.main}` };
  if (await putFile(`${path}/.claude-plugin/plugin.json`, JSON.stringify(manifest, null, 2) + "\n")) changed = true;

  const byMcp = new Map(lib.mcp.map((m) => [m.name, m]));
  const servers = {};
  for (const name of [...new Set(sel.mcp)].sort()) {
    const m = byMcp.get(name);
    if (!m) skipped.push({ name, reason: "missing from mcp library" });
    else if (m.invalid) skipped.push({ name, reason: m.invalid });
    else servers[name] = m.config;
  }
  const mcpText = Object.keys(servers).length ? JSON.stringify({ mcpServers: servers }, null, 2) + "\n" : null;
  if (await putFile(`${path}/.mcp.json`, mcpText)) changed = true;

  return { path, skills: linked, mcp: Object.keys(servers), skipped, changed };
}

// Feature 012 made one folder per launch under claude-sessions/<stamp>. Remove those no running
// process names on its command line (Claude was started with --plugin-dir <folder>), then the
// empty claude-sessions/ itself. If ps fails nothing is removed. rm -rf does not follow the links.
const STAMP = /^\d{8}-\d{6}-[a-z0-9]{4}$/;
export async function pruneLegacy(project) {
  const root = `${project.dir}/claude-sessions`;
  const r = await exec("find", [root, "-mindepth", "1", "-maxdepth", "1", "-type", "d"]).catch(() => null);
  if (!r || r.code !== 0) return [];
  const ps = await exec("ps", ["-axww", "-o", "args="]).catch(() => null);
  if (!ps || ps.code !== 0) return [];
  const removed = [];
  for (const p of lines(r)) {
    if (!STAMP.test(base(p)) || ps.stdout.includes(p)) continue;
    const rm = await exec("rm", ["-rf", p]);
    if (rm.code === 0) removed.push(base(p));
  }
  await exec("rmdir", [root]).catch(() => null);
  return removed;
}

// Argv for the + menu: sync the project's folder (it may be missing or stale), tidy leftovers,
// then start Claude with that same folder. argv is null when nothing ends up enabled.
export async function launchArgs(project, baseArgv) {
  const b = await syncBundle(project);
  await pruneLegacy(project).catch(() => {});
  const count = b.skills.length + b.mcp.length;
  return { argv: count ? [...baseArgv, "--plugin-dir", b.path] : null, count, skills: b.skills.length, mcp: b.mcp.length, skipped: b.skipped, path: b.path };
}

// Valid selected skills + MCP servers of a project: what the + menu counts on its Claude row.
export async function enabledCount(project, library) {
  const [sel, lib] = await Promise.all([readSelection(project), library ?? scanLibrary(project)]);
  const ok = (list, names) => list.filter((x) => !x.invalid && names.includes(x.name)).length;
  return { skills: ok(lib.skills, sel.skills), mcp: ok(lib.mcp, sel.mcp) };
}

// Argv for any place that starts an agent in a folder (spec 023: New worktree, git graph, reviewer Ask).
// Claude in a local git project (main checkout or any worktree) with items on gets the project's shared
// folder as --plugin-dir; everything else runs agent.run unchanged. Never throws: on failure Claude
// starts plain and one warning says why.
export async function agentArgv(agent, folder, machine) {
  const plain = agent?.run ?? [];
  if (agent?.key !== "claude" || machine || !folder) return plain;
  try {
    const project = await projectOf(folder);
    if (!project) return plain;
    // Nothing selected: no library scan and no folder written. Otherwise launchArgs scans and syncs once
    // (its count drops selected names that are missing or invalid: argv null, Claude starts plain).
    const sel = await readSelection(project);
    if (sel.skills.length + sel.mcp.length === 0) return plain;
    // A parallel start may be writing the same files: a second pass finds them in place.
    const res = await launchArgs(project, plain).catch(() => launchArgs(project, plain));
    if (res.skipped.length) notify({ level: "warning", title: "Skills skipped", body: res.skipped.map((x) => `${x.name}: ${x.reason}`).join(", ") });
    return res.argv ?? plain;
  } catch (e) {
    notify({ level: "warning", title: "Project skills not attached", body: String(e?.message ?? e).slice(0, 300) });
    return plain;
  }
}

// Rough per-conversation size of a list of skills.
export function estimate(items) {
  return { count: items.length, tokens: items.reduce((a, s) => a + (s.size ?? 0), 0) };
}
