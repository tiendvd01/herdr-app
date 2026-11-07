// The diagram viewer shared by the Issues and Files panels: a dialog opened as an overlay of
// the same mod (main.js hands the copy to this class when props().viewer):
//   openOverlay({ mod: "<mod>", kind: "dialog", width: 0.9, height: 0.9,
//     props: { viewer: true, title, path, w, h, mmd, hires, hiresPath, dark } })
// `path` is the 2x picture shown in the panel; a 4x one (`hires`, from the
// `mmd` source) is rendered on open so zooming in stays sharp.
// Drag or scroll to pan, cmd/ctrl + scroll to zoom at the pointer;
// keys: + - 0 (100%) f (fit), Esc closes.
import { div, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { iconButton } from "./panel-ui.js";
import { exec, props, closeOverlay, theme } from "herdr";
import * as fs from "fs/promises";

const MIN = 0.1, MAX = 8;
const clamp = (z) => Math.min(MAX, Math.max(MIN, z));

export class Viewer {
  init(_props, cx) {
    const p = props() ?? {};
    this.p = p; this.path = p.path; this.zoom = 1; this.x = 0; this.y = 0;
    this.view = null; this.drag = null; this.fitted = false;
    this.handle = cx.focus_handle();
    cx.timer.after(50, () => this.handle.focus());
    // Sharper picture for zooming: render the source again at 4x, once.
    if (p.mmd && p.hires) cx.spawn(async (cx) => {
      try {
        if (!(await fs.exists(p.hires))) {
          await exec("zsh", ["-ilc", 'mmdc -i "$1" -o "$2" -t "$3" -b transparent -s 4 -q', "zsh", p.mmd, p.hires, p.dark ? "dark" : "default"]);
        }
        if (await fs.exists(p.hires)) { this.path = p.hiresPath; cx.notify(); }
      } catch (e) { console.log(`hi-res diagram failed: ${e}`); }
    });
  }

  close() { closeOverlay(this.p.overlay); }

  // Zoom to `z`, keeping the point (px, py) of the viewport still.
  zoomTo(z, px, py) {
    z = clamp(z);
    if (!this.view) { this.zoom = z; return; }
    px ??= this.view.width / 2; py ??= this.view.height / 2;
    const k = z / this.zoom;
    this.x = px - (px - this.x) * k; this.y = py - (py - this.y) * k; this.zoom = z;
  }
  fit() {
    if (!this.view) return;
    const pad = 24, z = clamp(Math.min((this.view.width - pad * 2) / this.p.w, (this.view.height - pad * 2) / this.p.h, 2));
    this.zoom = z; this.center();
  }
  actual() { this.zoom = 1; this.center(); }
  center() {
    this.x = (this.view.width - this.p.w * this.zoom) / 2;
    this.y = (this.view.height - this.p.h * this.zoom) / 2;
  }

  render(cx) {
    const t = theme(), p = this.p;
    const tool = (id, label, action, tip) => div().id(id).h(22).min_w(24).px(7).flex().flex_none().items_center().justify_center().rounded(5)
      .text_color(t.dim).cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground)).tooltip(tip)
      .on_click((_e, cx) => { action(); cx.notify(); }).child(label);
    const bar = h_flex().h(42).flex_none().px(14).gap(4).items_center().border_b(1).border_color(t.border).text_size(12)
      .child(div().flex_none().font_semibold().text_size(13).child("Diagram"))
      .child(div().flex_1().min_w(0).truncate().px(6).text_size(11).text_color(t.dim).child(p.title ?? ""))
      .child(tool("z-out", "−", () => this.zoomTo(this.zoom / 1.25), "Zoom out (-)"))
      .child(div().w(48).flex_none().text_center().text_size(11).text_color(t.muted).child(`${Math.round(this.zoom * 100)}%`))
      .child(tool("z-in", "+", () => this.zoomTo(this.zoom * 1.25), "Zoom in (+)"))
      .child(div().w(1).h(14).mx(4).bg(t.border))
      .child(tool("z-fit", "Fit", () => this.fit(), "Fit to window (f)"))
      .child(tool("z-100", "100%", () => this.actual(), "Actual size (0)"))
      .child(div().w(1).h(14).mx(4).bg(t.border))
      .child(iconButton("v-close", "close", "Close (Esc)", (_e, cx) => { this.close(); cx.notify(); }));

    const stage = div().id("stage").flex_1().min_h(0).relative().overflow_hidden().bg(t.background)
      .when(Boolean(this.drag), (e) => e.cursor_grabbing()).when(!this.drag, (e) => e.cursor_grab())
      .on_size_change((size, cx) => {
        const first = !this.view; this.view = size;
        if (first && !this.fitted) { this.fitted = true; this.fit(); }
        cx.notify();
      })
      .on_scroll_wheel((e, cx) => {
        const lp = e.local_position;
        if (e.modifiers?.platform || e.modifiers?.control) this.zoomTo(this.zoom * Math.exp(e.delta.y * 0.004), lp?.x, lp?.y);
        else { this.x += e.delta.x; this.y += e.delta.y; }
        cx.notify();
      })
      .on_mouse_down("left", (e, cx) => { this.drag = { x: e.position.x, y: e.position.y, ox: this.x, oy: this.y }; cx.notify(); })
      .on_mouse_up("left", (_e, cx) => { this.drag = null; cx.notify(); })
      .on_mouse_move((e, cx) => {
        if (!this.drag) return;
        this.x = this.drag.ox + e.position.x - this.drag.x; this.y = this.drag.oy + e.position.y - this.drag.y; cx.notify();
      })
      .on_hover((hovered, cx) => { if (!hovered && this.drag) { this.drag = null; cx.notify(); } })
      .when(Boolean(this.view), (el) => el.child(image(this.path).absolute().left(this.x).top(this.y).w(p.w * this.zoom).h(p.h * this.zoom)))
      .child(div().absolute().bottom(8).right(12).px(8).py(3).rounded(6).bg(t.raised + "e0").text_size(10).text_color(t.dim)
        .child("Drag or scroll to move · ⌘/Ctrl + scroll to zoom"));

    return v_flex().id("viewer").track_focus(this.handle).size_full().min_h(0).bg(t.background).text_color(t.foreground)
      .on_key_down((e, cx) => {
        const k = e.key;
        if (k === "escape") this.close();
        else if (k === "+" || k === "=") this.zoomTo(this.zoom * 1.25);
        else if (k === "-") this.zoomTo(this.zoom / 1.25);
        else if (k === "0") this.actual();
        else if (k === "f") this.fit();
        else return;
        cx.stop_propagation(); cx.notify();
      })
      .child(bar).child(stage);
  }
}
