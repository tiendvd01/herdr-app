// Stand-in for Herdr's "herdr" module. A test sets answers with stub({ spaces: [...], panes: [...] }).
const state = {};
export const stub = (answers) => { for (const k of Object.keys(state)) delete state[k]; Object.assign(state, answers); };
const get = (name, fallback) => (...args) => (name in state ? (typeof state[name] === "function" ? state[name](...args) : state[name]) : fallback);

export const spaces = get("spaces", []);
export const panes = get("panes", []);
export const focused = get("focused", null);
export const agents = get("agents", []);
export const terminals = get("terminals", []);
export const home = get("home", "/Users/test");
export const theme = get("theme", {});
export const settings = get("settings", {});
export const notify = get("notify", undefined);
// Shell and files: a test that reaches these without an answer has a bug, so fail loudly.
const refuse = (name) => (...args) => { if (name in state) return state[name](...args); throw new Error(`herdr stub: ${name} not set`); };
export const exec = refuse("exec");
export const readTextFile = refuse("readTextFile");
export const writeTextFile = refuse("writeTextFile");
