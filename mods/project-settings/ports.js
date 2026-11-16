// GENERATED from lib/ports.js by scripts/sync-github-lib.sh. Do not edit here.
// Listening TCP ports of a git project, grouped by worktree (spec 010 rules, spec 014).
// Single source for Project Settings › Ports (synced copy in mods/project-settings/ports.js) and the
// herdr-ports MCP server (mcp-servers/herdr-ports/server.mjs imports this file directly).
// No `herdr` import: every function takes exec(cmd, args, opts?) -> Promise<{ code, stdout, stderr }>.
// Read-only: only lsof, ps and git queries.

// lsof exits 1 when one pid of a list is gone yet still prints the rest, so read stdout whatever the code.
const lines = (r) => (r?.stdout ?? "").split("\n");

// "/Users/<name>/..." in a command line shown as "~/...".
export function shortHome(text, home) {
  if (!text) return text;
  return home ? text.split(home).join("~") : text.replace(/\/Users\/[^/\s]+/g, "~");
}

// Repository of a folder (shared by its worktrees), or null outside git.
export async function repoOf(folder, exec) {
  if (!folder) return null;
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder }).catch(() => null);
  if (!r || r.code !== 0) return null;
  const common = r.stdout.trim();
  const main = common.endsWith("/.git") ? common.slice(0, -5) : common;
  return { main, name: main.split("/").pop() };
}

// Worktrees of a repository, without ports: { path, branch, main, items: [] }.
export async function listWorktrees(main, exec) {
  const wl = await exec("git", ["worktree", "list", "--porcelain"], { cwd: main });
  const trees = [];
  for (const blk of (wl.code === 0 ? wl.stdout : "").split("\n\n")) {
    const path = blk.match(/^worktree (.+)$/m)?.[1];
    if (!path) continue;
    const br = blk.match(/^branch refs\/heads\/(.+)$/m)?.[1];
    trees.push({ path, branch: br ?? "(detached)", main: path === main, items: [] });
  }
  return trees;
}

// Every listening TCP socket on this machine: { pid, port, cmd, args, dir, tty }.
// One entry per pid:port (IPv4 and IPv6 count once); dir is null when it cannot be read.
export async function listListeners(exec) {
  const l = await exec("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-Fpcn"]);
  const ls = [], seen = new Set();
  let cur = null;
  for (const line of lines(l)) {
    const k = line[0], v = line.slice(1);
    if (k === "p") cur = { pid: +v, cmd: "" };
    else if (k === "c" && cur) cur.cmd = v;
    else if (k === "n" && cur) {
      const port = +v.slice(v.lastIndexOf(":") + 1);
      const key = `${cur.pid}:${port}`;
      if (port >= 1 && port <= 65535 && !seen.has(key)) { seen.add(key); ls.push({ pid: cur.pid, cmd: cur.cmd, port }); }
    }
  }
  const pids = [...new Set(ls.map((x) => x.pid))];
  const cwd = new Map(), args = new Map(), tty = new Map();
  if (pids.length) {
    const c = await exec("lsof", ["-a", "-d", "cwd", "-p", pids.join(","), "-Fpn"]);
    let pid = 0;
    for (const line of lines(c)) {
      if (line[0] === "p") pid = +line.slice(1);
      else if (line[0] === "n") cwd.set(pid, line.slice(1));
    }
    const a = await exec("ps", ["-o", "pid=,args=", "-p", pids.join(",")]);
    for (const line of lines(a)) {
      const m = line.trim().match(/^(\d+)\s+(.*)$/);
      if (m) args.set(+m[1], m[2]);
    }
    const t = await exec("ps", ["-o", "pid=,tty=", "-p", pids.join(",")]);
    for (const line of lines(t)) {
      const m = line.trim().match(/^(\d+)\s+(\S+)$/);
      if (m && m[2] !== "??") tty.set(+m[1], m[2]);
    }
  }
  return ls.map((x) => ({ ...x, args: args.get(x.pid) ?? x.cmd, dir: cwd.get(x.pid) ?? null, tty: tty.get(x.pid) ?? null }));
}

// The worktree that contains a folder (deepest match), or null.
export function worktreeOf(dir, trees) {
  if (!dir) return null;
  return trees.filter((w) => dir === w.path || dir.startsWith(w.path + "/")).sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}

// Put listeners under their worktree; listeners outside every worktree are dropped.
// Items sorted by port; worktrees main first, then by branch.
export function assign(listeners, trees) {
  for (const t of trees) t.items = [];
  for (const x of listeners) {
    const t = worktreeOf(x.dir, trees);
    if (!t) continue;
    t.items.push({ ...x, rel: x.dir === t.path ? "./" : x.dir.slice(t.path.length + 1) });
  }
  for (const t of trees) t.items.sort((a, b) => a.port - b.port);
  return trees.sort((a, b) => Number(b.main) - Number(a.main) || a.branch.localeCompare(b.branch));
}

// The Ports tab's view of one repository.
export async function loadPorts(main, exec) {
  const [trees, listeners] = await Promise.all([listWorktrees(main, exec), listListeners(exec)]);
  return assign(listeners, trees);
}
