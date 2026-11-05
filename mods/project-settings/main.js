// Project Settings page (content area): per git project, the worktree setup
// script ~/.config/herdr-app/projects/<repo>/post-create.sh, run in every new worktree of the repo
// (the watcher lives in status-usage/postscripts.js).
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, EditorState, Editor } from "gpui-base";
import { theme, spaces, exec, readTextFile, writeTextFile, home, settings, run, terminals, panes } from "herdr";

const TEMPLATE = `#!/bin/sh
# Runs once in each new worktree of this project (cwd = the worktree).
# Example:
# cp "$(git rev-parse --git-common-dir)/../.env" .env
# npm install
`;

const slug = (main) => main.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
const scriptFile = (home, main) => `${home}/.config/herdr-app/projects/${slug(main)}/post-create.sh`;

async function repoOf(folder) {
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder });
  if (r.code !== 0) return null;
  const common = r.stdout.trim();
  const main = common.endsWith("/.git") ? common.slice(0, -5) : common;
  return { main, name: main.split("/").pop(), file: scriptFile(home(), main), legacy: `${main}/.herdr/post-create.sh` };
}

// Listening TCP ports per worktree of a repo: lsof lists the listeners, the listener's cwd picks the worktree.
async function loadPorts(r) {
  const wl = await exec("git", ["worktree", "list", "--porcelain"], { cwd: r.main });
  const trees = [];
  for (const blk of wl.stdout.split("\n\n")) {
    const path = blk.match(/^worktree (.+)$/m)?.[1];
    if (!path) continue;
    const br = blk.match(/^branch refs\/heads\/(.+)$/m)?.[1];
    trees.push({ path, branch: br ?? "(detached)", main: path === r.main, items: [] });
  }
  const l = await exec("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN", "-Fpcn"]);
  const ls = [];
  let cur = null;
  for (const line of l.stdout.split("\n")) {
    const k = line[0], v = line.slice(1);
    if (k === "p") cur = { pid: +v, cmd: "", port: 0 };
    else if (k === "c" && cur) cur.cmd = v;
    else if (k === "n" && cur) { const port = +v.slice(v.lastIndexOf(":") + 1); if (port) ls.push({ ...cur, port }); }
  }
  const pids = [...new Set(ls.map((x) => x.pid))];
  const cwd = new Map();
  if (pids.length) {
    const c = await exec("lsof", ["-a", "-d", "cwd", "-p", pids.join(","), "-Fpn"]);
    let pid = 0;
    for (const line of c.stdout.split("\n")) {
      if (line[0] === "p") pid = +line.slice(1);
      else if (line[0] === "n") cwd.set(pid, line.slice(1));
    }
  }
  const args = new Map();
  if (pids.length) {
    const a = await exec("ps", ["-o", "pid=,args=", "-p", pids.join(",")]);
    for (const line of a.stdout.split("\n")) {
      const m = line.trim().match(/^(\d+)\s+(.*)$/);
      if (m) args.set(+m[1], m[2].replace(/\/Users\/[^/\s]+/g, "~"));
    }
  }
  // Which terminal runs it: the listener shares a controlling tty with that terminal's foreground process.
  const tty = new Map();
  const pt = await exec("ps", ["-axo", "pid=,tty="]);
  for (const line of pt.stdout.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(\S+)$/);
    if (m && m[2] !== "??") tty.set(+m[1], m[2]);
  }
  const byTty = new Map();
  for (const tm of terminals()) {
    const p = tm.foreground?.pid;
    if (p && tty.has(p)) byTty.set(tty.get(p), tm.address);
  }
  const seen = new Set();
  for (const x of ls) {
    const dir = cwd.get(x.pid);
    const key = `${x.pid}:${x.port}`;
    if (!dir || seen.has(key)) continue;
    const t = trees.filter((w) => dir === w.path || dir.startsWith(w.path + "/")).sort((a, b) => b.path.length - a.path.length)[0];
    if (!t) continue;
    seen.add(key);
    t.items.push({ ...x, terminal: byTty.get(tty.get(x.pid)) ?? null, args: args.get(x.pid) ?? x.cmd, dir, rel: dir === t.path ? "./" : dir.slice(t.path.length + 1) });
  }
  for (const t of trees) t.items.sort((a, b) => a.port - b.port);
  return trees.sort((a, b) => Number(b.main) - Number(a.main) || a.branch.localeCompare(b.branch));
}

export default class ProjectSettings extends View {
  init(_props, cx) {
    this.repos = [];
    this.sel = null;
    this.saved = null;
    this.msg = "";
    this.known = "";
    this.editor = EditorState.new({ language: "bash", value: "", line_numbers: true, font_family: settings().font_family });
    this.editor.on("change", (_e, cx) => { this.msg = ""; cx.notify(); });
    this.tab = "ports";
    this.trees = [];
    this.scan(cx);
    cx.timer.every(5000, (cx) => this.scan(cx));
    cx.timer.every(3000, (cx) => this.refreshPorts(cx));
  }

  refreshPorts(cx, force) {
    const r = this.sel;
    if (!r || (this.tab !== "ports" && !force) || this.busy) return;
    this.busy = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try { const t = await loadPorts(r); if (this.sel === r) this.trees = t; } catch (_e) {}
      this.busy = false;
      cx.notify();
    });
  }

  // Jump to the pane showing that terminal (its space and tab first).
  gotoTerminal(addr) {
    run("layout.select", { stack: "content", child: "main" });
    const p = panes().find((x) => x.terminal === addr);
    const sp = spaces().find((s) => s.tabs?.some((tb) => tb.id === p?.tab));
    if (sp) run("space.select", { id: sp.id });
    if (p) { run("tab.select", { id: p.tab }); run("pane.focus", { pane: p.pane }); }
    else run("pane.focus", { terminal: addr });
  }

  portsView(t) {
    const total = this.trees.reduce((a, w) => a + w.items.length, 0);
    const link = (id, label, fn, danger) => div().id(id).px(8).py(3).rounded(5).border(1).border_color(t.border).text_size(12)
      .text_color(danger ? t.blocked : t.foreground).cursor_pointer().hover((s) => s.bg(t.raised)).on_click(fn).child(label);
    return v_flex().id("ports-list").flex_1().min_h(0).overflow_y_scrollbar().gap(10)
      .child(h_flex().gap(8).items_center()
        .child(div().flex_1().text_color(t.muted).child(`${total} listening port${total === 1 ? "" : "s"} across ${this.trees.length} worktrees (auto-refresh 3s)`))
        .child(link("ports-reload", this.busy ? "Reloading…" : "Reload", (_e, cx) => this.refreshPorts(cx, true))))
      .children(this.trees.map((w) => v_flex().gap(6).p(10).rounded(8).border(1).border_color(t.border).bg(t.raised)
        .child(h_flex().gap(8).items_center()
          .child(div().size(7).rounded(4).bg(w.items.length ? t.done : t.dim))
          .child(div().font_semibold().child(w.branch))
          .when(w.main, (el) => el.child(div().text_size(11).text_color(t.dim).child("main")))
          .child(div().flex_1().min_w(0).truncate().text_size(11.5).text_color(t.dim).child(w.path.replace(home(), "~"))))
        .when(!w.items.length, (el) => el.child(div().text_size(12).text_color(t.dim).child("No port in use")))
        .children(w.items.map((x) => h_flex().gap(8).items_start().px(4)
          .child(div().w(64).font_semibold().child(String(x.port)))
          .child(v_flex().flex_1().min_w(0)
            .child(div().text_size(12).text_color(t.muted).child(`${x.args} · pid ${x.pid}`))
            .child(div().text_size(11.5).text_color(t.dim).child(`📁 ${x.rel}`)))
          .when(!!x.terminal, (el) => el.child(link(`go-${x.pid}-${x.port}`, "Terminal", () => this.gotoTerminal(x.terminal))))
          .child(link(`op-${x.pid}-${x.port}`, "Open", () => exec("open", [`http://localhost:${x.port}`])))
          .child(link(`kp-${x.pid}-${x.port}`, "Stop", (_e, cx) => { exec("kill", [String(x.pid)]); cx.notify(); }, true))))));
  }

  // Projects of the open spaces; the active space's project is picked first.
  scan(cx) {
    const key = JSON.stringify(spaces().map((s) => [s.id, s.folder, s.active]));
    if (key === this.known) return;
    this.known = key;
    cx.spawn(async (cx) => {
      const seen = new Map();
      let current = null;
      for (const s of spaces().filter((x) => !x.machine && x.folder)) {
        const r = await repoOf(s.folder).catch(() => null);
        if (!r) continue;
        if (!seen.has(r.main)) seen.set(r.main, r);
        if (s.active) current = r.main;
      }
      this.repos = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
      this.loaded = true;
      const keep = this.sel && seen.get(this.sel.main);
      if (!keep) { const r = seen.get(current) ?? this.repos[0]; if (r) await this.pick(r); }
      cx.notify();
    });
  }

  async pick(r) {
    this.sel = r;
    this.trees = [];
    loadPorts(r).then((t) => { if (this.sel === r) this.trees = t; }).catch(() => {});
    this.saved = await readTextFile(r.file).catch(() => null);
    const old = this.saved == null ? await readTextFile(r.legacy).catch(() => null) : null;
    this.editor.set_value(this.saved ?? old ?? TEMPLATE);
    this.msg = "";
  }

  save(cx) {
    const r = this.sel;
    if (!r) return;
    cx.spawn(async (cx) => {
      try {
        await exec("mkdir", ["-p", r.file.slice(0, r.file.lastIndexOf("/"))]);
        await writeTextFile(r.file, this.editor.value(), this.saved);
        this.saved = this.editor.value();
        this.msg = "Saved";
      } catch (e) { this.msg = `Failed: ${String(e?.message ?? e)}`; }
      cx.notify();
    });
  }

  render() {
    const t = theme();
    const dirty = this.sel && this.editor.value() !== (this.saved ?? TEMPLATE);
    const btn = (id, label, fn, primary) => div().id(id).px(12).py(5).rounded(6).border(1).border_color(t.border)
      .text_size(12).cursor_pointer().when(primary, (el) => el.bg(t.solid).text_color(t.solid_foreground))
      .hover((s) => s.bg(primary ? t.solid : t.raised)).on_click(fn).child(label);
    return h_flex().id("pset-root").size_full().min_h(0).bg(t.surface).text_color(t.foreground).text_size(13)
      .rounded(10).border(1).border_color(t.border).overflow_hidden()
      .child(v_flex().w(210).flex_none().h_full().bg(t.chrome).border_r(1).border_color(t.border)
        .child(h_flex().id("pset-back").h(40).px(14).gap(6).items_center().flex_none().cursor_pointer().text_size(12).text_color(t.muted)
          .hover((s) => s.text_color(t.foreground))
          .on_click(() => run("layout.select", { stack: "content", child: "main" }))
          .child(svg("mods/project-settings/chevron-left.svg").size(13).flex_none()).child("Back"))
        .child(div().h(26).px(14).flex().items_center().text_size(11.5).text_color(t.dim).child("Projects"))
        .child(v_flex().id("pset-repos").flex_1().min_h(0).overflow_y_scrollbar().px(8).pb(8).gap(2)
          .when(this.loaded && !this.repos.length, (el) => el.child(div().p(8).text_color(t.muted).child("No git projects open")))
          .children(this.repos.map((r) => div().id(`pr-${r.main}`).px(10).h(30).flex().items_center().rounded(7).truncate().cursor_pointer()
            .when(this.sel?.main === r.main, (el) => el.bg(t.selected))
            .hover((s) => s.bg(t.hover))
            .on_click((_e, cx) => cx.spawn(async (cx) => { await this.pick(r); cx.notify(); }))
            .child(r.name)))))
      .child(v_flex().flex_1().min_w(0).h_full().min_h(0).p(20).gap(14)
        .when(!this.sel, (el) => el.child(div().text_color(t.muted).child("Open a git project to configure it.")))
        .when(Boolean(this.sel), (el) => el
          .child(v_flex().gap(4)
            .child(div().text_size(18).font_semibold().child(this.sel.name))
            .child(div().text_size(11.5).text_color(t.dim).truncate().child(this.sel.main.replace(home(), "~"))))
          .child(h_flex().gap(4)
            .children([["ports", "Ports"], ["script", "Worktree script"]].map(([k, label]) => div().id(`tab-${k}`).px(12).py(4).rounded(6).cursor_pointer()
              .text_color(this.tab === k ? t.foreground : t.muted).when(this.tab === k, (x) => x.bg(t.selected)).hover((x) => x.bg(t.hover))
              .on_click((_e, cx) => { this.tab = k; cx.notify(); }).child(label))))
          .when(this.tab === "ports", (x) => x.child(this.portsView(t)))
          .when(this.tab === "script", (x) => x
          .child(v_flex().gap(4)
            .child(div().font_semibold().child("Worktree script"))
            .child(div().text_color(t.muted).child("Runs once in every new worktree of this project (cwd = the worktree). Saved to:"))
            .child(div().text_size(11.5).text_color(t.dim).truncate().child(this.sel.file.replace(home(), "~"))))
          .child(div().id("pset-editor").w_full().flex_1().min_h(120).border(1).border_color(t.border).rounded(8).overflow_hidden().child(Editor.new(this.editor).size_full()))
          .child(h_flex().gap(8).items_center()
            .child(div().flex_1().text_color(this.msg.startsWith("Failed") ? t.blocked : t.muted)
              .child(this.msg || (dirty ? "Unsaved changes" : this.saved == null ? "No script yet" : "")))
            .child(btn("pset-reset", "Revert", (_e, cx) => cx.spawn(async (cx) => { await this.pick(this.sel); cx.notify(); })))
            .child(btn("pset-save", "Save", (_e, cx) => this.save(cx), true))))));
  }
}
