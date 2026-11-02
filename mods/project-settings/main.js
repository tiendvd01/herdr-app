// Project Settings page (content area): per git project, the worktree setup
// script <repo>/.herdr/post-create.sh, run in every new worktree of the repo
// (the watcher lives in status-usage/postscripts.js).
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, EditorState, Editor } from "gpui-base";
import { theme, spaces, exec, readTextFile, writeTextFile, home, settings, run } from "herdr";

const TEMPLATE = `#!/bin/sh
# Runs once in each new worktree of this project (cwd = the worktree).
# Example:
# cp "$(git rev-parse --git-common-dir)/../.env" .env
# npm install
`;

async function repoOf(folder) {
  const r = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder });
  if (r.code !== 0) return null;
  const common = r.stdout.trim();
  const main = common.endsWith("/.git") ? common.slice(0, -5) : common;
  return { main, name: main.split("/").pop(), file: `${main}/.herdr/post-create.sh` };
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
    this.scan(cx);
    cx.timer.every(5000, (cx) => this.scan(cx));
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
          .child(v_flex().gap(4)
            .child(div().font_semibold().child("Worktree script"))
            .child(div().text_color(t.muted).child("Runs once in every new worktree of this project (cwd = the worktree). Saved to:"))
            .child(div().text_size(11.5).text_color(t.dim).truncate().child(this.sel.file.replace(home(), "~"))))
          .child(div().id("pset-editor").w_full().flex_1().min_h(120).border(1).border_color(t.border).rounded(8).overflow_hidden().child(Editor.new(this.editor).size_full()))
          .child(h_flex().gap(8).items_center()
            .child(div().flex_1().text_color(this.msg.startsWith("Failed") ? t.blocked : t.muted)
              .child(this.msg || (dirty ? "Unsaved changes" : this.saved == null ? "No script yet" : "")))
            .child(btn("pset-reset", "Revert", (_e, cx) => cx.spawn(async (cx) => { await this.pick(this.sel); cx.notify(); })))
            .child(btn("pset-save", "Save", (_e, cx) => this.save(cx), true)))));
  }
}
