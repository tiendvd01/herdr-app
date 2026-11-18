#!/usr/bin/env node
// One-time move of the SoraTech team skills out of Herdr's own library (.agents/skills/) into
// ~/Documents/SoraTech/skills-set/ (spec 034): moves the folders, rewrites absolute paths inside them
// that point into the Herdr home's skill folders, adds the folder to the `sources` of each project's
// skills.json that has a team skill on (spec 035) and re-points every projects/<slug>/claude-plugin/skills/
// link. Selected names in skills.json stay as they are.
// Usage: node scripts/move-skill-set.mjs [--dry-run] [--to <folder>]
// Safe to run again. Never touches other skills, mcp/, selected names or ~/.claude/.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

export const TEAM_MATCH = (name) =>
  /^(delivery|devflow|find-mockup-repo|issue-walkthrough|onboard-domain|translate-requirement|archify|trace-flow|hunk-review|mermaid-diagrams|playwright-cli)$/.test(name) ||
  /^(delivery|sora)-[A-Za-z0-9._-]+$/.test(name);

// Rewrite references into the Herdr home's skill folders (old skills/ and .agents/skills/) so they point
// into `target` (given with ~). Keeps the spelling style: ~/..., $HOME/..., ${HOME}/... or absolute.
export function rewritePaths(text, home, target) {
  const rest = target.replace(/^~\//, "");
  const forms = [["~/", "~/"], ["$HOME/", "$HOME/"], ["${HOME}/", "${HOME}/"], [home + "/", home + "/"]];
  let out = text;
  for (const [from, to] of forms) {
    const esc = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(esc + "\\.config/herdr-app/(?:\\.agents/)?skills(?=[/'\"`\\s)]|$)", "gm"), to + rest);
  }
  return out;
}

const TEXT = /\.(md|sh|py|js|mjs|cjs|json|txt|env|ya?ml|toml)$/i;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && (TEXT.test(e.name) || !path.extname(e.name))) out.push(p);
  }
  return out;
}

function main() {
  const HOME = os.homedir();
  const APP = path.join(HOME, ".config/herdr-app");
  const OWN = path.join(APP, ".agents/skills");
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry-run");
  const toArg = argv.includes("--to") ? argv[argv.indexOf("--to") + 1] : "~/Documents/SoraTech/skills-set";
  const TARGET = toArg.replace(/\/+$/, "").replace(/^~(?=\/|$)/, HOME);
  const targetTilde = TARGET.startsWith(HOME + "/") ? "~" + TARGET.slice(HOME.length) : TARGET;
  const entries = (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []);
  const fail = (msg) => { console.error(msg); process.exit(1); };
  const tag = dry ? "would " : "";

  // 1. Preflight.
  const toMove = entries(OWN).filter((n) => TEAM_MATCH(n) && fs.statSync(path.join(OWN, n)).isDirectory());
  const clash = toMove.filter((n) => fs.existsSync(path.join(TARGET, n)));
  if (clash.length) { console.error(`clash in ${targetTilde}: ${clash.join(", ")} (nothing changed)`); process.exit(2); }

  // 2. Move.
  if (!toMove.length) console.log("nothing to move");
  if (!dry && toMove.length) fs.mkdirSync(TARGET, { recursive: true });
  for (const name of toMove) {
    const from = path.join(OWN, name), to = path.join(TARGET, name);
    if (dry) { console.log(`move ${name}`); continue; }
    try { fs.renameSync(from, to); }
    catch (e) {
      if (e.code !== "EXDEV") fail(`move failed: ${from}: ${e.message}`);
      try { fs.cpSync(from, to, { recursive: true, verbatimSymlinks: true }); fs.rmSync(from, { recursive: true }); }
      catch (e2) { fail(`move failed: ${from}: ${e2.message}`); }
    }
  }
  console.log(`${tag}moved ${toMove.length}`);

  // 3. Rewrite paths in every team skill now in the target (idempotent).
  let rewrote = 0;
  const teamThere = entries(dry ? OWN : TARGET).filter(TEAM_MATCH).concat(dry ? entries(TARGET).filter(TEAM_MATCH) : []);
  for (const name of [...new Set(teamThere)]) {
    const dir = fs.existsSync(path.join(TARGET, name)) ? path.join(TARGET, name) : path.join(OWN, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of walk(dir)) {
      const text = fs.readFileSync(f, "utf8");
      if (text.includes("\u0000")) continue;
      const next = rewritePaths(text, HOME, targetTilde);
      if (next === text) continue;
      rewrote++;
      if (dry) console.log(`rewrite ${path.relative(dir, f) ? `${name}/${path.relative(dir, f)}` : name}`);
      else fs.writeFileSync(f, next);
    }
  }
  console.log(`${tag}rewrote ${rewrote} files`);

  // 4. List the target as a source of every project that has a team skill on (spec 035: per project).
  const norm = (p) => p.replace(/\/+$/, "").replace(/^~(?=\/|$)/, HOME);
  for (const slug of entries(path.join(APP, "projects"))) {
    const file = path.join(APP, "projects", slug, "skills.json");
    let j;
    try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch { continue; }
    const sources = Array.isArray(j.sources) ? j.sources : [];
    if (!(j.skills ?? []).some(TEAM_MATCH) || sources.some((p) => norm(p) === TARGET)) continue;
    if (!dry) fs.writeFileSync(file, JSON.stringify({ version: 2, sources: [...sources, targetTilde], skills: j.skills ?? [], mcp: j.mcp ?? [] }, null, 2) + "\n");
    console.log(`${slug}: ${tag}add source ${targetTilde}`);
  }

  // 5. Re-point project links that still target the old place.
  const projects = path.join(APP, "projects");
  for (const slug of entries(projects)) {
    const dir = path.join(projects, slug, "claude-plugin/skills");
    if (!fs.existsSync(dir)) continue;
    let n = 0;
    for (const name of entries(dir)) {
      const p = path.join(dir, name);
      if (!fs.lstatSync(p).isSymbolicLink() || fs.readlinkSync(p) !== path.join(OWN, name) || !TEAM_MATCH(name)) continue;
      if (!dry) try { fs.unlinkSync(p); fs.symlinkSync(path.join(TARGET, name), p); } catch (e) { fail(`${p}: ${e.message}`); }
      n++;
    }
    console.log(`${slug}: ${tag}relinked ${n}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
