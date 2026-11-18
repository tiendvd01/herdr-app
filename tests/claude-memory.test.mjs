import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugOf, memoryDir, safeFile, validName, parseNote, parseIndex, noteText, indexLine, withLine, withoutFile,
  loadMemory, memoryStamp, saveNote, deleteNote, addToIndex, dropDead, addNote,
} from "../lib/claude-memory.js";

const D = "/h/.claude/projects/-r/memory";

// In-memory folder: files in `files` (path -> text) with mtimes; exec answers find/stat, rm, mkdir.
const world = (files = {}, mtimes = {}) => {
  const calls = [];
  let dirs = new Set(Object.keys(files).map((p) => p.slice(0, p.lastIndexOf("/"))));
  const exec = async (cmd, args = []) => {
    calls.push(`${cmd} ${args.join(" ")}`);
    if (cmd === "find") {
      const dir = args[0];
      if (!dirs.has(dir)) return { code: 1, stdout: "", stderr: `find: ${dir}: No such file or directory` };
      const out = Object.keys(files).filter((p) => p.startsWith(`${dir}/`) && p.endsWith(".md") && !p.slice(dir.length + 1).includes("/"))
        .map((p) => `${mtimes[p] ?? 100} ${p}`).join("\n");
      return { code: 0, stdout: out, stderr: "" };
    }
    if (cmd === "rm") { delete files[args[1]]; return { code: 0, stdout: "", stderr: "" }; }
    if (cmd === "mkdir") { dirs.add(args[1]); return { code: 0, stdout: "", stderr: "" }; }
    throw new Error(`unexpected exec: ${cmd}`);
  };
  const io = {
    read: async (p) => (p in files ? files[p] : null),
    write: async (p, text, expected) => {
      if ((p in files ? files[p] : null) !== expected) throw new Error("stale snapshot");
      files[p] = text;
    },
  };
  return { files, exec, io, calls };
};

const NOTE = `---\nname: no-probe-mods\ndescription: a temp mod gets docked\nmetadata:\n  node_type: memory\n  type: feedback\n---\n\nBody here.\n`;

test("slug and folder follow Claude's naming", () => {
  assert.equal(slugOf("/Users/x/.config/herdr-app"), "-Users-x--config-herdr-app");
  assert.equal(memoryDir("/h", "/Users/x/a_b"), "/h/.claude/projects/-Users-x-a-b/memory");
});

test("safeFile allows note basenames only", () => {
  assert.ok(safeFile("a-b_c.md"));
  for (const f of ["MEMORY.md", "../x.md", "a/b.md", ".hidden.md", "x.txt", "", null]) assert.equal(safeFile(f), false, String(f));
});

test("validName", () => {
  assert.equal(validName("deploy-steps"), null);
  assert.match(validName(""), /empty/);
  assert.match(validName("Bad Name"), /lowercase/);
  assert.match(validName("x", ["x.md"]), /exists/);
  assert.match(validName("memory"), /exists/);
});

test("parseNote reads metadata.type and top-level type, falls back without header", () => {
  const a = parseNote("no-probe-mods.md", NOTE);
  assert.deepEqual([a.name, a.description, a.type, a.header], ["no-probe-mods", "a temp mod gets docked", "feedback", true]);
  assert.equal(a.body.trim(), "Body here.");
  const b = parseNote("x.md", "---\nname: x\ndescription: \"quoted\"\ntype: user\n---\nhi");
  assert.deepEqual([b.description, b.type], ["quoted", "user"]);
  const c = parseNote("plain.md", "# Title line\n\nmore");
  assert.deepEqual([c.name, c.description, c.type, c.header], ["plain", "Title line", "unknown", false]);
});

test("parseIndex finds local links with hooks", () => {
  const e = parseIndex("# Memory\n- [No probe](no-probe-mods.md) — hook text\n- [Ext](https://x/y.md)\n- [Sub](a/b.md)\n");
  assert.deepEqual(e, [{ line: 1, title: "No probe", file: "no-probe-mods.md", hook: "hook text" }]);
});

test("noteText round-trips through parseNote; index line format", () => {
  const t = noteText({ name: "deploy-steps", description: "how\nto deploy", type: "project", body: "Run it." });
  const n = parseNote("deploy-steps.md", t);
  assert.deepEqual([n.name, n.description, n.type, n.body.trim()], ["deploy-steps", "how to deploy", "project", "Run it."]);
  assert.equal(indexLine({ name: "deploy-steps", file: "deploy-steps.md", description: "how" }), "- [Deploy steps](deploy-steps.md) — how");
});

test("withLine / withoutFile keep other lines", () => {
  assert.equal(withLine("a", "b"), "a\nb\n");
  assert.equal(withLine(null, "b"), "b\n");
  assert.equal(withoutFile("# H\n- [A](a.md) — x\n\n- [B](b.md)\n", "a.md"), "# H\n\n- [B](b.md)\n");
});

test("loadMemory: missing folder", async () => {
  const w = world();
  const m = await loadMemory(D, w.exec, w.io);
  assert.deepEqual([m.exists, m.notes.length, m.index], [false, 0, null]);
  assert.equal(await memoryStamp(D, w.exec), "none");
});

test("loadMemory: notes newest first, unlisted and dead", async () => {
  const w = world({
    [`${D}/MEMORY.md`]: "- [A](a.md) — a\n- [Gone](gone.md) — g\n",
    [`${D}/a.md`]: NOTE.replace("no-probe-mods", "a"),
    [`${D}/b.md`]: "plain note",
  }, { [`${D}/b.md`]: 200 });
  const m = await loadMemory(D, w.exec, w.io);
  assert.deepEqual(m.notes.map((n) => n.file), ["b.md", "a.md"]);
  assert.deepEqual(m.unlisted, ["b.md"]);
  assert.deepEqual(m.dead.map((e) => e.file), ["gone.md"]);
  assert.match(m.stamp, /b\.md:200/);
});

test("saveNote writes, refuses stale and unsafe files", async () => {
  const w = world({ [`${D}/a.md`]: "old" });
  await saveNote(D, "a.md", "new", "old", w.io);
  assert.equal(w.files[`${D}/a.md`], "new");
  await assert.rejects(saveNote(D, "a.md", "x", "old", w.io), /Changed on disk/);
  await assert.rejects(saveNote(D, "MEMORY.md", "x", null, w.io), /Refused/);
  await assert.rejects(saveNote(D, "../a.md", "x", null, w.io), /Refused/);
});

test("deleteNote removes the file and only its index lines", async () => {
  const w = world({ [`${D}/MEMORY.md`]: "# M\n- [A](a.md) — a\n- [B](b.md) — b\n", [`${D}/a.md`]: "x", [`${D}/b.md`]: "y" });
  await deleteNote(D, "a.md", w.exec, w.io);
  assert.equal(w.files[`${D}/a.md`], undefined);
  assert.equal(w.files[`${D}/MEMORY.md`], "# M\n- [B](b.md) — b\n");
});

test("addToIndex and dropDead fix one problem each", async () => {
  const w = world({ [`${D}/MEMORY.md`]: "- [Gone](gone.md) — g\n", [`${D}/x.md`]: NOTE.replace("no-probe-mods", "x") });
  await addToIndex(D, "x.md", w.io);
  await addToIndex(D, "x.md", w.io); // twice: still one line
  assert.equal(w.files[`${D}/MEMORY.md`], "- [Gone](gone.md) — g\n- [X](x.md) — a temp mod gets docked\n");
  await dropDead(D, "gone.md", w.io);
  assert.equal(w.files[`${D}/MEMORY.md`], "- [X](x.md) — a temp mod gets docked\n");
});

test("addNote creates folder, note and index; refuses duplicates", async () => {
  const w = world();
  const r = await addNote(D, { name: "deploy-steps", description: "how", type: "reference", body: "Run." }, w.exec, w.io);
  assert.equal(r.file, "deploy-steps.md");
  assert.equal(parseNote("deploy-steps.md", w.files[`${D}/deploy-steps.md`]).type, "reference");
  assert.equal(w.files[`${D}/MEMORY.md`], "- [Deploy steps](deploy-steps.md) — how\n");
  await assert.rejects(addNote(D, { name: "deploy-steps" }, w.exec, w.io), /exists/);
  await assert.rejects(addNote(D, { name: "../x" }, w.exec, w.io), /lowercase/);
});
