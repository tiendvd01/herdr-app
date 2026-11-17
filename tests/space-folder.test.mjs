import { test } from "node:test";
import assert from "node:assert/strict";
import { stub } from "./herdr-stub.mjs";
import { spaceFolder, activePlace } from "../lib/space-folder.js";

const space = { id: "s1", active: true, folder: "/start", tabs: [{ id: "t1" }, { id: "t2" }] };

test("spaceFolder: focused terminal, else first terminal, else space.folder", () => {
  stub({ spaces: [space] });
  const panes = [{ tab: "t1", cwd: "/a" }, { tab: "t2", cwd: "/b", focused: true }, { tab: "other", cwd: "/x", focused: true }];
  assert.equal(spaceFolder(space, panes), "/b");
  assert.equal(spaceFolder("s1", panes.map((p) => ({ ...p, focused: false }))), "/a");
  assert.equal(spaceFolder(space, []), "/start");
  assert.equal(spaceFolder("missing", panes), null);
});

test("activePlace keeps the last terminal folder while a mod pane is focused", () => {
  const term = { pane: "p1", terminal: "w1", tab: "t1", cwd: "/work" }, mod = { pane: "p2", tab: "t2" };
  stub({ spaces: [space], panes: [term, mod], focused: { pane: "p1", cwd: "/work" } });
  assert.deepEqual(activePlace(), { space, cwd: "/work", on: null });
  stub({ spaces: [space], panes: [term, mod], focused: { pane: "p2", cwd: "/Users/test" } });
  assert.equal(activePlace().cwd, "/work");
});
