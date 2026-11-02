// Post-create script per project: <repo>/.herdr/post-create.sh, run in every new
// worktree of that repo (the watcher lives in status-usage/postscripts.js).
import { View, div } from "gpui-kit";
import { v_flex, h_flex, EditorState, Editor } from "gpui-base";
import { theme, spaces, exec, readTextFile, writeTextFile, closeOverlay, props, home, settings } from "herdr";

export const TEMPLATE = `#!/bin/sh
# Runs once in each new worktree of this project (cwd = the worktree).
# Example:
# cp "$(git rev-parse --git-common-dir)/../.env" .env
# npm install
`;

export async function repoOf(folder) {
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder });
  if (r.code !== 0) return null;
  const common = r.stdout.trim();
  const main = common.endsWith("/.git") ? common.slice(0, -5) : common;
  return { main, name: main.split("/").pop(), file: `${main}/.herdr/post-create.sh` };
}

export default class ProjectScripts extends View {
  init(_props, cx) {
    this.repos = [];
    this.sel = null;
    this.saved = null; // file content on disk (null: none yet)
    this.msg = "";
    this.editor = EditorState.new({ language: "bash", value: "", line_numbers: true, font_family: settings().font_family });
    this.editor.on("change", (_e, cx) => { this.msg = ""; cx.notify(); });
    cx.spawn(async (cx) => {
      const seen = new Map();
      for (const s of spaces().filter((x) => !x.machine && x.folder)) {
        const r = await repoOf(s.folder).catch(() => null);
        if (r && !seen.has(r.main)) seen.set(r.main, r);
      }
      this.repos = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
      if (this.repos[0]) await this.pick(this.repos[0]);
      this.loaded = true;
      cx.notify();
    });
  }

  async pick(r) {
    this.sel = r;
    this.saved = await readTextFile(r.file).catch(() => null);
    this.editor.set_value(this.saved ?? TEMPLATE);
    this.msg = "";
  }

  save(cx) {
    const r = this.sel;
    if (!r) return;
    cx.spawn(async (cx) => {
      try {
        await exec("mkdir", ["-p", `${r.main}/.herdr`]);
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
    const btn = (id, label, fn, primary) => div().id(id).px(10).py(4).rounded(5).border(1).border_color(t.border)
      .text_size(12).cursor_pointer().when(primary, (el) => el.bg(t.solid).text_color(t.solid_foreground))
      .hover((s) => s.bg(primary ? t.solid : t.raised)).on_click(fn).child(label);
    return v_flex().id("ps-root").size_full().bg(t.popover).text_color(t.foreground).text_size(12.5)
      .child(h_flex().px(14).py(10).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().flex_1().font_semibold().text_size(14).child("Post-create script"))
        .child(div().text_color(t.muted).child("runs in each new worktree of the project")))
      .child(h_flex().flex_1().min_h(0)
        .child(v_flex().id("ps-repos").w(190).flex_none().overflow_y_scrollbar().p(8).gap(2).border_r(1).border_color(t.border)
          .when(this.loaded && !this.repos.length, (el) => el.child(div().p(6).text_color(t.muted).child("No git projects open")))
          .children(this.repos.map((r) => div().id(`r-${r.main}`).px(8).py(5).rounded(5).truncate().cursor_pointer()
            .when(this.sel?.main === r.main, (el) => el.bg(t.selected))
            .hover((s) => s.bg(t.hover)).on_click((_e, cx) => cx.spawn(async (cx) => { await this.pick(r); cx.notify(); })).child(r.name))))
        .child(v_flex().flex_1().min_w(0).p(10).gap(8)
          .when(Boolean(this.sel), (el) => el
            .child(div().text_size(11).text_color(t.dim).truncate().child(this.sel.file.replace(home(), "~")))
            .child(div().id("ps-editor").w_full().h(330).flex_none().border(1).border_color(t.border).rounded(6).overflow_hidden().child(Editor.new(this.editor).size_full()))
            .child(h_flex().gap(8).items_center()
              .child(div().flex_1().text_color(this.msg.startsWith("Failed") ? t.blocked : t.muted).child(this.msg || (dirty ? "Unsaved changes" : this.saved == null ? "No script yet" : "")))
              .child(btn("close", "Close", () => closeOverlay(props().overlay)))
              .child(btn("save", "Save", (_e, cx) => this.save(cx), true))))));
  }
}
