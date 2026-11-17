import { test } from "node:test";
import assert from "node:assert/strict";
import { repoOfRef, repoInArgs } from "../lib/gh-account.js";

test("repoOfRef", () => {
  assert.equal(repoOfRef("o/r"), "o/r");
  assert.equal(repoOfRef("https://github.com/o/r/pull/3"), "o/r");
  assert.equal(repoOfRef("o/r.git"), "o/r");
  assert.equal(repoOfRef("nope"), null);
});

test("repoInArgs finds the repo however gh names it", () => {
  assert.equal(repoInArgs(["pr", "list", "-R", "o/r"]), "o/r");
  assert.equal(repoInArgs(["pr", "view", "--repo=o/r"]), "o/r");
  assert.equal(repoInArgs(["pr", "view", "https://github.com/o/r/pull/1"]), "o/r");
  assert.equal(repoInArgs(["api", "repos/o/r/pulls"]), "o/r");
  assert.equal(repoInArgs(["api", "graphql", "-F", "owner=o", "-F", "name=r"]), "o/r");
  assert.equal(repoInArgs(["search", "prs", "x"]), null);
  assert.equal(repoInArgs(["api", "graphql", "-F", "owner=o"]), null);
});
