// Finds PRs from live agents and keeps their data fresh. It only reads. Everything it touches
// is passed in, so the loop runs against fakes in tests and has no timers of its own.
import { parsePrUrl } from './github.js';
import { prState } from './status.js';
import { sanitize } from './text.js';
import { flowActive } from './flow.js';

const DISCOVER_WORKING_MS = 30_000;
const DISCOVER_IDLE_MS = 120_000;
const REMOTE_TTL_MS = 60_000;
const SETTLED_FACTOR = 4;
const MERGED_KEEP_MS = 30 * 24 * 3_600_000;
const CONCURRENCY = 4;
const FLOW_POLL_MS = 15_000;
const VIEW_MS = 2 * 60_000; // a shown list view reloads (count, then its pages) this often
const COUNT_MS = 60_000;
const PAGE = 20; // PRs per page; scrolling to the end asks for the next one (spec 019)
const FLOW_RECENT_MS = 24 * 3_600_000; // listed merged PRs get Actions data only this soon after merging,
const FLOW_PER_TICK = 8; // in the background, this many per round

function clean(pr) {
  return { ...pr, title: sanitize(pr.title), body: sanitize(pr.body) };
}

export function createTracker({ gh, remoteOf, store, settings, now = Date.now }) {
  const tracked = store.load();
  const live = new Map(); // url -> { pr, threads, issues, fetchedAt, error }
  const flows = new Map(); // url -> { runs, jobs: { runId: { jobs, final } }, checkedAt }
  const discovered = new Map(); // repo:branch -> at
  const previous = new Map(); // address -> status
  const remotes = new Map(); // on:cwd -> { at, repo }
  let agents = [];
  let lastError = '';
  let view = { repo: null, state: 'open', scope: 'mine' };
  let me = null; // your GitHub logins, one per gh account
  let focused = null; // the opened PR: polled like an agent's
  // The list (spec 019): per repo|state|scope, the count first, then pages of PRs by cursor.
  const views = new Map(); // key -> { urls, cursor, next, pages, at, loading, error }
  const counts = new Map(); // key -> { n, at, p }
  const flowQueue = new Set(); // listed merged PRs still without Actions data
  const keyOf = (v, state = v.state) => `${v.repo}|${state}|${v.scope}`;
  const viewKey = () => keyOf(view);
  const listedNow = () => new Set(views.get(viewKey())?.urls ?? []);
  const listedAny = () => new Set([...views.values()].flatMap((v) => v.urls));

  async function repoOf(agent) {
    const key = `${agent.on ?? ''}:${agent.cwd}`;
    const hit = remotes.get(key);
    if (hit && now() - hit.at < REMOTE_TTL_MS) return hit.repo;
    const repo = await remoteOf(agent.cwd, agent.on).catch(() => null);
    remotes.set(key, { at: now(), repo });
    return repo;
  }

  function track(url, branch) {
    const parsed = parsePrUrl(url);
    if (!parsed) return null;
    const entry = (tracked[parsed.url] ??= { url: parsed.url, repo: parsed.repo, number: parsed.number, branch: '', headSha: '', headSeenAt: now() });
    if (branch) entry.branch = branch;
    return entry;
  }

  // A working agent may open a PR at any moment; an idle one rarely does.
  async function discover(agent) {
    const { repo, branch } = agent;
    if (Object.values(tracked).some((t) => t.repo === repo && t.branch === branch)) return;
    const key = `${repo}:${branch}`;
    const wait = agent.status === 'working' ? DISCOVER_WORKING_MS : DISCOVER_IDLE_MS;
    if (now() - (discovered.get(key) ?? -Infinity) < wait) return;
    discovered.set(key, now());
    const url = await gh.discover(repo, branch).catch((error) => { lastError = error.message; return null; });
    // No open PR: a PR merged within the keep window still shows while someone is on the branch.
    const url2 = url ?? await gh.discoverMerged(repo, branch, now() - MERGED_KEEP_MS).catch(() => null);
    if (!url2) return;
    const entry = track(url2, branch);
    store.save(tracked);
    await refresh(entry.url);
  }

  async function logins() {
    if (!me?.length) me = await gh.me().catch(() => null);
    return me?.length ? me : null;
  }

  // The view's total (cached COUNT_MS). Mine counts every logged-in login's PRs; null when unknown.
  function countStale(state, v = view) {
    const c = counts.get(keyOf(v, state));
    return Boolean(v.repo) && (!c || (!c.p && now() - c.at >= COUNT_MS));
  }
  async function ensureCount(state, v = view, force = false) {
    if (!v.repo) return null;
    const key = keyOf(v, state);
    let c = counts.get(key);
    if (c?.p) return c.p;
    if (c && !force && now() - c.at < COUNT_MS) return c.n;
    c = { n: c?.n ?? null, at: now(), p: null };
    counts.set(key, c);
    c.p = (async () => {
      const who = v.scope === 'mine' ? await logins() : null;
      if (v.scope === 'mine' && !who) return c.n;
      try { c.n = await gh.count(v.repo, state, who); } catch (error) { lastError = error.message; }
      return c.n;
    })().finally(() => { c.p = null; c.at = now(); });
    return c.p;
  }

  // One page into the tracked set and the live data (data fetched in full shortly before is kept).
  async function fetchPage(v, after) {
    const who = v.scope === 'mine' ? await logins() : null;
    const r = await gh.page(v.repo, v.state, who, after, PAGE);
    for (const p of r.prs) {
      const entry = track(p.url, p.pr.headRefName);
      if (!entry) continue;
      const old = live.get(entry.url);
      if (old?.pr && !old.partial && now() - old.fetchedAt < VIEW_MS) continue;
      absorb(entry, p.pr, p, true);
    }
    for (const p of r.prs) {
      const url = parsePrUrl(p.url)?.url, pr = live.get(url)?.pr;
      if (pr?.state === 'MERGED' && now() - Date.parse(pr.mergedAt ?? 0) < FLOW_RECENT_MS && !flows.has(url)) flowQueue.add(url);
    }
    store.save(tracked);
    return { urls: r.prs.map((p) => parsePrUrl(p.url)?.url).filter(Boolean), cursor: r.cursor, next: r.next && r.prs.length >= PAGE };
  }

  // Count first; 0 means no list call. Otherwise the loaded number of pages again, from the start.
  async function loadView(force = false) {
    const v = { ...view }, key = keyOf(v);
    if (!v.repo) return;
    const s = views.get(key) ?? { urls: [], cursor: null, next: false, pages: 1, at: -Infinity, loading: false, error: '' };
    views.set(key, s);
    if (s.loading || (!force && now() - s.at < VIEW_MS)) return;
    s.loading = true;
    try {
      const total = await ensureCount(v.state, v, force);
      if (total === 0) { Object.assign(s, { urls: [], cursor: null, next: false, pages: 1, error: '' }); return; }
      let urls = [], cursor = null, next = true, pages = 0;
      while (next && pages < s.pages) {
        const page = await fetchPage(v, cursor);
        urls = [...new Set([...urls, ...page.urls])];
        ({ cursor, next } = page);
        pages++;
      }
      Object.assign(s, { urls, cursor, next, pages: Math.max(1, pages), error: '' });
    } catch (error) {
      s.error = lastError = error.message;
    } finally {
      s.loading = false;
      s.at = now();
    }
  }

  function hasMore() {
    const s = views.get(viewKey()), total = counts.get(viewKey())?.n;
    return Boolean(s?.next) && (total == null || s.urls.length < total);
  }

  async function loadMore() {
    const v = { ...view }, s = views.get(keyOf(v));
    if (!s || s.loading || !hasMore()) return false;
    s.loading = true;
    try {
      const page = await fetchPage(v, s.cursor);
      s.urls = [...new Set([...s.urls, ...page.urls])];
      s.cursor = page.cursor;
      s.next = page.next;
      s.pages++;
      s.error = '';
    } catch (error) {
      s.error = lastError = error.message;
    } finally { s.loading = false; }
    return true;
  }

  // A PR's data from a full fetch or from a list page (`partial`: no files, body or thread comments).
  function absorb(entry, pr, extra, partial) {
    if (pr.headRefOid !== entry.headSha) {
      entry.headSha = pr.headRefOid;
      // A PR first seen long after its last commit should not wait for CI to appear.
      const committed = extra.headCommittedAt ? Date.parse(extra.headCommittedAt) : now();
      entry.headSeenAt = Math.min(committed, now());
    }
    entry.branch ||= pr.headRefName;
    const issues = (extra.issues ?? []).map((i) => ({ ...i, title: sanitize(i.title) }));
    live.set(entry.url, { pr: clean(pr), threads: extra.threads, issues, fetchedAt: now(), partial });
  }

  const refreshing = new Set();
  async function refresh(url) {
    const entry = tracked[url];
    if (!entry) return;
    refreshing.add(url);
    try {
      const [pr, extra] = await Promise.all([gh.fetchPr(url), gh.fetchThreads(url)]);
      absorb(entry, pr, extra, false);
      lastError = '';
      if (pr.state === 'MERGED') await refreshFlow(url);
      prune();
    } catch (error) {
      lastError = error.message;
      live.set(url, { ...live.get(url), error: error.message, fetchedAt: now() });
    }
    refreshing.delete(url);
    store.save(tracked);
  }

  // After a merge only Actions changes, so this is all a merged PR costs. Jobs are fetched for
  // unfinished runs; a finished run's jobs are fetched once, when someone opens it.
  async function refreshFlow(url) {
    const entry = tracked[url];
    const sha = live.get(url)?.pr?.mergeCommit?.oid;
    if (!entry || !sha) return;
    const old = flows.get(url) ?? { runs: [], jobs: {} };
    const runs = await gh.fetchRuns(entry.repo, sha).catch(() => old.runs);
    const jobs = { ...old.jobs };
    await Promise.all(runs.filter((r) => r.status !== 'completed' || (old.runs.some((o) => o.id === r.id && o.status !== 'completed') && !jobs[r.id]?.final)).map(async (r) => {
      const list = await gh.fetchJobs(entry.repo, r.id).catch(() => null);
      if (list) jobs[r.id] = { jobs: list, final: r.status === 'completed' };
    }));
    flows.set(url, { runs, jobs, checkedAt: now() });
  }

  const flowBusy = (url) => {
    const pr = live.get(url)?.pr;
    return pr?.state === 'MERGED' && Boolean(pr.mergeCommit?.oid) && flowActive(flows.get(url)?.runs, pr.mergedAt, now());
  };

  async function loadJobs(url, runId) {
    const entry = tracked[url], flow = flows.get(url);
    if (!entry || !flow || flow.jobs[runId]?.final) return;
    const run = flow.runs.find((r) => r.id === runId);
    const list = await gh.fetchJobs(entry.repo, runId).catch(() => null);
    if (list) flow.jobs[runId] = { jobs: list, final: run?.status === 'completed' };
  }

  function prune() {
    const keep = listedAny();
    for (const entry of Object.values(tracked)) {
      if (keep.has(entry.url) || entry.url === focused) continue;
      const pr = live.get(entry.url)?.pr;
      if (!pr) continue;
      const mergedAt = pr.mergedAt ? Date.parse(pr.mergedAt) : 0;
      if (pr.state === 'CLOSED' || (pr.state === 'MERGED' && now() - mergedAt > MERGED_KEEP_MS && !flowBusy(entry.url))) {
        delete tracked[entry.url];
        live.delete(entry.url);
        flows.delete(entry.url);
      }
    }
  }

  const onBranch = (entry) => agents.some((a) => a.repo === entry.repo && a.branch === entry.branch);

  const agentFor = (entry) => {
    const mine = agents.filter((a) => a.isAgent && a.repo === entry.repo && a.branch === entry.branch);
    return mine.find((a) => a.status === 'working') ?? mine[0] ?? null;
  };

  async function inBatches(items, fn) {
    for (let i = 0; i < items.length; i += CONCURRENCY) await Promise.all(items.slice(i, i + CONCURRENCY).map(fn));
  }

  // One round: `list` is what the app says about its agents right now.
  async function tick(list) {
    const withRepo = await Promise.all(list.filter((a) => a.cwd).map(async (a) => ({ ...a, repo: await repoOf(a) })));
    agents = withRepo;
    // An agent that just finished has probably pushed or opened a PR, so look now.
    const finished = agents.filter((a) => previous.get(a.address) === 'working' && a.status !== 'working');
    for (const a of finished) if (a.repo && a.branch) discovered.delete(`${a.repo}:${a.branch}`);
    for (const a of agents) previous.set(a.address, a.status);
    const seen = new Set();
    const unique = agents.filter((a) => {
      const key = `${a.repo}:${a.branch}`;
      if (!a.repo || !a.branch || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    await inBatches(unique, discover);
    await loadView();
    const fresh = new Set(finished.flatMap((a) => Object.values(tracked).filter((t) => t.repo === a.repo && t.branch === a.branch).map((t) => t.url)));
    // Listed rows refresh with their view's pages; one by one only an agent's branch and the opened PR.
    const due = Object.values(tracked).filter((entry) => {
      const mine = onBranch(entry), open = entry.url === focused;
      if (!mine && !open) return false;
      const data = live.get(entry.url);
      if (!data) return true;
      if (open && data.partial) return true;
      if (['MERGED', 'CLOSED'].includes(data.pr?.state)) return false;
      if (fresh.has(entry.url)) return true;
      return now() - data.fetchedAt >= settings.pollMs * (mine ? 1 : SETTLED_FACTOR);
    });
    await inBatches(due, (e) => refresh(e.url));
    const flowing = Object.values(tracked).filter((e) => !due.includes(e) && flowBusy(e.url) && now() - (flows.get(e.url)?.checkedAt ?? -Infinity) >= FLOW_POLL_MS);
    await inBatches(flowing, (e) => refreshFlow(e.url));
    const queued = [...flowQueue].slice(0, FLOW_PER_TICK);
    for (const url of queued) flowQueue.delete(url);
    await inBatches(queued.filter((url) => tracked[url] && !flows.has(url)), (url) => refreshFlow(url));
    prune();
  }

  // Open PRs by latest activity, then merged ones.
  function cards() {
    const out = [];
    for (const entry of Object.values(tracked)) {
      const data = live.get(entry.url);
      const agent = agentFor(entry);
      const base = { key: entry.url, url: entry.url, repo: entry.repo, number: entry.number, agent };
      if (!data?.pr) {
        // Not fetched because the shown view doesn't list it: hide it instead of a spinner that never ends.
        if (!data && !onBranch(entry) && !listedNow().has(entry.url) && entry.url !== focused && !refreshing.has(entry.url)) continue;
        out.push({ ...base, loading: true, error: data?.error });
        continue;
      }
      const status = prState(data.pr, { now: now(), headSeenAt: entry.headSeenAt, threads: data.threads }, settings);
      const flow = data.pr.state === 'MERGED' && data.pr.mergeCommit?.oid ? { ...(flows.get(entry.url) ?? { runs: [], jobs: {} }), active: flowBusy(entry.url) } : null;
      out.push({ ...base, mine: me?.length ? me.includes(data.pr.author?.login) : null, pr: data.pr, threads: data.threads, issues: data.issues ?? [], status, flow });
    }
    const rank = (c) => (c.pr?.state === 'MERGED' && !c.flow?.active ? 1 : 0);
    const time = (c) => Date.parse(c.pr?.updatedAt ?? 0) || 0;
    return out.sort((a, b) => rank(a) - rank(b) || time(b) - time(a));
  }

  return {
    tick,
    refresh,
    loadJobs,
    // Refresh: the view (count, then its pages) and, one by one, agents' and the opened PR.
    refreshAll: () => Promise.all([loadView(true), inBatches(Object.values(tracked).filter((e) => onBranch(e) || e.url === focused), (e) => refresh(e.url))]),
    track,
    cards,
    // The list (spec 019): count first, then a page at a time.
    hasMore,
    loadMore,
    loadView,
    setView(next) { view = { ...view, ...next }; },
    viewOf: () => ({ ...view }),
    viewState() { const s = views.get(viewKey()); return { loading: Boolean(s?.loading), loaded: Boolean(s && s.at > -Infinity), error: s?.error ?? '', total: counts.get(viewKey())?.n ?? null }; },
    viewStale: () => Boolean(view.repo) && !views.get(viewKey())?.loading && now() - (views.get(viewKey())?.at ?? -Infinity) >= VIEW_MS,
    total: (state) => counts.get(keyOf(view, state))?.n ?? null,
    countStale,
    ensureCount: (state) => ensureCount(state),
    focus(url) { focused = url ?? null; },
    isPartial: (url) => Boolean(live.get(url)?.partial),
    lastError: () => lastError,
  };
}
