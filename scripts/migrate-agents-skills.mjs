#!/usr/bin/env node
// One-time move of the skill library from skills/ to .agents/skills/ (spec 015), then re-points the
// links in every projects/<slug>/claude-plugin/skills/ and re-syncs lib/ into the mods.
// Usage: node scripts/migrate-agents-skills.mjs [--dry-run] [--sync]
// Safe to run again: nothing to move, links already right. Never writes skills.json, mcp/ or ~/.claude/.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const APP = path.join(os.homedir(), ".config/herdr-app");
const OLD = path.join(APP, "skills");
const NEW = path.join(APP, ".agents/skills");
const NAME = /^[A-Za-z0-9._-]+$/;
const dry = process.argv.includes("--dry-run");
const forceSync = process.argv.includes("--sync");

const entries = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const fail = (msg) => { console.error(msg); process.exit(1); };
const isSkill = (name) => fs.existsSync(path.join(NEW, name, "SKILL.md"));

// 1. Preflight.
const toMove = entries(OLD);
const clash = toMove.filter((n) => entries(NEW).includes(n));
if (clash.length) { console.error(`clash: ${clash.join(", ")}`); process.exit(2); }

// 2. Move.
if (!toMove.length) console.log("nothing to move");
else {
  if (!dry) fs.mkdirSync(NEW, { recursive: true });
  for (const name of toMove) {
    if (dry) { console.log(`move ${name}`); continue; }
    try { fs.renameSync(path.join(OLD, name), path.join(NEW, name)); } catch (e) { fail(`move failed: ${path.join(OLD, name)}: ${e.message}`); }
  }
  if (!dry) try { fs.rmdirSync(OLD); } catch (e) { fail(`cannot remove ${OLD}: ${e.message}`); }
}

// 3. Repair links of every project. In a dry run, judge targets as if the move had happened.
const exists = (name) => isSkill(name) || (dry && toMove.includes(name) && fs.existsSync(path.join(OLD, name, "SKILL.md")));
const projects = path.join(APP, "projects");
for (const slug of entries(projects)) {
  const dir = path.join(projects, slug, "claude-plugin/skills");
  if (!fs.existsSync(dir)) continue;
  const n = { relinked: 0, removed: 0, created: 0, kept: 0 };
  const act = (fn) => { if (!dry) try { fn(); } catch (e) { fail(`${dir}: ${e.message}`); } };
  for (const name of entries(dir)) {
    const p = path.join(dir, name);
    if (!fs.lstatSync(p).isSymbolicLink()) { n.kept++; continue; }
    const target = fs.readlinkSync(p);
    if (target !== path.join(OLD, name)) { n.kept++; continue; }
    if (exists(name)) { act(() => { fs.unlinkSync(p); fs.symlinkSync(path.join(NEW, name), p); }); n.relinked++; }
    else { act(() => fs.unlinkSync(p)); n.removed++; }
  }
  let sel = [];
  try { sel = JSON.parse(fs.readFileSync(path.join(projects, slug, "skills.json"), "utf8")).skills ?? []; } catch {}
  const have = new Set(entries(dir));
  for (const name of new Set(sel)) {
    if (typeof name !== "string" || !NAME.test(name) || have.has(name) || !exists(name)) continue;
    act(() => fs.symlinkSync(path.join(NEW, name), path.join(dir, name)));
    n.created++;
  }
  console.log(`${slug}: relinked ${n.relinked}, removed ${n.removed}, created ${n.created}, kept ${n.kept}`);
}

// 4. Copy the new lib into the mods (they hot-reload on the new path).
if (!dry && (toMove.length || forceSync)) {
  const r = spawnSync("bash", ["scripts/sync-github-lib.sh"], { cwd: APP, stdio: "inherit" });
  if (r.status !== 0) fail("scripts/sync-github-lib.sh failed");
}
console.log(`${dry ? "would move" : "moved"} ${toMove.length} skills`);
