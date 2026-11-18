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
