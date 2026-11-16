// The UI kit gallery (spec 018): every button kind × size × state, the motion demos and the common
// surfaces, in the current theme. Open: herdr-app do mod.open '{"name":"ui-gallery"}'.
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, props, closeOverlay } from "herdr";
import { UI, btn, iconButton, backButton, chip, button, textButton, dialogFrame, card, inputFrame, divider, sectionTitle, headerRow, emptyState } from "./panel-ui.js";

const KINDS = ["primary", "secondary", "ghost", "danger", "icon", "chip"];
const SIZES = ["sm", "md", "lg"];
const TOGGLES = ["ghost", "icon", "chip"]; // kinds with an "on" state

export default class Gallery extends View {
  init(_props, cx) {
    this.busy = false; this.attention = true; this.on = "md"; this.clicks = 0;
  }

  render(cx) {
    const t = theme();
    const close = () => { const id = props()?.overlay; if (id != null) closeOverlay(id); };
    const hit = () => { this.clicks++; cx.notify(); };
    const label = (text) => div().w(84).flex_none().text_size(UI.text.small).text_color(t.dim).child(text);
    const sample = (kind, size, state) => {
      const id = `g-${kind}-${size}-${state}`;
      const base = kind === "icon" ? { icon: "refresh", tip: "Refresh" } : { label: kind === "chip" ? "Mine" : "Commit", icon: kind === "primary" && size === "lg" ? "check" : undefined };
      return btn(id, { kind, size, ...base, action: hit, on: state === "on", disabled: state === "disabled", busy: state === "busy" });
    };
    const states = ["normal", "on", "disabled", "busy"];
    const kindBlock = (kind) => v_flex().gap(UI.space.md)
      .child(sectionTitle(kind))
      .children(SIZES.map((size) => h_flex().gap(UI.space.lg).items_center()
        .child(label(size))
        .children(states.map((st) => h_flex().w(120).flex_none().child(st === "on" && !TOGGLES.includes(kind)
          ? div().text_size(UI.text.caption).text_color(t.dim).child("—") : sample(kind, size, st))))));

    const header = headerRow()
      .child(div().text_size(UI.text.title).font_semibold().child("UI kit"))
      .child(div().text_size(UI.text.small).text_color(t.dim).child(`clicks: ${this.clicks}`))
      .child(div().flex_1())
      .child(btn("g-close", { kind: "icon", icon: "close", tip: "Close", action: close }));

    const columnsHead = h_flex().gap(UI.space.lg).child(label("")).children(states.map((s) => div().w(120).flex_none().text_size(UI.text.caption).text_color(t.dim).child(s)));

    const motion = card()
      .child(div().text_size(UI.text.title).font_semibold().child("Motion"))
      .child(div().text_size(UI.text.small).text_color(t.dim).child("Hover: highlight fades in (120 ms). Press: short dip (80 ms). Busy: spinner, same width. Attention: slow accent pulse."))
      .child(h_flex().gap(UI.space.lg).items_center()
        .child(button("g-busy-demo", this.busy ? "Saving…" : "Save", hit, { primary: true, busy: this.busy }))
        .child(btn("g-busy-toggle", { kind: "chip", size: "sm", label: "busy", on: this.busy, action: () => { this.busy = !this.busy; cx.notify(); } }))
        .child(div().w(UI.space.xxl))
        .child(btn("g-att-demo", { kind: "secondary", icon: "fetch", label: "Update ready", attention: this.attention, action: hit }))
        .child(btn("g-att-toggle", { kind: "chip", size: "sm", label: "attention", on: this.attention, action: () => { this.attention = !this.attention; cx.notify(); } })));

    const legacy = card()
      .child(div().text_size(UI.text.title).font_semibold().child("Panel helpers (same signatures as before)"))
      .child(h_flex().gap(UI.space.lg).items_center()
        .child(backButton("g-back", "List", hit))
        .child(iconButton("g-ib", "settings", "Settings", hit))
        .child(iconButton("g-ib-on", "settings", "Settings (on)", hit, { active: true }))
        .child(iconButton("g-ib-sm", "copy", "Copy", hit, { small: true }))
        .child(iconButton("g-ib-spin", "spinner", "Loading", hit))
        .child(chip("g-chip", "Open", this.on === "md", () => { this.on = "md"; cx.notify(); }, { count: 4 }))
        .child(chip("g-chip2", "Closed", this.on === "x", () => { this.on = "x"; cx.notify(); }, { count: 12 }))
        .child(button("g-btn", "Search", hit))
        .child(button("g-btn-p", "Submit", hit, { primary: true, large: true }))
        .child(textButton("g-tb", "Cancel", hit, { large: true }))
        .child(button("g-btn-d", "Delete", hit, { danger: true })));

    const surfaces = card()
      .child(div().text_size(UI.text.title).font_semibold().child("Surfaces"))
      .child(h_flex().gap(UI.space.xl).items_start()
        .child(v_flex().w(220).gap(UI.space.md)
          .child(sectionTitle("Input frame"))
          .child(inputFrame(false).child(div().text_size(UI.text.small).text_color(t.dim).child("Search…")))
          .child(inputFrame(true).child(div().text_size(UI.text.small).child("focused")))
          .child(sectionTitle("Divider")).child(divider()))
        .child(v_flex().w(220).gap(UI.space.md)
          .child(sectionTitle("Text sizes"))
          .children(Object.entries(UI.text).map(([k, v]) => div().text_size(v).child(`${k} ${v}`))))
        .child(v_flex().w(260).h(150).rounded(UI.radius.lg).border_1().border_color(t.border).bg(t.background)
          .child(emptyState("merge", "No pull requests yet", "Nothing matches this filter."))));

    return dialogFrame(v_flex().id("ui-gallery").size_full().min_h(0).text_color(t.foreground).text_size(UI.text.body))
      .child(header)
      .child(v_flex().id("g-body").flex_1().min_h(0).overflow_y_scrollbar().p(UI.space.xxl).gap(UI.space.xxl)
        .child(motion)
        .child(card().child(div().text_size(UI.text.title).font_semibold().child("Buttons: kind × size × state"))
          .child(columnsHead).children(KINDS.map(kindBlock)))
        .child(legacy)
        .child(surfaces));
  }
}
