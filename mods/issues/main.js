// Issues: a GitHub issue manager in the side panel.
// Each workspace (space) keeps its own state: repo, filters, search, the
// list and the open issue. Switching spaces swaps them.
// The repo comes from the focused terminal's folder (`gh repo view`), or one
// typed in the bar (kept per space). Clicking an issue shows its body and
// comments as markdown (TextView.markdown, native: mods have no web view).
//
// render() never calls cx.notify(): work it needs (detect the repo, load
// the list, swap the space) is spawned and notifies when it finishes.
import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, TextView } from "gpui-base";
import { exec, theme, focused, spaces, appHome, notify, settings, props, openOverlay } from "herdr";
import { Viewer } from "./viewer.js";
import * as fs from "fs/promises";


const DATA = () => `${appHome()}/data/issues`;
const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};
// "updated …" for a cache time (ms).
const since = (at) => Date.now() - at < 60_000 ? "updated just now" : `updated ${ago(new Date(at).toISOString())} ago`;
const keyOf = (repo, n) => `${repo}#${n}`;
// ```mermaid blocks in issue bodies and comments are drawn as
// pictures: mermaid-cli (mmdc) renders them on this machine to
// mods/issues/.diagrams/<hash>.png (cached), shown with image().
const MERMAID = /```mermaid[^\n]*\n([\s\S]*?)```/g;
const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(36); };
// Cache: a list or an issue fetched less than FRESH ago is not fetched again.
const FRESH = 60_000, MAX_LISTS = 60, MAX_ISSUES = 300;
const fail = (e) => ({ code: 1, stdout: "", stderr: String(e?.message ?? e) });

export default class Issues extends View {
  init(_props, cx) {
    // Opened as the diagram viewer (a dialog): this copy is the viewer, nothing else.
    if (props()?.viewer) { this.viewer = Object.create(Viewer.prototype); this.viewer.init(_props, cx); return; }
    this.repos = JSON.parse(localStorage.getItem("repos") ?? "{}"); // space id -> repo typed by hand
    this.saved = JSON.parse(localStorage.getItem("spaces") ?? "{}"); // space id -> {state, mine, query, open}
    this.autoRepo = {}; // folder -> repo from gh (null: not a repo / asking)
    this.ws = {}; // space id -> live state
    this.cur = null; // the space whose state is shown
    this.editingRepo = false;
    this.diagrams = {}; // hash -> { status: "pending" | "ok" | "error", w, h, error }
    this.width = 360;
    this.cache = { lists: {}, issues: {} }; this.tried = {}; this.inflight = new Set(); this.dirty = false;
    cx.spawn(async (cx) => {
      await this.loadCache();
      // Whatever the spaces show already comes from the cache now.
      for (const s of Object.values(this.ws)) { s.listKey = null; if (s.open && !s.detail) { const c = this.cached("issues", keyOf(s.open.repo, s.open.number)); if (c) { s.detail = c.data; s.detailAt = c.at; s.detailLoading = false; } } }
      cx.notify();
    });
    cx.timer.every(5000, () => this.saveCache());

    this.search = InputState.new({ placeholder: "Search issues… (enter)" });
    this.search.on("submit", (_e, cx) => { const s = this.st(); s.query = this.search.value().trim(); this.persist(); this.refresh(cx, true); cx.notify(); });
    this.repoInput = InputState.new({ placeholder: "owner/repo (empty: from folder)" });
    this.repoInput.on("submit", (_e, cx) => this.setRepo(this.repoInput.value().trim(), cx));

  }

  // ---------- per-space state ----------
  st(id = this.cur) {
    if (!id) return this.blank ??= this.fresh({});
    if (!this.ws[id]) this.ws[id] = this.fresh(this.saved[id] ?? {});
    return this.ws[id];
  }
  fresh(p) {
    return { state: p.state ?? "open", mine: !!p.mine, query: p.query ?? "", open: p.open ?? null,
      list: [], listKey: null, loading: false, error: null, detail: null, detailLoading: false,
    };
  }
  persist() {
    for (const [id, s] of Object.entries(this.ws)) this.saved[id] = { state: s.state, mine: s.mine, query: s.query, open: s.open };
    localStorage.setItem("spaces", JSON.stringify(this.saved));
  }
  // Called from render when the focused space changed: swap the inputs'
  // text in a task (not during render), then redraw.
  switchTo(id, cx) {
    if (this.switching === id) return;
    this.switching = id;
    cx.spawn(async (cx) => {
      this.cur = id; this.switching = null; this.editingRepo = false;
      const s = this.st();
      this.search.set_value(s.query);
      // Reopen the issue this space had open (after a reload too).
      if (s.open) this.show(s.open.number, cx, s.open.repo); // cached at once, fetched again when stale
      cx.notify();
    });
  }

  // ---------- repo ----------
  space() { return spaces().find((s) => s.id === this.cur) ?? null; }
  folder() {
    const f = focused();
    return (f?.space === this.cur ? f?.cwd : null) ?? this.space()?.folder ?? null;
  }
  repo() {
    if (this.cur && this.repos[this.cur]) return this.repos[this.cur];
    const f = this.folder();
    return f ? this.autoRepo[f] ?? null : null;
  }
  setRepo(repo, cx) {
    if (!this.cur) return;
    if (repo) this.repos[this.cur] = repo; else delete this.repos[this.cur];
    localStorage.setItem("repos", JSON.stringify(this.repos));
    const s = this.st();
    this.editingRepo = false; s.open = null; s.detail = null; this.persist();
    this.refresh(cx, true); cx.notify();
  }
  detectRepo(cx) {
    const f = this.folder();
    if (!f || f in this.autoRepo || this.space()?.machine) return;
    this.autoRepo[f] = null;
    cx.spawn(async (cx) => {
      const r = await exec("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], { cwd: f }).catch(fail);
      this.autoRepo[f] = r.code === 0 ? r.stdout.trim() || null : null;
      cx.notify();
    });
  }

  // ---------- cache ----------
  // Lists and issues are kept in memory and in data/issues/cache.json, so
  // they show at once (also after a restart). A copy younger than FRESH is
  // used as is; an older one shows while gh fetches the new one behind it
  // (stale-while-revalidate). Reload always fetches. Hovering a row fetches
  // that issue ahead of the click.
  cached(kind, key) { return this.cache[kind][key] ?? null; }
  isFresh(kind, key) { return Date.now() - (this.tried[`${kind}:${key}`] ?? 0) < FRESH; }
  put(kind, key, data) { this.cache[kind][key] = { at: Date.now(), data }; this.dirty = true; }
  async loadCache() {
    try {
      const c = JSON.parse(await fs.readFile(`${DATA()}/cache.json`, "utf8"));
      // Merge: anything fetched while the file was being read is newer.
      for (const kind of ["lists", "issues"]) for (const [k, v] of Object.entries(c[kind] ?? {}))
        if (!this.cache[kind][k] || this.cache[kind][k].at < v.at) this.cache[kind][k] = v;
    } catch {}
  }
  saveCache() {
    if (!this.dirty) return;
    this.dirty = false;
    const trim = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1].at - a[1].at).slice(0, n));
    this.cache = { lists: trim(this.cache.lists, MAX_LISTS), issues: trim(this.cache.issues, MAX_ISSUES) };
    fs.writeFile(`${DATA()}/cache.json`, JSON.stringify(this.cache)).catch(() => {});
  }

  // ---------- list ----------
  // Shows the cached list for the filters at once and fetches when it is
  // stale (or `force`). Safe from render: it never notifies before a result.
  refresh(cx, force) {
    const repo = this.repo(), s = this.st(); if (!repo || !this.cur) return;
    const key = JSON.stringify([repo, s.state, s.mine, s.query]);
    if (key !== s.listKey) {
      s.listKey = key; s.error = null;
      const c = this.cached("lists", key); s.list = c?.data ?? []; s.listAt = c?.at ?? null;
      s.loading = this.inflight.has(`lists:${key}`);
    }
    if (this.inflight.has(`lists:${key}`) || (!force && this.isFresh("lists", key))) return;
    this.inflight.add(`lists:${key}`); this.tried[`lists:${key}`] = Date.now(); s.loading = true;
    cx.spawn(async (cx) => {
      const args = ["issue", "list", "-R", repo, "--state", s.state, "--limit", "100",
        "--json", "number,title,state,labels,assignees,updatedAt,author"];
      if (s.mine) args.push("--assignee", "@me");
      if (s.query) args.push("--search", s.query);
      const r = await exec("gh", args).catch(fail);
      this.inflight.delete(`lists:${key}`);
      if (r.code === 0) this.put("lists", key, JSON.parse(r.stdout || "[]"));
      if (key === s.listKey) {
        s.loading = false;
        if (r.code === 0) { s.list = this.cache.lists[key].data; s.listAt = this.cache.lists[key].at; s.error = null; }
        else s.error = (r.stderr || r.stdout).trim().slice(0, 300);
      }
      cx.notify();
    });
  }
  setFilter(patch, cx) { Object.assign(this.st(), patch); this.persist(); this.refresh(cx, false); cx.notify(); }

  // ---------- detail ----------
  // Fetches one issue into the cache (shared by show and the hover prefetch).
  fetchIssue(repo, n, cx, force) {
    const key = keyOf(repo, n), id = `issues:${key}`;
    if (this.inflight.has(id) || (!force && this.isFresh("issues", key))) return;
    this.inflight.add(id); this.tried[id] = Date.now();
    cx.spawn(async (cx) => {
      const r = await exec("gh", ["issue", "view", String(n), "-R", repo, "--json",
        "number,title,body,state,author,labels,assignees,comments,url,createdAt"]).catch(fail);
      this.inflight.delete(id);
      if (r.code === 0) this.put("issues", key, JSON.parse(r.stdout));
      // Every space showing this issue takes the new copy.
      for (const s of Object.values(this.ws)) {
        if (s.open?.repo !== repo || s.open?.number !== n) continue;
        s.detailLoading = false;
        if (r.code === 0) { s.detail = this.cache.issues[key].data; s.detailAt = this.cache.issues[key].at; s.error = null; }
        else if (!s.detail) s.error = (r.stderr || r.stdout).trim().slice(0, 300);
      }
      cx.notify();
    });
  }
  show(n, cx, repo = this.repo(), force) {
    const s = this.st(); if (!repo) return;
    const c = this.cached("issues", keyOf(repo, n));
    s.open = { repo, number: n }; s.detail = c?.data ?? null; s.detailAt = c?.at ?? null; s.detailLoading = !c; s.error = null;
    this.persist();
    this.fetchIssue(repo, n, cx, force);
  }
  prefetch(repo, n, cx) { if (!this.cached("issues", keyOf(repo, n)) || !this.isFresh("issues", keyOf(repo, n))) this.fetchIssue(repo, n, cx, false); }
  back(cx) { const s = this.st(); s.open = null; s.detail = null; s.error = null; this.persist(); this.refresh(cx, false); cx.notify(); }
  setState(n, close, cx) {
    const s = this.st(), repo = s.open.repo;
    cx.spawn(async (cx) => {
      const r = await exec("gh", ["issue", close ? "close" : "reopen", String(n), "-R", repo]).catch(fail);
      if (r.code !== 0) notify({ title: "gh failed", body: (r.stderr || "").trim().slice(0, 200), level: "error" });
      if (this.st() === s) { this.show(n, cx, repo, true); this.refresh(cx, true); }
      cx.notify();
    });
  }

  // ---------- diagrams ----------
  // Starts rendering one diagram (spawned: safe to call from render).
  diagram(src, cx) {
    const dark = settings().dark !== false, key = hash(`${dark ? "d" : "l"}:${src}`);
    if (this.diagrams[key]) return { key, ...this.diagrams[key] };
    this.diagrams[key] = { status: "pending" };
    cx.spawn(async (cx) => {
      // image() only reads under mods/; a hidden folder there doesn't reload the mod.
      const dir = `${DATA()}/diagrams`, inp = `${dir}/${key}.mmd`, pics = `${appHome()}/mods/issues/.diagrams`, out = `${pics}/${key}.png`;
      const d = this.diagrams[key];
      try {
        await fs.mkdir(dir, { recursive: true }); await fs.mkdir(pics, { recursive: true });
        if (!(await fs.exists(inp))) await fs.writeFile(inp, src);
        if (!(await fs.exists(out))) {
          // A login + interactive zsh, so nvm's node and mmdc are on PATH.
          const r = await exec("zsh", ["-ilc", 'mmdc -i "$1" -o "$2" -t "$3" -b transparent -s 2 -q', "zsh", inp, out, dark ? "dark" : "default"]);
          if (!(await fs.exists(out))) throw new Error((r.stderr || r.stdout).trim().split("\n").slice(-6).join("\n") || "mmdc failed");
        }
        const s = await exec("sips", ["-g", "pixelWidth", "-g", "pixelHeight", out]);
        d.w = Number(s.stdout.match(/pixelWidth: (\d+)/)?.[1] ?? 800) / 2;
        d.h = Number(s.stdout.match(/pixelHeight: (\d+)/)?.[1] ?? 400) / 2;
        d.status = "ok"; d.path = `mods/issues/.diagrams/${key}.png`;
        d.mmd = inp; d.dark = dark; d.hires = `${pics}/${key}@4.png`; d.hiresPath = `mods/issues/.diagrams/${key}@4.png`;
      } catch (e) { d.status = "error"; d.error = String(e?.message ?? e); }
      cx.notify();
    });
    return { key, status: "pending" };
  }

  // A rendered diagram with a button (and a click on it) that opens it in the zoomable viewer.
  diagramCard(id, d, w, h, t) {
    const open = () => openOverlay({ mod: "issues", kind: "dialog", width: 0.9, height: 0.9,
      props: { viewer: true, title: this.st().detail?.title ?? "", path: d.path, w: d.w, h: d.h, mmd: d.mmd, dark: d.dark, hires: d.hires, hiresPath: d.hiresPath } });
    return div().id(`dg-${id}`).relative().p(6).rounded(6).bg(t.surface).cursor_pointer().on_click(open)
      .child(image(d.path).w(w).h(h))
      .child(h_flex().id(`dg-open-${id}`).absolute().top(6).right(6).h(22).px(7).gap(4).items_center().rounded(5)
        .bg(t.raised).border_1().border_color(t.border).text_size(11).text_color(t.muted)
        .hover((s) => s.text_color(t.foreground).bg(t.hover)).tooltip("Open in a dialog to zoom")
        .on_click((_e, cx) => { cx.stop_propagation(); open(); }).child("⤢ Open"));
  }

  // Markdown with its mermaid blocks drawn as pictures.
  markdown(id, md, t, cx) {
    const parts = [], text = md || "_(empty)_";
    let last = 0, i = 0;
    for (const m of text.matchAll(MERMAID)) {
      if (m.index > last) parts.push(TextView.markdown(`${id}-${i++}`, text.slice(last, m.index)).selectable(true).on_link_click((url) => exec("open", [url])));
      const d = this.diagram(m[1].trim(), cx), max = Math.max(120, this.width - 64);
      parts.push(d.status === "ok"
        ? this.diagramCard(`${id}-${i++}`, d, Math.min(d.w, max), d.h * Math.min(1, max / d.w), t)
        : d.status === "error"
          ? v_flex().gap(4).child(div().text_size(11).text_color(t.ansi1).whitespace_normal().child(`Diagram error: ${d.error}`))
            .child(TextView.markdown(`${id}-${i++}`, "```\n" + m[1] + "\n```"))
          : h_flex().gap(6).p(6).items_center().text_size(11).text_color(t.dim)
            .child(svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.working).spin(900)).child("Rendering diagram…"));
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(TextView.markdown(`${id}-${i++}`, text.slice(last)).selectable(true).on_link_click((url) => exec("open", [url])));
    return v_flex().gap(8).children(parts);
  }

  // ---------- render ----------
  // The frame and colors follow the Changes panel (reviewer): a rounded card
  // on `background`, a 42px header, 28px sub-bars at 11px, toggles that fill
  // with `selected`, `solid` primary buttons, and a bar docked at the bottom
  // (Changes' commit box; here the search box).
  render(cx) {
    if (this.viewer) return this.viewer.render(cx);
    const t = theme(), want = focused()?.space ?? null;
    if (want !== this.cur) this.switchTo(want, cx);
    this.detectRepo(cx);
    const repo = this.repo(), s = this.st();
    if (repo && !s.open) this.refresh(cx, false);
    const ui = {
      button: (id, label, primary, action) => div().id(id).h(24).px(10).flex().flex_none().items_center().rounded(6)
        .bg(primary ? t.solid : t.raised).text_color(primary ? t.solid_foreground : t.foreground).text_size(12).font_medium()
        .cursor_pointer().hover((st) => st.opacity(0.88)).on_click(action).child(label),
      toggle: (id, label, on, action) => div().id(id).h(20).px(8).flex().flex_none().items_center().rounded(5).cursor_pointer()
        .when(on, (e) => e.bg(t.selected).text_color(t.foreground)).when(!on, (e) => e.text_color(t.dim).hover((st) => st.bg(t.hover).text_color(t.foreground)))
        .on_click(action).child(label),
      link: (id, label, action) => div().id(id).h(24).px(8).flex().flex_none().items_center().rounded(6).text_size(12).text_color(t.dim)
        .cursor_pointer().hover((st) => st.bg(t.hover).text_color(t.foreground)).on_click(action).child(label),
      pill: (text) => div().h(24).px(8).flex().flex_none().items_center().rounded(6).border_1().border_color(t.border).text_size(12).text_color(t.muted).child(text),
      subbar: () => h_flex().h(28).flex_none().px(12).gap(4).items_center().border_b(1).border_color(t.border).text_size(11),
    };
    const root = v_flex().id("issues").size_full().min_h(0).relative().rounded(10).overflow_hidden()
      .bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .on_size_change((size, cx) => { if (Math.abs(size.width - this.width) > 1) { this.width = size.width; cx.notify(); } });

    // Header: title, count, the repo as a select-looking box (click to type another), reload.
    const repoBox = this.editingRepo
      ? div().flex_1().min_w(80).h(24).px(8).flex().items_center().rounded(6).border_1().border_color(t.accent)
        .child(Input.new(this.repoInput).h_full().w_full().text_size(12).text_color(t.foreground))
      : h_flex().id("repo-box").min_w(0).h(24).px(8).gap(6).items_center().rounded(6).border_1().border_color(t.border).bg(t.raised)
        .cursor_pointer().hover((st) => st.bg(t.hover)).tooltip("The repo of this space: click to type owner/repo (empty: from the folder)")
        .on_click((_e, cx) => { this.editingRepo = true; this.repoInput.set_value(this.repos[this.cur] ?? ""); this.repoInput.focus(); cx.notify(); })
        .child(div().min_w(0).truncate().text_size(12).child(repo ?? "Set repo"))
        .child(svg("mods/reviewer/chevron-down.svg").size(11).flex_none().text_color(t.dim));
    const header = h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
      .child(div().flex_none().font_semibold().child("Issues"))
      .when(!s.open && s.list.length > 0, (e) => e.child(ui.pill(`${s.list.length}${s.list.length >= 100 ? "+" : ""}`)))
      .child(repoBox)
      .child(div().flex_1())
      .child(ui.link("reload", "Reload", (_e, cx) => { if (s.open) this.show(s.open.number, cx, s.open.repo, true); else this.refresh(cx, true); cx.notify(); }));

    if (!repo && !s.open) return root.child(header).child(div().p(14).text_color(t.dim).whitespace_normal()
      .child("This folder is not a GitHub repo. Click Set repo above and type owner/repo."));
    return root.child(header).child(s.open ? this.renderDetail(s, t, ui, cx) : this.renderList(s, t, ui, repo));
  }

  renderList(s, t, ui, repo) {
    const filters = ui.subbar()
      .child(ui.toggle("st-open", "Open", s.state === "open", (_e, cx) => this.setFilter({ state: "open" }, cx)))
      .child(ui.toggle("st-closed", "Closed", s.state === "closed", (_e, cx) => this.setFilter({ state: "closed" }, cx)))
      .child(ui.toggle("st-all", "All", s.state === "all", (_e, cx) => this.setFilter({ state: "all" }, cx)))
      .child(div().w(1).h(14).mx(4).bg(t.border))
      .child(ui.toggle("mine", "Mine", s.mine, (_e, cx) => this.setFilter({ mine: !s.mine }, cx)))
      .child(div().flex_1())
      .when(s.loading, (e) => e.child(svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.dim).spin(900)))
      .when(Boolean(s.listAt) && !s.loading, (e) => e.child(div().text_color(t.dim).tooltip("Shown from the cache; fetched again after a minute, or Reload").child(since(s.listAt))));
    const rows = s.list.map((i) => {
      const k = keyOf(repo, i.number);
      return v_flex().id(`i-${i.number}`).flex_none().px(8).py(6).gap(3).rounded(7).cursor_pointer()
        .hover((st) => st.bg(t.hover)).on_hover((on, cx) => { if (on) this.prefetch(repo, i.number, cx); }).on_click((_e, cx) => { this.show(i.number, cx); cx.notify(); })
        .child(h_flex().gap(8).items_start()
          .child(div().w(14).flex_none().text_size(11).text_color(i.state === "OPEN" ? t.ansi2 : t.ansi5).child(i.state === "OPEN" ? "●" : "✓"))
          .child(div().flex_1().min_w(0).text_size(12.5).whitespace_normal().child(i.title)))
        .child(h_flex().gap(6).pl(22).text_size(11).text_color(t.dim).flex_wrap()
          .child(`#${i.number}`).child(i.author?.login ?? "").child(ago(i.updatedAt))
          .children((i.labels ?? []).slice(0, 3).map((l) => div().h(16).px(5).flex().items_center().rounded(4).bg(`#${l.color}26`).text_size(10).text_color(t.muted).child(l.name))));
    });
    // Search docked at the bottom, like Changes' commit box.
    const search = h_flex().flex_none().p(10).gap(8).border_t(1).border_color(t.border)
      .child(div().id("search-box").flex_1().min_w(0).h(32).px(10).flex().items_center().rounded(8).border_1().border_color(t.border).cursor_text()
        .child(Input.new(this.search).h_full().w_full().text_size(12).text_color(t.foreground)))
      .child(div().id("search-go").h(32).px(14).flex().items_center().rounded(8).bg(t.raised).text_color(t.foreground).text_size(12).cursor_pointer()
        .hover((st) => st.opacity(0.88)).on_click((_e, cx) => { s.query = this.search.value().trim(); this.persist(); this.refresh(cx, true); cx.notify(); }).child("Search"));
    return v_flex().flex_1().min_h(0)
      .child(filters)
      .when(Boolean(s.error), (e) => e.child(div().px(12).py(6).text_size(11).text_color(t.ansi1).whitespace_normal().child(s.error)))
      .child(v_flex().id("list").flex_1().min_h(0).overflow_y_scrollbar().p(6).gap(1)
        .when(s.loading && !s.list.length && !s.listAt, (e) => e.child(div().p(8).text_color(t.dim).child("Loading issues…")))
        .when((!s.loading || s.listAt) && !s.list.length && !s.error, (e) => e.child(div().p(8).text_color(t.dim).child("No issues")))
        .children(rows))
      .child(search);
  }

  renderDetail(s, t, ui, cx) {
    const d = s.detail, n = s.open.number, k = keyOf(s.open.repo, n), sid = this.cur ?? "none";
    const bar = ui.subbar()
      .child(ui.toggle("back", "← Issues", false, (_e, cx) => this.back(cx)))
      .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(`#${n}`))
      .when(this.inflight.has(`issues:${k}`), (e) => e.child(svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.dim).spin(900)))
      .when(Boolean(s.detailAt) && !this.inflight.has(`issues:${k}`), (e) => e.child(div().px(4).text_color(t.dim).child(since(s.detailAt))))
      .when(Boolean(d), (e) => e
        .child(ui.toggle("browser", "GitHub ↗", false, () => exec("open", [d.url])))
        .child(ui.toggle("state", d.state === "OPEN" ? "Close" : "Reopen", false, (_e, cx) => this.setState(n, d.state === "OPEN", cx))));
    const body = v_flex().id("detail").flex_1().min_h(0).overflow_y_scrollbar().p(12).gap(10);
    if (!d) return v_flex().flex_1().min_h(0).child(bar).child(body.child(div().text_color(s.error ? t.ansi1 : t.dim).whitespace_normal().child(s.detailLoading ? "Loading issue…" : s.error ?? "")));

    // Cards like Changes' comment cards; markdown ids carry the space and issue.
    const card = (id, title, md, accent) => v_flex().flex_none().rounded(8).border_1().border_color(accent ? t.accent + "66" : t.border).bg(t.surface).overflow_hidden()
      .child(div().px(10).py(5).text_size(10.5).text_color(accent ? t.accent : t.dim).border_b(1).border_color(t.border).child(title))
      .child(div().px(10).py(8).text_size(12.5).child(this.markdown(`${sid}-${k}-${id}`, md, t, cx)));

    return v_flex().flex_1().min_h(0).child(bar).child(body
      .child(div().flex_none().text_size(15).font_semibold().whitespace_normal().child(`${d.title}`))
      .child(h_flex().flex_none().gap(6).text_size(11).text_color(t.dim).flex_wrap()
        .child(div().h(18).px(6).flex().items_center().rounded(4).bg((d.state === "OPEN" ? t.ansi2 : t.ansi5) + "33").text_color(t.foreground).child(d.state === "OPEN" ? "Open" : "Closed"))
        .child(`#${d.number}`).child(d.author?.login ?? "").child(ago(d.createdAt))
        .children((d.assignees ?? []).map((a) => `@${a.login}`))
        .children((d.labels ?? []).map((l) => div().h(16).px(5).flex().items_center().rounded(4).bg(`#${l.color}26`).text_size(10).text_color(t.muted).child(l.name))))
      .when(Boolean(s.error), (e) => e.child(div().text_size(11).text_color(t.ansi1).whitespace_normal().child(s.error)))
      .child(card("body", `${d.author?.login ?? ""} · mô tả`, d.body))
      .children((d.comments ?? []).map((c, i) => card(`c-${i}`, `${c.author?.login ?? "?"} · ${ago(c.createdAt)}`, c.body))));
  }
}
