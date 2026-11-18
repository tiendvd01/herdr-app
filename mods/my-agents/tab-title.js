// GENERATED from lib/tab-title.js by scripts/sync-github-lib.sh. Do not edit here.
// A tab's label (spec 032): a tab named after its agent program ("Claude Code"), or not named at all,
// shows the agent's live terminal title instead, which Claude Code sets to the session's title.
// Display only: the stored tab name never changes, so a hand-chosen name always wins.
// Used by the tab bar (my-tabs) and the sidebar's agent rows (my-agents).

/** Drops leading glyphs (status marks, spinners) and spaces. */
export const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

/** The pane that speaks for a tab: the one running an agent, else the focused one, else the first. */
export function lead(tab, all) {
  const mine = (all ?? []).filter(p => p.tab === tab.id && p.terminal);
  return mine.find(p => p.program?.agent) ?? mine.find(p => p.focused) ?? mine[0];
}

/** Says something about the work: not empty, not the program's name or key, not a path or user@host. */
function telling(raw, live, program) {
  const path = /^[~/]|^[A-Za-z]:\\/;
  return Boolean(live) && live !== program?.name && live.toLowerCase() !== program?.key
    && !path.test((raw ?? "").trim()) && !path.test(live) && !live.includes("@");
}

/** The label to show for a tab, given the panes (`panes()`). */
export function tabTitle(tab, all, l = lead(tab, all)) {
  const prog = l?.program;
  const live = clean(l?.title);
  const auto = !tab.named || (prog?.name != null && tab.name === prog.name);
  return auto && telling(l?.title, live, prog) ? live : tab.name;
}
