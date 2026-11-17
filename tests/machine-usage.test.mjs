// Whole-machine memory from vm_stat (spec 028): mods/status-usage/procs.js is the mod's own file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { vmUsed } from "../mods/status-usage/procs.js";

const out = `Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                                     5177.
Pages wired down:                             100.
Pages purgeable:                                10.
"Translation faults":                     7643506571.
Anonymous pages:                              300.
Pages occupied by compressor:                 50.
`;

test("app memory + wired + compressed, in bytes", () => {
  assert.equal(vmUsed(out), (300 - 10 + 100 + 50) * 16384);
});

test("null when vm_stat output is missing or odd", () => {
  assert.equal(vmUsed(""), null);
  assert.equal(vmUsed(out.replace(/Anonymous pages.*\n/, "")), null);
});
