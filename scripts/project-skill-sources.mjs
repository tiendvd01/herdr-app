#!/usr/bin/env node
// One-time carry-over (spec 035): the shared skill-sources.json of spec 034 becomes per-project lists.
// Each project gets every shared folder that provides at least one of its turned-on skills (a name
// Herdr's own .agents/skills/ also has is provided by the own library, so it does not count). Then the
// shared file is deleted. Usage: node scripts/project-skill-sources.mjs [--dry-run]. Safe to rerun.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

// Sources (in shared order) to add to a project: `have` = its current list, `on` = its turned-on names,
// `shared` = [{ path, names: Set }], `own` = Set of names in the own library.
export function carryOver(have, on, shared, own) {
  const out = [...have];
  for (const s of shared) if (!out.includes(s.path) && on.some((n) => !own.has(n) && s.names.has(n))) out.push(s.path);
  return out;
}

function main() {
  const HOME = os.homedir();
  const APP = path.join(HOME, ".config/herdr-app");
  const dry = process.argv.includes("--dry-run");
  const file = path.join(APP, "skill-sources.json");
  if (!fs.existsSync(file)) { console.log("nothing to do (no skill-sources.json)"); return; }
  let list = [];
  try { list = JSON.parse(fs.readFileSync(file, "utf8")).sources ?? []; } catch { console.error(`cannot read ${file}`); process.exit(1); }
  const skillNames = (dir) => new Set(fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => fs.existsSync(path.join(dir, n, "SKILL.md"))) : []);
  const own = skillNames(path.join(APP, ".agents/skills"));
  const shared = list.map((p) => ({ path: p, names: skillNames(p.replace(/^~(?=\/|$)/, HOME)) }));
  const projects = path.join(APP, "projects");
  for (const slug of fs.existsSync(projects) ? fs.readdirSync(projects) : []) {
    const f = path.join(projects, slug, "skills.json");
    let j;
    try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
    const have = Array.isArray(j.sources) ? j.sources : [];
    const next = carryOver(have, j.skills ?? [], shared, own);
    if (next.length === have.length) { console.log(`${slug}: unchanged`); continue; }
    if (!dry) fs.writeFileSync(f, JSON.stringify({ version: 2, sources: next, skills: j.skills ?? [], mcp: j.mcp ?? [] }, null, 2) + "\n");
    console.log(`${slug}: ${dry ? "would add" : "added"} ${next.slice(have.length).join(", ")}`);
  }
  if (!dry) fs.rmSync(file);
  console.log(`${dry ? "would delete" : "deleted"} skill-sources.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
