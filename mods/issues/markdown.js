// GENERATED from lib/markdown.js by scripts/sync-github-lib.sh. Do not edit here.
// Markdown with ```mermaid blocks drawn as pictures, shared by the Issues and Files panels.
// mmdc (mermaid-cli) renders each block to <app>/mods/<mod>/.diagrams/<hash>.png (a hidden folder:
// saving there does not reload the mod; image() only reads under mods/). Clicking a picture, or its
// button, opens the zoomable viewer (diagram-viewer.js) as a dialog overlay of the same mod: the
// mod's init must hand props().viewer to that Viewer.
//   const md = new Markdown("files");  ...  md.render(id, text, theme(), cx, { width, title })
import { div, image } from "gpui-kit";
import { v_flex, h_flex, TextView } from "gpui-base";
import { exec, appHome, settings, openOverlay } from "herdr";
import * as fs from "fs/promises";
import { icon, iconButton } from "./panel-ui.js";

const MERMAID = /```mermaid[^\n]*\n([\s\S]*?)```/g;
// mmdc's output: the message ("Error: Parse error on line 4:", the source line, a ^ pointer, "Expecting …")
// then a JS stack. Keep the message, drop the stack frames, shorten the long "Expecting" token list.
const mmdcError = (out) => {
  const lines = out.trim().split("\n"), start = lines.findIndex((l) => /^\s*\w*Error:/.test(l));
  const frame = (l) => /^\s*at\s|\((file|https?):\/\//.test(l);
  const msg = (start < 0 ? lines : lines.slice(start)).filter((l) => l.trim() && !frame(l) && !/^Generating/.test(l))
    .map((l) => l.length > 160 ? l.slice(0, 157) + "…" : l);
  return msg.slice(0, 6).join("\n") || "mmdc failed";
};
const ZOOM = 2; // most a diagram is enlarged to fill a wide pane
const FILL = 0.7; // share of the pane width a diagram is sized to
const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(36); };

export class Markdown {
  constructor(mod) { this.mod = mod; this.diagrams = {}; } // hash -> { status: "pending" | "ok" | "error", w, h, error }

  // Starts rendering one diagram (spawned: safe to call from render).
  diagram(src, cx) {
    const dark = settings().dark !== false, key = hash(`${dark ? "d" : "l"}:${src}`);
    if (this.diagrams[key]) return { key, ...this.diagrams[key] };
    const d = this.diagrams[key] = { status: "pending" }, mod = this.mod;
    cx.spawn(async (cx) => {
      const dir = `${appHome()}/data/${mod}/diagrams`, inp = `${dir}/${key}.mmd`, pics = `${appHome()}/mods/${mod}/.diagrams`, out = `${pics}/${key}.png`;
      try {
        await fs.mkdir(dir, { recursive: true }); await fs.mkdir(pics, { recursive: true });
        if (!(await fs.exists(inp))) await fs.writeFile(inp, src);
        if (!(await fs.exists(out))) {
          // A login + interactive zsh, so nvm's node and mmdc are on PATH.
          const r = await exec("zsh", ["-ilc", 'mmdc -i "$1" -o "$2" -t "$3" -b transparent -s 2 -q', "zsh", inp, out, dark ? "dark" : "default"]);
          if (!(await fs.exists(out))) throw new Error(mmdcError(r.stderr || r.stdout));
        }
        const s = await exec("sips", ["-g", "pixelWidth", "-g", "pixelHeight", out]);
        d.w = Number(s.stdout.match(/pixelWidth: (\d+)/)?.[1] ?? 800) / 2;
        d.h = Number(s.stdout.match(/pixelHeight: (\d+)/)?.[1] ?? 400) / 2;
        d.status = "ok"; d.path = `mods/${mod}/.diagrams/${key}.png`;
        d.mmd = inp; d.dark = dark; d.hires = `${pics}/${key}@4.png`; d.hiresPath = `mods/${mod}/.diagrams/${key}@4.png`;
      } catch (e) { d.status = "error"; d.error = String(e?.message ?? e); }
      cx.notify();
    });
    return { key, status: "pending" };
  }

  // A diagram shown bigger than its 2x picture needs the 4x one (the same file the viewer makes): render it once.
  sharpen(d, cx) {
    if (d.sharp !== undefined) return;
    d.sharp = false;
    cx.spawn(async (cx) => {
      try {
        if (!(await fs.exists(d.hires)))
          await exec("zsh", ["-ilc", 'mmdc -i "$1" -o "$2" -t "$3" -b transparent -s 4 -q', "zsh", d.mmd, d.hires, d.dark ? "dark" : "default"]);
        if (await fs.exists(d.hires)) { d.sharp = true; cx.notify(); }
      } catch { /* keep the 2x picture */ }
    });
  }

  // A rendered diagram with a button (and a click on it) that opens it in the zoomable viewer.
  card(id, d, w, h, t, title) {
    const open = () => openOverlay({ mod: this.mod, kind: "dialog", width: 0.9, height: 0.9,
      props: { viewer: true, title, path: d.path, w: d.w, h: d.h, mmd: d.mmd, dark: d.dark, hires: d.hires, hiresPath: d.hiresPath } });
    return div().id(`dg-${id}`).relative().p(6).rounded(6).bg(t.surface).cursor_pointer().on_click(open)
      .child(image(d.sharp ? d.hiresPath : d.path).w(w).h(h))
      .child(div().absolute().top(6).right(6).rounded(6).bg(t.raised).border_1().border_color(t.border)
        .child(iconButton(`dg-open-${id}`, "maximize", "Open in a dialog to zoom", (_e, cx) => { cx.stop_propagation(); open(); })));
  }

  // `width`: the panel's width (diagrams are sized to FILL of it, enlarged up to ZOOM times); `title`: shown in the viewer's header.
  render(id, md, t, cx, { width = 360, title = "" } = {}) {
    const parts = [], text = md || "_(empty)_", link = (url) => exec("open", [url]);
    let last = 0, i = 0;
    for (const m of text.matchAll(MERMAID)) {
      if (m.index > last) parts.push(TextView.markdown(`${id}-${i++}`, text.slice(last, m.index)).selectable(true).on_link_click(link));
      const d = this.diagram(m[1].trim(), cx), max = Math.max(120, Math.min(width * FILL, width - 64)), k = d.status === "ok" ? Math.min(ZOOM, max / d.w) : 1;
      if (d.status === "ok" && k > 1) this.sharpen(this.diagrams[d.key], cx);
      parts.push(d.status === "ok"
        ? h_flex().w_full().justify_center().child(this.card(`${id}-${i++}`, this.diagrams[d.key], d.w * k, d.h * k, t, title))
        : d.status === "error"
          ? v_flex().gap(4).child(div().text_size(11).text_color(t.ansi1).whitespace_normal().child(`Diagram error: ${d.error}`))
            .child(TextView.markdown(`${id}-${i++}`, "```\n" + m[1] + "\n```"))
          : h_flex().gap(6).p(6).items_center().text_size(11).text_color(t.dim)
            .child(icon("spinner", 12).text_color(t.working).spin(900)).child("Rendering diagram…"));
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(TextView.markdown(`${id}-${i++}`, text.slice(last)).selectable(true).on_link_click(link));
    return v_flex().gap(8).children(parts);
  }
}
