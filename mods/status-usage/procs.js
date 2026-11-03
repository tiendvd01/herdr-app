// Collects the process tree under every Claude session (all spaces) from `ps`.
import { agents, terminals } from "herdr";

export function etimeSecs(s) {
  const [d, rest] = s.includes("-") ? s.split("-") : [0, s];
  const p = rest.split(":").map(Number);
  while (p.length < 3) p.unshift(0);
  return Number(d) * 86400 + p[0] * 3600 + p[1] * 60 + p[2];
}

// ps %cpu on macOS is a decaying average, so it stays high after work stops.
// Real activity = growth of cumulative CPU time between two polls.
function cpuTimeSecs(s) {
  const p = s.split(":").map(Number);
  let v = 0;
  for (const x of p) v = v * 60 + x;
  return v;
}
let prevCt = new Map();
let prevAt = 0;

export function pretty(cmd) {
  let c = cmd;
  const i = cmd.indexOf("eval '");
  if (i >= 0) {
    const j = cmd.lastIndexOf("' < /dev/null");
    c = cmd.slice(i + 6, j > i ? j : undefined).replace(/'"'"'/g, "'");
  }
  c = c.replace(/\/Users\/[^/\s]+/g, "~").replace(/\s+/g, " ").trim();
  return c;
}

export async function collect(exec) {
  const r = await exec("/bin/ps", ["-axo", "pid=,ppid=,pcpu=,rss=,etime=,stat=,time=,command="]);
  const procs = new Map();
  const kids = new Map();
  for (const line of r.stdout.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)$/);
    if (!m) continue;
    const p = { pid: +m[1], ppid: +m[2], cpu: +m[3], rss: +m[4] * 1024, age: etimeSecs(m[5]), stat: m[6], ct: cpuTimeSecs(m[7]), cmd: m[8] };
    procs.set(p.pid, p);
    if (!kids.has(p.ppid)) kids.set(p.ppid, []);
    kids.get(p.ppid).push(p.pid);
  }
  const now = Date.now();
  const dt = (now - prevAt) / 1000;
  const live = new Map();
  for (const p of procs.values()) {
    const b = prevCt.get(p.pid);
    live.set(p.pid, b !== undefined && dt > 0 ? Math.max(0, (p.ct - b) / dt * 100) : 0);
  }
  prevCt = new Map([...procs.values()].map((p) => [p.pid, p.ct]));
  prevAt = now;
  const subtree = (pid) => {
    const out = [];
    const walk = (x) => { out.push(x); for (const k of kids.get(x) ?? []) walk(k); };
    walk(pid);
    return out.map((x) => procs.get(x)).filter(Boolean);
  };
  const fg = new Map(terminals().map((t) => [t.address, t.foreground?.pid]));
  const sessions = [];
  for (const a of agents().filter((x) => x.app === "claude-code")) {
    const root = fg.get(a.address);
    if (!root || !procs.has(root)) continue;
    const items = (kids.get(root) ?? []).map((pid) => {
      const all = subtree(pid);
      const top = procs.get(pid);
      return {
        pid, pids: all.map((x) => x.pid), cmd: pretty(top.cmd), age: top.age,
        cpu: all.reduce((s, x) => s + x.cpu, 0), rss: all.reduce((s, x) => s + x.rss, 0),
        paused: top.stat.startsWith("T"), n: all.length,
      };
    }).sort((x, y) => y.age - x.age);
    const busyCpu = subtree(root).reduce((a, x) => a + (live.get(x.pid) ?? 0), 0);
    sessions.push({
      busyCpu,
      address: a.address, pane: a.pane, space: a.space, tab: a.tab, title: a.title || "Claude",
      where: `${a.space_name} › ${a.tab_name}`, status: a.status, root,
      age: procs.get(root).age, rootCpu: procs.get(root).cpu, rootRss: procs.get(root).rss, items,
    });
  }
  return { at: Date.now(), sessions };
}
