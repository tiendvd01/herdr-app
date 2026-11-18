import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugOf, threadsDir, validId, cleanPrompt, parseLines, listFiles, summarize, ThreadCache, liveMap, filterThreads, deleteThread, ago,
} from "../lib/claude-threads.js";

const ID1 = "11111111-1111-4111-8111-111111111111", ID2 = "22222222-2222-4222-8222-222222222222";
const D = "/h/.claude/projects/-r";
const user = (content, extra = {}) => JSON.stringify({ isSidechain: false, type: "user", message: { role: "user", content }, cwd: "/r", gitBranch: "main", ...extra });

// Fake folder: path -> { mtime, size, lines }; exec answers find/stat, rg and rm.
const world = (files) => {
  const calls = [];
  const exec = async (cmd, args = []) => {
    calls.push(cmd);
    if (cmd === "find") {
      const out = Object.entries(files).filter(([p]) => p.startsWith(`${args[0]}/`) && p.endsWith(".jsonl"))
        .map(([p, f]) => `${f.mtime} ${f.size} ${p}`).join("\n");
      return { code: 0, stdout: out, stderr: "" };
    }
    if (cmd === "rg") {
      const paths = args.slice(args.indexOf("--") + 1), pats = [];
      for (let i = 0; i < args.length; i++) if (args[i] === "-e") pats.push(new RegExp(args[i + 1]));
      const out = paths.flatMap((p) => (files[p]?.lines ?? []).filter((l) => pats.some((re) => re.test(l))).map((l) => `${p}:${l}`));
      return { code: out.length ? 0 : 1, stdout: out.join("\n"), stderr: "" };
    }
    if (cmd === "rm") { delete files[args[1]]; return { code: 0, stdout: "", stderr: "" }; }
    throw new Error(`unexpected exec ${cmd}`);
  };
  return { exec, calls, files };
};

test("names follow Claude's folder naming", () => {
  assert.equal(slugOf("/Users/x/.config/herdr-app"), "-Users-x--config-herdr-app");
  assert.equal(threadsDir("/h", "/r"), "/h/.claude/projects/-r");
  assert.ok(validId(ID1));
  assert.ok(!validId("../x") && !validId("abc"));
});

test("cleanPrompt keeps typed text and commands with args, drops noise", () => {
  assert.equal(cleanPrompt("fix the\n  login bug"), "fix the login bug");
  assert.equal(cleanPrompt("<command-message>x</command-message>\n<command-name>/speckit-plan</command-name>\n<command-args>go</command-args>"), "/speckit-plan go");
  assert.equal(cleanPrompt("<command-name>/clear</command-name>\n<command-args></command-args>"), null);
  assert.equal(cleanPrompt("<local-command-stdout>ok</local-command-stdout>"), null);
  assert.equal(cleanPrompt("[Request interrupted by user]"), null);
  assert.equal(cleanPrompt("   "), null);
});

test("parseLines: custom title beats ai title beats first prompt; meta and sidechain skipped", () => {
  const recs = [
    { type: "user", isMeta: true, message: { content: "caveat" } },
    { type: "user", isSidechain: true, message: { content: "agent prompt" } },
    { type: "user", message: { content: "first ask" }, cwd: "/r/a", gitBranch: "feat" },
    { type: "user", message: { content: [{ type: "text", text: "with image" }, { type: "image" }] } },
    { type: "ai-title", aiTitle: "AI name" },
    { type: "last-prompt", lastPrompt: "latest ask" },
  ];
  const s = parseLines(recs);
  assert.deepEqual(s, { title: "AI name", firstPrompt: "first ask", lastPrompt: "latest ask", prompts: 2, branch: "feat", cwd: "/r/a" });
  assert.equal(parseLines([...recs, { type: "custom-title", customTitle: "Mine" }]).title, "Mine");
  assert.equal(parseLines([{ type: "user", message: { content: "only this" } }]).title, "only this");
  assert.equal(parseLines([]).title, "Untitled thread");
});

test("listFiles reads ids, times and sizes; skips non-thread names", async () => {
  const { exec } = world({ [`${D}/${ID1}.jsonl`]: { mtime: 5, size: 10 }, [`${D}/notes.jsonl`]: { mtime: 1, size: 1 } });
  assert.deepEqual(await listFiles(D, exec), [{ id: ID1, path: `${D}/${ID1}.jsonl`, mtime: 5, size: 10 }]);
});

test("summarize reads many files in one rg call and ignores broken lines", async () => {
  const p1 = `${D}/${ID1}.jsonl`, p2 = `${D}/${ID2}.jsonl`;
  const { exec, calls } = world({
    [p1]: { lines: [user("hello"), '{"type":"ai-title","aiTitle":"T1"}', '{"type":"assistant","message":{}}'] },
    [p2]: { lines: [user("half"), '{"type":"user","message":{"role":"user","content":"brok'] },
  });
  const m = await summarize([p1, p2], exec);
  assert.equal(calls.filter((c) => c === "rg").length, 1);
  assert.equal(m.get(p1).title, "T1");
  assert.equal(m.get(p2).prompts, 1);
});

test("ThreadCache sorts newest first, hides empty threads and re-reads only changed files", async () => {
  const p1 = `${D}/${ID1}.jsonl`, p2 = `${D}/${ID2}.jsonl`, p3 = `${D}/33333333-3333-4333-8333-333333333333.jsonl`;
  const w = world({
    [p1]: { mtime: 10, size: 1, lines: [user("old")] },
    [p2]: { mtime: 20, size: 1, lines: [user("new")] },
    [p3]: { mtime: 30, size: 1, lines: ['{"type":"file-history-snapshot"}'] },
  });
  const c = new ThreadCache();
  assert.deepEqual((await c.load(D, w.exec)).map((t) => t.title), ["new", "old"]);
  w.calls.length = 0;
  await c.load(D, w.exec);
  assert.ok(!w.calls.includes("rg"));
  w.files[p1] = { mtime: 40, size: 2, lines: [user("old"), user("more")] };
  const again = await c.load(D, w.exec);
  assert.equal(again[0].id, ID1);
  assert.equal(again[0].prompts, 2);
});

test("liveMap matches terminal pids to Claude's session files", async () => {
  const files = { "/h/.claude/sessions/10.json": JSON.stringify({ pid: 10, sessionId: ID1 }), "/h/.claude/sessions/11.json": "{bad" };
  const read = async (p) => files[p] ?? null;
  const m = await liveMap([{ address: "t1", pid: 10 }, { address: "t2", pid: 11 }, { address: "t3", pid: 12 }, { address: "t4", pid: null }], read, "/h");
  assert.deepEqual([...m], [[ID1, "t1"]]);
});

test("filterThreads matches title and prompts, case-insensitive", () => {
  const list = [{ title: "DB Migration", firstPrompt: "a" }, { title: "x", firstPrompt: "fix login" }, { title: "y", lastPrompt: "LOGIN page" }];
  assert.equal(filterThreads(list, "migration").length, 1);
  assert.equal(filterThreads(list, "login").length, 2);
  assert.equal(filterThreads(list, "  ").length, 3);
});

test("deleteThread validates the id and removes file and side folder", async () => {
  const calls = [];
  const exec = async (cmd, args) => { calls.push(`${cmd} ${args.join(" ")}`); return { code: 0, stdout: "", stderr: "" }; };
  await deleteThread(D, ID1, exec);
  assert.deepEqual(calls, [`rm -f ${D}/${ID1}.jsonl`, `rm -rf ${D}/${ID1}`]);
  await assert.rejects(deleteThread(D, "../../x", exec));
  assert.equal(calls.length, 2);
});

test("ago is short", () => {
  assert.equal(ago(1000, 1030), "now");
  assert.equal(ago(1000, 1000 + 300), "5m");
  assert.equal(ago(1000, 1000 + 7200), "2h");
  assert.equal(ago(1000, 1000 + 86400 * 3), "3d");
  assert.equal(ago(1000, 1000 + 86400 * 14), "2w");
});
