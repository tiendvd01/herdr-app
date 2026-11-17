import { test } from "node:test";
import assert from "node:assert/strict";
import { checkState, prState } from "../lib/pr-status.js";

const settings = { aiChecks: [], ciWaitMs: 60_000 };
const ctx = { now: 1_000_000, headSeenAt: 0, threads: [] };
const run = (name, conclusion, status = "COMPLETED") => ({ __typename: "CheckRun", name, status, conclusion });

test("checkState for check runs and status contexts", () => {
  assert.equal(checkState(run("ci", "SUCCESS")), "passed");
  assert.equal(checkState(run("ci", "TIMED_OUT")), "failed");
  assert.equal(checkState(run("ci", null, "IN_PROGRESS")), "running");
  assert.equal(checkState({ __typename: "StatusContext", state: "ERROR" }), "failed");
  assert.equal(checkState({ __typename: "StatusContext", state: "PENDING" }), "running");
});

test("prState: most blocking fact first", () => {
  const pr = (extra) => ({ state: "OPEN", statusCheckRollup: [run("ci", "SUCCESS")], ...extra });
  assert.equal(prState(pr({ state: "MERGED" }), ctx, settings).name, "merged");
  assert.equal(prState(pr({ isDraft: true }), ctx, settings).name, "draft");
  assert.equal(prState(pr({ mergeable: "CONFLICTING" }), ctx, settings).name, "conflict");
  const failed = prState(pr({ statusCheckRollup: [run("ci", "FAILURE"), run("lint", "FAILURE")] }), ctx, settings);
  assert.deepEqual([failed.name, failed.count], ["ci_failed", 2]);
  assert.equal(prState(pr({ reviewDecision: "CHANGES_REQUESTED" }), ctx, settings).name, "changes");
  assert.equal(prState(pr({}), { ...ctx, threads: [{ isResolved: false, isOutdated: false }] }, settings).name, "comments");
  assert.equal(prState(pr({ mergeStateStatus: "BEHIND" }), ctx, settings).name, "behind");
  assert.equal(prState(pr({}), ctx, settings).name, "ready");
});

test("prState: an AI review job is not CI", () => {
  const p = { state: "OPEN", statusCheckRollup: [run("ci", "SUCCESS"), run("claude-review", "FAILURE")] };
  assert.equal(prState(p, ctx, settings).name, "ready");
});

test("prState: no checks yet is running, later it is none", () => {
  const p = { state: "OPEN", statusCheckRollup: [] };
  assert.equal(prState(p, { ...ctx, headSeenAt: ctx.now - 1000 }, settings).name, "ci_running");
  assert.equal(prState(p, ctx, settings).ci.kind, "none");
});
