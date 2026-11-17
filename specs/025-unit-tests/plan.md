# Plan: Unit tests (spec 025)

- Runner: Node's built-in `node:test` + `node:assert/strict` (Node 24 on the machine). No package.json.
- Command: `node --import ./tests/setup.mjs --test 'tests/*.test.mjs'`.
- `tests/setup.mjs`: `module.registerHooks` resolves the bare `herdr` import to `tests/herdr-stub.mjs`.
- `tests/herdr-stub.mjs`: exports used by lib files (`spaces`, `panes`, `focused`, `exec`, `readTextFile`, ...) answering from state kept in the module; a test sets it with the exported `stub({ spaces, panes, ... })` (`import { stub } from "herdr"`). Shell and file exports throw unless the test set them.
- Shell: functions already take `exec`; tests pass a fake that answers by command.
- Tests import `lib/` (single source), never the synced copies under `mods/`.
- Dialog check test builds fixtures in `os.tmpdir()`.

Constitution: II (tests target `lib/`), III (plain JS, no build), operational "no probe mods" (nothing under `mods/`). Pass.
