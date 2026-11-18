// Threads (spec 031): Claude Code's saved conversations of the space's folder, newest first, in the right
// side panel. Click one to resume it in a new tab of this space (project skills attached like the + menu's
// Claude row); a thread already live in a terminal is marked and clicking focuses that terminal.
// Logic: claude-threads.js (synced from lib/). Nothing is written except an explicit, confirmed delete.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, Scrollbar, v_virtual_list } from "gpui-base";
import { exec, hc, home, theme, agents, knownAgents, run, notify, readTextFile, layout } from "herdr";
import { ThreadCache, threadsDir, liveMap, filterThreads, deleteThread, ago } from "./claude-threads.js";
import { agentArgv } from "./project-skills.js";
import { activePlace } from "./space-folder.js";
import { btn, icon, inputFrame, headerRow, emptyState, UI } from "./panel-ui.js";

const ROW_H = 54, REFRESH = 4000, CLAUDE = "icons/claude.svg";
const base = (p) => String(p ?? "").replace(/\/+$/, "").split("/").pop() || p;

function find(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const c of node.children ?? []) { const f = find(c, id); if (f) return f; }
  return null;
}
// The panel shows Threads right now.
function shown() {
  const root = layout(), panel = find(root, "panel"), body = find(root, "panel-body");
  return Boolean(panel && !panel.hidden && body?.active === "threads");
}

export default class Threads extends View {
  init(_props, cx) {
    try { this.saved = JSON.parse(localStorage.getItem("spaces") ?? "{}"); } catch { this.saved = {}; } // space id -> { query }
    this.cache = new ThreadCache();
    this.folder = null; this.list = []; this.loading = false; this.error = null; this.loadedFor = null;
    this.live = new Map(); // session id -> terminal address
    this.starting = new Map(); // thread id -> time a resume was asked (no double start)
    this.confirm = null; // thread id waiting for the second delete click
    this.cur = undefined; // space whose query is in the box
    this.search = InputState.new({ placeholder: "Search threads…" });
    this.search.on("change", (_e, cx) => {
      if (!this.cur) return;
      const q = this.search.value();
      if ((this.saved[this.cur]?.query ?? "") === q) return;
      this.saved[this.cur] = { ...(this.saved[this.cur] ?? {}), query: q };
      try { localStorage.setItem("spaces", JSON.stringify(this.saved)); } catch {}
      cx.notify();
    });
    cx.timer.every(REFRESH, (cx) => { if (shown()) this.reload(cx); });
  }

  // Lists the folder's threads and which are live; only one load at a time.
  reload(cx, folder = this.folder) {
    if (this.loading || !folder) return;
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        const list = await this.cache.load(threadsDir(home(), folder), exec);
        const live = await this.readLive();
        if (folder === this.folder) { this.list = list; this.live = live; this.error = null; this.loadedFor = folder; }
      } catch (e) {
        if (folder === this.folder) { this.error = String(e?.message ?? e).slice(0, 200); this.loadedFor = folder; }
      }
      this.loading = false;
      const now = Date.now();
      for (const [id, at] of this.starting) if (this.live.has(id) || now - at > 15000) this.starting.delete(id);
      cx.notify();
    });
  }

  // Claude terminals on this machine: foreground pid (Claude itself) -> ~/.claude/sessions/<pid>.json.
  async readLive() {
    const terms = agents().filter((a) => (a.program?.key === "claude" || a.app === "claude-code") && !a.address.includes("/"));
    const pids = await Promise.all(terms.map(async (a) => {
      try {
        const r = await hc(["get", a.address, "--json"]);
        return { address: a.address, pid: r.code === 0 ? JSON.parse(r.stdout)?.foreground?.pid ?? null : null };
      } catch { return { address: a.address, pid: null }; }
    }));
    return liveMap(pids, (p) => readTextFile(p), home());
  }

  async claudeArgv(folder) {
    let agent = null;
    try { agent = (await knownAgents()).find((a) => a.key === "claude") ?? null; } catch {}
    if (agent && !agent.installed) throw new Error("Claude Code is not installed (not found in your shell).");
    return agentArgv(agent ?? { key: "claude", name: "Claude Code", run: ["claude"] }, folder, null);
  }

  open(t, space, cx) {
    const address = this.live.get(t.id);
    if (address) { run("agent.focus", { terminal: address }); return; }
    if (this.starting.has(t.id)) return;
    this.starting.set(t.id, Date.now());
    const folder = t.cwd || this.folder;
    cx.spawn(async (cx) => {
      try {
        const argv = [...await this.claudeArgv(folder), "--resume", t.id];
        run("tab.new", { name: t.title.slice(0, 28), space: space?.id, folder, argv });
      } catch (e) {
        this.starting.delete(t.id);
        notify({ level: "warning", title: "Could not resume thread", body: String(e?.message ?? e).slice(0, 300) });
      }
      cx.notify();
    });
  }

  newThread(space, cx) {
    const folder = this.folder;
    cx.spawn(async () => {
      try { run("tab.new", { name: "Claude", space: space?.id, folder, argv: await this.claudeArgv(folder) }); }
      catch (e) { notify({ level: "warning", title: "Could not start Claude", body: String(e?.message ?? e).slice(0, 300) }); }
    });
  }

  remove(t, cx) {
    if (this.live.has(t.id)) return;
    if (this.confirm !== t.id) {
      this.confirm = t.id;
      this.confirmTimer?.cancel();
      this.confirmTimer = cx.timer.after(4000, (cx) => { this.confirm = null; cx.notify(); });
      cx.notify();
      return;
    }
    this.confirm = null;
    const dir = threadsDir(home(), this.folder);
    cx.spawn(async (cx) => {
      try { await deleteThread(dir, t.id, exec); this.list = this.list.filter((x) => x.id !== t.id); }
      catch (e) { notify({ level: "error", title: "Thread not deleted", body: String(e?.message ?? e).slice(0, 300) }); }
      cx.notify();
      this.reload(cx);
    });
  }

  render(cx) {
    const t = theme(), place = activePlace(), space = place.space;
    // Space switch: its own search text in the box.
    if ((space?.id ?? null) !== this.cur) {
      this.cur = space?.id ?? null;
      const q = this.saved[this.cur]?.query ?? "";
      if (this.search.value() !== q) this.search.set_value(q);
      this.confirm = null;
    }
    const remote = Boolean(place.on), folder = remote ? null : place.cwd;
    if (folder !== this.folder) {
      this.folder = folder; this.list = []; this.live = new Map(); this.error = null; this.loadedFor = null;
      if (folder) this.reload(cx, folder);
    }
    const root = v_flex().id("threads").size_full()
      .on_key_down((e, cx) => { if (e.key === "escape" && this.confirm) { this.confirm = null; cx.notify(); } }).min_h(0).rounded(10).overflow_hidden()
      .bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(UI.text.body);
    const query = this.search.value().trim(), rows = filterThreads(this.list, query);
    const count = query ? `${rows.length} / ${this.list.length}` : String(this.list.length);
    const header = headerRow()
      .child(div().flex_none().font_semibold().child("Threads"))
      .when(this.list.length > 0, (e) => e.child(div().h(20).px(7).flex().flex_none().items_center().rounded(UI.radius.md)
        .border_1().border_color(t.border).text_size(UI.text.caption).text_color(t.muted).child(count)))
      .when(Boolean(folder), (e) => e.child(div().min_w(0).truncate().text_size(UI.text.small).text_color(t.dim).tooltip(folder).child(base(folder))))
      .child(div().flex_1())
      .when(Boolean(folder), (e) => e
        .child(btn("threads-new", { kind: "secondary", size: "sm", icon: CLAUDE, label: "New", tip: "Start a new Claude thread in this folder", action: (_e, cx) => this.newThread(space, cx) }))
        .child(btn("threads-reload", { kind: "icon", size: "sm", icon: "refresh", busy: this.loading && this.loadedFor === folder, tip: "Reload", action: (_e, cx) => this.reload(cx) })));

    if (remote) return root.child(header).child(emptyState(CLAUDE, "Local spaces only", "Threads are listed for spaces on this computer."));
    if (!folder) return root.child(header).child(emptyState(CLAUDE, "No folder", "Open a terminal in this space to see its threads."));
    if (this.error) return root.child(header).child(emptyState(CLAUDE, "Could not read threads", this.error));
    if (this.loadedFor !== folder) return root.child(header).child(v_flex().flex_1().items_center().justify_center().gap(8)
      .child(icon("spinner", 18).text_color(t.dim).spin(UI.motion.spin)).child(div().text_size(UI.text.small).text_color(t.dim).child("Reading threads…")));

    const searchBar = h_flex().flex_none().px(10).py(8).border_b(1).border_color(t.border)
      .child(inputFrame(false).id("threads-search").flex_1().min_w(0).cursor_text()
        .child(Input.new(this.search).h_full().w_full().text_size(UI.text.small).text_color(t.foreground)))
      .when(Boolean(query), (e) => e.child(div().w(6)).child(btn("threads-clear", { kind: "icon", size: "sm", icon: "close", tip: "Clear search", action: (_e, cx) => { this.search.set_value(""); cx.notify(); } })));

    if (this.list.length === 0) return root.child(header).child(v_flex().flex_1().items_center().justify_center()
      .child(emptyState(CLAUDE, "No threads yet", `Claude has no saved threads in ${base(folder)}.`).h_auto())
      .child(btn("threads-empty-new", { kind: "primary", icon: CLAUDE, label: "New thread", action: (_e, cx) => this.newThread(space, cx) })));
    if (rows.length === 0) return root.child(header).child(searchBar).child(v_flex().flex_1().items_center().justify_center()
      .child(emptyState("close", "No thread matches", `Nothing has "${query}" in its title or prompts.`).h_auto())
      .child(btn("threads-empty-clear", { kind: "secondary", label: "Clear search", action: (_e, cx) => { this.search.set_value(""); cx.notify(); } })));

    // A virtual list's rows take no handlers: the list's on_item_click opens (or, on a row armed for delete,
    // deletes), its right-click arms a delete. Anything else, or 4 s, disarms.
    const row = (th) => {
      const live = this.live.has(th.id), starting = this.starting.has(th.id), confirming = this.confirm === th.id;
      const meta = confirming ? "Click to delete this thread · Esc or wait to cancel"
        : [`${th.prompts} prompt${th.prompts === 1 ? "" : "s"}`, th.branch, th.lastPrompt && th.lastPrompt !== th.title ? th.lastPrompt : null].filter(Boolean).join(" · ");
      return v_flex().id(`th-${th.id}`).w_full().h(ROW_H).flex_none().px(8).py(7).gap(3).rounded(UI.radius.lg).overflow_hidden()
        .cursor_pointer().hover((st) => st.bg(t.hover))
        .when(confirming, (e) => e.bg(`${t.ansi1}1f`).border_1().border_color(`${t.ansi1}66`))
        .child(h_flex().gap(8).items_center()
          .child(div().w(14).flex_none().flex().items_center().justify_center()
            .child(live ? div().size(8).rounded_full().bg(t.ansi2).loop("opacity", { from: 0.45, to: 1, period: 1600 })
              : starting ? icon("spinner", 12).text_color(t.dim).spin(UI.motion.spin)
              : confirming ? icon("close", 12).text_color(t.ansi1)
              : icon(CLAUDE, 12).text_color(t.dim)))
          .child(div().flex_1().min_w(0).truncate().text_size(12.5).when(live, (e) => e.font_medium()).child(th.title))
          .when(live, (e) => e.child(div().flex_none().text_size(UI.text.caption).text_color(t.ansi2).child("running")))
          .child(div().flex_none().text_size(UI.text.caption).text_color(t.dim).child(ago(th.mtime))))
        .child(div().pl(22).min_w(0).truncate().text_size(UI.text.caption).text_color(confirming ? t.ansi1 : t.dim).child(meta));
    };
    const byId = (key) => rows.find((r) => r.id === key);
    const list = div().flex_1().min_h(0).relative().p(6)
      .child(v_virtual_list("threads-list", rows.length, ROW_H, (i) => rows[i]?.id ?? String(i),
        (range) => Array.from({ length: range.end - range.start }, (_x, k) => row(rows[range.start + k])))
        .on_item_click((key, cx) => {
          const th = byId(key); if (!th) return;
          if (this.confirm === key) this.remove(th, cx);
          else { this.confirm = null; this.open(th, space, cx); }
          cx.notify();
        })
        .on_item_secondary_click((key, _ev, cx) => { const th = byId(key); if (th && !this.live.has(key)) this.remove(th, cx); })
        .size_full())
      .child(Scrollbar.vertical("threads-list").viewport_from_layout().absolute().inset_0());
    return root.child(header).child(searchBar).child(list);
  }
}
