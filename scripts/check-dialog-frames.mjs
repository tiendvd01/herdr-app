#!/usr/bin/env node
// Dialog border rule (spec 024): a dialog's frame is drawn by Herdr OR by the mod (mod.json overlay.frame "none"
// + the kit's dialogFrame), never both, never neither. Usage: node scripts/check-dialog-frames.mjs [root]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? new URL("..", import.meta.url).pathname;
// Herdr's own mods (constitution I) are not ours to fix.
const SHIPPED = new Set(["picker", "open-file", "machine-add", "mermaid-board", "worktree", "menu", "agents", "win98",
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
for (const m of mods) {
  if (SHIPPED.has(m)) continue;
  const draws = code[m].some(({ src }) => /\bdialogFrame\b/.test(src.replace(/^import[^;]*;/gm, "")));
  if (draws && !selfFramed.has(m)) errors.push(`mods/${m}: draws dialogFrame but mod.json has no overlay.frame "none" (Herdr adds a second border)`);
  if (!draws && selfFramed.has(m)) errors.push(`mods/${m}: mod.json overlay.frame "none" but no dialogFrame (the dialog has no border)`);
  for (const { f, src } of code[m]) {
    for (let i = src.indexOf("openOverlay("); i >= 0; i = src.indexOf("openOverlay(", i + 1)) {
      let depth = 0, j = i + "openOverlay".length;
      do { if (src[j] === "(") depth++; else if (src[j] === ")") depth--; j++; } while (depth > 0 && j < src.length);
      const call = src.slice(i, j);
      const target = call.match(/\bmod:\s*["']([\w-]+)["']/)?.[1];
      // A mod opening its own sub-dialogs/menus uses Herdr's frame on purpose (reviewer Ask, git-graph actions).
      if (target && target !== m && selfFramed.has(target) && !/frame:\s*["']none["']/.test(call)) {
        const line = src.slice(0, i).split("\n").length;
        errors.push(`mods/${m}/${f}:${line}: opens "${target}" (self-framed) without frame "none"; use run("mod.open", { name: "${target}" })`);
      }
    }
  }
}
for (const e of errors) console.error(e);
if (errors.length) process.exitCode = 1;
else if (!process.exitCode) console.log(`dialog frames ok (${selfFramed.size} self-framed: ${[...selfFramed].join(", ")})`);
