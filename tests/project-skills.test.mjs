import { test } from "node:test";
import assert from "node:assert/strict";
import { stub } from "herdr";
import { agentArgv } from "../lib/project-skills.js";

const claude = { key: "claude", run: ["claude"] };

// A git project at /p; `selection` is projects/<slug>/skills.json (null: none saved). Logs every command run.
function world(selection) {
  const ran = [], notes = [];
  stub({
    home: "/h",
    notify: (n) => notes.push(n),
    exec: async (cmd, args) => {
      ran.push(`${cmd} ${args.join(" ")}`);
      if (cmd === "git") return { code: 0, stdout: "/p/.git\n", stderr: "" };
      return { code: 0, stdout: "", stderr: "" }; // find, mkdir, ln, ps ...: empty answers
    },
    readTextFile: async (path) => {
      if (path.endsWith("/skills.json")) { if (selection == null) throw new Error("ENOENT"); return JSON.stringify(selection); }
      throw new Error(`ENOENT ${path}`);
    },
    writeTextFile: async () => {},
  });
  return { ran, notes };
}

test("agentArgv: other agents, remote machines and no folder start plain", async () => {
  const { ran } = world({ skills: ["a"] });
  assert.deepEqual(await agentArgv({ key: "codex", run: ["codex"] }, "/p", null), ["codex"]);
  assert.deepEqual(await agentArgv(claude, "/p", "box"), ["claude"]);
  assert.deepEqual(await agentArgv(claude, null, null), ["claude"]);
  assert.deepEqual(ran, []);
});

test("agentArgv: nothing selected starts plain without scanning or writing anything", async () => {
  for (const sel of [null, { skills: [], mcp: [] }]) {
    const { ran } = world(sel);
    assert.deepEqual(await agentArgv(claude, "/p/sub", null), ["claude"]);
    assert.deepEqual(ran, ["git rev-parse --path-format=absolute --git-common-dir"]);
  }
});

test("agentArgv: a selection scans the library once (no separate count pass)", async () => {
  const { ran, notes } = world({ skills: ["gone"], mcp: [] });
  // "gone" is not in the (empty) library: skipped with a warning, Claude starts plain.
  assert.deepEqual(await agentArgv(claude, "/p", null), ["claude"]);
  const scans = ran.filter((c) => c.startsWith("find -L /h/.config/herdr-app/.agents/skills"));
  assert.equal(scans.length, 1);
  assert.equal(notes.length, 1);
  assert.match(notes[0].body, /gone: missing from library/);
});
