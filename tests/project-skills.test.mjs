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

// Spec 027: Claude in the main checkout of a project must get the same skills as in a worktree.
// A library with one valid skill "a", selected for project /p (slug "p"); git answers /p/.git from any folder of it.
const LIB = "/h/.config/herdr-app/.agents/skills";
const PLUGIN = "/h/.config/herdr-app/projects/p/claude-plugin";
function project() {
  const ran = [], notes = [];
  stub({
    home: "/h",
    notify: (n) => notes.push(n),
    exec: async (cmd, args, opts) => {
      ran.push({ cmd, args, cwd: opts?.cwd });
      if (cmd === "git") return { code: 0, stdout: "/p/.git\n", stderr: "" };
      if (cmd === "find" && args[1] === LIB) return { code: 0, stdout: `${LIB}/a\n`, stderr: "" };
      return { code: 0, stdout: "", stderr: "" };
    },
    readTextFile: async (path) => {
      if (path === "/h/.config/herdr-app/projects/p/skills.json") return JSON.stringify({ skills: ["a"], mcp: [] });
      if (path === `${LIB}/a/SKILL.md`) return "---\nname: a\ndescription: does a\n---\n";
      throw new Error(`ENOENT ${path}`);
    },
    writeTextFile: async () => {},
  });
  return { ran, notes };
}

test("agentArgv: main checkout, a subfolder and a worktree of one project get the same skills folder", async () => {
  for (const folder of ["/p", "/p/src", "/wt/p-feature"]) {
    const { ran, notes } = project();
    assert.deepEqual(await agentArgv(claude, folder, null), ["claude", "--plugin-dir", PLUGIN], folder);
    assert.equal(ran[0].cwd, folder, "the project is looked up from the launch folder");
    assert.ok(ran.some((c) => c.cmd === "ln" && c.args.join(" ") === `-sfn ${LIB}/a ${PLUGIN}/skills/a`));
    assert.deepEqual(notes, []);
  }
});

test("+ menu: agentTab decides at launch time (Claude in the main checkout gets the skills folder)", async () => {
  const { agentTab } = await import("../mods/my-new-menu/launch.js");
  project();
  assert.deepEqual(await agentTab({ key: "claude", name: "Claude Code", run: ["claude"] }, { id: "s1", machine: null }, "/p"),
    { name: "Claude Code", space: "s1", folder: "/p", argv: ["claude", "--plugin-dir", PLUGIN] });
  const { ran } = project();
  assert.deepEqual(await agentTab({ key: "codex", name: "Codex", run: ["codex"] }, { id: "s1" }, "/p"),
    { name: "Codex", space: "s1", folder: "/p", argv: ["codex"] });
  assert.deepEqual(ran, []);
  // No folder known: no folder argument, Claude plain.
  assert.deepEqual(await agentTab({ key: "claude", name: "Claude Code", run: ["claude"] }, { id: "s1" }, null),
    { name: "Claude Code", space: "s1", folder: undefined, argv: ["claude"] });
});
