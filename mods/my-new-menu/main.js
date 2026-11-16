import { View, div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, spaces, panes, knownAgents, run, openOverlay, closeOverlay, props, window, keys, shared, setShared, notify } from "herdr";
import { spaceFolder } from "./space-folder.js";
import { projectOf, readSelection, scanLibrary, launchArgs } from "./project-skills.js";

function shortcut(name) {
  const k = keys().find(b => b.section === "global" && b.action === name);
  if (!k?.keys.trim()) return "";
  const mac = window()?.platform === "macos";
  const names = mac ? { ctrl: "⌃", alt: "⌥", shift: "⇧", cmd: "⌘", fn: "fn" } : { ctrl: "Ctrl", alt: "Alt", shift: "Shift", cmd: "Super", fn: "Fn" };
  const alias = { secondary: mac ? "cmd" : "ctrl", super: "cmd", win: "cmd" };
  return k.keys.trim().split(/\s+/).map(stroke => {
    const parts = stroke.split("-");
    let key = parts.pop();
    if (key === "") { key = "-"; parts.pop(); }
    const held = new Set(parts.map(m => alias[m.toLowerCase()] ?? m.toLowerCase()));
    if (/^[A-Z]$/.test(key)) held.add("shift");
    const label = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1).toLowerCase();
    return [...Object.keys(names).filter(m => held.has(m)).map(m => names[m]), label].join(mac ? "" : "+");
  }).join(" ");
}

export default class NewMenu extends View {
  init(_props, cx) {
    this.agents = [];
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.spawn(async cx => {
      try { this.agents = await knownAgents({ on: spaces().find(s => s.active)?.machine }); }
      catch { this.failed = true; }
      // A digit typed before the list arrived (cmd-n then 1 quickly) still starts that agent.
      if (this.pending) this.launch(this.pending);
      // Per-project skills (Project Settings > Skills): how many valid items this folder's project has on.
      const space = spaces().find(s => s.active);
      if (space && !space.machine && this.claude()) {
        try {
          this.project = await projectOf(spaceFolder(space));
          if (this.project) {
            const [sel, lib] = await Promise.all([readSelection(this.project), scanLibrary()]);
            const ok = (list, names) => list.filter(x => !x.invalid && names.includes(x.name)).length;
            this.skillCount = ok(lib.skills, sel.skills);
            this.mcpCount = ok(lib.mcp, sel.mcp);
          }
        } catch { this.project = null; }
      }
      // my-tabs sizes the next popup from this count, so the frame fits the rows exactly.
      const rows = this.choices().length + (this.project ? 1 : 0);
      if (rows && shared("new-menu.rows") !== rows) setShared("new-menu.rows", rows);
      cx.notify();
    });
  }
  claude() { return this.agents.find(a => a.key === "claude" && a.installed); }
  // "Claude · N skills": rebuild the project's bundle, then start Claude with --plugin-dir. The popup stays
  // open until the argv is ready (closing it first would drop this view mid-way).
  launchSkills(cx) {
    const claude = this.claude(), project = this.project;
    if (!claude || !project || this.starting) return;
    this.starting = true;
    cx.notify();
    cx.spawn(async cx => {
      const space = spaces().find(s => s.active);
      let res;
      try { res = await launchArgs(project, claude.run); }
      catch (e) { res = { argv: null, skipped: [{ name: "bundle", reason: String(e?.message ?? e) }] }; }
      if (res.skipped.length) notify({ level: "warning", title: "Skills skipped", body: res.skipped.map(x => `${x.name}: ${x.reason}`).join(", ") });
      if (!res.argv) {
        notify({ level: "warning", title: "No project skills on", body: "Turn skills on in Project Settings > Skills." });
        this.starting = false;
        cx.notify();
        return;
      }
      closeOverlay(props().overlay);
      run("tab.new", { name: claude.name, space: space?.id, folder: spaceFolder(space) ?? undefined, argv: res.argv });
    });
  }
  openSkillsTab() {
    const space = spaces().find(s => s.active);
    setShared("project-settings.tab", { tab: "skills", folder: spaceFolder(space) ?? null, at: Date.now() });
    // Project Settings is a dialog: open it unless it is open already (mod.open again would close it).
    if (shared("project-settings.dialog") == null) run("mod.open", { name: "project-settings" });
  }
  choices() {
    const installed = this.agents.filter(a => a.installed);
    return [...installed, ...this.agents.filter(a => !a.installed).slice(0, 2)];
  }
  launch(n) {
    this.pending = null;
    const agent = this.agents.filter(a => a.installed)[n - 1];
    if (!agent) return;
    const space = spaces().find(s => s.active);
    closeOverlay(props().overlay);
    run("tab.new", { name: agent.name, space: space?.id, folder: spaceFolder(space) ?? undefined, argv: agent.run });
  }
  row(id, icon, name, action, hint = "", enabled = true, keepOpen = false) {
    const t = theme();
    return h_flex().id(id).h(31).px(9).gap(10).rounded(7).items_center().flex_none()
      .text_color(enabled ? t.foreground : t.dim).when(enabled, el => el.hover(s => s.bg(t.selected)))
      .on_click((_e, cx) => { if (!enabled) return; if (!keepOpen) closeOverlay(props().overlay); action(cx); })
      .child(icon).child(div().flex_1().child(name)).child(div().text_size(11).text_color(t.dim).child(hint));
  }
  render() {
    const t = theme();
    const space = spaces().find(s => s.active);
    const installed = this.agents.filter(a => a.installed);
    const choices = this.choices();
    const claude = this.claude();
    const n = (this.skillCount ?? 0) + (this.mcpCount ?? 0);
    const skillsLabel = this.starting ? "Starting Claude…" : n
      ? `${claude?.name ?? "Claude"} · ${this.skillCount} skill${this.skillCount === 1 ? "" : "s"}${this.mcpCount ? ` · ${this.mcpCount} MCP` : ""}`
      : "Project skills…";
    // Padding 10, Terminal + btop 62, label 28, divider 11, five actions 155, 31 per agent.
    // my-tabs opens the popup at the same height (from "new-menu.rows"), so the frame fits.
    return v_flex().min_h(0).w_full().h(Math.min(266 + Math.max(1, choices.length) * 31 + (this.project ? 31 : 0), 640)).bg(t.popover).p(5).text_size(12.8)
      .id("new-menu").track_focus(this.handle)
      .on_key_down((e) => {
        if (e.modifiers.control || e.modifiers.platform || e.modifiers.alt) return;
        if (!/^[1-9]$/.test(e.key)) return;
        if (this.agents.length === 0 && !this.failed) { this.pending = Number(e.key); return; }
        this.launch(Number(e.key));
      })
      .child(this.row("terminal", svg("icons/shell.svg").size(14), "Terminal", () => run("tab.new", { space: space?.id, folder: spaceFolder(space) ?? undefined }), shortcut("tab.new")))
      .child(this.row("btop", svg("icons/htop.svg").size(14), "btop", () => run("tab.new", { name: "btop", space: space?.id, folder: spaceFolder(space) ?? undefined, argv: ["btop"] }), "", Boolean(space)))
      .child(div().h(28).flex_none().flex().items_end().px(9).pb(6).text_size(11).text_color(t.dim).child("Start an agent"))
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar()
        .children(choices.map((a, i) => this.row(a.key, a.tint ? svg(a.icon).size(14).text_color(t.foreground) : image(a.icon).size(14), a.name,
          () => run("tab.new", { name: a.name, space: space?.id, folder: spaceFolder(space) ?? undefined, argv: a.run }), a.installed ? (i < 9 ? String(i + 1) : "") : "not installed", a.installed)))
        .when(this.agents.length === 0, el => el.child(div().px(9).py(6).text_color(t.dim).child(this.failed ? "Could not load agents" : "Checking installed agents…"))))
      .when(Boolean(this.project && claude), el => el.child(this.row("claude-skills",
        claude.tint ? svg(claude.icon).size(14).text_color(t.foreground) : image(claude.icon).size(14), skillsLabel,
        n ? (cx) => this.launchSkills(cx) : () => this.openSkillsTab(), "", !this.starting, Boolean(n))))
      .child(div().h(1).flex_none().mx(4).my(5).bg(t.border))
      .child(this.row("vscode", svg("mods/open-vscode/vscode.svg").size(14), "Open in VS Code", () => run("mod.open", { name: "open-vscode" }), "", Boolean(space)))
      .child(this.row("zed", svg("mods/open-zed/zed.svg").size(14), "Open in Zed", () => run("mod.open", { name: "open-zed" }), shortcut("mod.open:open-zed"), Boolean(space)))
      .child(this.row("space", div().w(14).child("+"), "New space", () => run("space.new"), shortcut("space.new")))
      .child(this.row("worktree", svg("mods/workspace-chrome/branch.svg").size(14), "New worktree…", () => openOverlay({ mod: "my-worktree", kind: "dialog", width: 640, height: 560, props: { space: space?.id, folder: spaceFolder(space) ?? undefined, action: "new" } }), "", Boolean(space)))
      .child(this.row("worktree-open", svg("mods/workspace-chrome/branch.svg").size(14), "Open worktree\u2026", () => openOverlay({ mod: "my-worktree", kind: "dialog", width: 560, height: 480, props: { space: space?.id, folder: spaceFolder(space) ?? undefined, action: "open" } }), "", Boolean(space)));
  }
}
