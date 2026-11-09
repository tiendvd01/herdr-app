// Herdr's Files panel with VS Code's Material Icon Theme icons: a lazy file browser for the
// focused pane's folder, with bounded read-only previews.
//
// Modified from Herdr's shipped `files` mod (https://github.com/herdrdev/herdr-app, Apache-2.0):
// added DIR, icon() and the Material Icon Theme icons in the rows and the preview header.
// Local changes: an "Edit in Neovim" button on file rows and in the preview header, and a Preview/Source
// switch for Markdown files.
import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, Editor, EditorState, TextView, InputState, Input } from "gpui-base";
import { spaces, panes, focused, exec, readTextFile, watchFolder, run, theme, settings, window, props } from "herdr";
import ICONS from "./icons.js";
import { iconButton, chip } from "./panel-ui.js";
import { Markdown } from "./markdown.js";
import { Viewer } from "./diagram-viewer.js";
import { activePlace } from "./space-folder.js";

// The focused terminal's folder; while a mod pane (a file viewer tab, ...) is focused, the
// space's last focused terminal (lib/space-folder.js), never Herdr's own home.
function location() {
  const { cwd, on } = activePlace();
  return { cwd, on };
}
const key = () => JSON.stringify(location());
const LANG = { ts: "js", tsx: "js", mts: "js", cts: "js", jsx: "js", mjs: "js", toml: "yaml", jsonc: "json", svelte: "html", vue: "html" };
const PER_FOLDER = 500, TOTAL = 5000;
const DIR = "mods/file-icons";

// Material Icon Theme's rules, as VS Code applies them: names match case-insensitively; a
// path rule (".github/workflows") beats a name, a name beats an extension, and the longest
// extension wins ("spec.ts" over "ts"). Light themes check the theme's light table first.
const bare = name => name.replace(/^__(.+)__$/, "$1").replace(/^[._-]/, "");
const opened = id => id.endsWith("_light") ? `${id.slice(0, -6)}-open_light` : `${id}-open`;
function lookup(table, key, dark) { return (dark ? undefined : ICONS.light[table][key]) ?? ICONS[table][key]; }
function icon(path, dir, open, dark) {
  const parts = path.toLowerCase().split("/"), name = parts[parts.length - 1];
  const table = dir ? "folderNames" : "fileNames", find = key => lookup(table, key, dark) ?? (dir ? lookup(table, bare(key), dark) : undefined);
  let id;
  for (let i = 0; !id && i < parts.length - 1; i++) id = find(parts.slice(i).join("/"));
  if (dir) {
    id ??= find(name) ?? ICONS.folder;
    return `${DIR}/icons/${open ? opened(id) : id}.svg`;
  }
  id ??= lookup(table, name, dark);
  for (let dot = name.indexOf("."); !id && dot !== -1; dot = name.indexOf(".", dot + 1)) id = lookup("fileExtensions", name.slice(dot + 1), dark);
  return `${DIR}/icons/${id ?? ICONS.file}.svg`;
}

async function directory(path, on) {
  if (!on && window()?.platform === "windows") {
    const r = await exec("powershell", ["-NoProfile", "-Command", "& { param($p) @(Get-ChildItem -LiteralPath $p -Force -ErrorAction Stop | Where-Object Name -ne '.git' | Select-Object -First 501 | ForEach-Object { @{ name=$_.Name; dir=($_.PSIsContainer -and -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint)) } }) | ConvertTo-Json -Compress }", path]);
    if (r.code !== 0) throw new Error(r.stderr || "Cannot list this folder");
    const result = JSON.parse(r.stdout || "[]");
    return Array.isArray(result) ? result : [result];
  }
  const script = 'n=0; for p in "$1"/* "$1"/.[!.]* "$1"/..?*; do [ -e "$p" ] || [ -L "$p" ] || continue; name=${p##*/}; [ "$name" = .git ] && continue; if [ -d "$p" ] && [ ! -L "$p" ]; then kind=d; else kind=f; fi; printf "%s\\0%s\\0" "$kind" "$name"; n=$((n+1)); [ "$n" -gt 500 ] && break; done; test -d "$1"';
  const r = await exec("sh", ["-c", script, "files", path], { on });
  if (r.code !== 0) throw new Error(r.stderr || "Cannot list this folder");
  const fields = r.stdout.split("\0"), out = [];
  for (let i = 0; i + 1 < fields.length; i += 2) out.push({ name: fields[i + 1], dir: fields[i] === "d" });
  return out;
}

export default class Files extends View {
  init(_props, cx) {
    // Opened as the diagram viewer (a dialog): this copy is the viewer, nothing else.
    if (props()?.viewer) { this.viewer = Object.create(Viewer.prototype); this.viewer.init(_props, cx); return; }
    this.entries = new Map(); this.folders = new Set(); this.pending = new Set(); this.marks = {}; this.ignored = new Set();
    this.mdView = new Markdown("file-icons");
    this.mdY = 0; this.mdViewH = 0; this.mdContentH = 0; // hand-kept preview scroll (mdPane)
    this.width = 360;
    this.query = ""; this.all = null; this.allLoading = false;
    this.search = InputState.new({ placeholder: "Search files…" });
    this.search.on("change", (_e, cx) => { this.query = this.search.value().trim(); if (this.query) this.loadAll(cx); cx.notify(); });
    // Opened in a tab of its own (props.file = an absolute path): a viewer for that one file. It never
    // follows the focused terminal's folder (the panel does), so it keeps showing its file wherever focus is.
    const pinned = props()?.file;
    if (pinned) {
      this.pinned = true; this.context = "pinned"; this.on = props().on ?? null;
      this.root = pinned.slice(0, pinned.lastIndexOf("/")) || "/";
      this.show(pinned, cx);
      cx.timer.every(10000, cx => this.reloadFile(cx));
      return;
    }
    this.refresh(cx);
    cx.timer.every(10000, cx => { this.reloadFile(cx); this.refresh(cx); });
  }

  // The folder context this copy shows: the panel follows the focused terminal, a file tab is fixed.
  ctx() { return this.pinned ? this.context : key(); }

  // A file is read in a tab of its own (a Files preview pane), next to the terminals.
  openTab(path) {
    run("tab.new", { name: path.split("/").pop(), mod: "file-icons", props: { file: path.startsWith("/") ? path : `${this.root}/${path}`, on: this.on } });
  }

  watch(root, cx) {
    if (this.on || this.watched === root) return;
    this.watched = root;
    cx.spawn(async cx => {
      try { while (this.watched === root) { await watchFolder(root); if (this.watched === root) { this.reloadFile(cx); this.refresh(cx); } } }
      catch { if (this.watched === root) this.watched = null; }
    });
  }

  async loadFolder(path, context) {
    const on = this.on, root = this.root;
    const entries = await directory(path ? `${root}/${path}` : root, on);
    if (key() !== context || (path && !this.folders.has(path))) return;
    const used = [...this.entries.entries()].filter(([p]) => p !== path).reduce((n, [, e]) => n + e.length, 0);
    this.entries.set(path, entries.slice(0, Math.max(0, Math.min(PER_FOLDER, TOTAL - used))).sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name)));
    if (entries.length > PER_FOLDER || used + entries.length > TOTAL) this.limited = true;
  }

  refresh(cx) {
    if (this.loading) return;
    const { cwd, on } = location(), context = key();
    if (context !== this.context) {
      this.context = context; this.root = cwd; this.on = on; this.entries = new Map(); this.folders = new Set();
      this.pending = new Set(); this.marks = {}; this.ignored = new Set(); this.show(null); this.watched = null; this.error = null; this.limited = false;
      this.all = null; this.allLoading = false;
    }
    if (!cwd) return;
    this.loading = true;
    this.limited = false;
    cx.spawn(async cx => {
      try {
        for (const path of ["", ...this.folders]) await this.loadFolder(path, context);
        const top = await exec("git", ["rev-parse", "--show-toplevel"], { cwd, on }).catch(() => null);
        const marks = {};
        if (top?.code === 0) {
          // Writes nothing under .git (index lock, fsmonitor cookie): the folder watch would refresh again.
          const status = await exec("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "status", "--porcelain=v1", "-z", "--no-renames", "--untracked-files=normal"], { cwd, on }).catch(() => null);
          if (status?.code === 0) for (const entry of status.stdout.split("\0").filter(Boolean).slice(0, TOTAL)) {
            const xy = entry.slice(0, 2);
            marks[`${top.stdout.trim()}/${entry.slice(3)}`] = xy === "??" || xy.includes("A") ? "A" : xy.includes("U") ? "U" : xy.includes("D") ? "D" : "M";
          }
        }
        // Ignored paths (relative to the folder; whole directories collapsed to one entry).
        const ignored = new Set();
        if (top?.code === 0) {
          const ig = await exec("git", ["--no-optional-locks", "ls-files", "-z", "--others", "--ignored", "--exclude-standard", "--directory"], { cwd, on }).catch(() => null);
          if (ig?.code === 0) for (const p of ig.stdout.split("\0").filter(Boolean).slice(0, TOTAL)) ignored.add(p.replace(/\/$/, ""));
        }
        if (key() !== context) return;
        this.ignored = ignored; this.marks = marks; this.error = null; this.watch(cwd, cx);
      } catch (e) { if (key() === context) this.error = String(e); }
      finally { this.loading = false; cx.notify(); }
    });
  }

  // Every file under the folder (tracked + untracked, honoring .gitignore; plain find outside git), loaded when searching.
  loadAll(cx, force = false) {
    if ((this.all && !force) || this.allLoading || !this.root) return;
    this.allLoading = true;
    const context = this.context, root = this.root, on = this.on;
    cx.spawn(async cx => {
      try {
        let r = await exec("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, on }).catch(() => null);
        if (r?.code !== 0) r = await exec("find", [".", "-type", "f", "-not", "-path", "*/.git/*", "-not", "-path", "*/node_modules/*", "-print0"], { cwd: root, on });
        if (key() !== context) return;
        this.all = r.stdout.split("\0").filter(Boolean).map(f => f.replace(/^\.\//, "")).slice(0, 100000);
      } catch { if (key() === context) this.all = []; }
      finally { this.allLoading = false; cx.notify(); }
    });
  }

  matches() {
    const words = this.query.toLowerCase().split(/\s+/).filter(Boolean), out = [];
    for (const f of this.all ?? []) {
      const l = f.toLowerCase();
      if (words.every(w => l.includes(w))) { out.push(f); if (out.length >= 200) break; }
    }
    return out;
  }

  results(t, dark) {
    const list = this.matches();
    if (!list.length) return [div().p(8).text_size(12).text_color(t.dim).child(this.all ? "No matching files" : "Searching…")];
    return list.map(path => {
      const name = path.split("/").pop(), dir = path.slice(0, path.length - name.length - 1);
      return h_flex().id(`found-${path}`).h(28).flex_none().px(8).gap(7).items_center().rounded(7).cursor_pointer().hover(s => s.bg(t.hover))
        .on_click(() => this.openTab(path))
        .child(image(icon(path, false, false, dark)).size(16).flex_none())
        .child(div().flex_none().max_w(200).truncate().child(name))
        .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(dir))
        .child(this.editButton(path, true));
    });
  }

  toggle(path, cx) {
    if (this.folders.has(path)) {
      for (const folder of [...this.folders]) if (folder === path || folder.startsWith(path + "/")) {
        this.folders.delete(folder);
        this.entries.delete(folder);
      }
    } else {
      this.folders.add(path);
      if (!this.entries.has(path) && !this.pending.has(path)) {
        const context = this.context;
        this.pending.add(path);
        cx.spawn(async cx => {
          try { await this.loadFolder(path, context); }
          catch (e) { if (key() === context) this.error = String(e); }
          finally { this.pending.delete(path); cx.notify(); }
        });
      }
    }
    cx.notify();
  }

  show(path, cx) {
    this.code?.release(); this.code = null; this.file = path; this.fileText = null; this.fileError = null; this.md = null; this.mdPreview = true; this.mdY = 0;
    if (!path || !cx) return;
    this.loadFile(path, cx, false);
  }

  // Re-reads the open file; the view is rebuilt only when the content changed (keeps scroll otherwise).
  reloadFile(cx) {
    if (this.file && !this.fileError && this.fileText !== null) this.loadFile(this.file, cx, true);
  }

  loadFile(path, cx, reload) {
    const context = this.context, root = this.root, on = this.on;
    cx.spawn(async cx => {
      try {
        const text = await readTextFile(path.startsWith("/") ? path : `${root}/${path}`, { on }); // absolute: a file outside the folder (cmd-p)
        if (this.file !== path || this.ctx() !== context) return;
        if (reload && text === this.fileText) return;
        if (text === null) { this.fileError = "This file is no longer available"; return; }
        if (text.includes("\0")) { this.fileError = "Binary file · no text preview"; return; }
        this.fileText = text;
        const t = theme(), ext = path.includes(".") ? path.split(".").pop() : "txt";
        const shown = text.length > 400000 ? text.slice(0, 400000) + "\n… (file truncated)" : text;
        this.code?.release();
        this.md = /^(md|markdown)$/i.test(ext) ? shown : null;
        this.code = EditorState.new({ language: LANG[ext] ?? ext, readonly: true, value: shown,
          font_family: settings().font_family, font_size: 12,
          syntax: { keyword: t.ansi5, string: t.ansi2, comment: t.dim, function: t.ansi4, type: t.ansi3, number: t.ansi1, constant: t.ansi6 } });
      } catch { if (!reload && this.file === path && this.ctx() === context) this.fileError = "Cannot preview this file (binary, too large, or unreadable)"; }
      finally { cx.notify(); }
    });
  }

  // Opens the file in neovim in a new tab.
  edit(path) {
    run("tab.new", { name: path.split("/").pop(), folder: this.root, argv: ["nvim", path.startsWith("/") ? path : `${this.root}/${path}`] });
  }

  editButton(path, small) {
    return iconButton(`edit-${path}`, "edit", "Edit in Neovim (new tab)", (_e, cx) => { cx.stop_propagation(); this.edit(path); }, { small })
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation());
  }

  isIgnored(path) {
    if (!this.ignored?.size) return false;
    const parts = path.split("/");
    for (let i = 1; i <= parts.length; i++) if (this.ignored.has(parts.slice(0, i).join("/"))) return true;
    return false;
  }

  rows(prefix, depth, out, t, dark) {
    if (out.length >= TOTAL || depth > 40) return out;
    for (const entry of this.entries.get(prefix) ?? []) {
      if (out.length >= TOTAL) break;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name, open = this.folders.has(path), mark = this.marks[`${this.root}/${path}`];
      out.push(h_flex().id(`file-${path}`).h(28).flex_none().pl(8 + depth * 18).pr(8).gap(7).items_center().rounded(7).cursor_pointer().hover(s => s.bg(t.hover))
        .when(this.isIgnored(path), el => el.opacity(0.45))
        .on_click((_e, cx) => entry.dir ? this.toggle(path, cx) : this.openTab(path))
        .child(entry.dir ? svg(`${DIR}/chevron-${open ? "down" : "right"}.svg`).size(12).flex_none().text_color(t.dim) : div().w(12).flex_none())
        .child(image(icon(path, entry.dir, open, dark)).size(16).flex_none())
        .child(div().flex_1().min_w(0).truncate().child(entry.name))
        .when(!entry.dir, el => el.child(this.editButton(path, true)))
        .when(Boolean(mark), el => el.child(div().text_size(11).text_color(mark === "A" ? t.ansi2 : mark === "D" || mark === "U" ? t.ansi1 : t.blocked).child(mark))));
      if (entry.dir && open) this.rows(path, depth + 1, out, t, dark);
    }
    return out;
  }

  // The markdown preview scrolls by hand: GPUI drops a scroll area's offset while its tab is hidden and no
  // API reads or sets it, so the offset lives on this instance (kept across tab switches) and the content is
  // shifted up by it. Wheel and trackpad move it; the thumb only shows where you are.
  mdPane(t, cx) {
    const view = this.mdViewH, total = this.mdContentH, max = Math.max(0, total - view);
    const y = Math.min(this.mdY, max);
    const scrollTo = (v, cx) => { v = Math.max(0, Math.min(max, v)); if (v !== this.mdY) { this.mdY = v; cx.notify(); } };
    const measure = (field) => (size, cx) => { if (Math.abs(size.height - this[field]) > 0.5) { this[field] = size.height; cx.notify(); } };
    const thumb = max > 0 ? Math.max(24, view * view / total) : 0;
    return div().id("files-md").flex_1().min_h(0).relative().overflow_hidden()
      .on_size_change(measure("mdViewH"))
      .on_scroll_wheel((e, cx) => scrollTo(y - (e.delta_lines ? e.delta_lines.y * 20 : e.delta.y), cx))
      .child(div().id("files-md-body").absolute().left(0).right(0).top(-y).p(12).text_size(12.5)
        .on_size_change(measure("mdContentH"))
        .child(this.mdView.render(`files-md-${this.file}`, this.md, t, cx, { width: this.width, title: this.file })))
      .when(max > 0, el => el.child(div().absolute().right(2).top((view - thumb) * y / max).w(6).h(thumb).rounded(3).bg(t.border)));
  }

  render(cx) {
    if (this.viewer) return this.viewer.render(cx);
    if (!this.pinned && key() !== this.context) this.refresh(cx);
    const t = theme(), dark = Boolean(settings().dark);
    // In the side panel the mod draws its own card; opened as a tab (pinned to a file) the pane already has one.
    return v_flex().id("files").size_full().min_h(0).overflow_hidden().bg(t.background).text_color(t.foreground).text_size(13)
      .when(!this.pinned, el => el.rounded(10).border_1().border_color(t.border))
      .on_size_change((size, cx) => {
        // Debounce: only re-render (diagram widths) once dragging has settled.
        if (Math.abs(size.width - this.width) <= 1) { this.widthTimer?.cancel(); this.widthTimer = null; return; }
        this.widthTimer?.cancel();
        this.widthTimer = cx.timer.after(150, (acx) => { this.widthTimer = null; this.width = size.width; acx.notify(); });
      })
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .when(Boolean(this.file) && !this.pinned, el => el.child(div().id("files-back").w(20).cursor_pointer().text_color(t.muted).on_click((_e, cx) => { this.show(null); cx.notify(); }).child("←")))
        .when(!this.pinned, el => el.child(div().font_semibold().child("Files")))
        .when(Boolean(this.file && this.md !== null), el => el.child(h_flex().id("files-mdmode").gap(2).flex_none()
          .children([["Preview", true], ["Source", false]].map(([label, v]) =>
            chip(`files-mode-${label}`, label, this.mdPreview === v, (_e, cx) => { this.mdPreview = v; cx.notify(); })))))
        .when(Boolean(this.file), el => el.child(this.editButton(this.file, false)))
        .child(h_flex().flex_1().min_w(0).gap(6).justify_end().items_center().text_size(12).text_color(t.dim)
          .when(Boolean(this.file), el => el.child(image(icon(this.file, false, false, dark)).size(14).flex_none()))
          .child(div().min_w(0).truncate().child(this.file ?? this.root?.split(/[\\/]/).pop() ?? ""))))
      .when(!this.file, el => el.child(div().id("files-search").flex_none().mx(8).mt(8).h(30).px(10).flex().items_center().rounded(8).border_1().border_color(t.border).cursor_text()
        .child(Input.new(this.search).h_full().w_full().text_size(12).text_color(t.foreground))))
      .when(!this.file && Boolean(this.query), el => el.child(v_flex().id("files-found").flex_1().min_h(0).overflow_y_scrollbar().p(6).children(this.results(t, dark))))
      .when(!this.file && !this.query, el => el.child(v_flex().id("files-tree").flex_1().min_h(0).overflow_y_scrollbar().p(6).children(this.rows("", 0, [], t, dark))
        .when(Boolean(this.error) || !this.entries.get("")?.length, el => el.child(div().p(8).text_size(12).text_color(t.dim).child(this.error || (this.loading ? "Loading files…" : this.root ? "No files" : "No folder"))))
        .when(this.limited, el => el.child(div().p(8).text_size(11).text_color(t.dim).child("File list limited to 500 entries per folder and 5,000 total")))))
      .when(Boolean(this.file), el => el.child(this.code && this.md !== null && this.mdPreview
        ? this.mdPane(t, cx)
        : this.code ? Editor.new(this.code).flex_1().min_h(0) : div().p(12).text_color(t.dim).child(this.fileError || "Loading file…")));
  }
}
