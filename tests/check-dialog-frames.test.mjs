import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = new URL("../scripts/check-dialog-frames.mjs", import.meta.url).pathname;
const SELF = JSON.stringify({ overlay: { frame: "none" } });

function fixture(mods) {
  const root = mkdtempSync(join(tmpdir(), "frames-"));
  for (const [name, files] of Object.entries(mods)) {
    mkdirSync(join(root, "mods", name), { recursive: true });
    for (const [f, src] of Object.entries(files)) writeFileSync(join(root, "mods", name, f), src);
  }
  return spawnSync(process.execPath, [script, root], { encoding: "utf8" });
}
const ok = { "mod.json": SELF, "main.js": 'import { dialogFrame } from "./panel-ui.js";\ndialogFrame(v);\nopenOverlay({ mod: "ok", kind: "popup" });' };

test("the repo passes", () => {
  assert.match(execFileSync(process.execPath, [script], { encoding: "utf8" }), /dialog frames ok/);
});

test("a correct self-framed mod (with a self-opened sub-dialog) passes", () => {
  assert.equal(fixture({ ok }).status, 0);
});

test("dialogFrame without frame none fails", () => {
  const r = fixture({ ok, a: { "main.js": "dialogFrame(x);" } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /mods\/a: draws dialogFrame/);
});

test("frame none without dialogFrame fails", () => {
  const r = fixture({ ok, b: { "mod.json": SELF, "main.js": "// none" } });
  assert.match(r.stderr, /mods\/b: mod.json overlay.frame "none" but no dialogFrame/);
});

test("opening another mod's self-framed dialog without frame none fails with file:line", () => {
  const r = fixture({ ok, c: { "main.js": 'x;\nopenOverlay({ mod: "ok", width: f(1) });\nopenOverlay({ mod: "ok", frame: "none" });' } });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.trim(), 'mods/c/main.js:2: opens "ok" (self-framed) without frame "none"; use run("mod.open", { name: "ok" })');
});
