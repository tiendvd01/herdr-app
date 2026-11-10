// GENERATED from lib/code-highlight.js by scripts/sync-github-lib.sh. Do not edit here.
// Syntax colors for fenced code blocks in markdown (lib/markdown.js), by highlight.js 11.11.1
// (lib/vendor/highlight.min.js, the "common" ES build: ~36 languages, BSD-3-Clause).
// highlight(code, lang) -> lines of spans [{ text, cls }] with cls one of keyword, string, comment,
// number, function, type, variable, boolean, operator, punctuation or "" (plain); null when the
// language is unknown. colors(t) maps those classes to the Herdr theme's colors.
import hljs from "./hljs.js";

// Info-string names highlight.js has no alias for.
const ALIAS = { tsx: "typescript", jsx: "javascript", mjs: "javascript", cjs: "javascript", vue: "xml", svelte: "xml",
  zsh: "bash", console: "bash", sh: "bash", shellscript: "bash", jsonc: "json", json5: "json", toml: "ini", dockerfile: "bash", proto: "go" };

// highlight.js scopes -> our classes. The first matching prefix wins ("title.function" before "title").
const SCOPES = [
  ["title.function", "function"], ["title.class", "type"], ["title", "function"], ["function", "function"],
  ["keyword", "keyword"], ["selector-tag", "keyword"], ["meta", "keyword"], ["doctag", "keyword"], ["section", "keyword"], ["name", "keyword"],
  ["built_in", "type"], ["type", "type"], ["class", "type"], ["selector-class", "type"], ["selector-id", "type"],
  ["literal", "boolean"], ["number", "number"], ["deletion", "number"], ["symbol", "number"], ["bullet", "number"],
  ["string", "string"], ["regexp", "string"], ["char", "string"], ["addition", "string"], ["link", "string"],
  ["comment", "comment"], ["quote", "comment"],
  ["variable", "variable"], ["template-variable", "variable"], ["attr", "variable"], ["attribute", "variable"], ["property", "variable"], ["params", ""],
  ["operator", "operator"], ["punctuation", "punctuation"], ["subst", ""],
];
// "hljs-title function_" -> "title.function"
const scopeOf = (classes) => {
  const parts = classes.split(/\s+/);
  const head = (parts.find((c) => c.startsWith("hljs-")) ?? "").slice(5);
  return [head, ...parts.filter((c) => /_$/.test(c)).map((c) => c.replace(/_+$/, ""))].filter(Boolean).join(".");
};
const clsOf = (scope) => scope ? (SCOPES.find(([s]) => scope === s || scope.startsWith(s + "."))?.[1] ?? "") : "";
const unescape = (s) => s.replace(/&(lt|gt|amp|quot|#x27|#39);/g, (_, e) => ({ lt: "<", gt: ">", amp: "&", quot: "\"", "#x27": "'", "#39": "'" })[e]);

/** The highlight.js language for a fence's info string, or null. */
export function languageOf(info) {
  const name = (info ?? "").trim().split(/[\s{]/)[0].toLowerCase();
  if (!name) return null;
  const lang = ALIAS[name] ?? name;
  return hljs.getLanguage(lang) ? lang : null;
}

/** Lines of colored spans for `code` in `lang` (from languageOf), or null when it can't be highlighted. */
export function highlight(code, lang) {
  if (!lang) return null;
  let html;
  try { html = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value; } catch { return null; }
  const lines = [[]], stack = [];
  const push = (text) => {
    const cls = [...stack].reverse().find((c) => c) ?? "";
    text.split("\n").forEach((piece, k) => {
      if (k > 0) lines.push([]);
      if (!piece) return;
      const line = lines[lines.length - 1], last = line[line.length - 1];
      if (last && last.cls === cls) last.text += piece; else line.push({ text: piece, cls });
    });
  };
  for (const m of html.matchAll(/<span class="([^"]*)">|<\/span>|[^<]+/g)) {
    if (m[1] !== undefined) stack.push(clsOf(scopeOf(m[1])));
    else if (m[0] === "</span>") stack.pop();
    else push(unescape(m[0]));
  }
  return lines;
}

/** Class -> color from the Herdr theme (`theme()`), so light and dark themes both read. */
export const colors = (t) => ({ keyword: t.ansi5, string: t.ansi2, comment: t.dim, function: t.ansi4, type: t.ansi3,
  number: t.ansi1, boolean: t.ansi1, variable: t.ansi6, operator: t.ansi5, punctuation: t.muted, "": t.foreground });
