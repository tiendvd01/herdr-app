import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRemoteUrl, githubRepo, repoFromRemote, parsePrUrl } from "../lib/github.js";

test("parseRemoteUrl reads https, ssh and scp-style remotes", () => {
  const want = { host: "github.com", owner: "o", name: "r", repo: "o/r" };
  assert.deepEqual(parseRemoteUrl("https://github.com/o/r.git"), want);
  assert.deepEqual(parseRemoteUrl("https://user:tok@GitHub.com/o/r/"), want);
  assert.deepEqual(parseRemoteUrl("ssh://git@github.com:22/o/r.git"), want);
  assert.deepEqual(parseRemoteUrl("git@github.com:o/r.git"), want);
});

test("parseRemoteUrl rejects local paths and junk", () => {
  assert.equal(parseRemoteUrl("/Users/me/repo"), null);
  assert.equal(parseRemoteUrl(""), null);
  assert.equal(parseRemoteUrl(undefined), null);
});

test("githubRepo only answers for github.com", () => {
  assert.equal(githubRepo("git@github.com:o/r.git"), "o/r");
  assert.equal(githubRepo("git@gitlab.com:o/r.git"), null);
});

test("repoFromRemote asks the host checker for ssh aliases only", async () => {
  const asked = [];
  const isGithubHost = async (host) => { asked.push(host); return host === "github-work"; };
  assert.equal(await repoFromRemote("git@github-work:o/r.git", { isGithubHost }), "o/r");
  assert.equal(await repoFromRemote("git@other:o/r.git", { isGithubHost }), null);
  assert.equal(await repoFromRemote("https://example.com/o/r", { isGithubHost }), null);
  assert.deepEqual(asked, ["github-work", "other"]);
});

test("parsePrUrl", () => {
  assert.deepEqual(parsePrUrl("https://github.com/o/r/pull/12/files"),
    { owner: "o", name: "r", repo: "o/r", number: 12, url: "https://github.com/o/r/pull/12" });
  assert.equal(parsePrUrl("https://github.com/o/r/issues/12"), null);
});
