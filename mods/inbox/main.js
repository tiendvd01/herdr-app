// Inbox: one list of what wants you. Agents that need you or finished, and your open PRs that got a
// review, new comments, a red CI or a conflict. Each entry goes where it's about: an agent to its
// pane, a PR to Pull requests (pr-flow) open on that PR. One entry per agent and per PR, updated in place.
// Reads GitHub only; the PR code (gh, status) is pr-flow's.
import { View, div, svg } from "gpui-kit";
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
const DONE_KEEP_MS = 7 * 86_400_000;
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
    if (state === "CHANGES_REQUESTED") out.push({ text: `${login} requested changes`, tone: "bad" });
    else if (state === "APPROVED") out.push({ text: `${login} approved`, tone: "ok" });
    else if (state === "COMMENTED") out.push({ text: `${login} reviewed`, tone: "warn" });
  }
  if (now.comments > old.comments) {
    const n = now.comments - old.comments;
    out.push({ text: `${n} new comment${n > 1 ? "s" : ""} · ${now.open} unresolved`, tone: "warn" });
  }
  if (now.ci === "failed" && old.ci !== "failed") out.push({ text: `CI failed: ${now.failed.join(", ") || "?"}`, tone: "bad" });
  if (now.conflict && !old.conflict) out.push({ text: "Conflicts with base", tone: "bad" });
  return out;
}

const TONE_RANK = { bad: 3, warn: 2, ok: 1 };

export default class Inbox extends View {
  init(_props, cx) {
    this.items = load("items", []);
    this.prSnap = load("prs", {}); // url -> snapshot (see snapshot())
    this.prev = null; // address -> status, from the last render
    this.showDone = false;
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
    // "inbox.open-latest" (the PR toast's click), "inbox.read-all", for keys.json too.
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        if (c === "open-latest") { const it = this.items.find((x) => !x.done); if (it) this.open(it, cx); }
        else if (c === "read-all") this.readAll();
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

  readAll() {
    for (const it of this.items) it.read = true;
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
      if (!first && a.status === "blocked" && was !== "blocked") {
        this.upsert(key, { kind: "attention", title: name, body: `Needs you · ${where}`, tone: "bad", target });
        dirty = true;
      } else if (!first && was !== undefined && a.status === "done" && was !== "done") {
        this.upsert(key, { kind: "done", title: name, body: `Finished · ${where}`, tone: "ok", target });
        dirty = true;
      }
      // Looking at it reads it; it going back to work settles a "needs you".
      if (a.focused) dirty = this.patch(key, { read: true }) || dirty;
      if (a.status === "working") {
        const it = this.items.find((x) => x.key === key);
        if (it?.kind === "attention" && !it.done) dirty = this.patch(key, { done: true, read: true }) || dirty;
      }
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
        // Gone from your open list: merged or closed. Its entry is settled, its snapshot dropped.
        for (const url of Object.keys(this.prSnap)) {
          if (this.urls.includes(url) || this.listedAt < 0) continue;
          delete this.prSnap[url];
          changed = this.patch(`pr:${url}`, { done: true }) || changed;
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
    const tone = events.map((e) => e.tone).sort((a, b) => TONE_RANK[b] - TONE_RANK[a])[0];
    const repo = parsePrUrl(url)?.repo ?? "";
    const title = `#${now.number} ${now.title}`;
    const body = events.map((e) => e.text).join(" · ");
    this.upsert(`pr:${url}`, { kind: "pr", title, body, sub: repo, tone, target: { kind: "pr", url, repo } });
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

  dismiss(it) {
    this.patch(it.key, { done: true, read: true });
    this.save();
  }

  // ---------- drawing ----------
  mark(t, it) {
    const color = t[{ bad: "blocked", warn: "working", ok: "done" }[it.tone]] ?? t.dim;
    if (it.kind === "attention") return div().size(16).flex_none().rounded(4).bg(t.blocked + "26").text_size(11).font_bold().text_color(t.blocked).flex().items_center().justify_center().child("!");
    if (it.kind === "done") return h_flex().size(16).flex_none().items_center().justify_center().child(div().size(7).rounded(4).bg(t.done));
    const name = it.tone === "ok" ? "check" : it.tone === "bad" && /CI|conflict/.test(it.body) ? "cross" : it.tone === "warn" || it.tone === "bad" ? "comment" : "merge";
    return h_flex().size(16).flex_none().items_center().justify_center().child(icon(name, 13, color));
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
      .child(div().pt(1).child(this.mark(t, it)))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(div().truncate().text_size(12.5).when(unread, (el) => el.font_semibold()).text_color(it.done ? t.dim : unread ? t.foreground : t.muted).child(it.title || "?"))
        .child(div().truncate().text_size(11).text_color(t.dim).child([it.body, it.sub].filter(Boolean).join(" · "))))
      .child(v_flex().flex_none().items_end().gap(3)
        .child(hovered && !it.done
          ? div().id(`x-${it.key}`).p(1).rounded(4).text_color(t.dim).hover((s) => s.bg(t.raised).text_color(t.foreground)).tooltip("Done")
            .on_click((_e, cx) => { cx.stop_propagation(); this.dismiss(it); this.hovered = null; cx.notify(); })
            .child(icon("x", 12, t.dim))
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
      .when(unread > 0, (el) => el.child(div().id("in-readall").text_color(t.dim).hover((s) => s.text_color(t.foreground)).tooltip("Mark all read")
        .on_click((_e, cx) => { this.readAll(); cx.notify(); })
        .child(icon("check", 14, t.dim))));

    const doneHeader = h_flex().id("in-done").px(8).pt(8).h(28).flex_none().gap(6).items_center().text_size(11).font_medium().text_color(t.dim).cursor_pointer()
      .hover((s) => s.text_color(t.foreground))
      .on_click((_e, cx) => { this.showDone = !this.showDone; cx.notify(); })
      .child(div().child("Done"))
      .child(div().child(String(done.length)))
      .child(div().flex_1())
      .child(icon(this.showDone ? "chevron-down" : "chevron-right", 11, t.dim));

    return v_flex().size_full().min_h(0).bg(t.chrome).border_t(1).border_color(t.border).text_size(13)
      .child(header)
      .when(live.length === 0, (el) => el.child(div().px(16).pb(6).text_size(12).text_color(t.dim).child("Nothing yet. Agents that need you or finish, and reviews on your PRs, show up here.")))
      .child(v_flex().id("in-list").flex_1().min_h(0).px(8).overflow_y_scrollbar()
        .children(live.map((it) => this.row(t, it, now)))
        .when(done.length > 0, (el) => el.child(doneHeader))
        .when(this.showDone, (el) => el.children(done.map((it) => this.row(t, it, now)))));
  }
}
