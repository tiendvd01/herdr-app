import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, panes, focused, exec, run, openOverlay, nextCommand, theme, window, shared, layout, settings } from "herdr";
import { activePlace } from "./space-folder.js";
import { btn } from "./panel-ui.js";

// Same place the Changes panel reads: the focused pane's folder, on its machine.
function location() {
  const { cwd, on } = activePlace();
  return { cwd, on };
}
const READ = ["--no-optional-locks", "-c", "core.fsmonitor=false", "-c", "diff.autoRefreshIndex=false"];

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class Tabs extends View {
  init(_props, cx) {
    this.pressed = null;
    this.diff = null;
    cx.timer.every(3000, (cx) => this.refreshDiff(cx));
    this.refreshDiff(cx);
    this.panels = JSON.parse(localStorage.getItem("panels") ?? "{}");
    // keys.json "my-tabs.new-menu" (cmd-n): open the new-tab menu under the + button.
    cx.spawn(async () => {
      for (;;) { if (await nextCommand() === "new-menu") this.openNewMenu(); }
    });
  }

  // The popup under the + button, its right edge on the button's. The tab bar ends at the
  // window's right edge, so the button sits left of the measured trailing buttons.
  openNewMenu() {
    // my-new-menu's rows: padding 10, Terminal + btop 62, label 28, divider 11, five actions 155,
    // plus 31 per agent (it shares the count once it has looked agents up).
    const rows = Number(shared("new-menu.rows")) || 8;
    const width = 250, height = Math.min(266 + rows * 31, 640);
    const plusRight = (this.viewW ?? 0) - 10 - (this.trailW ?? 0) - 3;
    const at = this.viewW ? { x: Math.max(8, plusRight - width), y: (this.barH ?? 37) + 2 } : undefined;
    openOverlay({ mod: "my-new-menu", kind: "popup", width, height, at });
  }

  // Lines added/removed against HEAD, shown on the Changes button.
  refreshDiff(cx, rendering = false) {
    if (this.diffLoading) return;
    const { cwd, on } = location(), key = JSON.stringify({ cwd, on });
    if (key !== this.diffKey) { this.diffKey = key; this.diff = null; if (!rendering) cx.notify(); }
    if (!cwd) return;
    this.diffLoading = true;
    cx.spawn(async (cx) => {
      try {
        let r = await exec("git", [...READ, "diff", "HEAD", "--numstat"], { cwd, on });
        if (r.code !== 0) r = await exec("git", [...READ, "diff", "--numstat"], { cwd, on });
        let add = 0, del = 0;
        if (r.code === 0) for (const line of r.stdout.split("\n")) {
          const [a, d] = line.split("\t");
          add += Number(a) || 0; del += Number(d) || 0;
        }
        const next = r.code === 0 ? { add, del } : null;
        if (key === this.diffKey && JSON.stringify(next) !== JSON.stringify(this.diff)) { this.diff = next; cx.notify(); }
      } catch { /* machine unreachable: keep the last numbers */ }
      finally { this.diffLoading = false; }
    });
  }

  // The side panel is remembered per space: switching shows that space's choice
  // (closed if it never had one), and opening or closing it records it.
  syncPanel(space, panel, body, enabled) {
    if (!space || !panel) return;
    const now = panel.hidden ? null : body?.active ?? null;
    if (space.id !== this.space) {
      const first = this.space === undefined;
      this.space = space.id; this.pending = null;
      if (!(first && !(space.id in this.panels))) {
        const stored = this.panels[space.id] ?? null, want = enabled.includes(stored) ? stored : null;
        if (want !== now) {
          this.pending = { want, until: Date.now() + 1000 };
          if (want) { run("layout.select", { stack: "panel-body", child: want }); run("layout.show", { id: "panel" }); }
          else run("layout.hide", { id: "panel" });
          return;
        }
      }
    }
    // Until the restore lands (or something else won), the old state isn't a choice.
    if (this.pending) {
      if (this.pending.want !== now && Date.now() < this.pending.until) return;
      this.pending = null;
    }
    if (this.panels[space.id] === now) return;
    this.panels[space.id] = now;
    localStorage.setItem("panels", JSON.stringify(this.panels));
  }

  render(cx) {
    const t = theme();
    this.viewW = globalThis.window?.viewport_size?.().width;
    const space = spaces().find(p => p.active);
    const shown = space?.tabs ?? [];
    const stop = (_e, cx) => cx.stop_propagation();
    // Kit icon buttons; the press must not start a window drag (the bar is a drag area).
    const button = (id, label, action, tip) => btn(id, { kind: "icon", ...(typeof label === "string" && !label.includes("/") ? { label } : { icon: label }), tip, action })
      .on_mouse_down("left", stop);
    const item = (c, i) => {
      const program = panes().find(p => p.tab === c.id && p.program?.agent)?.program ?? panes().find(p => p.tab === c.id)?.program;
      const name = /^tb\d+$/.test(c.name) ? program?.name ?? "Terminal" : c.name;
      return h_flex().id(`tab-${c.id}`).h(29).px(10).gap(7).rounded(7).items_center().flex_none().text_size(12.8)
        .border(1).border_color(c.active ? t.border : t.chrome).bg(c.active ? t.raised : t.chrome).text_color(c.active ? t.foreground : t.muted)
        .hover(s => s.bg(t.hover))
        .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.pressed = i; if (e.click_count === 2) run("tab.rename", { id: c.id }); })
        .on_mouse_up("left", () => {
          const from = this.pressed; this.pressed = null;
          if (from !== null && from !== i) run("tab.move", { id: shown[from].id, index: space.tabs.findIndex(x => x.id === c.id) + 1 });
          else run("tab.select", { id: c.id });
        })
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); openOverlay({ mod: "menu", kind: "popup", width: 200, props: { tab: "tab", target: { id: c.id, space: space.id } } }); })
        .when(Boolean(program?.icon), el => el.child(program.tint ? svg(program.icon).size(14).text_color(t.muted) : image(program.icon).size(14)))
        .child(div().max_w(170).truncate().child(c.zoomed ? `${name} Z` : name))
        .when(c.status === "working", el => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900)))
        .when(c.status === "blocked" || c.status === "done", el => el.child(div().size(6).rounded(3).bg(t[c.status])))
        .when(c.active, el => el.child(div().id(`close-${c.id}`).text_color(t.dim).on_mouse_down("left", stop).on_click((_e, cx) => { cx.stop_propagation(); run("tab.close", { id: c.id }); }).child(svg("mods/pane/close.svg").size(12))));
    };
    const root = layout(), sidebar = find(root, "sidebar"), w = window();
    // Old saved rails and a dragged-narrow sidebar can be smaller than the window buttons.
    const lightsPadding = w?.platform === "macos" && w.titlebar === "none" && !w.fullscreen && root?.traffic_lights
      ? Math.max(10, (root.traffic_lights[0] + 64) / settings().zoom - (sidebar?.hidden ? 0 : sidebar?.size?.px ?? 0))
      : 10;
    const panel = find(root, "panel"), body = find(root, "panel-body");
    const enabled = [...(shared("workspace.panels") ?? ["files", "changes"]), "issues"];
    // Changes, Git and Pull requests are dialogs (reviewer, git-graph, pr-flow), not children of the right panel stack;
    // a space that remembered "graph" or "prs" as its panel falls back to a hidden panel.
    this.syncPanel(space, panel, body, enabled.filter(id => id !== "changes"));
    if (JSON.stringify(location()) !== this.diffKey) this.refreshDiff(cx, true);
    const d = this.diff;
    const counts = d && (d.add || d.del)
      ? h_flex().gap(4).text_size(11.5).font_semibold()
        .when(d.add > 0, el => el.child(div().text_color(t.ansi2).child(`+${d.add}`)))
        .when(d.del > 0, el => el.child(div().text_color(t.ansi1).child(`-${d.del}`)))
      : null;
    const panelButton = (id, label, icon, extra, tip) => {
      const on = panel && !panel.hidden && body?.active === id;
      return btn(`panel-${id}`, { kind: "icon", icon, extra, on, tip: label, action: () => {
        if (on) run("layout.hide", { id: "panel" });
        else { run("layout.select", { stack: "panel-body", child: id }); run("layout.show", { id: "panel" }); }
      } }).on_mouse_down("left", stop);
    };
    // Changes opens the reviewer as a dialog; shared "reviewer.dialog" holds its overlay id while open.
    const changesOpen = shared("reviewer.dialog") != null;
    const changesButton = btn("panel-changes", { kind: "icon", icon: "mods/changes/changes.svg", extra: counts, on: changesOpen, tip: "Changes  ⌘⇧G",
      action: () => run("mod.open", { name: "reviewer" }) }).on_mouse_down("left", stop);
    // A mod opened as a dialog by mod.open (again: closes it); shared "<mod>.dialog" holds its overlay id while open.
    const dialogButton = (id, mod, label, icon) =>
      btn(`panel-${id}`, { kind: "icon", icon, on: shared(`${mod}.dialog`) != null, tip: label, action: () => run("mod.open", { name: mod }) })
        .on_mouse_down("left", stop);
    return h_flex().size_full().min_w(0).px(10).pl(lightsPadding).gap(3).items_center().bg(t.chrome).border_b(1).border_color(t.border)
      .id("tab-bar").on_size_change(size => { this.barH = size.height; })
      .on_mouse_up("left", () => { this.pressed = null; })
      .on_scroll_wheel(e => { if (Math.abs(e.delta.y) >= 1) run(e.delta.y > 0 ? "tab.prev" : "tab.next"); })
      .child(h_flex().id("tab-scroll").flex_1().min_w(0).h_full().items_center().gap(3).overflow_x_scrollbar().children(shown.map(item)))
      .child(button("tab-new", "+", () => this.openNewMenu(), "New tab"))
      .child(h_flex().id("tab-trailing").flex_none().gap(3).items_center().on_size_change(size => { this.trailW = size.width; })
      .when(enabled.includes("files"), el => el.child(panelButton("files", "Files", "mods/files/file.svg", null, "browse the space's folder")))
      .when(enabled.includes("changes"), el => el.child(changesButton))
      .child(panelButton("issues", "Issues", "mods/issues/issue.svg", null, "GitHub issues of this repo"))
      .child(dialogButton("graph", "git-graph", "Git", "mods/git-graph/icons/graph.svg"))
      .child(dialogButton("prs", "pr-flow", "Pull requests", "mods/my-tabs/pull-request.svg"))
      .when(w?.buttons, el => el.child(button("minimize", w.platform === "windows" ? "mods/my-tabs/win-min.svg" : "−", () => run("window.minimize"), "Minimize"))
        .child(button("maximize", w.platform === "windows" ? `mods/my-tabs/${w.maximized ? "win-restore" : "win-max"}.svg` : "□", () => run("window.maximize"), "Maximize"))
        .child(button("close-window", w.platform === "windows" ? "mods/my-tabs/win-close.svg" : "mods/pane/close.svg", () => run("window.close"), "Close window"))));
  }
}
