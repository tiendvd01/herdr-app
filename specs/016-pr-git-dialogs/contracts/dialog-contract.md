# Contract: dialog mods (reviewer, pr-flow, git-graph)

A mod that the tab bar opens as a dialog MUST:

1. Declare in `mod.json`: `"overlay": { "kind": "dialog", "width": 0.75, "height": 0.8, "frame": "none" }`.
2. Be opened and closed only via `run("mod.open", { name })` (second call closes it).
3. When `props().overlay != null` and it is the main view (no sub-role / not a viewer):
   - set `shared("<name>.dialog")` to `props().overlay` in `init`;
   - clear it in `async close()` only if the stored value equals its own id.
4. Draw one frame at its root: `rounded(10)`, `overflow_hidden()`, `border_1()`, `border_color(t.border)`, `shadow_lg()`, `bg(t.background)`.

Consumers:

- `my-tabs`: button "on" = `shared("<name>.dialog") != null`; click = `mod.open`.
- `inbox`: to show a PR, set `pr-flow.goto` then `mod.open pr-flow` only if `shared("pr-flow.dialog") == null`.
