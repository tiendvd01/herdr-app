import { test } from "node:test";
import assert from "node:assert/strict";
import { clean, lead, tabTitle } from "../lib/tab-title.js";

const claude = { name: "Claude Code", key: "claude", agent: true };
const pane = (o) => ({ tab: "t1", terminal: "a1", program: claude, ...o });

test("tab named after the program shows the session title", () => {
  assert.equal(tabTitle({ id: "t1", name: "Claude Code", named: true }, [pane({ title: "Fix login" })]), "Fix login");
});

test("unnamed tab shows the session title, else its position", () => {
  assert.equal(tabTitle({ id: "t1", name: "2", named: false }, [pane({ title: "Fix login" })]), "Fix login");
  assert.equal(tabTitle({ id: "t1", name: "2", named: false }, [pane({ title: "" })]), "2");
});

test("a chosen name is kept", () => {
  assert.equal(tabTitle({ id: "t1", name: "review PR 12", named: true }, [pane({ title: "Fix login" })]), "review PR 12");
});

test("glyphs dropped; program name, key, paths and hosts are not telling", () => {
  const tab = { id: "t1", name: "Claude Code", named: true };
  assert.equal(tabTitle(tab, [pane({ title: "✳ Fix login" })]), "Fix login");
  for (const title of ["Claude Code", "claude", "~/code", "/Users/x", "C:\\x", "me@host: ~", "✳ ", null])
    assert.equal(tabTitle(tab, [pane({ title })]), "Claude Code", String(title));
});

test("lead prefers the agent pane over a focused shell", () => {
  const shell = { tab: "t1", terminal: "a2", focused: true, title: "~/code", program: { name: "zsh", key: "zsh" } };
  const agent = pane({ title: "Fix login" });
  assert.equal(lead({ id: "t1" }, [shell, agent]), agent);
  assert.equal(tabTitle({ id: "t1", name: "Claude Code", named: true }, [shell, agent]), "Fix login");
  assert.equal(lead({ id: "t1" }, [{ tab: "t1", focused: true }]), undefined); // mod panes don't count
  assert.equal(clean("  ⠋ x "), "x");
});

// Spec 033: the session's saved titles join the rule.
import { parseTitles, isChosen, titlesFor, mergeTitles } from "../lib/tab-title.js";

test("parseTitles keeps the last rename and Claude title, the first message, every title", () => {
  const out = "F\tfix the login page\nA\tLogin fix\nF\tand the logout\nC\tAuth\nA\t✳ Login redirect\nC\tAuth refactor\nA\tLogin fix\n";
  assert.deepEqual(parseTitles(out), { custom: "Auth refactor", ai: "Login fix", first: "fix the login page", all: ["Login fix", "Auth", "Login redirect", "Auth refactor"] });
  assert.deepEqual(parseTitles(""), { custom: "", ai: "", first: "", all: [] });
});

test("order: chosen name, rename title, Claude title, live title, first message, tab name", () => {
  const tab = { id: "t1", name: "Claude Code", named: true };
  const live = [pane({ title: "Live" })];
  const none = [pane({ title: "" })];
  assert.equal(tabTitle(tab, live, { custom: "Mine", ai: "AI", first: "F", all: [] }), "Mine");
  assert.equal(tabTitle(tab, live, { custom: "", ai: "AI", first: "F", all: [] }), "AI");
  assert.equal(tabTitle(tab, live, { custom: "", ai: "", first: "F", all: [] }), "Live");
  assert.equal(tabTitle(tab, none, { custom: "", ai: "", first: "F", all: [] }), "F");
  assert.equal(tabTitle(tab, none, undefined), "Claude Code");
  assert.equal(tabTitle({ id: "t1", name: "review PR 12", named: true }, live, { custom: "Mine", ai: "AI", first: "F", all: ["Mine"] }), "review PR 12");
});

test("a tab named after the thread is automatic and follows a later rename", () => {
  const long = "Investigate the flaky login redirect on staging";
  const tab = { id: "t1", name: long.slice(0, 28), named: true };
  const titles = { custom: "Auth refactor", ai: long, first: "x", all: [long, "Auth refactor"] };
  assert.equal(isChosen(tab, [pane({ title: "" })], titles), false);
  assert.equal(tabTitle(tab, [pane({ title: "" })], titles), "Auth refactor");
  assert.equal(isChosen({ id: "t1", name: "", named: true }, [pane({})], titles), false);
  assert.equal(isChosen({ id: "t1", name: "review", named: true }, [pane({})], titles), true);
});

test("titlesFor picks the lead pane's entry", () => {
  const map = { a1: { custom: "X", ai: "", first: "", all: ["X"] } };
  assert.equal(titlesFor({ id: "t1" }, [pane({})], map), map.a1);
  assert.equal(titlesFor({ id: "t9" }, [pane({})], map), undefined);
});

test("after /clear the terminal keeps its old titles, so a tab named after them stays automatic", () => {
  const old = { custom: "", ai: "Thread Claude theo từng space", first: "x", all: ["Thread Claude theo từng space"] };
  const next = { custom: "", ai: "Tên session", first: "", all: ["Tên session"] };
  const m = mergeTitles(old, next);
  assert.deepEqual(m, { custom: "", ai: "Tên session", first: "", all: ["Thread Claude theo từng space", "x", "Tên session"] });
  assert.equal(mergeTitles(m, next).all.length, 3);
  assert.equal(tabTitle({ id: "t1", name: "Thread Claude theo từng spac", named: true }, [pane({ title: "" })], m), "Tên session");
  assert.equal(mergeTitles(undefined, next), next);
});
