import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex, HoverCard } from "gpui-base";
import { spaces, agents, theme, run, window, keys, exec, setShared, notify, openOverlay, shared } from "herdr";
import { collect } from "./procs.js";
import { checkPostScripts } from "./postscripts.js";
import { spaceFolder } from "./space-folder.js";

const ICONS = { claude: "claude", copilot: "copilot", codex: "codex", agy: "antigravity", gemini: "gemini" };

const short = (iso) => {
  if (!iso) return "";
  const m = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (m <= 0) return "";
  const h = Math.floor(m / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};
const shortLabel = (l) => l.replace(/weekly/i, "wk").replace("premium interactions", "premium");

export default class WorkspaceStatus extends View {
  // The palette key as actually bound, not a hardcoded one; without a
  // binding the hint stays useful ("commands") instead of lying.
  hint(t) {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key}  commands` : "commands";
  }

  init(_props, cx) {
    this.data = null;
    this.last = 0;
    cx.timer.every(120000, (cx) => this.refresh(cx, true));
    this.refresh(cx, true);
    this.prev = new Map();
    cx.timer.every(4000, (cx) => this.pollProcs(cx));
    this.pollProcs(cx);
    // The Sessions dialog's refresh button bumps shared "procs.refresh"; poll again right away.
    this.seenRefresh = shared("procs.refresh");
    cx.timer.every(500, (cx) => { const r = shared("procs.refresh"); if (r !== this.seenRefresh) { this.seenRefresh = r; this.pollProcs(cx); } });
    // The branch shown is the one of the space's fixed folder, the folder the
    // branch-switch popup acts on. Re-read every 3s, and right after a switch.
    this.branch = null;
    this.seenSwitch = shared("branch.switched");
    cx.timer.every(3000, (cx) => this.pollBranch(cx));
    cx.timer.every(500, (cx) => { const s = shared("branch.switched"); const k = spaces().find(x => x.active)?.id; if (s !== this.seenSwitch || k !== this.branchSpace) { this.seenSwitch = s; this.pollBranch(cx); } });
    this.pollBranch(cx);
    cx.timer.every(3000, (cx) => { if (!this.psbusy) { this.psbusy = true; cx.spawn(async () => { try { await checkPostScripts(exec); } catch (e) { console.log("post-script", String(e)); } this.psbusy = false; }); } });
  }

  pollBranch(cx) {
    if (this.bbusy) return;
    const space = spaces().find(s => s.active);
    const folder = spaceFolder(space);
    this.branchSpace = space?.id;
    if (!folder) { this.branch = null; return; }
    this.bbusy = true;
    cx.spawn(async (cx) => {
      let b = null;
      try {
        const r = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: folder, on: space.machine ?? undefined });
        if (r.code === 0) b = (r.stdout ?? "").trim() || null;
      } catch {}
      this.bbusy = false;
      if (b !== this.branch) { this.branch = b; cx.notify(); }
    });
  }

  pollProcs(cx) {
    if (this.pbusy) return;
    this.pbusy = true;
    cx.spawn(async (cx) => {
      try {
        const d = await collect(exec);
        const now = new Map();
        for (const se of d.sessions) for (const it of se.items) now.set(it.pid, { it, se });
        // A task that ran for a while and is gone: tell the user it finished.
        const killed = shared("procs.killed") ?? [];
        for (const [pid, { it, se }] of this.prev) {
          if (!now.has(pid) && it.age >= 20 && !killed.includes(pid))
            notify({ title: "Process finished", body: `${it.cmd}\n${se.title} · ${se.where}`, level: "success",
              action: { name: "pane.focus", args: { pane: se.pane } } });
        }
        this.prev = now;
        setShared("procs", d);
      } catch (e) {
        console.log("procs failed", String(e?.message ?? e));
      }
      this.pbusy = false;
    });
  }

  // Data comes from quota-axi; hovering the bar asks it again (at most every 5s).
  refresh(cx, force) {
    if (this.busy || (!force && Date.now() - this.last < 30000)) return;
    this.busy = true;
    this.last = Date.now();
    cx.spawn(async (cx) => {
      try {
        const r = await exec("/bin/zsh", ["-lic", "quota-axi --json --max-age 60s"]);
        if (r.code && !r.stdout) throw new Error(`exit ${r.code}: ${(r.stderr ?? "").slice(0, 80)}`);
        this.err = null;
        const j = JSON.parse(r.stdout.slice(r.stdout.indexOf("{")));
        this.data = (j.providers ?? [])
          .filter(p => (p.state?.status === "fresh" || p.state?.status === "stale") && !p.notSetUp)
          .map(p => ({
            id: p.provider, label: p.provider, plan: p.plan ?? "", stale: p.state?.status === "stale",
            windows: (p.windows ?? []).filter(w => typeof w.percentRemaining === "number")
              .map(w => ({ label: w.label, kind: w.kind, percent: 100 - w.percentRemaining, reset: w.resetsAt })),
          }))
          .filter(p => p.windows.length);
      } catch (e) {
        this.err = String(e?.message ?? e).slice(0, 90);
      }
      this.busy = false;
      cx.notify();
    });
  }

  providers() {
    return this.data ?? [];
  }

  card(t, provs) {
    const color = (p) => (p >= 90 ? t.blocked : p >= 70 ? t.working : t.accent);
    return v_flex().w(270).gap(12).p(12).text_size(12).text_color(t.foreground)
      .child(div().font_semibold().child("Usage"))
      .when(provs.length === 0, el => el.child(div().text_color(t.muted).child("No data yet")))
      .children(provs.map(p => v_flex().gap(8)
        .child(h_flex().gap(6).items_center().child(image(`icons/${ICONS[p.id] ?? p.id}.svg`).size(13)).child(div().font_semibold().child(p.label)).child(div().text_color(t.dim).child(p.stale ? `${p.plan} · stale` : p.plan)))
        .children(p.windows.map(w => v_flex().gap(4)
          .child(h_flex().justify_between().child(div().child(w.label)).child(div().text_color(t.muted).child(`${Math.round(w.percent)}%`)))
          .child(div().h(5).w_full().rounded(3).bg(t.raised)
            .child(div().h(5).rounded(3).bg(color(w.percent)).w(Math.max(2, Math.min(100, w.percent)) * 2.46)))
          .when(Boolean(w.reset), el => el.child(div().text_size(11).text_color(t.dim).child(short(w.reset) ? `resets in ${short(w.reset)}` : "reset pending")))))));
  }

  procBadge(t) {
    const d = shared("procs");
    const tasks = (d?.sessions ?? []).flatMap(se => se.items);
    const all = tasks;
    const cpu = all.reduce((a, i) => a + i.cpu, 0);
    const mb = all.reduce((a, i) => a + i.rss, 0) / 1048576;
    return h_flex().id("procs-badge").gap(6).items_center().cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click(() => openOverlay({ mod: "processes", kind: "dialog", width: 920, height: 720 }))
      .child(svg("mods/workspace-chrome/layers.svg").size(13))
      .child(`${tasks.length} proc · ${cpu.toFixed(0)}% · ${mb >= 1024 ? (mb / 1024).toFixed(1) + "G" : mb.toFixed(0) + "M"}`);
  }

  render() {
    const t = theme();
    const provs = this.providers();
    const item = (p) => h_flex().gap(6).items_center()
      .child(image(`icons/${ICONS[p.id] ?? p.id}.svg`).size(13))
      .children((p.id === "claude" ? p.windows.filter(w => w.kind === "weekly") : [p.windows.reduce((a, b) => (b.percent > a.percent ? b : a))]).map(w => div().mr(4).child(`${Math.round(w.percent)}%${p.id === "claude" ? "" : " " + shortLabel(w.label)}${p.id === "claude" && w.reset ? " " + short(w.reset) : ""}`)));
    const usage = HoverCard.new("usage").anchor("bottom_right").open_delay(150)
      .trigger(h_flex().id("usage-trigger").gap(14).items_center().on_hover((hovered, cx) => { if (hovered) this.refresh(cx, false); })
        .child(div().text_color(t.dim).child("Used"))
        .children(provs.map(item))
        .when(Boolean(this.err), el => el.child(div().text_color(t.blocked).child(this.err))))
      .content(this.card(t, provs).bg(t.popover).border(1).border_color(t.border).rounded(8));
    const space = spaces().find(s => s.active);
    const list = agents();
    const needs = list.filter(a => a.status === "blocked").length;
    const label = (icon, text) => h_flex().gap(6).items_center().child(svg(`mods/workspace-chrome/${icon}.svg`).size(13)).child(text);
    return h_flex().size_full().px(14).gap(16).items_center().bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(label(space?.machine ? "server" : "monitor", space?.machine ?? "This computer"))
      .when(Boolean(this.branch), el => el.child(h_flex().id("branch-switch").cursor_pointer()
        .hover((s) => s.text_color(t.foreground))
        .on_click(() => openOverlay({ mod: "branch-switch", kind: "popup", width: 380, height: 420 }))
        .child(label("branch", this.branch))
        .child(svg("mods/workspace-chrome/chevron-down.svg").size(11).ml(3))))
      .child(h_flex().gap(6).items_center().child(div().size(6).rounded(3).bg(t.dim)).child(`${list.length} agents`)
        .when(needs > 0, el => el.child(div().text_color(t.blocked).child(`· ${needs} needs you`))))
      .child(this.procBadge(t))
      .child(usage)
      .child(div().flex_1())
      .child(div().id("palette").text_color(t.dim).on_click(() => run("app.palette")).child(this.hint(t)));
  }
}
