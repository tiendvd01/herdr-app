import { test } from "node:test";
import assert from "node:assert/strict";
import { shortHome, listWorktrees, listListeners, assign, loadPorts } from "../lib/ports.js";

// Fake exec: answers by "cmd arg0 arg1"; anything else is a test bug.
const fakeExec = (answers) => async (cmd, args) => {
  const key = Object.keys(answers).find((k) => `${cmd} ${args.join(" ")}`.startsWith(k));
  if (!key) throw new Error(`unexpected exec: ${cmd} ${args.join(" ")}`);
  return { code: 0, stderr: "", stdout: answers[key] };
};

const exec = fakeExec({
  "git worktree list": "worktree /r\nHEAD a\nbranch refs/heads/main\n\nworktree /r-wt\nHEAD b\ndetached\n",
  "lsof -nP -iTCP": "p10\ncnode\nn*:3000\nn[::]:3000\np20\ncvite\nn127.0.0.1:5173\np30\ncpg\nn*:5432\n",
  "lsof -a -d cwd": "p10\nn/r/web\np20\nn/r-wt\np30\nn/var/db\n",
  "ps -o pid=,args=": "10 node server.js\n20 vite\n",
  "ps -o pid=,tty=": "10 ttys001\n20 ??\n",
});

test("shortHome", () => {
  assert.equal(shortHome("/Users/me/x /Users/me/y", "/Users/me"), "~/x ~/y");
  assert.equal(shortHome("/Users/someone/x"), "~/x");
});

test("listWorktrees reads porcelain output", async () => {
  assert.deepEqual(await listWorktrees("/r", exec), [
    { path: "/r", branch: "main", main: true, items: [] },
    { path: "/r-wt", branch: "(detached)", main: false, items: [] },
  ]);
});

test("listListeners: one entry per pid:port, with dir, args and tty", async () => {
  const ls = await listListeners(exec);
  assert.deepEqual(ls.map((x) => [x.pid, x.port, x.dir, x.args, x.tty]), [
    [10, 3000, "/r/web", "node server.js", "ttys001"],
    [20, 5173, "/r-wt", "vite", null],
    [30, 5432, "/var/db", "pg", null],
  ]);
});

test("loadPorts groups by worktree, drops listeners outside, main first", async () => {
  const trees = await loadPorts("/r", exec);
  assert.deepEqual(trees.map((t) => [t.path, t.items.map((i) => [i.port, i.rel])]), [
    ["/r", [[3000, "web"]]],
    ["/r-wt", [[5173, "./"]]],
  ]);
});

test("assign picks the deepest worktree", () => {
  const trees = [{ path: "/r", branch: "main", main: true }, { path: "/r/nested", branch: "x", main: false }];
  assign([{ port: 1, dir: "/r/nested/a" }], trees);
  assert.equal(trees.find((t) => t.path === "/r/nested").items.length, 1);
});
