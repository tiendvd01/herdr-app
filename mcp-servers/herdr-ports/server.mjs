#!/usr/bin/env node
// herdr-ports: MCP server (stdio, newline-delimited JSON-RPC 2.0) giving Claude the information of
// Herdr's Project Settings › Ports (spec 014). Read-only: it only runs lsof, ps, git and hc queries.
// No dependencies, no build. Registered as mcp/herdr-ports.json, turned on per project in
// Project Settings › Skills. stdout carries protocol messages only; logs go to stderr.
import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { createInterface } from "node:readline";
import { repoOf, listWorktrees, listListeners, loadPorts, worktreeOf, shortHome } from "../../lib/ports.js";

const HOME = homedir();

function exec(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd: opts.cwd, maxBuffer: 16 * 1024 * 1024, timeout: opts.timeout ?? 10000 }, (err, stdout, stderr) => {
      resolve({ code: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: stdout ?? "", stderr: stderr ?? "" });
    });
  });
}

const tilde = (p) => (p ? shortHome(p, HOME) : p);
class ToolError extends Error {}

// ---- Herdr terminals: listener tty -> { address, where } through hc (optional, never fails) ----
async function herdrTerminals() {
  const map = new Map();
  try {
    const ls = await exec("hc", ["ls"]);
    if (ls.code !== 0) return map;
    const live = JSON.parse(ls.stdout).terminals ?? [];
    const got = await Promise.all(live.map((t) => exec("hc", ["get", t.address]).then((r) => {
      try { return r.code === 0 ? JSON.parse(r.stdout) : null; } catch { return null; }
    })));
    const byPid = new Map();
    for (const g of got) if (g?.pid) byPid.set(g.pid, { address: g.address, where: g.labels?.where ?? g.where ?? null });
    if (!byPid.size) return map;
    const ps = await exec("ps", ["-o", "pid=,tty=", "-p", [...byPid.keys()].join(",")]);
    for (const line of ps.stdout.split("\n")) {
      const m = line.trim().match(/^(\d+)\s+(\S+)$/);
      if (m && m[2] !== "??" && byPid.has(+m[1])) map.set(m[2], byPid.get(+m[1]));
    }
  } catch (e) { process.stderr.write(`herdr-ports: hc lookup failed: ${e?.message ?? e}\n`); }
  return map;
}

// ---- Project resolution ----
async function knownProjects() {
  const ls = await exec("hc", ["ls"]);
  if (ls.code !== 0) return null;
  let terms = [];
  try { terms = JSON.parse(ls.stdout).terminals ?? []; } catch { return null; }
  const seen = new Map();
  for (const f of [...new Set(terms.map((t) => t.cwd).filter(Boolean))]) {
    const r = await repoOf(f, exec);
    if (r && !seen.has(r.main)) seen.set(r.main, r);
  }
  return [...seen.values()];
}

async function resolveProject(arg) {
  if (arg == null || arg === "") {
    const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const r = await repoOf(cwd, exec);
    if (!r) throw new ToolError(`No project given and the current folder (${tilde(cwd)}) is not in a git repository. Pass "project" (a folder or a project name).`);
    return r;
  }
  const folder = arg.startsWith("~") ? HOME + arg.slice(1) : arg;
  if (folder.startsWith("/") || existsSync(folder)) {
    if (!existsSync(folder) || !statSync(folder).isDirectory()) throw new ToolError(`No such folder: ${arg}`);
    const r = await repoOf(folder, exec);
    if (!r) throw new ToolError(`Not a git repository: ${tilde(folder)}`);
    return r;
  }
  const known = await knownProjects();
  if (!known) throw new ToolError(`Cannot list Herdr projects (hc unavailable); pass a folder instead of "${arg}".`);
  const hits = known.filter((p) => p.name === arg);
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) throw new ToolError(`Ambiguous project "${arg}": ${hits.map((p) => tilde(p.main)).join(", ")}`);
  throw new ToolError(`Unknown project "${arg}". Known: ${known.map((p) => p.name).sort().join(", ") || "(none)"}`);
}

// ---- Tools ----
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

async function projectPorts(args) {
  const p = await resolveProject(args?.project);
  const [trees, terms] = await Promise.all([loadPorts(p.main, exec), herdrTerminals()]);
  const total = trees.reduce((a, w) => a + w.items.length, 0);
  const out = {
    project: { name: p.name, main: tilde(p.main) },
    total,
    worktrees: trees.map((w) => ({
      path: tilde(w.path), branch: w.branch, main: w.main,
      ports: w.items.map((x) => ({
        port: x.port, pid: x.pid, command: tilde(x.args), folder: tilde(x.dir), rel: x.rel,
        ...(x.tty && terms.get(x.tty) ? { terminal: terms.get(x.tty) } : {}),
      })),
    })),
  };
  return `${p.name}: ${plural(total, "listening port")} across ${plural(trees.length, "worktree")}\n${JSON.stringify(out, null, 2)}`;
}

async function portLookup(args) {
  const port = args?.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ToolError("Port must be an integer between 1 and 65535");
  const [all, terms] = await Promise.all([listListeners(exec), herdrTerminals()]);
  const hits = all.filter((x) => x.port === port);
  const holders = [];
  for (const x of hits) {
    const r = x.dir ? await repoOf(x.dir, exec) : null;
    const wt = r ? worktreeOf(x.dir, await listWorktrees(r.main, exec)) : null;
    holders.push({
      pid: x.pid, command: tilde(x.args), folder: tilde(x.dir),
      project: r ? r.name : null,
      worktree: wt ? { path: tilde(wt.path), branch: wt.branch, main: wt.main } : null,
      ...(x.tty && terms.get(x.tty) ? { terminal: terms.get(x.tty) } : {}),
    });
  }
  const out = { port, free: holders.length === 0, holders };
  const h = holders[0];
  const line = !h ? `Port ${port} is free`
    : `Port ${port}: ${h.command} (pid ${h.pid})${h.project ? ` in ${h.project}${h.worktree ? ` › ${h.worktree.branch}` : ""}` : " (not in a git repository)"}${holders.length > 1 ? ` and ${holders.length - 1} more` : ""}`;
  return `${line}\n${JSON.stringify(out, null, 2)}`;
}

const TOOLS = [
  {
    name: "project_ports",
    description: "Listening TCP ports of a git project, grouped by worktree (same as Herdr Project Settings › Ports): port, pid, command, folder and the Herdr terminal running it. Defaults to the project of the current folder.",
    inputSchema: {
      type: "object",
      properties: { project: { type: "string", description: "Folder inside the repository, or a project name as shown in Herdr Project Settings. Omit for the current folder's project." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, title: "Project ports" },
    run: projectPorts,
  },
  {
    name: "port_lookup",
    description: "Who is listening on a TCP port on this machine: free, or the project, worktree, folder, command and pid holding it.",
    inputSchema: {
      type: "object",
      properties: { port: { type: "integer", minimum: 1, maximum: 65535 } },
      required: ["port"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, title: "Port lookup" },
    run: portLookup,
  },
];

// ---- JSON-RPC over stdio ----
const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");

async function handle(req) {
  const { id, method, params } = req;
  const isRequest = id !== undefined && id !== null;
  try {
    switch (method) {
      case "initialize":
        return isRequest && send({ id, result: {
          protocolVersion: params?.protocolVersion ?? "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "herdr-ports", version: "1.0.0" },
        } });
      case "notifications/initialized":
      case "notifications/cancelled":
        return;
      case "ping":
        return isRequest && send({ id, result: {} });
      case "tools/list":
        return isRequest && send({ id, result: { tools: TOOLS.map(({ run, ...t }) => t) } });
      case "tools/call": {
        const tool = TOOLS.find((t) => t.name === params?.name);
        if (!tool) return isRequest && send({ id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } });
        try {
          const text = await tool.run(params?.arguments ?? {});
          return isRequest && send({ id, result: { content: [{ type: "text", text }] } });
        } catch (e) {
          const text = e instanceof ToolError ? e.message : `herdr-ports failed: ${e?.message ?? e}`;
          return isRequest && send({ id, result: { content: [{ type: "text", text }], isError: true } });
        }
      }
      default:
        if (isRequest) send({ id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (e) {
    if (isRequest) send({ id, error: { code: -32603, message: String(e?.message ?? e) } });
  }
}

const rl = createInterface({ input: process.stdin });
const pending = new Set();
rl.on("line", (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch { return send({ id: null, error: { code: -32700, message: "Parse error" } }); }
  const p = handle(req).finally(() => pending.delete(p));
  pending.add(p);
});
rl.on("close", async () => { await Promise.all(pending); process.exit(0); });
