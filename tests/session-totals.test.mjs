// Sessions dialog header totals (spec 028): mods/processes/totals.js is the mod's own file, not a synced copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readTotals, cpuText, ramText, hot, pct } from "../mods/processes/totals.js";

const GB = 1073741824;
const fake = (stdout) => async () => ({ stdout });

test("reads cores and memory from sysctl", async () => {
  assert.deepEqual(await readTotals(fake("8\n17179869184\n")), { cores: 8, mem: 16 * GB });
});

test("null on failure or garbage", async () => {
  assert.equal(await readTotals(async () => { throw new Error("no sysctl"); }), null);
  assert.equal(await readTotals(fake("")), null);
  assert.equal(await readTotals(fake("x\n123")), null);
  assert.equal(await readTotals(fake("0\n123")), null);
});

test("formats used / total, or used alone without totals", () => {
  const t = { cores: 8, mem: 16 * GB };
  assert.equal(cpuText(120.4, t), "CPU 120% / 800%");
  assert.equal(cpuText(120.4, null), "CPU 120%");
  assert.equal(ramText(2.1 * GB, t), "RAM 2.1 / 16 GB");
  assert.equal(ramText(512 * 1048576, t), "RAM 512 MB / 16 GB");
  assert.equal(ramText(0, t), "RAM 0 MB / 16 GB");
  assert.equal(ramText(2.1 * GB, null), "RAM 2.1 GB");
});

test("hot at 80% of the total", () => {
  assert.equal(hot(640, 800), true);
  assert.equal(hot(639, 800), false);
  assert.equal(hot(900, 800), true);
  assert.equal(hot(5, 0), false);
});

test("bar fill is clamped to 0..100", () => {
  assert.equal(pct(200, 800), 25);
  assert.equal(pct(900, 800), 100);
  assert.equal(pct(5, 0), 0);
});

test("with the whole machine: sessions and machine on one line", () => {
  const t = { cores: 8, mem: 16 * GB };
  assert.equal(cpuText(1.2, t, 45.4), "CPU 1% sessions · 45% machine / 800%");
  assert.equal(ramText(228 * 1048576, t, 11.24 * GB), "RAM 228 MB sessions · 11.2 GB machine / 16 GB");
  assert.equal(cpuText(1.2, null, 45), "CPU 1%");
});
