import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanRunLog, runIdFromUrl, viewQuery, createGh } from "../lib/pr-gh.js";

test("cleanRunLog drops job/step/time prefixes and group markers", () => {
  const log = "build\tTest\t2026-11-17T01:02:03.456Z ##[group]Run tests\n" +
    "build\tTest\t2026-11-17T01:02:04.000Z ##[endgroup]\n" +
    "build\tTest\t2026-11-17T01:02:05.000Z ##[error]boom\n" +
    "build\tTest\t2026-11-17T01:02:06.000Z plain";
  assert.equal(cleanRunLog(log), "boom\nplain");
});

test("runIdFromUrl", () => {
  assert.equal(runIdFromUrl("https://github.com/o/r/actions/runs/42/job/7"), "42");
  assert.equal(runIdFromUrl(null), null);
});

test("viewQuery: state and authors", () => {
  assert.equal(viewQuery("o/r"), "repo:o/r is:pr is:open");
  assert.equal(viewQuery("o/r", "merged", ["a", "b"]), "repo:o/r is:pr is:merged author:a author:b");
});

// ---- GraphQL reads (spec 022): a fake `gh` that answers `api graphql` from a handler. ----
// handler(query, vars) -> { data, errors } (printed as gh does) or a { code, stdout, stderr } to return as is.
function fakeGh(handler) {
  const calls = [];
  const exec = async (cmd, args) => {
    if (cmd === "gh" && args[0] === "auth") {
      return { code: 0, stderr: "", stdout: JSON.stringify({ hosts: { "github.com": [{ login: "me", state: "success", active: true }] } }) };
    }
    assert.equal(cmd, "gh");
    assert.deepEqual(args.slice(0, 2), ["api", "graphql"]);
    let query = "";
    const vars = {};
    for (let i = 2; i < args.length; i += 2) {
      const [k, ...v] = args[i + 1].split("=");
      if (k === "query") query = v.join("=");
      else vars[k] = args[i] === "-F" ? Number(v.join("=")) : v.join("=");
    }
    calls.push({ query, vars });
    const r = await handler(query, vars);
    if ("code" in r) return r;
    return { code: r.errors ? 1 : 0, stderr: "", stdout: JSON.stringify(r) };
  };
  return { gh: createGh(exec), calls };
}

const pr = (n, extra = {}) => ({
  number: n, title: `t${n}`, url: `https://github.com/o/r/pull/${n}`, state: "OPEN", headRefName: `b${n}`, headRefOid: "sha",
  author: { login: "me" }, latestReviews: { nodes: [] }, closingIssuesReferences: { nodes: [] },
  commits: { nodes: [{ commit: { committedDate: "2026-11-17T00:00:00Z", statusCheckRollup: { contexts: { nodes: [] } } } }] },
  reviewThreads: { nodes: [{ isResolved: false, path: "a.js", comments: { nodes: [{ author: { login: "x" }, body: "hi" }] } }] },
  body: "b", files: { nodes: [{ path: "a.js" }] }, ...extra,
});

test("discoverMany: an open PR wins over newer merged ones from the same branch name", async () => {
  const since = Date.parse("2026-11-01T00:00:00Z");
  const { gh, calls } = fakeGh((q, v) => {
    // Open and merged are separate aliases, so merged PRs cannot crowd the open one out.
    assert.match(q, /o0:pullRequests\(headRefName:\$b0,states:\[OPEN\]/);
    assert.match(q, /m0:pullRequests\(headRefName:\$b0,states:\[MERGED\]/);
    assert.equal(v.owner, "o"); assert.equal(v.name, "r"); assert.equal(v.b0, "dev");
    const merged = Array.from({ length: 5 }, (_, i) => ({ url: `https://github.com/o/r/pull/${90 + i}`, mergedAt: "2026-11-16T00:00:00Z" }));
    return { data: { repository: {
      o0: { nodes: [{ url: "https://github.com/o/r/pull/7" }] }, m0: { nodes: merged },
      o1: { nodes: [] }, m1: { nodes: [{ url: "https://github.com/o/r/pull/3", mergedAt: "2026-11-10T00:00:00Z" }, { url: "https://github.com/o/r/pull/2", mergedAt: "2026-11-12T00:00:00Z" }] },
      o2: { nodes: [] }, m2: { nodes: [{ url: "https://github.com/o/r/pull/1", mergedAt: "2026-10-01T00:00:00Z" }] },
    } } };
  });
  const { found, failed } = await gh.discoverMany("o/r", ["dev", "feat", "old"], since);
  assert.equal(calls.length, 1);
  assert.deepEqual([...found], [["dev", "https://github.com/o/r/pull/7"], ["feat", "https://github.com/o/r/pull/2"]]);
  assert.equal(failed.size, 0); // "old" merged before `since`: in neither
});

test("discoverMany: a failed chunk fails only its branches, an alias error only its branch", async () => {
  const branches = Array.from({ length: 21 }, (_, i) => `b${i}`);
  const { gh, calls } = fakeGh((q, v) => {
    if (v.b0 === "b20") return { code: 1, stdout: "", stderr: "HTTP 502" };
    const repository = {};
    for (let i = 0; i < 20; i++) { repository[`o${i}`] = { nodes: [] }; repository[`m${i}`] = { nodes: [] }; }
    repository.o0 = { nodes: [{ url: "https://github.com/o/r/pull/1" }] };
    repository.o1 = null;
    return { data: { repository }, errors: [{ path: ["repository", "o1"], message: "bad ref" }] };
  });
  const { found, failed } = await gh.discoverMany("o/r", branches, 0);
  assert.equal(calls.length, 2);
  assert.deepEqual([...found], [["b0", "https://github.com/o/r/pull/1"]]);
  assert.deepEqual([...failed], [["b1", "bad ref"], ["b20", "HTTP 502"]]);
});

test("readPrs: 10 per query, an unreadable PR gets its own error", async () => {
  const { gh, calls } = fakeGh((q, v) => {
    const repository = {};
    for (const [k, n] of Object.entries(v)) if (k.startsWith("n")) repository[`p${k.slice(1)}`] = n === 5 ? null : pr(n);
    return { data: { repository }, errors: Object.values(v).includes(5) ? [{ path: ["repository", `p${Object.values(v).indexOf(5) - 2}`], message: "Could not resolve to a PullRequest" }] : undefined };
  });
  const got = await gh.readPrs("o/r", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11]);
  assert.equal(calls.length, 2);
  assert.equal(got.size, 11);
  assert.deepEqual(got.get(5), { error: "Could not resolve to a PullRequest" });
  const one = got.get(1);
  assert.equal(one.url, "https://github.com/o/r/pull/1");
  assert.equal(one.pr.body, "b");
  assert.deepEqual(one.pr.files, [{ path: "a.js" }]);
  assert.equal(one.threads[0].comments.nodes[0].body, "hi");
  assert.equal(one.headCommittedAt, "2026-11-17T00:00:00Z");
});

test("readPrs: a failed query fails its chunk", async () => {
  const { gh } = fakeGh(() => ({ code: 1, stdout: "", stderr: "rate limited" }));
  const got = await gh.readPrs("o/r", [1, 2]);
  assert.deepEqual([...got], [[1, { error: "rate limited" }], [2, { error: "rate limited" }]]);
});

test("counts: open and merged in one query", async () => {
  const { gh, calls } = fakeGh((q, v) => {
    assert.equal(v.qo, "repo:o/r is:pr is:open author:a");
    assert.equal(v.qm, "repo:o/r is:pr is:merged author:a");
    return { data: { o: { issueCount: 3 }, m: { issueCount: 9 } } };
  });
  assert.deepEqual(await gh.counts("o/r", ["a"]), { open: 3, merged: 9 });
  assert.equal(calls.length, 1);
});

test("page: goes through the same graphql helper (cursor, partial rows)", async () => {
  const { gh } = fakeGh((q, v) => {
    assert.equal(v.q, "repo:o/r is:pr is:open sort:updated-desc");
    assert.equal(v.first, 20);
    assert.equal(v.after, "c1");
    const { body, files, ...row } = pr(4);
    return { data: { search: { issueCount: 1, pageInfo: { endCursor: "c2", hasNextPage: false }, nodes: [row, {}] } } };
  });
  const r = await gh.page("o/r", "open", null, "c1");
  assert.equal(r.total, 1);
  assert.equal(r.cursor, "c2");
  assert.equal(r.prs.length, 1);
  assert.equal(r.prs[0].pr.body, "");
  assert.equal("files" in r.prs[0].pr, false);
});

test("page: an answer without search throws", async () => {
  const { gh } = fakeGh(() => ({ data: { search: null }, errors: [{ path: ["search"], message: "bad query" }] }));
  await assert.rejects(gh.page("o/r"), /bad query/);
});
