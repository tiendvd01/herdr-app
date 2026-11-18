import { test } from "node:test";
import assert from "node:assert/strict";
import { stub } from "herdr";
import { scanLibrary, syncBundle, addSource, removeSource, writeSelection, readSelection } from "../lib/project-skills.js";
import { TEAM_MATCH, rewritePaths } from "../scripts/move-skill-set.mjs";
import { carryOver } from "../scripts/project-skill-sources.mjs";

const APP = "/h/.config/herdr-app";
const OWN = `${APP}/.agents/skills`;
const SET = "/h/set";
const P = { dir: `${APP}/projects/p`, plugin: "herdr-p", main: "/p" };
const Q = { dir: `${APP}/projects/q`, plugin: "herdr-q", main: "/q" };
const SEL = (dir) => `${dir}/skills.json`;

// A fake disk: `dirs` are existing folders, `skills` maps a folder to its skill names, `sel` maps a project
// dir to its skills.json object.
function disk({ sel = { [P.dir]: { sources: ["~/set"], skills: [], mcp: [] } }, dirs = [OWN, SET, "/h/other"], skills = {} } = {}) {
  const ran = [], written = {};
  const all = {};
  for (const [dir, j] of Object.entries(sel)) all[SEL(dir)] = JSON.stringify(j);
  for (const [dir, names] of Object.entries(skills))
    for (const n of names) all[`${dir}/${n}/SKILL.md`] = `---\nname: ${n}\ndescription: ${n} in ${dir}\n---\n`;
  stub({
    home: "/h",
    exec: async (cmd, args) => {
      ran.push(`${cmd} ${args.join(" ")}`);
      if (cmd === "test") return { code: dirs.includes(args[1]) ? 0 : 1, stdout: "", stderr: "" };
      if (cmd === "realpath") return { code: 0, stdout: args[0] + "\n", stderr: "" };
      if (cmd === "find" && args[0] === "-L") return { code: 0, stdout: (skills[args[1]] ?? []).map((n) => `${args[1]}/${n}`).join("\n"), stderr: "" };
      if (cmd === "readlink") return { code: 1, stdout: "", stderr: "" };
      return { code: 0, stdout: "", stderr: "" };
    },
    readTextFile: async (p) => { if (p in written) return written[p]; if (p in all) return all[p]; throw new Error(`ENOENT ${p}`); },
    writeTextFile: async (p, text) => { written[p] = text; },
  });
  return { ran, written };
}

test("scanLibrary: own library first, the project's source after, first source wins a name", async () => {
  disk({ skills: { [OWN]: ["a", "b"], [SET]: ["b", "c"] } });
  const lib = await scanLibrary(P);
  assert.deepEqual(lib.skills.map((s) => `${s.name}@${s.source}`), ["a@~/.config/herdr-app/.agents/skills", "b@~/.config/herdr-app/.agents/skills", "c@~/set"]);
  assert.deepEqual(lib.hidden.map((s) => [s.name, s.source, s.hiddenBy]), [["b", "~/set", "~/.config/herdr-app/.agents/skills"]]);
  assert.deepEqual(lib.sources.map((s) => [s.path, s.own, s.missing, s.count]), [["~/.config/herdr-app/.agents/skills", true, false, 2], ["~/set", false, false, 1]]);
});

test("scanLibrary: sources are per project (another project and no project see only the own library)", async () => {
  disk({ skills: { [OWN]: ["a"], [SET]: ["c"] } });
  assert.deepEqual((await scanLibrary(Q)).skills.map((s) => s.name), ["a"]);
  assert.deepEqual((await scanLibrary()).skills.map((s) => s.name), ["a"]);
  assert.deepEqual((await scanLibrary(P)).skills.map((s) => s.name), ["a", "c"]);
});

test("scanLibrary: a missing source stays listed and gives no skills", async () => {
  const { ran } = disk({ sel: { [P.dir]: { sources: ["~/gone"] } }, skills: { [OWN]: ["a"] } });
  const lib = await scanLibrary(P);
  assert.deepEqual(lib.sources.map((s) => [s.path, s.missing]), [["~/.config/herdr-app/.agents/skills", false], ["~/gone", true]]);
  assert.deepEqual(lib.skills.map((s) => s.name), ["a"]);
  assert.ok(!ran.some((c) => c.startsWith("find -L /h/gone")));
});

test("syncBundle: a selected skill from the project's source is linked from there", async () => {
  const { ran } = disk({ sel: { [P.dir]: { sources: ["~/set"], skills: ["c"], mcp: [] } }, skills: { [OWN]: ["a"], [SET]: ["c"] } });
  const b = await syncBundle(P);
  assert.deepEqual(b.skills, ["c"]);
  assert.ok(ran.includes(`ln -sfn ${SET}/c ${APP}/projects/p/claude-plugin/skills/c`));
});

test("writeSelection: a save of switches keeps the project's folders", async () => {
  const { written } = disk({ sel: { [P.dir]: { sources: ["~/set", "~/other"], skills: ["a"], mcp: [] } } });
  const before = await readSelection(P);
  assert.equal((await writeSelection(P, { skills: ["c", "a"], mcp: [] }, before.raw)).ok, true);
  assert.deepEqual(JSON.parse(written[SEL(P.dir)]), { version: 2, sources: ["~/set", "~/other"], skills: ["a", "c"], mcp: [] });
});

test("addSource: per project; refuses non-folders, duplicates and the own library; keeps switches", async () => {
  const { written } = disk({ sel: { [P.dir]: { sources: ["~/set"], skills: ["x"], mcp: ["m"] } } });
  assert.match((await addSource(P, "relative/x")).error, /full path/);
  assert.match((await addSource(P, "~/nope")).error, /not a folder/);
  assert.match((await addSource(P, "/h/set/")).error, /already a source/);
  assert.match((await addSource(P, "$HOME/.config/herdr-app/.agents/skills")).error, /own library/);
  assert.deepEqual(await addSource(P, "/h/other"), { ok: true, sources: ["~/set", "~/other"] });
  assert.deepEqual(JSON.parse(written[SEL(P.dir)]), { version: 2, sources: ["~/set", "~/other"], skills: ["x"], mcp: ["m"] });
  assert.deepEqual(await addSource(Q, "/h/set"), { ok: true, sources: ["~/set"] }, "another project has its own list");
});

test("removeSource: drops the path from this project and counts its turned-on skills from it", async () => {
  const { written } = disk({ sel: { [P.dir]: { sources: ["~/set"], skills: ["a", "c"], mcp: [] } }, skills: { [OWN]: ["a"], [SET]: ["c", "d"] } });
  assert.deepEqual(await removeSource(P, "~/set"), { ok: true, sources: [], on: 1 });
  assert.deepEqual(JSON.parse(written[SEL(P.dir)]).skills, ["a", "c"]);
  assert.equal((await removeSource(P, "~/x")).ok, false);
});

test("carry-over: a project gets a shared folder only if one of its turned-on skills comes from it", () => {
  const shared = [{ path: "~/set", names: new Set(["c", "b"]) }, { path: "~/two", names: new Set(["z"]) }];
  const own = new Set(["b"]);
  assert.deepEqual(carryOver([], ["c"], shared, own), ["~/set"]);
  assert.deepEqual(carryOver([], ["b"], shared, own), [], "a name the own library has does not count");
  assert.deepEqual(carryOver(["~/set"], ["c", "z"], shared, own), ["~/set", "~/two"]);
  assert.deepEqual(carryOver([], [], shared, own), []);
});

test("move-skill-set: TEAM_MATCH picks the team set only", () => {
  for (const n of ["delivery", "delivery-dev", "delivery-dev-pr", "devflow", "sora-ask", "sora-profile", "find-mockup-repo", "issue-walkthrough", "onboard-domain", "translate-requirement"]) assert.ok(TEAM_MATCH(n), n);
  for (const n of ["archify", "trace-flow", "hunk-review", "mermaid-diagrams", "playwright-cli"]) assert.ok(TEAM_MATCH(n), n);
  for (const n of ["ponytail", "ponytail-review", "sora", "deliveryx"]) assert.ok(!TEAM_MATCH(n), n);
});

test("move-skill-set: rewritePaths keeps each spelling and is idempotent", () => {
  const t = "~/.config/herdr-app/skills/delivery-dev/x.sh $HOME/.config/herdr-app/.agents/skills/delivery-start/a ${HOME}/.config/herdr-app/skills/b /Users/me/.config/herdr-app/.agents/skills/c ~/.config/herdr-app/mods/x";
  const out = rewritePaths(t, "/Users/me", "~/Documents/SoraTech/skills-set");
  assert.equal(out, "~/Documents/SoraTech/skills-set/delivery-dev/x.sh $HOME/Documents/SoraTech/skills-set/delivery-start/a ${HOME}/Documents/SoraTech/skills-set/b /Users/me/Documents/SoraTech/skills-set/c ~/.config/herdr-app/mods/x");
  assert.equal(rewritePaths(out, "/Users/me", "~/Documents/SoraTech/skills-set"), out);
  assert.equal(rewritePaths("x('~/.config/herdr-app/skills') ~/.config/herdr-app/skills-lock.json", "/Users/me", "~/s"), "x('~/s') ~/.config/herdr-app/skills-lock.json");
});
