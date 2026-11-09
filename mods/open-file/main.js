// cmd-p: open a file in a new tab, shown by the Files preview (mod file-icons; markdown rendered).
//  - Plain text: fuzzy search under the focused terminal's folder (rg lists, fzf ranks).
//  - A path (starts with /, ~, ./ or ../): browse that folder; fzf filters the part after the last /.
//    Folders end with "/": Enter or Tab goes into one, Enter on a file opens it.
// Up/Down move, Esc closes.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, run, props, closeOverlay, theme } from "herdr";
import { activePlace } from "./space-folder.js";

const SHOWN = 30;
const isPath = (q) => /^(~|\.{1,2})(\/|$)|^\//.test(q);
const FZF = 'command -v fzf >/dev/null';

export default class OpenFile extends View {
  init(_props, cx) {
    const place = activePlace();
    this.cwd = place.cwd; this.on = place.on;
    this.matches = []; this.selected = 0; this.version = 0; this.error = this.cwd ? null : "No folder: focus a terminal first.";
    this.input = InputState.new({ placeholder: "Open file… (or a path: /, ~/, ./, ../)" });
    this.input.on("change", (_e, cx) => this.search(cx));
    this.input.on("submit", () => this.open(this.matches[this.selected]));
    this.input.focus();
    cx.timer.after(600, () => this.input.focus());
    this.handle = cx.focus_handle();
    this.search(cx);
  }

  search(cx) {
    if (!this.cwd) return;
    const version = ++this.version, query = this.input.value().trim();
    cx.spawn(async (cx) => {
      try {
        let matches;
        if (isPath(query)) {
          // dir part (kept for display) + the name part fzf filters; the shell resolves ~ and prints the real folder first.
          const bare = /^(~|\.{1,2})$/.test(query), cut = query.lastIndexOf("/") + 1;
          const dir = bare ? query : query.slice(0, cut), term = bare ? "" : query.slice(cut), shown = bare ? query + "/" : dir;
          const script = 'd=$1; q=$2; case "$d" in "~") d="$HOME";; "~/"*) d="$HOME/${d#\\~/}";; esac; cd "$d" 2>/dev/null || exit 3; pwd; ' +
            `if [ -n "$q" ] && ${FZF}; then ls -1Ap | fzf --filter "$q" --tiebreak=length,index; else ls -1Ap; fi | head -n ${SHOWN}`;
          const r = await exec("sh", ["-c", script, "sh", dir || "/", term], { cwd: this.cwd, on: this.on });
          if (version !== this.version) return;
          if (r.code === 3) { matches = []; this.error = "No such folder"; }
          else {
            const [root, ...names] = r.stdout.split("\n").filter(Boolean);
            matches = names.map((name) => ({ display: shown + name, abs: root.replace(/\/$/, "") + "/" + name.replace(/\/$/, ""), dir: name.endsWith("/") }));
            this.error = null;
          }
        } else {
          const script = `q=$1; shift; if [ -n "$q" ] && ${FZF}; then rg "$@" 2>/dev/null | fzf --filter "$q" --scheme=path --tiebreak=length,index; else rg "$@" 2>/dev/null; fi | head -n ${SHOWN}`;
          const r = await exec("sh", ["-c", script, "sh", query, "--files", "--hidden", "--glob", "!.git", "--glob", "!node_modules"], { cwd: this.cwd, on: this.on });
          if (version !== this.version) return;
          matches = r.stdout.split("\n").filter(Boolean).map((file) => ({ display: file, rel: file, dir: false }));
          this.error = null;
        }
        this.matches = matches; this.selected = 0;
      } catch (e) {
        if (version !== this.version) return;
        this.error = String(e?.message ?? e);
      }
      cx.notify();
    });
  }

  // A folder is entered (the field takes its path); a file goes to the Files panel.
  open(m) {
    if (!m) return;
    if (m.dir) { this.input.set_value(m.display); this.input.focus(); return; }
    // Under the focused folder: joined to it; elsewhere already absolute. Shown in a new tab (a fixed
    // file viewer, mod file-icons), not in the Files panel, which keeps following the current folder.
    const path = m.rel ? this.cwd.replace(/\/$/, "") + "/" + m.rel : m.abs;
    closeOverlay(props().overlay);
    run("tab.new", { name: path.split("/").pop(), mod: "file-icons", props: { file: path, on: this.on } });
  }

  key(e, cx) {
    if (e.key === "escape") { closeOverlay(props().overlay); cx.stop_propagation(); }
    else if (e.key === "down" || (e.key === "n" && e.modifiers?.control)) { this.selected = Math.min(this.selected + 1, this.matches.length - 1); cx.notify(); cx.stop_propagation(); }
    else if (e.key === "up" || (e.key === "p" && e.modifiers?.control)) { this.selected = Math.max(this.selected - 1, 0); cx.notify(); cx.stop_propagation(); }
    else if (e.key === "tab") {
      const m = this.matches[this.selected];
      if (m && isPath(this.input.value().trim())) this.input.set_value(m.display);
      cx.stop_propagation();
    }
  }

  render() {
    const t = theme();
    return v_flex().id("open-file").track_focus(this.handle).on_key_down((e, cx) => this.key(e, cx))
      .size_full().min_h(0).p(12).gap(8).bg(t.popover).text_color(t.foreground)
      .child(Input.new(this.input).h(36).px(10).rounded(9).border_1().border_color(t.accent).bg(t.background).text_size(13).text_color(t.foreground))
      .child(div().text_size(10).text_color(t.dim).truncate().child(this.cwd || ""))
      .when(Boolean(this.error), el => el.child(div().text_size(12).text_color(t.blocked).child(this.error)))
      .child(v_flex().id("open-file-list").flex_1().min_h(0).overflow_y_scrollbar().children(this.matches.map((m, i) => {
        const trimmed = m.display.replace(/\/$/, ""), name = trimmed.split("/").pop() + (m.dir ? "/" : ""), dir = trimmed.slice(0, trimmed.length - (name.length - (m.dir ? 1 : 0)));
        return h_flex().id("open-file-" + i).gap(8).px(10).py(6).rounded(6).items_center().cursor_pointer().text_size(12.5)
          .bg(i === this.selected ? t.selected : t.popover).hover(s => s.bg(t.hover))
          .on_click(() => this.open(m))
          .child(div().flex_shrink_0().text_color(m.dir ? t.accent : t.foreground).child(name))
          .child(div().min_w(0).truncate().text_size(11).text_color(t.dim).child(dir));
      })));
  }
}
