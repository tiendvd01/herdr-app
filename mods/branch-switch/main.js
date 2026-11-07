// Switch the active space's branch. Opened as a popup from the branch in the
// status bar (status-usage). Works on the space's folder
// (space-folder.js), the same one the panels show. Type to filter, ↑/↓ and
// Enter to switch; a name that matches nothing creates that branch from HEAD.
// A remote-only branch is checked out as a local tracking branch.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, Scrollbar } from "gpui-base";
import { props, closeOverlay, theme, spaces, exec, notify, setShared } from "herdr";
import { spaceFolder } from "./space-folder.js";

const ago = (s) => {
  if (!s) return "";
  const d = Date.now() / 1000 - s;
  return d < 3600 ? `${Math.max(1, Math.round(d / 60))}m` : d < 86400 ? `${Math.round(d / 3600)}h` : d < 86400 * 60 ? `${Math.round(d / 86400)}d` : `${Math.round(d / 86400 / 30)}mo`;
};

async function git(cwd, args, on) {
  const r = await exec("git", args, { cwd, on });
  return { ok: r.code === 0, out: (r.stdout ?? "").trim(), err: ((r.stderr || r.stdout) ?? "").trim() };
}

// Local branches (newest commit first), then remote-only ones: { name, ref, remote, at }.
async function branchList(cwd, on) {
  const r = await git(cwd, ["for-each-ref", "--sort=-committerdate", "--format=%(refname)%09%(committerdate:unix)", "refs/heads", "refs/remotes"], on);
  const local = [], remote = [];
  for (const line of r.out.split("\n").filter(Boolean)) {
    const [ref, at] = line.split("\t");
    if (ref.startsWith("refs/heads/")) local.push({ name: ref.slice(11), ref: ref.slice(11), remote: false, at: Number(at) || 0 });
    else {
      const short = ref.slice(13);
      const name = short.slice(short.indexOf("/") + 1);
      if (!short.endsWith("/HEAD")) remote.push({ name, ref: short, remote: true, at: Number(at) || 0 });
    }
  }
  const have = new Set(local.map((b) => b.name));
  const seen = new Set();
  return [...local, ...remote.filter((b) => !have.has(b.name) && !seen.has(b.name) && seen.add(b.name))];
}

// Branches checked out in another worktree: git refuses to switch to them.
async function elsewhere(cwd, on) {
  const top = (await git(cwd, ["rev-parse", "--show-toplevel"], on)).out;
  const list = await git(cwd, ["worktree", "list", "--porcelain"], on);
  const out = new Map();
  for (const block of list.out.split(/\n\n+/)) {
    const lines = block.split("\n");
    const path = lines.find((l) => l.startsWith("worktree "))?.slice(9);
    const b = lines.find((l) => l.startsWith("branch "))?.slice(7).replace(/^refs\/heads\//, "");
    if (path && b && path !== top) out.set(b, path);
  }
  return out;
}

export default class BranchSwitch extends View {
  init(_props, cx) {
    const space = spaces().find((s) => s.active);
    this.on = space?.machine ?? undefined;
    this.folder = spaceFolder(space);
    this.branches = undefined;
    this.current = "";
    this.used = new Map();
    this.text = "";
    this.at = 0;
    this.busy = false;
    this.err = "";
    this.input = InputState.new({ placeholder: "Switch to branch, or type a new name…" });
    this.input.on("change", (_e, cx) => { this.text = this.input.value(); this.at = 0; this.err = ""; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.go(this.choices()[this.at], cx));
    this.input.focus();
    cx.timer.after(300, () => this.input.focus());
    this.handle = cx.focus_handle();
    cx.spawn(async (cx) => {
      try {
        if (!this.folder) throw new Error("This space has no folder.");
        const cur = await git(this.folder, ["rev-parse", "--abbrev-ref", "HEAD"], this.on);
        if (!cur.ok) throw new Error("Not a git repository.");
        this.current = cur.out;
        [this.branches, this.used] = await Promise.all([branchList(this.folder, this.on), elsewhere(this.folder, this.on)]);
      } catch (e) {
        this.branches = [];
        this.err = String(e?.message ?? e);
      }
      cx.notify();
    });
  }

  close() {
    closeOverlay(props().overlay);
  }

  choices() {
    const f = this.text.trim();
    const q = f.toLowerCase();
    const list = (this.branches ?? []).filter((b) => !q || b.name.toLowerCase().includes(q));
    // The current branch first, so the list opens on where you are.
    list.sort((a, b) => (b.name === this.current) - (a.name === this.current));
    const exact = (this.branches ?? []).some((b) => b.name === f);
    return f && !exact && this.branches ? [...list, { name: f, create: true }] : list;
  }

  go(b, cx) {
    if (!b || this.busy) return;
    if (b.name === this.current && !b.create) return this.close();
    if (this.used.has(b.name)) { this.err = `"${b.name}" is checked out in ${this.used.get(b.name)}.`; return cx.notify(); }
    this.busy = true;
    this.err = "";
    cx.notify();
    const args = b.create ? ["switch", "-c", b.name] : b.remote ? ["switch", "--track", b.ref] : ["switch", b.name];
    cx.spawn(async (cx) => {
      const r = await git(this.folder, args, this.on).catch((e) => ({ ok: false, err: String(e?.message ?? e) }));
      this.busy = false;
      if (r.ok) {
        setShared("branch.switched", Date.now());
        notify({ title: b.create ? "Branch created" : "Switched branch", body: b.name, level: "success" });
        this.close();
      } else {
        this.err = r.err.split("\n").filter(Boolean).slice(0, 6).join("\n") || "git switch failed.";
      }
      cx.notify();
    });
  }

  key(e, cx) {
    if (e.key === "escape") return this.close();
    const n = this.choices().length;
    if ((e.key === "down" || e.key === "up") && n) {
      this.at = (this.at + (e.key === "down" ? 1 : n - 1)) % n;
      cx.stop_propagation();
      cx.notify();
    }
  }

  render() {
    const t = theme();
    const rows = this.choices();
    this.at = Math.min(this.at, Math.max(0, rows.length - 1));
    const row = (b, i) => {
      const on = i === this.at;
      const cur = !b.create && b.name === this.current;
      const used = this.used.has(b.name);
      const note = b.create ? "new · from HEAD" : cur ? "current" : used ? "other worktree" : b.remote ? "remote" : ago(b.at);
      return h_flex()
        .id(`bs-${i}`)
        .flex_none()
        .h(30)
        .px(10)
        .gap(8)
        .items_center()
        .rounded(6)
        .cursor_pointer()
        .when(on, (el) => el.bg(t.selected))
        .when(!on, (el) => el.hover((s) => s.bg(t.hover)))
        .on_click((_e, cx) => { this.at = i; this.go(b, cx); })
        .child(div().w(12).flex_none().text_color(t.accent).child(cur ? "✓" : b.create ? "+" : ""))
        .child(div().flex_1().min_w(0).truncate().text_color(used ? t.dim : t.foreground).when(cur, (d) => d.font_semibold()).child(b.create ? `Create branch "${b.name}"` : b.name))
        .child(div().flex_none().text_size(11).text_color(b.create ? t.accent : t.dim).child(note));
    };
    return v_flex()
      .id("branch-switch")
      .track_focus(this.handle)
      .on_key_down((e, cx) => this.key(e, cx))
      .w_full()
      .p(12)
      .gap(8)
      .bg(t.popover)
      .text_size(12.5)
      .child(h_flex().gap(6).items_center()
        .child(svg("mods/workspace-chrome/git-branch.svg").size(13).text_color(t.muted))
        .child(div().flex_1().min_w(0).truncate().font_semibold().text_color(t.foreground).child(this.current ? `Switch branch · ${this.current}` : "Switch branch"))
        .when(this.busy, (el) => el.child(svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.working).spin(900))))
      .child(Input.new(this.input).h(30).px(10).items_center().rounded(6).border(1).border_color(t.accent).bg(t.background).text_color(t.foreground))
      .when(Boolean(this.err), (el) => el.child(div().flex_none().p(8).rounded(6).bg(t.raised).text_size(11.5).text_color(t.blocked).child(this.err)))
      .child(
        // A popup is only as tall as its content, so the list needs a real height.
        div().relative().flex_none().h(Math.max(36, Math.min(300, rows.length * 30)))
          .child(v_flex().id("bs-list").size_full().overflow_y_scroll()
            .when(this.branches === undefined, (el) => el.child(div().p(10).text_color(t.muted).child("…")))
            .children(rows.map(row))
            .when(this.branches !== undefined && rows.length === 0 && !this.err, (el) => el.child(div().p(10).text_color(t.dim).child("No branches."))))
          .child(Scrollbar.vertical("bs-list").absolute().inset_0()),
      )
      .child(h_flex().justify_end().text_size(11).text_color(t.dim).child("↑↓ choose · ↵ switch · esc close"));
  }
}
