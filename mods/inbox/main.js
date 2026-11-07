// Inbox: one list of what wants you. Agents that need you or finished, and your open PRs that got a
// review, new comments, a red CI or a conflict. Each entry goes where it's about: an agent to its
// pane, a PR to Pull requests (pr-flow) open on that PR. One entry per agent and per PR, updated in place.
// Reads GitHub only; the PR code (gh, status) is pr-flow's.
import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, spaces, run, theme, exec, notify, setShared, nextCommand, layout } from "herdr";
import { createGh, parsePrUrl } from "./gh.js";
import { ciSummary } from "./status.js";
import { repoFromRemote, githubHostChecker } from "./github.js";
import { spaceFolder } from "./space-folder.js";

const MOD = "inbox";
const PR_POLL_MS = 120_000; // each open PR, at most this often
const LIST_MS = 300_000; // your open PRs, re-listed
const KEEP = 150;
const DONE_KEEP_MS = 7 * 86_400_000; // done entries go on their own after this
const CI_SETTINGS = { ciWaitMs: 120_000, aiChecks: [] };

const icon = (name, size, color) => svg(`mods/${MOD}/${name}.svg`).size(size).flex_none().text_color(color);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) ?? "") ?? d; } catch { return d; } };
const clean = (s) => String(s ?? "").replace(/^[^\p{L}\p{N}#]+/u, "").trim();

function find(node, id) {
  if (node?.id === id) return node;
  for (const c of node?.children ?? []) { const f = find(c, id); if (f) return f; }
  return null;
}
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

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
    this.items = load("items", []);
    this.showDone = false;
    this.prSnap = load("prs", {}); // url -> snapshot (see snapshot())
    this.prev = null; // address -> status, from the last render
    this.hovered = null;
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
    cx.timer.every(60_000, (cx) => cx.notify()); // "5m" moves on
    // "inbox.open-latest" (the PR toast's click), "inbox.done-all", for keys.json too.
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        if (c === "open-latest") { const it = this.items.find((x) => !x.done); if (it) this.open(it, cx); }
        else if (c === "done-all") this.doneAll();
        cx.notify();
      }
    });
  }

  save() {
    const now = Date.now();
    this.items = this.items.filter((x) => !x.done || now - x.at < DONE_KEEP_MS).slice(0, KEEP);
    localStorage.setItem("items", JSON.stringify(this.items));
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

  remove(key) {
    const before = this.items.length;
    this.items = this.items.filter((x) => x.key !== key);
    return this.items.length !== before;
  }

  doneAll() {
    for (const it of this.items) Object.assign(it, { done: true, read: true });
    this.save();
  }

  clearDone() {
    this.items = this.items.filter((x) => !x.done);
    this.save();
  }

  // ---------- agents: from agents() on each render; no fetching, so no cx.notify ----------
  trackAgents(list) {
    const first = this.prev === null;
    const prev = this.prev ?? {};
    this.prev = Object.fromEntries(list.map((a) => [a.address, a.status]));
    let dirty = false;
    for (const a of list) {
      const key = `agent:${a.address}`;
      const was = prev[a.address];
      const name = clean(a.title) && clean(a.title) !== a.program?.name ? clean(a.title) : a.tab_name;
      const where = [a.space_name, a.program?.name].filter(Boolean).join(" · ");
      const target = { kind: "agent", address: a.address, pane: a.pane };
      const pic = a.program?.icon ? { icon: a.program.icon, tint: a.program.tint } : null;
      if (!first && a.status === "blocked" && was !== "blocked") {
        this.upsert(key, { kind: "attention", title: name, body: `Needs you · ${where}`, tone: "bad", pic, target });
        dirty = true;
      } else if (!first && was !== undefined && a.status === "done" && was !== "done") {
        this.upsert(key, { kind: "done", title: name, body: `Finished · ${where}`, tone: "ok", pic, target });
        dirty = true;
      }
      // Looking at it reads it; it going back to work settles a "needs you".
      if (a.focused) dirty = this.patch(key, { read: true }) || dirty;
      if (a.status === "working" && this.items.find((x) => x.key === key)?.kind === "attention") dirty = this.markDone(key) || dirty;
    }
    if (dirty) this.save();
  }

  // ---------- PRs: your open PRs, polled in the background ----------
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
      let changed = false;
      try {
        if (!this.me) this.me = await this.gh.me().catch(() => null);
        if (Date.now() - this.listedAt >= LIST_MS) {
          const urls = await this.gh.mine("open").catch(() => null);
          if (urls) { this.urls = urls; this.listedAt = Date.now(); }
        }
        const due = this.urls.filter((u) => Date.now() - (this.fetchedAt[u] ?? -Infinity) >= PR_POLL_MS);
        for (let i = 0; i < due.length; i += 4) {
          const results = await Promise.all(due.slice(i, i + 4).map(async (url) => {
            const [pr, extra] = await Promise.all([this.gh.fetchPr(url), this.gh.fetchThreads(url)]).catch(() => [null, null]);
            this.fetchedAt[url] = Date.now();
            return { url, pr, extra };
          }));
          for (const { url, pr, extra } of results) if (pr && this.takePr(url, pr, extra)) changed = true;
        }
        // Gone from your open list: merged or closed. Its entry is done, its snapshot dropped.
        for (const url of Object.keys(this.prSnap)) {
          if (this.urls.includes(url) || this.listedAt < 0) continue;
          delete this.prSnap[url];
          changed = this.markDone(`pr:${url}`) || changed;
        }
        localStorage.setItem("prs", JSON.stringify(this.prSnap));
      } finally {
        this.busy = false;
      }
      if (changed) { this.save(); cx.notify(); }
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

  // ---------- going there ----------
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
    this.patch(it.key, { read: true });
    this.save();
    const t = it.target;
    if (t?.kind === "agent") {
      if (agents().some((a) => a.address === t.address)) run("agent.focus", { terminal: t.address });
      else notify({ title: "That agent has closed", body: it.title, level: "info", timeout: 3000 });
      return;
    }
    if (t?.kind !== "pr") return;
    cx.spawn(async (cx) => {
      // The space of that repo, the shown one first; none found keeps the shown space.
      const all = spaces();
      const ordered = [...all.filter((s) => s.active), ...all.filter((s) => !s.active)];
      let space = null;
      for (const s of ordered) if ((await this.repoOf(s)) === t.repo) { space = s; break; }
      const show = () => {
        run("layout.select", { stack: "panel-body", child: "prs" });
        run("layout.show", { id: "panel" });
        setShared("pr-flow.goto", { url: t.url, at: Date.now() });
      };
      // my-tabs restores each space's own panel right after a switch; open ours after that.
      if (space && !space.active) {
        run("space.select", { id: space.id });
        cx.timer.after(600, () => show());
      } else show();
      cx.notify();
    });
  }

  // ---------- drawing ----------
  // What it is (a PR, or the agent's own program icon), with how it stands in the corner.
  mark(t, it) {
    let base;
    if (it.kind === "pr") base = icon("pull-request", 14, it.done ? t.dim : t.foreground);
    else if (it.pic?.icon) base = it.pic.tint ? svg(it.pic.icon).size(14).flex_none().text_color(t.foreground) : image(it.pic.icon).w(14).h(14).flex_none();
    else base = icon("terminal", 14, t.muted);
    const ring = (el) => el.absolute().right(-4).bottom(-4).size(10).rounded(5).border(1.5).border_color(t.chrome).flex().items_center().justify_center();
    let corner;
    if (it.kind === "attention") corner = ring(div()).bg(t.blocked).text_size(7).font_bold().text_color(t.chrome).child("!");
    else if (it.kind === "done") corner = ring(div()).bg(t.done);
    else {
      // Entries from before badges: guess from the tone.
      const b = BADGE[it.badge] ?? { icon: it.tone === "ok" ? "check" : it.tone === "bad" ? "cross" : "comment", tone: it.tone };
      corner = ring(div()).bg(toneColor(t, b.tone)).child(icon(b.icon, 6, t.chrome));
    }
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
      .px(8)
      .py(5)
      .gap(8)
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
      .on_click((_e, cx) => { this.open(it, cx); cx.notify(); })
      .child(div().pt(1).pr(2).child(this.mark(t, it)))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(div().truncate().text_size(12.5).when(unread, (el) => el.font_semibold()).text_color(it.done ? t.dim : unread ? t.foreground : t.muted).child(it.title || "?"))
        .child(this.detail(t, it)))
      .child(v_flex().flex_none().items_end().gap(3)
        .child(hovered
          ? (it.done
            ? div().id(`rm-${it.key}`).p(1).rounded(4).text_color(t.dim).hover((s) => s.bg(t.raised).text_color(t.foreground)).tooltip("Remove")
              .on_click((_e, cx) => { cx.stop_propagation(); this.remove(it.key); this.save(); this.hovered = null; cx.notify(); })
              .child(icon("x", 12, t.dim))
            : div().id(`mark-${it.key}`).p(1).rounded(4).text_color(t.dim).hover((s) => s.bg(t.raised).text_color(t.foreground)).tooltip("Mark as done")
              .on_click((_e, cx) => { cx.stop_propagation(); this.markDone(it.key); this.save(); this.hovered = null; cx.notify(); })
              .child(icon("check", 12, t.dim)))
          : div().text_size(10.5).text_color(t.dim).child(ago(now - it.at)))
        .when(unread, (el) => el.child(div().size(6).rounded(3).bg(t.accent ?? t.working))));
  }

  render(cx) {
    const t = theme();
    this.trackAgents(agents());
    const now = Date.now();
    const live = this.items.filter((x) => !x.done);
    const done = this.items.filter((x) => x.done);
    const unread = live.filter((x) => !x.read).length;

    if (narrow()) {
      const doneHeader = h_flex().id("in-done").px(8).pt(8).h(28).flex_none().gap(6).items_center().text_size(11).font_medium().text_color(t.dim).cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => { this.showDone = !this.showDone; cx.notify(); })
      .child(icon(this.showDone ? "chevron-down" : "chevron-right", 11, t.dim))
      .child(div().child("Done"))
      .child(div().child(String(done.length)))
      .child(div().flex_1())
      .when(this.showDone, (el) => el.child(div().id("in-clear").px(4).rounded(4).text_size(10.5).hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip("Remove every done entry")
        .on_click((_e, cx) => { cx.stop_propagation(); this.clearDone(); cx.notify(); })
        .child("Clear")));

    return v_flex().size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border).items_center().pt(8)
        .child(div().id("inbox-rail").relative().p(4).rounded(6).hover((s) => s.bg(t.hover)).tooltip(`Inbox · ${unread} unread`)
          .on_click((_e, cx) => { const it = live[0]; if (it) this.open(it, cx); })
          .child(icon("inbox", 16, unread ? t.foreground : t.dim))
          .when(unread > 0, (el) => el.child(div().absolute().top(0).right(0).min_w(13).h(13).px(3).rounded(7).bg(t.blocked).text_size(9).font_bold().text_color(t.background).flex().items_center().justify_center().child(String(unread)))));
    }

    const header = h_flex().px(16).h(41).pt(14).pb(5).flex_none().items_center().gap(6)
      .child(div().text_size(11.5).font_medium().text_color(t.dim).child("Inbox"))
      .when(unread > 0, (el) => el.child(div().px(5).h(15).rounded(8).bg(t.blocked + "26").text_size(10).font_semibold().text_color(t.blocked).flex().items_center().child(String(unread))))
      .child(div().flex_1())
      .when(live.length > 0, (el) => el.child(div().id("in-readall").text_color(t.dim).hover((s) => s.text_color(t.foreground)).tooltip("Mark all as done")
        .on_click((_e, cx) => { this.doneAll(); cx.notify(); })
        .child(icon("check", 14, t.dim))));

    const doneHeader = h_flex().id("in-done").px(8).pt(8).h(28).flex_none().gap(6).items_center().text_size(11).font_medium().text_color(t.dim).cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => { this.showDone = !this.showDone; cx.notify(); })
      .child(icon(this.showDone ? "chevron-down" : "chevron-right", 11, t.dim))
      .child(div().child("Done"))
      .child(div().child(String(done.length)))
      .child(div().flex_1())
      .when(this.showDone, (el) => el.child(div().id("in-clear").px(4).rounded(4).text_size(10.5).hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip("Remove every done entry")
        .on_click((_e, cx) => { cx.stop_propagation(); this.clearDone(); cx.notify(); })
        .child("Clear")));

    return v_flex().size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border).text_size(13)
      .child(header)
      .when(live.length === 0, (el) => el.child(div().px(16).pb(6).text_size(12).text_color(t.dim).child("Nothing yet. Agents that need you or finish, and reviews on your PRs, show up here.")))
      .child(v_flex().id("in-list").flex_1().min_h(0).px(8).overflow_y_scrollbar()
        .children(live.map((it) => this.row(t, it, now)))
        .when(done.length > 0, (el) => el.child(doneHeader))
        .when(this.showDone, (el) => el.children(done.map((it) => this.row(t, it, now)))));
  }
}
