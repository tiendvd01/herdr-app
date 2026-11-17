// pr-flow's tracker (mods/pr-flow/tracker.js is its single source, not a synced copy): everything it
// touches is passed in, so a fake gh drives it. No timers: `now` is a number the test moves.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createTracker } from "../mods/pr-flow/tracker.js";

const URL1 = "https://github.com/o/r/pull/1", URL2 = "https://github.com/o/r/pull/2";
const pr = (n, extra = {}) => ({ number: n, title: `t${n}`, body: "", url: `https://github.com/o/r/pull/${n}`, state: "OPEN", headRefName: `b${n}`,
  headRefOid: "sha", updatedAt: "2026-11-17T00:00:00Z", latestReviews: [], statusCheckRollup: [], files: [], ...extra });
const read = (n) => ({ url: `https://github.com/o/r/pull/${n}`, pr: pr(n), threads: [], issues: [], headCommittedAt: null });

function setup(gh, tracked = {}) {
  let t = 1_000_000_000;
  const clock = { now: () => t, move: (ms) => { t += ms; } };
  const tracker = createTracker({
    gh: { me: async () => ["me"], ...gh },
    remoteOf: async () => "o/r",
    store: { load: () => tracked, save: () => {} },
    settings: { pollMs: 30_000 },
    now: clock.now,
  });
  return { tracker, clock };
}
const agent = (branch, status = "idle") => ({ address: `a-${branch}`, cwd: `/w/${branch}`, branch, status, isAgent: true });
const entry = (n) => ({ url: `https://github.com/o/r/pull/${n}`, repo: "o/r", number: n, branch: `b${n}`, headSha: "", headSeenAt: 0 });

test("discover: a failed lookup is asked again after the short wait, a found one is tracked", async () => {
  const asked = [];
  let fail = true;
  const { tracker, clock } = setup({
    discoverMany: async (repo, branches) => {
      asked.push([...branches]);
      if (fail) return { found: new Map([["b1", URL1]]), failed: new Map([["b2", "HTTP 502"]]) };
      return { found: new Map([["b2", URL2]]), failed: new Map() };
    },
    readPrs: async (repo, numbers) => new Map(numbers.map((n) => [n, read(n)])),
  });
  await tracker.tick([agent("b1"), agent("b2")]);
  assert.deepEqual(asked, [["b1", "b2"]]);
  assert.equal(tracker.lastError(), "");
  assert.ok(tracker.cards().some((c) => c.url === URL1 && c.pr));
  fail = false;
  clock.move(29_000);
  await tracker.tick([agent("b1"), agent("b2")]);
  assert.equal(asked.length, 1); // idle agent, but not yet 30 s
  clock.move(2_000);
  await tracker.tick([agent("b1"), agent("b2")]);
  assert.deepEqual(asked[1], ["b2"]); // retried long before the 2 min idle wait
  assert.ok(tracker.cards().some((c) => c.url === URL2 && c.pr));
});

test("discover: a thrown lookup fails each branch it asked for", async () => {
  const asked = [];
  const { tracker, clock } = setup({
    discoverMany: async (repo, branches) => { asked.push(branches); throw new Error("rate limited"); },
    readPrs: async () => new Map(),
  });
  await tracker.tick([agent("b1")]);
  assert.equal(tracker.lastError(), "rate limited");
  clock.move(31_000);
  await tracker.tick([agent("b1")]);
  assert.equal(asked.length, 2);
});

test("refresh: a later success does not hide an earlier failure of the same round", async () => {
  const { tracker } = setup({
    discoverMany: async () => ({ found: new Map(), failed: new Map() }),
    readPrs: async () => new Map([[1, { error: "Could not resolve to a PullRequest" }], [2, read(2)]]),
  }, { [URL1]: entry(1), [URL2]: entry(2) });
  await tracker.tick([agent("b1"), agent("b2")]);
  assert.equal(tracker.lastError(), "Could not resolve to a PullRequest");
  const one = tracker.cards().find((c) => c.url === URL1);
  assert.equal(one.error, "Could not resolve to a PullRequest");
});

test("refresh: a round with only successes clears the error", async () => {
  let bad = true;
  const { tracker } = setup({
    discoverMany: async () => ({ found: new Map(), failed: new Map() }),
    readPrs: async () => new Map([[1, bad ? { error: "boom" } : read(1)]]),
  }, { [URL1]: entry(1) });
  tracker.focus(URL1);
  await tracker.refresh(URL1);
  assert.equal(tracker.lastError(), "boom");
  bad = false;
  await tracker.refresh(URL1);
  assert.equal(tracker.lastError(), "");
});

test("refresh: overlapping reads keep a not-yet-loaded card until the last one ends", async () => {
  const gates = [];
  const { tracker } = setup({
    discoverMany: async () => ({ found: new Map(), failed: new Map() }),
    readPrs: () => new Promise((resolve) => gates.push(resolve)),
  }, { [URL1]: entry(1) });
  // Not on an agent's branch, not focused, not listed: shown only while being read.
  const a = tracker.refresh(URL1), b = tracker.refresh(URL1);
  await new Promise((r) => setImmediate(r));
  assert.equal(gates.length, 2);
  gates[0](new Map()); // the first read answers nothing for it
  await a;
  assert.ok(tracker.cards().some((c) => c.url === URL1 && c.loading), "still shown while the second read runs");
  gates[1](new Map([[1, read(1)]]));
  await b;
  assert.ok(tracker.cards().some((c) => c.url === URL1 && c.pr));
});
