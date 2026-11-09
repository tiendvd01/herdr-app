// Mermaid board: a dialog to paste a mermaid diagram, preview it live, and keep it.
// Opened with cmd-shift-m, from the status bar ("Mermaid"), or `mod.open {"name":"mermaid-board"}`.
// Diagrams are plain `<name>.mmd` files in <app>/data/mermaid-board/library/ (a button opens the
// folder in Finder): add, rename or delete files there and the list follows within 3 seconds.
// The preview is drawn by mmdc through lib/markdown.js; the zoomable viewer is lib/diagram-viewer.js.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, EditorState, Editor } from "gpui-base";
import { props, theme, settings, appHome, exec, notify, closeOverlay } from "herdr";
import * as fs from "fs/promises";
import { Markdown } from "./markdown.js";
import { Viewer } from "./diagram-viewer.js";
import { icon, iconButton, button, textButton } from "./panel-ui.js";

const DIR = () => `${appHome()}/data/mermaid-board/library`;
const SAMPLE = "flowchart LR\n  A[Paste] --> B[Preview] --> C[Save]";
// A pasted ```mermaid fence is fine: only the diagram goes to mmdc.
const clean = (s) => s.replace(/^\s*```mermaid[^\n]*\n/, "").replace(/\n?```\s*$/, "").trim();
const slug = (s) => s.trim().replace(/\.mmd$/i, "").replace(/[\\/:*?"<>|\n]+/g, "-").replace(/^\.+/, "").slice(0, 80).trim();

export default class MermaidBoard extends View {
  init(_props, cx) {
    // Opened as the zoomable diagram viewer: this copy is the viewer, nothing else.
    if (props()?.viewer) { this.viewer = Object.create(Viewer.prototype); this.viewer.init(_props, cx); return; }
    this.md = new Markdown("mermaid-board");
    this.files = []; this.cur = null; this.saved = ""; this.src = ""; this.ver = 0;
    this.msg = ""; this.err = ""; this.confirm = null; this.pw = 560;
    this.name = InputState.new({ placeholder: "Name (file name)…" });
    this.name.on("change", (_e, cx) => { this.msg = ""; this.err = ""; cx.notify(); });
    this.editor = EditorState.new({ value: "", line_numbers: true, soft_wrap: false, font_family: settings().font_family });
    // The preview follows the text 0.6s after the last keystroke.
    this.editor.on("change", (_e, cx) => {
      const v = ++this.ver; this.msg = ""; this.err = ""; this.confirm = null;
      cx.timer.after(600, (cx) => { if (v === this.ver) { this.src = this.editor.value(); cx.notify(); } });
      cx.notify();
    });
    this.handle = cx.focus_handle();
    this.reload(cx);
    cx.timer.every(3000, (cx) => this.reload(cx));
  }

  close() { closeOverlay(props().overlay); }
  dirty() { return this.editor.value() !== this.saved || (this.cur ?? "") !== slug(this.name.value()); }

  reload(cx) {
    cx.spawn(async (cx) => {
      try {
        await fs.mkdir(DIR(), { recursive: true });
        const list = (await fs.readdir(DIR())).filter((f) => f.endsWith(".mmd")).map((f) => f.slice(0, -4)).sort((a, b) => a.localeCompare(b));
        if (list.join("\n") !== this.files.join("\n")) { this.files = list; cx.notify(); }
      } catch (e) { this.err = String(e?.message ?? e); cx.notify(); }
    });
  }

  fresh(cx) {
    this.cur = null; this.saved = SAMPLE; this.confirm = null; this.msg = ""; this.err = "";
    this.name.set_value(""); this.editor.set_value(SAMPLE); this.src = SAMPLE; this.ver++;
    this.name.focus(); cx.notify();
  }

  open(name, cx) {
    cx.spawn(async (cx) => {
      try {
        const text = await fs.readFile(`${DIR()}/${name}.mmd`, "utf8");
        this.cur = name; this.saved = text; this.confirm = null; this.msg = ""; this.err = "";
        this.name.set_value(name); this.editor.set_value(text); this.src = text; this.ver++;
      } catch (e) { this.err = `Cannot open ${name}: ${e?.message ?? e}`; }
      cx.notify();
    });
  }

  save(cx) {
    const name = slug(this.name.value()), text = this.editor.value();
    if (!name) { this.err = "Give it a name first."; return cx.notify(); }
    if (!text.trim()) { this.err = "Nothing to save."; return cx.notify(); }
    cx.spawn(async (cx) => {
      try {
        if (name !== this.cur && (await fs.exists(`${DIR()}/${name}.mmd`))) throw new Error(`"${name}" already exists.`);
        await fs.mkdir(DIR(), { recursive: true });
        await fs.writeFile(`${DIR()}/${name}.mmd`, text.endsWith("\n") ? text : text + "\n");
        if (this.cur && this.cur !== name) await fs.unlink(`${DIR()}/${this.cur}.mmd`).catch(() => {});
        this.cur = name; this.saved = text; this.msg = "Saved"; this.err = "";
        if (this.name.value() !== name) this.name.set_value(name);
        this.reload(cx);
      } catch (e) { this.err = String(e?.message ?? e); }
      cx.notify();
    });
  }

  remove(name, cx) {
    if (this.confirm !== name) { this.confirm = name; return cx.notify(); }
    cx.spawn(async (cx) => {
      try {
        await fs.unlink(`${DIR()}/${name}.mmd`);
        notify({ title: "Diagram deleted", body: name, level: "success" });
        if (this.cur === name) this.fresh(cx);
        this.confirm = null; this.reload(cx);
      } catch (e) { this.err = String(e?.message ?? e); }
      cx.notify();
    });
  }

  render(cx) {
    if (this.viewer) return this.viewer.render(cx);
    const t = theme(), md = this.md;
    const code = clean(this.src);
    const d = code ? md.diagram(code, cx) : null;
    const max = Math.max(160, this.pw - 40);

    const row = (n) => {
      const on = n === this.cur, del = this.confirm === n;
      return h_flex().id(`mb-${n}`).flex_none().h(30).px(10).gap(6).items_center().rounded(6).cursor_pointer()
        .when(on, (e) => e.bg(t.selected)).when(!on, (e) => e.hover((s) => s.bg(t.hover)))
        .on_click((_e, cx) => this.open(n, cx))
        .child(div().flex_1().min_w(0).truncate().when(on, (e) => e.font_semibold()).child(n))
        .child(del
          ? textButton(`mb-del-${n}`, "Delete?", (_e, cx) => { cx.stop_propagation(); this.remove(n, cx); }, { color: t.blocked })
          : iconButton(`mb-x-${n}`, "close", "Delete", (_e, cx) => { cx.stop_propagation(); this.remove(n, cx); }, { small: true }));
    };

    const side = v_flex().w(210).h_full().flex_none().min_h(0).gap(6).p(10).border_r(1).border_color(t.border)
      .child(h_flex().items_center().gap(6)
        .child(div().flex_1().text_size(11).text_color(t.dim).child(`${this.files.length} saved`))
        .child(iconButton("mb-folder", "external", "Open the folder in Finder", () => exec("open", [DIR()])))
        .child(iconButton("mb-refresh", "refresh", "Reload the list", (_e, cx) => this.reload(cx))))
      .child(v_flex().id("mb-list").flex_1().min_h(0).overflow_y_scroll().gap(2)
        .children(this.files.map(row))
        .when(this.files.length === 0, (e) => e.child(div().p(8).text_size(12).text_color(t.dim).child("Nothing saved yet."))));

    const left = v_flex().flex_1().min_w(0).h_full().min_h(0).gap(8).p(12).border_r(1).border_color(t.border)
      .child(h_flex().gap(8).items_center()
        .child(Input.new(this.name).flex_1().h(30).px(10).items_center().rounded(6).border(1).border_color(t.input).bg(t.background).text_color(t.foreground))
        .child(button("mb-save", this.dirty() ? "Save" : "Saved", (_e, cx) => this.save(cx), { primary: true, disabled: !this.dirty() })))
      .child(div().id("mb-editor").flex_1().min_h(0).border(1).border_color(t.border).rounded(8).overflow_hidden().child(Editor.new(this.editor).size_full()))
      .child(h_flex().h(18).items_center().text_size(11.5)
        .child(this.err ? div().text_color(t.blocked).truncate().child(this.err)
          : div().text_color(this.msg ? t.done : t.dim).child(this.msg || "Paste a mermaid diagram — the preview updates as you type.")));

    const right = v_flex().id("mb-preview").flex_1().min_w(0).h_full().min_h(0).p(12).gap(8).overflow_y_scroll()
      .on_size_change((s, cx) => { if (Math.abs(s.width - this.pw) > 2) { this.pw = s.width; cx.notify(); } })
      .child(!d ? div().p(8).text_color(t.dim).child("Nothing to preview.")
        : d.status === "ok" ? md.card("mb", d, Math.min(d.w, max), d.h * Math.min(1, max / d.w), t, this.cur ?? "New diagram")
        : d.status === "error" ? div().text_size(12).text_color(t.ansi1).whitespace_normal().child(`Diagram error: ${d.error}`)
        : h_flex().gap(6).p(6).items_center().text_size(12).text_color(t.dim)
            .child(icon("spinner", 12).text_color(t.working).spin(900)).child("Rendering diagram…"));

    const bar = h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
      .child(div().font_semibold().text_size(13).child("Mermaid"))
      .child(div().flex_1().text_size(11).text_color(t.dim).truncate().child(this.cur ? `${this.cur}.mmd` : "new diagram"))
      .child(button("mb-new", "New", (_e, cx) => this.fresh(cx)))
      .child(iconButton("mb-close", "close", "Close (Esc)", () => this.close()));

    return v_flex().id("mermaid-board").track_focus(this.handle).size_full().min_h(0).bg(t.background).text_color(t.foreground).text_size(12.5)
      .on_key_down((e, cx) => {
        if (e.key === "escape") { this.close(); cx.stop_propagation(); }
        else if (e.key === "s" && (e.modifiers?.platform || e.modifiers?.control)) { this.save(cx); cx.stop_propagation(); }
      })
      .child(bar)
      .child(h_flex().w_full().flex_1().min_h(0).items_stretch().child(side).child(left).child(right));
  }
}
