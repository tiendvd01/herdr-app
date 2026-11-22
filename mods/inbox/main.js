// Inbox (spec 037): news on your open PRs only (a review, new comments, a red CI or a conflict), one
// entry per PR, updated in place. Two copies of this mod: a floating button over the terminal area
// (layout `floating`, the only copy that polls and posts toasts) and the dialog it opens with
// mod.open (props().overlay set), which draws the list. Each copy has its own localStorage, so the
// entries live in shared("inbox.items"); shared("inbox.dialog") is the dialog's overlay id while open.
// Clicking an entry asks the floating copy (shared "inbox.goto" + command) to open Pull requests
// (pr-flow) on that PR, since the dialog's own tasks end when it closes.
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, run, theme, exec, notify, shared, setShared, nextCommand, props, closeOverlay } from "herdr";
import { createGh, parsePrUrl } from "./gh.js";
import { ciSummary } from "./status.js";
import { repoFromRemote, githubHostChecker } from "./github.js";
import { spaceFolder } from "./space-folder.js";
import { btn, iconButton, dialogFrame } from "./panel-ui.js";

const MOD = "inbox";
const PR_POLL_MS = 120_000; // each open PR, at most this often
const LIST_MS = 300_000; // your open PRs, re-listed
const KEEP = 150;
const DONE_KEEP_MS = 7 * 86_400_000; // done entries go on their own after this
const CI_SETTINGS = { ciWaitMs: 120_000, aiChecks: [] };

const icon = (name, size, color) => svg(`mods/${MOD}/${name}.svg`).size(size).flex_none().text_color(color);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) ?? "") ?? d; } catch { return d; } };
// PR entries only: agent entries from before spec 037 are dropped.
const prOnly = (list) => (Array.isArray(list) ? list : []).filter((x) => x?.kind === "pr");
const countText = (n) => (n > 99 ? "99+" : String(n));
function ago(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

// What changed on a PR between two looks, newest facts only. `me`: your logins.
function prEvents(old, now, me) {
  const out = [];
  for (const [login, r] of Object.entries(now.reviews)) {
    if (me.includes(login) || old.reviews[login] === r) continue;
    const state = r.split("@")[0];
    if (state === "CHANGES_REQUESTED") out.push({ text: `${login} requested changes`, badge: "changes" });
    else if (state === "APPROVED") out.push({ text: `${login} approved`, badge: "approved" });
    else if (state === "COMMENTED") out.push({ text: `${login} reviewed`, badge: "comment" });
  }
  if (now.comments > old.comments) {
    const n = now.comments - old.comments;
    out.push({ text: `${n} new comment${n > 1 ? "s" : ""} · ${now.open} unresolved`, badge: "comment" });
  }
  if (now.ci === "failed" && old.ci !== "failed") out.push({ text: `CI failed: ${now.failed.join(", ") || "?"}`, badge: "ci" });
  if (now.conflict && !old.conflict) out.push({ text: "Conflicts with base", badge: "conflict" });
  return out;
}

// Each PR event's mark: a small glyph and how bad it is. The entry's corner badge is its worst event's.
const BADGE = {
  changes: { icon: "cross", tone: "bad" },
  ci: { icon: "cross", tone: "bad" },
  conflict: { icon: "cross", tone: "bad" },
  comment: { icon: "comment", tone: "warn" },
  approved: { icon: "check", tone: "ok" },
};
const TONE_RANK = { bad: 3, warn: 2, ok: 1 };
// Green for approved, as Pull requests (pr-flow) draws it; the theme's "done" is often blue.
const toneColor = (t, tone) => (tone === "ok" ? t.ansi2 ?? t.done : t[{ bad: "blocked", warn: "working" }[tone]]) ?? t.dim;

export default class Inbox extends View {
  init(_props, cx) {
    this.dialog = props()?.overlay ?? null;
    this.showDone = false;
    this.hovered = null;
    if (this.dialog) {
      setShared("inbox.dialog", this.dialog);
      return;
    }
    // The floating copy: seeds the shared list once (from an older copy's storage), then polls.
    if (shared("inbox.items") == null) setShared("inbox.items", prOnly(load("items", [])));
    else if (shared("inbox.items").some((x) => x?.kind !== "pr")) setShared("inbox.items", prOnly(shared("inbox.items")));
    this.prSnap = load("prs", {}); // url -> snapshot (see snapshot())
    this.gh = createGh(exec);
    this.isGithubHost = githubHostChecker(exec);
    this.repos = new Map(); // machine:folder -> repo or null
    this.urls = [];
    this.listedAt = -Infinity;
    this.fetchedAt = {};
    this.me = null;
    this.busy = false;
    this.pollPrs(cx);
    cx.timer.every(30_000, (cx) => this.pollPrs(cx));
    // "inbox.open-latest" (the PR toast's click), "inbox.done-all" (keys.json), "inbox.goto" (the dialog's row click).
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        if (c === "open-latest") { const it = this.pull().find((x) => !x.done); if (it) this.open(it, cx); }
        else if (c === "done-all") this.doneAll();
        else if (c === "goto") {
          const g = shared("inbox.goto");
          const it = g && Date.now() - g.at < 10_000 ? this.pull().find((x) => x.key === g.key) : null;
          if (it) this.open(it, cx);
        }
        cx.notify();
      }
    });
  }

  close() {
    if (this.dialog && shared("inbox.dialog") === this.dialog) setShared("inbox.dialog", null);
  }

  // The shared list, as a private copy to change and save().
  pull() {
    this.items = JSON.parse(JSON.stringify(prOnly(shared("inbox.items"))));
    return this.items;
  }

  save() {
    const now = Date.now();
    this.items = this.items.filter((x) => !x.done || now - x.at < DONE_KEEP_MS).slice(0, KEEP);
    setShared("inbox.items", this.items);
  }

  // One entry per key: a new event rewrites it, unread again, on top.
  upsert(key, fields) {
    const old = this.items.find((x) => x.key === key);
    this.items = [{ ...old, ...fields, key, at: Date.now(), read: false, done: false }, ...this.items.filter((x) => x.key !== key)];
  }

  patch(key, fields) {
    const it = this.items.find((x) => x.key === key);
    if (!it || Object.entries(fields).every(([k, v]) => it[k] === v)) return false;
    Object.assign(it, fields);
    return true;
  }

  // Done: out of the way, into the folded Done group. Removing (from Done) drops it for good.
  markDone(key) {
    return this.patch(key, { done: true, read: true });
  }

  // Changes on the shared list: pull, change, save, all in one go so the other copy's writes survive.
  edit(fn) {
    this.pull();
    if (fn() !== false) this.save();
  }

  doneAll() {
    this.edit(() => { for (const it of this.items) Object.assign(it, { done: true, read: true }); });
  }

  // ---------- PRs: your open PRs, polled in the background (floating copy only) ----------
  snapshot(pr, threads, headSeenAt) {
    const reviews = {};
    for (const r of pr.latestReviews ?? []) if (r.author?.login) reviews[r.author.login] = `${r.state}@${r.submittedAt}`;
    const open = (threads ?? []).filter((t) => !t.isResolved && !t.isOutdated);
    const comments = open.reduce((n, t) => n + (t.comments?.nodes ?? []).filter((c) => !(this.me ?? []).includes(c.author?.login)).length, 0);
    const ci = ciSummary(pr, { now: Date.now(), headSeenAt }, CI_SETTINGS);
    return {
      title: pr.title, number: pr.number, state: pr.state, reviews, comments, open: open.length,
      ci: ci.kind, failed: ci.failed.map((c) => c.name), conflict: pr.mergeable === "CONFLICTING",
      headSeenAt,
    };
  }

  pollPrs(cx) {
    if (this.busy) return;
    this.busy = true;
    cx.spawn(async (cx) => {
      const looks = []; // [url, pr, extra], applied to the shared list in one go at the end
      let gone = [];
      try {
        if (!this.me) this.me = await this.gh.me().catch(() => null);
        if (Date.now() - this.listedAt >= LIST_MS) {
          const urls = await this.gh.mine("open").catch(() => null);
          if (urls) { this.urls = urls; this.listedAt = Date.now(); }
        }
        const due = this.urls.filter((u) => Date.now() - (this.fetchedAt[u] ?? -Infinity) >= PR_POLL_MS);
        // One query per 10 PRs of a repo (spec 022), up to 4 repos at a time.
        const byRepo = new Map();
        for (const url of due) {
          const p = parsePrUrl(url);
          if (p) byRepo.set(p.repo, [...(byRepo.get(p.repo) ?? []), { url, number: p.number }]);
        }
        const repos = [...byRepo];
        for (let i = 0; i < repos.length; i += 4) {
          await Promise.all(repos.slice(i, i + 4).map(async ([repo, prs]) => {
            const got = await this.gh.readPrs(repo, prs.map((p) => p.number)).catch(() => new Map());
            for (const p of prs) {
              this.fetchedAt[p.url] = Date.now();
              const r = got.get(Number(p.number));
              if (r?.pr) looks.push([p.url, r.pr, r]);
            }
          }));
        }
        // Gone from your open list: merged or closed. Its entry is done, its snapshot dropped.
        if (this.listedAt >= 0) gone = Object.keys(this.prSnap).filter((url) => !this.urls.includes(url));
      } finally {
        this.busy = false;
      }
      let changed = false;
      this.edit(() => {
        for (const [url, pr, extra] of looks) changed = this.takePr(url, pr, extra) || changed;
        for (const url of gone) { delete this.prSnap[url]; changed = this.markDone(`pr:${url}`) || changed; }
        return changed;
      });
      localStorage.setItem("prs", JSON.stringify(this.prSnap));
      if (changed) cx.notify();
    });
  }

  // A fresh look at one PR; true when the inbox changed.
  takePr(url, pr, extra) {
    const old = this.prSnap[url];
    const headSeenAt = old?.headSeenAt ?? (extra?.headCommittedAt ? Date.parse(extra.headCommittedAt) : Date.now());
    const now = this.snapshot(pr, extra?.threads, headSeenAt);
    this.prSnap[url] = now;
    if (!old) return false; // first look: what's there already isn't news
    const events = prEvents(old, now, this.me ?? []);
    if (!events.length) return false;
    const badge = events.map((e) => e.badge).sort((a, b) => TONE_RANK[BADGE[b].tone] - TONE_RANK[BADGE[a].tone])[0];
    const tone = BADGE[badge].tone;
    const repo = parsePrUrl(url)?.repo ?? "";
    const title = `#${now.number} ${now.title}`;
    const body = events.map((e) => e.text).join(" · ");
    this.upsert(`pr:${url}`, { kind: "pr", title, body, events, badge, sub: repo, tone, target: { kind: "pr", url, repo } });
    notify({ title, body, level: tone === "bad" ? "error" : tone === "warn" ? "warning" : "success", action: { name: "inbox.open-latest" } });
    return true;
  }

  // ---------- going there (floating copy) ----------
  async repoOf(space) {
    const folder = spaceFolder(space);
    if (!folder) return null;
    const key = `${space.machine ?? ""}:${folder}`;
    if (!this.repos.has(key)) {
      const r = await exec("git", ["--no-optional-locks", "remote", "get-url", "origin"], { cwd: folder, on: space.machine ?? undefined }).catch(() => null);
      this.repos.set(key, r?.code === 0 ? await repoFromRemote(r.stdout, { isGithubHost: this.isGithubHost, on: space.machine }) : null);
    }
    return this.repos.get(key);
  }

  open(it, cx) {
    this.edit(() => this.patch(it.key, { read: true }));
    const t = it.target;
    if (t?.kind !== "pr") return;
    cx.spawn(async (cx) => {
      // The space of that repo, the shown one first; none found keeps the shown space.
      const all = spaces();
      const ordered = [...all.filter((s) => s.active), ...all.filter((s) => !s.active)];
      let space = null;
      for (const s of ordered) if ((await this.repoOf(s)) === t.repo) { space = s; break; }
      // Pull requests is a dialog: open it unless it is open already (mod.open again would close it).
      const show = () => {
        setShared("pr-flow.goto", { url: t.url, at: Date.now() });
        if (shared("pr-flow.dialog") == null) run("mod.open", { name: "pr-flow" });
      };
      // Open after the space switch has settled (my-tabs restores the space's own panel then).
      if (space && !space.active) {
        run("space.select", { id: space.id });
        cx.timer.after(600, () => show());
      } else show();
      cx.notify();
    });
  }

  // From the dialog: the floating copy opens it, then this dialog goes.
  goto(it) {
    setShared("inbox.goto", { key: it.key, at: Date.now() });
    closeOverlay(this.dialog);
    run("inbox.goto");
  }

  // ---------- drawing ----------
  // A PR glyph with its worst event's mark in the corner.
  mark(t, it) {
    const base = icon("pull-request", 14, it.done ? t.dim : t.foreground);
    const b = BADGE[it.badge] ?? { icon: it.tone === "ok" ? "check" : it.tone === "bad" ? "cross" : "comment", tone: it.tone };
    const corner = div().absolute().right(-4).bottom(-4).size(10).rounded(5).border(1.5).border_color(t.background)
      .flex().items_center().justify_center().bg(toneColor(t, b.tone)).child(icon(b.icon, 6, t.background));
    return div().relative().size(16).flex_none().flex().items_center().justify_center().child(base).child(corner);
  }

  // The second line: every event with its own small mark, so an approve next to new comments shows both.
  detail(t, it) {
    const line = div().flex_none().truncate().text_size(11).text_color(t.dim);
    if (!it.events?.length) return line.child([it.body, it.sub].filter(Boolean).join(" · "));
    return h_flex().min_w(0).gap(8).items_center().overflow_hidden()
      .children(it.events.map((e) => {
        const b = BADGE[e.badge];
        return h_flex().flex_none().gap(3).items_center()
          .when(Boolean(b), (el) => el.child(icon(b.icon, 10, toneColor(t, b.tone))))
          .child(div().text_size(11).text_color(t.dim).child(e.text));
      }))
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(it.sub ?? ""));
  }

  row(t, it, now) {
    const unread = !it.read && !it.done;
    const hovered = this.hovered === it.key;
    return h_flex()
      .id(`in-${it.key}`)
      .px(10)
      .py(6)
      .gap(10)
      .flex_none()
      .rounded(8)
      .items_start()
      .cursor_pointer()
      .hover((s) => s.bg(t.hover))
      .on_hover((on, cx) => {
        if (on) this.hovered = it.key;
        else if (this.hovered === it.key) this.hovered = null;
        cx.notify();
      })
      .on_click(() => this.goto(it))
      .child(div().pt(1).pr(2).child(this.mark(t, it)))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(div().truncate().text_size(12.5).when(unread, (el) => el.font_semibold()).text_color(it.done ? t.dim : unread ? t.foreground : t.muted).child(it.title || "?"))
        .child(this.detail(t, it)))
      .child(v_flex().flex_none().items_end().gap(3)
        .child(hovered
          ? (it.done
            ? iconButton(`rm-${it.key}`, "close", "Remove", (_e, cx) => { cx.stop_propagation(); this.edit(() => { this.items = this.items.filter((x) => x.key !== it.key); }); this.hovered = null; cx.notify(); }, { small: true })
            : iconButton(`mark-${it.key}`, "check", "Mark as done", (_e, cx) => { cx.stop_propagation(); this.edit(() => this.markDone(it.key)); this.hovered = null; cx.notify(); }, { small: true }))
          : div().text_size(10.5).text_color(t.dim).child(ago(now - it.at)))
        .when(unread, (el) => el.child(div().size(6).rounded(3).bg(t.accent ?? t.working))));
  }

  // The floating copy: one button, the unread count beside it. Herdr draws the frame and does the dragging.
  renderButton(t, unread) {
    const open = shared("inbox.dialog") != null;
    const pill = unread > 0
      ? div().min_w(16).h(16).px(4).rounded(8).bg(t.blocked).text_size(10).font_bold().text_color(t.background).flex().items_center().justify_center().child(countText(unread))
      : null;
    return h_flex().px(4).items_center()
      .child(btn("inbox-fab", { kind: "icon", icon: `mods/${MOD}/inbox.svg`, extra: pill, on: open,
        tip: unread ? `Inbox · ${unread} unread` : "Inbox · PR news",
        color: unread ? t.foreground : t.dim,
        action: () => run("mod.open", { name: MOD }) }));
  }

  render(_cx) {
    const t = theme();
    const items = this.pull();
    const live = items.filter((x) => !x.done);
    const unread = live.filter((x) => !x.read).length;
    if (!this.dialog) return this.renderButton(t, unread);

    const now = Date.now();
    const done = items.filter((x) => x.done);
    const header = h_flex().px(16).h(48).flex_none().items_center().gap(8).border_b(1).border_color(t.border)
      .child(icon("inbox", 15, t.muted))
      .child(div().text_size(13.5).font_semibold().text_color(t.foreground).child("Inbox"))
      .when(unread > 0, (el) => el.child(div().px(6).h(17).rounded(9).bg(t.blocked + "26").text_size(10.5).font_semibold().text_color(t.blocked).flex().items_center().child(countText(unread))))
      .child(div().flex_1())
      .when(live.length > 0, (el) => el.child(iconButton("in-readall", "check", "Mark all as done", (_e, cx) => { this.doneAll(); cx.notify(); })))
      .child(iconButton("in-close", "close", "Close", () => closeOverlay(this.dialog)));

    const doneHeader = h_flex().id("in-done").px(10).pt(8).h(30).flex_none().gap(6).items_center().text_size(11).font_medium().text_color(t.dim).cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => { this.showDone = !this.showDone; cx.notify(); })
      .child(icon(this.showDone ? "chevron-down" : "chevron-right", 11, t.dim))
      .child(div().child("Done"))
      .child(div().child(String(done.length)))
      .child(div().flex_1())
      .when(this.showDone, (el) => el.child(btn("in-clear", { kind: "ghost", size: "sm", label: "Clear", tip: "Remove every done entry",
        action: (_e, cx) => { cx.stop_propagation(); this.edit(() => { this.items = this.items.filter((x) => !x.done); }); cx.notify(); } })));

    // Opened with frame "none": this is the dialog's only frame, the kit's.
    // Esc: Herdr closes the top dialog.
    return dialogFrame(v_flex().id("in-root").size_full()).bg(t.background).text_color(t.foreground).text_size(13)
      .child(header)
      .when(live.length === 0, (el) => el.child(div().px(18).pt(14).pb(6).text_size(12).text_color(t.dim)
        .child("No PR news yet. Reviews, comments, failed CI and conflicts on your open PRs show up here.")))
      .child(v_flex().id("in-list").flex_1().min_h(0).p(8).overflow_y_scrollbar()
        .children(live.map((it) => this.row(t, it, now)))
        .when(done.length > 0, (el) => el.child(doneHeader))
        .when(this.showDone, (el) => el.children(done.map((it) => this.row(t, it, now)))));
  }
}
