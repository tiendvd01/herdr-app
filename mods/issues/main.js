// Issues: a GitHub issue manager in the side panel.
// Each workspace (space) keeps its own state: repo, filters, search, the
// list, the open issue and the prompt draft. Switching spaces swaps them.
// The repo comes from the focused terminal's folder (`gh repo view`), or one
// typed in the bar (kept per space). Clicking an issue shows its body and
// comments as markdown (TextView.markdown, native: mods have no web view).
//
// Translate / summarize: only when asked. Under an issue, type a prompt
// ("dịch sang tiếng Việt, lưu vào ~/notes/issues/<số>.md") and press Run:
// the issue (title, body, comments) is written to a file, and `claude -p`
// runs in the background (a core terminal started with `hc run --bg`, since
// `exec` stops at 30 s) with that prompt and the file's path. Claude saves
// the result wherever the prompt says; its answer shows under the issue.
// "Open in tab" runs the same prompt in a new interactive Claude tab instead.
// Runs are kept in data/issues/runs.json (appHome).
//
// render() never calls cx.notify(): work it needs (detect the repo, load
// the list, swap the space) is spawned and notifies when it finishes.
import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, TextareaState, Textarea, TextView } from "gpui-base";
import { exec, hc, run, theme, focused, spaces, appHome, home, readTextFile, notify, settings } from "herdr";
import * as fs from "fs/promises";

// What the background Claude may do without asking: read and write files
// (anywhere in home), make folders, and comment on an issue when the prompt says so.
const ALLOWED_TOOLS = ["Read", "Write", "Edit", "Glob", "Bash(mkdir:*)", "Bash(gh issue comment:*)", "Bash(gh issue view:*)"];
const MAX_RECENT = 8;

const DATA = () => `${appHome()}/data/issues`;
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};
const keyOf = (repo, n) => `${repo}#${n}`;
// ```mermaid blocks in issue bodies, comments and results are drawn as
// pictures: mermaid-cli (mmdc) renders them on this machine to
// mods/issues/.diagrams/<hash>.png (cached), shown with image().
const MERMAID = /```mermaid[^\n]*\n([\s\S]*?)```/g;
const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(36); };
const fail = (e) => ({ code: 1, stdout: "", stderr: String(e?.message ?? e) });

export default class Issues extends View {
  init(_props, cx) {
    this.repos = JSON.parse(localStorage.getItem("repos") ?? "{}"); // space id -> repo typed by hand
    this.saved = JSON.parse(localStorage.getItem("spaces") ?? "{}"); // space id -> {state, mine, query, open}
    this.recent = JSON.parse(localStorage.getItem("recent") ?? "[]");
    this.autoRepo = {}; // folder -> repo from gh (null: not a repo / asking)
    this.ws = {}; // space id -> live state
    this.cur = null; // the space whose state is shown
    this.runs = []; this.jobs = {};
    this.editingRepo = false;
    this.diagrams = {}; // hash -> { status: "pending" | "ok" | "error", w, h, error }
    this.width = 360;

    this.search = InputState.new({ placeholder: "Search issues… (enter)" });
    this.search.on("submit", (_e, cx) => { const s = this.st(); s.query = this.search.value().trim(); this.persist(); this.refresh(cx, true); cx.notify(); });
    this.repoInput = InputState.new({ placeholder: "owner/repo (empty: from folder)" });
    this.repoInput.on("submit", (_e, cx) => this.setRepo(this.repoInput.value().trim(), cx));
    this.prompt = TextareaState.new({ placeholder: "Prompt: dịch sang tiếng Việt và lưu vào ~/notes/issues/<số issue>.md …", rows: 3 });
    this.prompt.set_auto_grow(3, 8);
    this.prompt.on("submit", (_e, cx) => this.translate(cx, false));

    cx.spawn(async (cx) => {
      try { await fs.mkdir(`${DATA()}/jobs`, { recursive: true }); } catch {}
      try { this.runs = JSON.parse(await fs.readFile(`${DATA()}/runs.json`, "utf8")); } catch { this.runs = []; }
      for (const r of this.runs) if (r.status === "running") this.jobs[r.id] = r; // survived a reload
      cx.notify();
    });
    cx.timer.every(2500, (cx) => this.poll(cx));
  }

  // ---------- per-space state ----------
  st(id = this.cur) {
    if (!id) return this.blank ??= this.fresh({});
    if (!this.ws[id]) this.ws[id] = this.fresh(this.saved[id] ?? {});
    return this.ws[id];
  }
  fresh(p) {
    return { state: p.state ?? "open", mine: !!p.mine, query: p.query ?? "", open: p.open ?? null,
      list: [], listKey: null, loading: false, error: null, detail: null, detailLoading: false,
      shownRun: null, draft: "", restored: false };
  }
  persist() {
    for (const [id, s] of Object.entries(this.ws)) this.saved[id] = { state: s.state, mine: s.mine, query: s.query, open: s.open };
    localStorage.setItem("spaces", JSON.stringify(this.saved));
  }
  // Called from render when the focused space changed: swap the inputs'
  // text in a task (not during render), then redraw.
  switchTo(id, cx) {
    if (this.switching === id) return;
    this.switching = id;
    cx.spawn(async (cx) => {
      if (this.cur) { const old = this.st(); old.draft = this.prompt.value(); }
      this.cur = id; this.switching = null; this.editingRepo = false;
      const s = this.st();
      this.search.set_value(s.query);
      this.prompt.set_value(s.draft);
      // Reopen the issue this space had open (after a reload too).
      if (s.open && !s.detail && !s.detailLoading) this.show(s.open.number, cx, s.open.repo);
      cx.notify();
    });
  }

  // ---------- repo ----------
  space() { return spaces().find((s) => s.id === this.cur) ?? null; }
  folder() {
    const f = focused();
    return (f?.space === this.cur ? f?.cwd : null) ?? this.space()?.folder ?? null;
  }
  repo() {
    if (this.cur && this.repos[this.cur]) return this.repos[this.cur];
    const f = this.folder();
    return f ? this.autoRepo[f] ?? null : null;
  }
  setRepo(repo, cx) {
    if (!this.cur) return;
    if (repo) this.repos[this.cur] = repo; else delete this.repos[this.cur];
    localStorage.setItem("repos", JSON.stringify(this.repos));
    const s = this.st();
    this.editingRepo = false; s.open = null; s.detail = null; this.persist();
    this.refresh(cx, true); cx.notify();
  }
  detectRepo(cx) {
    const f = this.folder();
    if (!f || f in this.autoRepo || this.space()?.machine) return;
    this.autoRepo[f] = null;
    cx.spawn(async (cx) => {
      const r = await exec("gh", ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], { cwd: f }).catch(fail);
      this.autoRepo[f] = r.code === 0 ? r.stdout.trim() || null : null;
      cx.notify();
    });
  }

  // ---------- list ----------
  // Starts loading when the filters changed (or `force`). Never notifies by
  // itself before the result: callers in handlers notify, render needs none.
  refresh(cx, force) {
    const repo = this.repo(), s = this.st(); if (!repo || !this.cur) return;
    const key = JSON.stringify([repo, s.state, s.mine, s.query]);
    if (!force && key === s.listKey) return;
    s.listKey = key; s.loading = true; s.error = null;
    cx.spawn(async (cx) => {
      const args = ["issue", "list", "-R", repo, "--state", s.state, "--limit", "100",
        "--json", "number,title,state,labels,assignees,updatedAt,author"];
      if (s.mine) args.push("--assignee", "@me");
      if (s.query) args.push("--search", s.query);
      const r = await exec("gh", args).catch(fail);
      if (key !== s.listKey) return;
      s.loading = false;
      if (r.code === 0) { s.list = JSON.parse(r.stdout || "[]"); s.error = null; }
      else { s.list = []; s.error = (r.stderr || r.stdout).trim().slice(0, 300); }
      cx.notify();
    });
  }
  setFilter(patch, cx) { Object.assign(this.st(), patch); this.persist(); this.refresh(cx, false); cx.notify(); }

  // ---------- detail ----------
  show(n, cx, repo = this.repo()) {
    const s = this.st(); if (!repo) return;
    s.open = { repo, number: n }; s.detail = null; s.detailLoading = true; s.shownRun = null; s.error = null;
    this.persist();
    cx.spawn(async (cx) => {
      const r = await exec("gh", ["issue", "view", String(n), "-R", repo, "--json",
        "number,title,body,state,author,labels,assignees,comments,url,createdAt"]).catch(fail);
      if (s.open?.number !== n || s.open?.repo !== repo) return;
      s.detailLoading = false;
      if (r.code === 0) s.detail = JSON.parse(r.stdout);
      else s.error = (r.stderr || r.stdout).trim().slice(0, 300);
      cx.notify();
    });
  }
  back(cx) { const s = this.st(); s.open = null; s.detail = null; s.error = null; this.persist(); this.refresh(cx, false); cx.notify(); }
  setState(n, close, cx) {
    const s = this.st(), repo = s.open.repo;
    cx.spawn(async (cx) => {
      const r = await exec("gh", ["issue", close ? "close" : "reopen", String(n), "-R", repo]).catch(fail);
      if (r.code !== 0) notify({ title: "gh failed", body: (r.stderr || "").trim().slice(0, 200), level: "error" });
      if (this.st() === s) { this.show(n, cx, repo); this.refresh(cx, true); }
      cx.notify();
    });
  }

  issueMarkdown(repo, d) {
    const parts = [`# ${d.title}`, `${repo}#${d.number} · ${d.state} · ${d.author?.login ?? ""} · ${d.url}`, "", d.body || "(no description)"];
    for (const c of d.comments ?? []) parts.push("", "---", `## Comment by ${c.author?.login ?? "?"} (${c.createdAt})`, "", c.body ?? "");
    return parts.join("\n");
  }

  // ---------- translate / summarize ----------
  fullPrompt(userPrompt, repo, d, file) {
    return [
      `Yêu cầu của tôi: ${userPrompt}`,
      "",
      `Toàn bộ nội dung GitHub issue ${repo}#${d.number} ("${d.title}", ${d.url}) gồm mô tả và comment nằm trong file: ${file}`,
      "Hãy đọc file đó rồi làm đúng yêu cầu trên. Nếu yêu cầu nói lưu ở đâu (file, thư mục, comment issue…) thì lưu đúng chỗ đó, tạo thư mục nếu cần.",
      "Cuối cùng in ra kết quả (bản dịch / tóm tắt) bằng markdown, và dòng cuối là `Đã lưu: <nơi lưu>` nếu có lưu.",
    ].join("\n");
  }

  translate(cx, inTab) {
    const s = this.st(), text = this.prompt.value().trim(), d = s.detail;
    if (!text || !d) { s.error = text ? "Issue is still loading" : "Type a prompt first"; cx.notify(); return; }
    this.recent = [text, ...this.recent.filter((p) => p !== text)].slice(0, MAX_RECENT);
    localStorage.setItem("recent", JSON.stringify(this.recent));
    const id = `${Date.now().toString(36)}`, dir = `${DATA()}/jobs/${id}`, repo = s.open.repo;
    const cwd = (!this.space()?.machine && this.folder()) || home();
    cx.spawn(async (cx) => {
      try {
        await fs.mkdir(dir, { recursive: true });
        const file = `${dir}/issue.md`;
        await fs.writeFile(file, this.issueMarkdown(repo, d));
        const prompt = this.fullPrompt(text, repo, d, file);
        if (inTab) {
          run("tab.new", { name: `#${d.number} ${text.slice(0, 20)}`, folder: cwd, argv: ["claude"], task: prompt });
          this.addRun({ id, repo, number: d.number, prompt: text, at: Date.now(), status: "tab", output: "" });
        } else {
          await fs.writeFile(`${dir}/prompt.txt`, prompt);
          const claude = (await exec("sh", ["-lc", "command -v claude"]).catch(fail)).stdout.trim() || "claude";
          await fs.writeFile(`${dir}/run.sh`, [
            "#!/bin/sh",
            `cd ${shq(cwd)}`,
            `${shq(claude)} -p "$(cat ${shq(`${dir}/prompt.txt`)})" --permission-mode acceptEdits --add-dir ${shq(home())} --allowedTools ${ALLOWED_TOOLS.map(shq).join(" ")} > ${shq(`${dir}/out.md`)} 2> ${shq(`${dir}/err.txt`)}`,
            `echo $? > ${shq(`${dir}/exit`)}`,
          ].join("\n"));
          const r = await hc(["run", "--bg", "--json", "--no-parent", "--rm", "--name", `issue-${id}`, "--cwd", cwd, "--", "/bin/sh", `${dir}/run.sh`]);
          if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim());
          const job = { id, repo, number: d.number, prompt: text, at: Date.now(), status: "running", output: "", dir };
          this.jobs[id] = job; s.shownRun = id;
          this.addRun(job);
        }
        s.draft = "";
        if (this.st() === s) this.prompt.set_value("");
      } catch (e) { s.error = `Could not start: ${e?.message ?? e}`; }
      cx.notify();
    });
  }

  addRun(r) {
    this.runs = [r, ...this.runs.filter((x) => x.id !== r.id)].slice(0, 300);
    this.saveRuns();
  }
  saveRuns() { fs.writeFile(`${DATA()}/runs.json`, JSON.stringify(this.runs, null, 1)).catch(() => {}); }

  poll(cx) {
    const ids = Object.keys(this.jobs); if (!ids.length) return;
    cx.spawn(async (cx) => {
      let changed = false;
      for (const id of ids) {
        const job = this.jobs[id], dir = job.dir ?? `${DATA()}/jobs/${id}`;
        const exit = await readTextFile(`${dir}/exit`).catch(() => null);
        if (exit == null) continue;
        const out = (await readTextFile(`${dir}/out.md`).catch(() => null)) ?? "";
        const err = (await readTextFile(`${dir}/err.txt`).catch(() => null)) ?? "";
        const ok = exit.trim() === "0";
        const r = this.runs.find((x) => x.id === id) ?? job;
        r.status = ok ? "done" : "failed"; r.output = ok ? out : `${out}\n\n\`\`\`\n${err.trim()}\n\`\`\``;
        delete this.jobs[id]; changed = true;
        const saved = out.match(/Đã lưu:\s*(.+)/)?.[1]?.trim();
        notify({ title: ok ? `#${r.number}: xong` : `#${r.number}: lỗi`, body: saved ? `Đã lưu: ${saved}` : r.prompt.slice(0, 100), level: ok ? "success" : "error" });
      }
      if (changed) { this.saveRuns(); cx.notify(); }
    });
  }

  // ---------- diagrams ----------
  // Starts rendering one diagram (spawned: safe to call from render).
  diagram(src, cx) {
    const dark = settings().dark !== false, key = hash(`${dark ? "d" : "l"}:${src}`);
    if (this.diagrams[key]) return { key, ...this.diagrams[key] };
    this.diagrams[key] = { status: "pending" };
    cx.spawn(async (cx) => {
      // image() only reads under mods/; a hidden folder there doesn't reload the mod.
      const dir = `${DATA()}/diagrams`, inp = `${dir}/${key}.mmd`, pics = `${appHome()}/mods/issues/.diagrams`, out = `${pics}/${key}.png`;
      const d = this.diagrams[key];
      try {
        await fs.mkdir(dir, { recursive: true }); await fs.mkdir(pics, { recursive: true });
        if (!(await fs.exists(out))) {
          await fs.writeFile(inp, src);
          // A login + interactive zsh, so nvm's node and mmdc are on PATH.
          const r = await exec("zsh", ["-ilc", 'mmdc -i "$1" -o "$2" -t "$3" -b transparent -s 2 -q', "zsh", inp, out, dark ? "dark" : "default"]);
          if (!(await fs.exists(out))) throw new Error((r.stderr || r.stdout).trim().split("\n").slice(-6).join("\n") || "mmdc failed");
        }
        const s = await exec("sips", ["-g", "pixelWidth", "-g", "pixelHeight", out]);
        d.w = Number(s.stdout.match(/pixelWidth: (\d+)/)?.[1] ?? 800) / 2;
        d.h = Number(s.stdout.match(/pixelHeight: (\d+)/)?.[1] ?? 400) / 2;
        d.status = "ok"; d.path = `mods/issues/.diagrams/${key}.png`;
      } catch (e) { d.status = "error"; d.error = String(e?.message ?? e); }
      cx.notify();
    });
    return { key, status: "pending" };
  }

  // Markdown with its mermaid blocks drawn as pictures.
  markdown(id, md, t, cx) {
    const parts = [], text = md || "_(empty)_";
    let last = 0, i = 0;
    for (const m of text.matchAll(MERMAID)) {
      if (m.index > last) parts.push(TextView.markdown(`${id}-${i++}`, text.slice(last, m.index)).selectable(true).on_link_click((url) => exec("open", [url])));
      const d = this.diagram(m[1].trim(), cx), max = Math.max(120, this.width - 64);
      parts.push(d.status === "ok"
        ? div().p(6).rounded(6).bg(t.surface).child(image(d.path).w(Math.min(d.w, max)).h(d.h * Math.min(1, max / d.w)))
        : d.status === "error"
          ? v_flex().gap(4).child(div().text_size(11).text_color(t.ansi1).whitespace_normal().child(`Diagram error: ${d.error}`))
            .child(TextView.markdown(`${id}-${i++}`, "```\n" + m[1] + "\n```"))
          : h_flex().gap(6).p(6).items_center().text_size(11).text_color(t.dim)
            .child(svg("mods/workspace-chrome/spinner.svg").size(12).text_color(t.working).spin(900)).child("Rendering diagram…"));
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(TextView.markdown(`${id}-${i++}`, text.slice(last)).selectable(true).on_link_click((url) => exec("open", [url])));
    return v_flex().gap(8).children(parts);
  }

  // ---------- render ----------
  render(cx) {
    const t = theme(), want = focused()?.space ?? null;
    if (want !== this.cur) this.switchTo(want, cx);
    this.detectRepo(cx);
    const repo = this.repo(), s = this.st();
    if (repo && !s.open) this.refresh(cx, false);
    const btn = (id, label, action, on) => h_flex().id(id).h(24).px(8).items_center().rounded(6).text_size(11.5).flex_none()
      .bg(on ? t.selected : t.raised).text_color(on ? t.foreground : t.muted).border_1().border_color(t.border)
      .cursor_pointer().hover((st) => st.bg(t.hover)).on_click(action).child(label);
    const root = v_flex().id("issues").on_size_change((size, cx) => { if (Math.abs(size.width - this.width) > 1) { this.width = size.width; cx.notify(); } }).size_full().min_h(0).bg(t.chrome).text_color(t.foreground).text_size(12.5);

    const bar = h_flex().h(36).px(10).gap(6).items_center().border_b(1).border_color(t.border).flex_none()
      .child(div().text_size(13).font_semibold().child("Issues"))
      .child(this.editingRepo
        ? div().flex_1().min_w(0).child(Input.new(this.repoInput).h(24).px(6).rounded(5).border_1().border_color(t.input).bg(t.background).text_size(12))
        : div().id("repo-name").flex_1().min_w(0).truncate().text_size(11.5).text_color(t.dim).cursor_pointer().hover((st) => st.text_color(t.foreground))
          .on_click((_e, cx) => { this.editingRepo = true; this.repoInput.set_value(this.repos[this.cur] ?? ""); this.repoInput.focus(); cx.notify(); })
          .child(repo ?? "no repo — click to set"))
      .child(btn("reload", "↻", (_e, cx) => { if (s.open) this.show(s.open.number, cx, s.open.repo); else this.refresh(cx, true); cx.notify(); }));

    if (!repo && !s.open) return root.child(bar).child(div().p(14).text_color(t.muted).whitespace_normal()
      .child("This folder is not a GitHub repo. Click the bar above and type owner/repo."));

    return root.child(bar).child(s.open ? this.renderDetail(s, t, btn, cx) : this.renderList(s, t, btn, repo));
  }

  renderList(s, t, btn, repo) {
    const translated = new Set(this.runs.filter((r) => r.status === "done").map((r) => keyOf(r.repo, r.number)));
    const busy = new Set(Object.values(this.jobs).map((r) => keyOf(r.repo, r.number)));
    const filters = h_flex().px(10).py(6).gap(5).items_center().flex_none()
      .child(btn("st-open", "Open", (_e, cx) => this.setFilter({ state: "open" }, cx), s.state === "open"))
      .child(btn("st-closed", "Closed", (_e, cx) => this.setFilter({ state: "closed" }, cx), s.state === "closed"))
      .child(btn("st-all", "All", (_e, cx) => this.setFilter({ state: "all" }, cx), s.state === "all"))
      .child(btn("mine", "Mine", (_e, cx) => this.setFilter({ mine: !s.mine }, cx), s.mine));
    const search = div().px(10).pb(6).flex_none()
      .child(Input.new(this.search).h(26).px(8).rounded(6).border_1().border_color(t.input).bg(t.background).text_size(12));
    const rows = s.list.map((i) => {
      const k = keyOf(repo, i.number);
      return v_flex().id(`i-${i.number}`).px(10).py(6).gap(3).border_b(1).border_color(t.border).cursor_pointer()
        .hover((st) => st.bg(t.hover)).on_click((_e, cx) => { this.show(i.number, cx); cx.notify(); })
        .child(h_flex().gap(6).items_start()
          .child(div().size(8).mt(5).flex_none().rounded(4).bg(i.state === "OPEN" ? t.ansi2 : t.ansi5))
          .child(div().flex_1().min_w(0).whitespace_normal().child(i.title))
          .when(busy.has(k), (e) => e.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900)))
          .when(translated.has(k) && !busy.has(k), (e) => e.child(div().flex_none().px(5).rounded(4).bg(t.raised).text_size(10).text_color(t.accent).child("VI"))))
        .child(h_flex().gap(6).pl(14).text_size(11).text_color(t.dim)
          .child(`#${i.number}`).child(i.author?.login ?? "").child(ago(i.updatedAt))
          .children((i.labels ?? []).slice(0, 3).map((l) => div().px(5).rounded(4).text_color(`#${l.color}`).border_1().border_color(`#${l.color}`).child(l.name))));
    });
    return v_flex().flex_1().min_h(0)
      .child(filters).child(search)
      .when(Boolean(s.error), (e) => e.child(div().px(10).pb(6).text_size(11.5).text_color(t.ansi1).whitespace_normal().child(s.error)))
      .child(v_flex().id("list").flex_1().min_h(0).overflow_y_scrollbar()
        .when(s.loading && !s.list.length, (e) => e.child(div().p(12).text_color(t.dim).child("Loading…")))
        .when(!s.loading && !s.list.length && !s.error, (e) => e.child(div().p(12).text_color(t.dim).child("No issues")))
        .children(rows));
  }

  renderDetail(s, t, btn, cx) {
    const d = s.detail, n = s.open.number, k = keyOf(s.open.repo, n), sid = this.cur ?? "none";
    const runs = this.runs.filter((r) => keyOf(r.repo, r.number) === k);
    const shown = runs.find((r) => r.id === s.shownRun) ?? runs.find((r) => r.status !== "tab") ?? null;
    const head = h_flex().px(10).py(6).gap(5).items_center().flex_none().border_b(1).border_color(t.border)
      .child(btn("back", "← Back", (_e, cx) => this.back(cx)))
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.dim).child(`${s.open.repo}#${n}`))
      .when(Boolean(d), (e) => e
        .child(btn("browser", "GitHub ↗", () => exec("open", [d.url])))
        .child(btn("toggle", d.state === "OPEN" ? "Close" : "Reopen", (_e, cx) => this.setState(n, d.state === "OPEN", cx))));
    const body = v_flex().id("detail").flex_1().min_h(0).overflow_y_scrollbar().p(10).gap(10);
    if (!d) return v_flex().flex_1().min_h(0).child(head).child(body.child(div().text_color(s.error ? t.ansi1 : t.dim).whitespace_normal().child(s.detailLoading ? "Loading…" : s.error ?? "")));

    // Markdown ids carry the space and issue, so another space's view never reuses them.
    const card = (id, title, md) => v_flex().rounded(8).border_1().border_color(t.border).bg(t.background).overflow_hidden()
      .child(div().px(10).py(5).text_size(11).text_color(t.dim).bg(t.surface).border_b(1).border_color(t.border).child(title))
      .child(div().p(10).child(this.markdown(`${sid}-${k}-${id}`, md, t, cx)));

    const tr = v_flex().gap(6).p(10).rounded(8).border_1().border_color(t.accent).bg(t.surface)
      .child(div().text_size(12).font_semibold().child("Dịch / tóm tắt bằng prompt"))
      .child(Textarea.new(this.prompt).w_full().px(8).py(6).rounded(6).border_1().border_color(t.input).bg(t.background).text_size(12))
      .when(this.recent.length > 0, (e) => e.child(v_flex().gap(3).children(this.recent.map((p, i) =>
        div().id(`recent-${i}`).px(6).py(2).rounded(5).text_size(11).text_color(t.muted).truncate().cursor_pointer()
          .hover((st) => st.bg(t.hover).text_color(t.foreground))
          .on_click((_e, cx) => { this.prompt.set_value(p); this.prompt.focus(); cx.notify(); }).child(`↺ ${p}`)))))
      .child(h_flex().gap(6).items_center()
        .child(div().flex_1().text_size(10.5).text_color(t.dim).child("Run: chạy nền, kết quả hiện bên dưới"))
        .child(btn("in-tab", "Open in tab", (_e, cx) => this.translate(cx, true)))
        .child(h_flex().id("run").h(24).px(12).items_center().rounded(6).bg(t.solid).text_color(t.solid_foreground).text_size(11.5).font_medium()
          .cursor_pointer().hover((st) => st.opacity(0.88)).on_click((_e, cx) => this.translate(cx, false)).child("Run")));

    const results = runs.length ? v_flex().gap(6)
      .child(h_flex().gap(4).flex_wrap().children(runs.slice(0, 10).map((r) =>
        div().id(`run-${r.id}`).px(6).py(2).rounded(5).text_size(10.5).max_w(200).truncate().cursor_pointer()
          .bg(shown?.id === r.id ? t.selected : t.raised).text_color(r.status === "failed" ? t.ansi1 : t.muted)
          .on_click((_e, cx) => { s.shownRun = r.id; cx.notify(); })
          .child(`${r.status === "running" ? "⏳" : r.status === "tab" ? "▣" : r.status === "failed" ? "✗" : "✓"} ${r.prompt}`))))
      .when(Boolean(shown), (e) => e.child(shown.status === "running"
        ? h_flex().gap(6).items_center().p(8).text_color(t.dim)
          .child(svg("mods/workspace-chrome/spinner.svg").size(13).text_color(t.working).spin(900)).child("Claude đang làm…")
        : card(`out-${shown.id}`, `Kết quả · ${shown.prompt}`, shown.output))) : null;

    return v_flex().flex_1().min_h(0).child(head).child(body
      .child(div().text_size(15).font_semibold().whitespace_normal().child(`${d.title}`))
      .child(h_flex().gap(6).text_size(11).text_color(t.dim).flex_wrap()
        .child(`#${d.number}`).child(d.state).child(d.author?.login ?? "").child(ago(d.createdAt))
        .children((d.assignees ?? []).map((a) => `@${a.login}`)))
      .child(tr)
      .when(Boolean(s.error), (e) => e.child(div().text_size(11.5).text_color(t.ansi1).whitespace_normal().child(s.error)))
      .when(Boolean(results), (e) => e.child(results))
      .child(card("body", `${d.author?.login ?? ""} · mô tả`, d.body))
      .children((d.comments ?? []).map((c, i) => card(`c-${i}`, `${c.author?.login ?? "?"} · ${ago(c.createdAt)}`, c.body))));
  }
}
