#!/usr/bin/env node
// Dialog border rule (spec 024): every personal dialog draws its own frame (frame "none" + the kit's dialogFrame);
// Herdr's rounded frame does not clip a mod's square background. Never both, never neither. Popups keep Herdr's frame. Usage: node scripts/check-dialog-frames.mjs [root]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? new URL("..", import.meta.url).pathname;
// Herdr's own mods (constitution I) are not ours to fix.
const SHIPPED = new Set(["picker", "machine-add", "worktree", "menu", "agents", "win98",
  "spaces", "files", "tabs", "pane", "peek", "changes", "new-menu", "workspace-chrome", "terminals-bar", "toast"]);

const modsDir = join(root, "mods");
const mods = readdirSync(modsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
const selfFramed = new Set();
const code = {};
for (const m of mods) {
  const json = join(modsDir, m, "mod.json");
  try { if (existsSync(json) && JSON.parse(readFileSync(json, "utf8")).overlay?.frame === "none") selfFramed.add(m); }
  catch (e) { console.error(`mods/${m}/mod.json: ${e.message}`); process.exitCode = 1; }
  // panel-ui.js defines dialogFrame; its synced copies don't count as use.
  code[m] = readdirSync(join(modsDir, m)).filter(f => f.endsWith(".js") && f !== "panel-ui.js")
    .map(f => ({ f, src: readFileSync(join(modsDir, m, f), "utf8") }));
}

const errors = [];
const calls = []; // every openOverlay(...) of a personal mod: { m, f, line, call, target }
for (const m of mods) {
  if (SHIPPED.has(m)) continue;
  for (const { f, src } of code[m]) {
    for (let i = src.indexOf("openOverlay("); i >= 0; i = src.indexOf("openOverlay(", i + 1)) {
      if (src.lastIndexOf("//", i) > src.lastIndexOf("\n", i)) continue; // in a comment
      let depth = 0, j = i + "openOverlay".length;
      do { if (src[j] === "(") depth++; else if (src[j] === ")") depth--; j++; } while (depth > 0 && j < src.length);
      const call = src.slice(i, j);
      // A layout dialog (sub-agent peek) draws its frame in the layout's border/radius, not in a mod.
      if (/\blayout:\s*\{/.test(call)) continue;
      const target = /\bmod:\s*this\.mod\b/.test(call) ? m : call.match(/\bmod:\s*["']([\w-]+)["']/)?.[1];
      calls.push({ m, f, line: src.slice(0, i).split("\n").length, call, target });
    }
  }
}
const frameless = (c) => /frame:\s*["']none["']/.test(c.call);
// Mods that are opened without Herdr's frame somewhere, so they draw it themselves.
const drawsOwn = new Set([...selfFramed, ...calls.filter(frameless).map(c => c.target).filter(Boolean)]);

for (const m of mods) {
  if (SHIPPED.has(m)) continue;
  try {
    const ov = existsSync(join(modsDir, m, "mod.json")) && JSON.parse(readFileSync(join(modsDir, m, "mod.json"), "utf8")).overlay;
    if (ov?.kind === "dialog" && ov.frame !== "none") errors.push(`mods/${m}/mod.json: dialog overlay without frame "none" (Herdr's rounded frame does not clip the mod's square background)`);
  } catch { /* reported above */ }
  const draws = code[m].some(({ src }) => /\bdialogFrame\b/.test(src.replace(/^import[^;]*;/gm, "")));
  if (draws && !drawsOwn.has(m)) errors.push(`mods/${m}: draws dialogFrame but is never opened with frame "none" (Herdr adds a second border)`);
  if (!draws && selfFramed.has(m)) errors.push(`mods/${m}: mod.json overlay.frame "none" but no dialogFrame (the dialog has no border)`);
}
for (const c of calls) {
  const at = `mods/${c.m}/${c.f}:${c.line}`;
  // Every dialog draws its own frame: Herdr's does not clip a mod's square background at its corners.
  if (/kind:\s*["']dialog["']/.test(c.call) && !frameless(c))
    errors.push(`${at}: dialog opened with Herdr's frame; add frame: "none" and wrap its root in dialogFrame`);
  else if (c.target && c.target !== c.m && selfFramed.has(c.target) && !frameless(c))
    errors.push(`${at}: opens "${c.target}" (self-framed) without frame "none"; use run("mod.open", { name: "${c.target}" })`);
  if (frameless(c) && c.target && !code[c.target]?.some(({ src }) => /\bdialogFrame\b/.test(src.replace(/^import[^;]*;/gm, ""))))
    errors.push(`${at}: opens "${c.target}" with frame "none" but it draws no dialogFrame (no border)`);
}
for (const e of errors) console.error(e);
if (errors.length) process.exitCode = 1;
else if (!process.exitCode) console.log(`dialog frames ok (${selfFramed.size} self-framed: ${[...selfFramed].join(", ")})`);
