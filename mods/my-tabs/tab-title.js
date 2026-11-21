// GENERATED from lib/tab-title.js by scripts/sync-github-lib.sh. Do not edit here.
// A session's display name (spec 032, widened by spec 033): one rule for the tab bar (my-tabs),
// the sidebar's agent rows (my-agents) and the Sessions dialog (processes).
// Order: a tab name the user chose; else the session's rename title; else Claude's own title;
// else the live terminal title if it says something; else the first message; else the tab's name.
// The saved titles come from the session's transcript, read once by my-agents and shared as
// `session.titles` (address -> parseTitles() result). Display only: stored tab names never change.

/** Drops leading glyphs (status marks, spinners) and spaces. */
export const clean = (s) => (s ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** jq filter over a Claude transcript: `C\t` rename titles, `A\t` Claude's titles, `F\t` real user messages. */
export const TITLES_JQ = '(select(.type=="custom-title") | "C\\t" + (.customTitle // "")), (select(.type=="ai-title") | "A\\t" + (.aiTitle // "")), (select(.type=="user" and (.isMeta|not)) | .message.content | if type=="string" then . else ([.[]|select(.type=="text")|.text]|join(" ")) end | select(length>0 and (startswith("<")|not) and (startswith("[")|not)) | "F\\t" + (.[0:200] | gsub("[[:space:]]+";" ")))';

/** Reads TITLES_JQ output: the last rename title, the last Claude title, the first message, every title seen. */
export function parseTitles(stdout) {
  let custom = "", ai = "", first = "";
  const all = [];
  for (const l of String(stdout ?? "").split("\n")) {
    const v = clean(l.slice(2));
    if (!v) continue;
    if (l.startsWith("C\t")) { custom = v; if (!all.includes(v)) all.push(v); }
    else if (l.startsWith("A\t")) { ai = v; if (!all.includes(v)) all.push(v); }
    else if (l.startsWith("F\t") && !first) first = v;
  }
  return { custom, ai, first, all };
}

/**
 * A terminal's titles after a new read: the new session's, with every title the terminal had
 * before kept in `all` (after /clear a terminal moves to a new transcript, but its tab may still
 * carry a name copied from the old one). At most 30 kept, newest last.
 */
export function mergeTitles(old, next) {
  if (!old) return next;
  const all = [];
  for (const v of [...(old.all ?? []), old.first, ...next.all, next.first]) if (v && !all.includes(v)) all.push(v);
  return { ...next, all: all.slice(-30) };
}

/** The pane that speaks for a tab: the one running an agent, else the focused one, else the first. */
export function lead(tab, all) {
  const mine = (all ?? []).filter(p => p.tab === tab.id && p.terminal);
  return mine.find(p => p.program?.agent) ?? mine.find(p => p.focused) ?? mine[0];
}

/** The shared titles entry of a tab's lead pane. */
export const titlesFor = (tab, all, map) => (map ?? {})[lead(tab, all)?.terminal];

/** Says something about the work: not empty, not the program's name or key, not a path or user@host. */
function telling(raw, live, program) {
  const path = /^[~/]|^[A-Za-z]:\\/;
  return Boolean(live) && live !== program?.name && live.toLowerCase() !== program?.key
    && !path.test((raw ?? "").trim()) && !path.test(live) && !live.includes("@");
}

/**
 * A name the user chose: not empty, not the program's name, and not a copy of a title the session
 * had (the Threads panel names a resumed tab after the thread, cut to 28 characters).
 */
export function isChosen(tab, all, titles, l = lead(tab, all)) {
  if (!tab.named || !norm(tab.name)) return false;
  const prog = l?.program;
  // The Threads panel's New thread names its tab "Claude": the program's key, not its name.
  if (prog?.name != null && tab.name === prog.name) return false;
  if (prog?.key && norm(tab.name).toLowerCase() === prog.key.toLowerCase()) return false;
  const name = norm(tab.name);
  const seen = [...(titles?.all ?? []), titles?.first, clean(l?.title)];
  return !seen.some(s => s && (norm(s) === name || norm(norm(s).slice(0, 28)) === name));
}

/** The label to show for a tab, given the panes (`panes()`) and its shared titles entry, if any. */
export function tabTitle(tab, all, titles) {
  const l = lead(tab, all);
  if (isChosen(tab, all, titles, l)) return tab.name;
  const live = clean(l?.title);
  return titles?.custom || titles?.ai || (telling(l?.title, live, l?.program) ? live : "") || titles?.first || tab.name;
}
