// GENERATED from lib/panel-ui.js by scripts/sync-github-lib.sh. Do not edit here.
// Buttons shared by the side panels (Files, Changes, Issues, Git, Pull requests), so the
// five look and behave the same. The rule:
// - a well-known action (refresh, settings, close, edit, copy, open on GitHub) is an icon
//   with a tooltip: iconButton;
// - Back is an arrow plus the name of the screen it goes back to: backButton;
// - a filter or view switch (Open/Closed, Mine, Wrap, Preview/Source...) is a text chip: chip;
// - an action (Submit, Send, Search, Commit, Cancel...) is a text button: button (filled or
//   outlined) or textButton (no box, for Cancel/Discard beside a filled one).
// Icons are Lucide, in lib/icons/<name>.svg.
import { div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme } from "herdr";

/** An icon from lib/icons (tinted with the text color). */
export const icon = (name, size = 14) => svg(`lib/icons/${name}.svg`).size(size);

/** An icon-only button with a tooltip. `small`: the 18px one used inside list rows. */
export function iconButton(id, name, tip, action, { active = false, small = false } = {}) {
  const t = theme();
  return h_flex().id(id).size(small ? 18 : 24).flex_none().items_center().justify_center().rounded(small ? 4 : 6)
    .cursor_pointer().text_color(active ? t.foreground : t.muted).when(active, (e) => e.bg(t.selected))
    .hover((s) => s.bg(active ? t.selected : t.hover).text_color(t.foreground))
    .accessibility_label(tip).tooltip(tip).on_click(action)
    .child(name === "spinner" ? icon(name, small ? 11 : 13).spin(900) : icon(name, small ? 12 : 14));
}

/** Back: an arrow plus where it goes ("List", "Issues", "Files"...). */
export function backButton(id, label, action) {
  const t = theme();
  return h_flex().id(id).h(24).flex_none().pl(4).pr(8).gap(4).items_center().rounded(6)
    .text_size(12).text_color(t.muted).cursor_pointer().hover((s) => s.bg(t.hover).text_color(t.foreground))
    .tooltip(`Back to ${label}`).on_click(action)
    .child(icon("back", 14)).child(label);
}

/** A filter or view switch. `count`: a number shown after the label. */
export function chip(id, label, on, action, { tip, count } = {}) {
  const t = theme();
  return h_flex().id(id).h(22).flex_none().px(8).gap(5).items_center().rounded(6).text_size(12).cursor_pointer()
    .when(on, (e) => e.bg(t.selected).text_color(t.foreground))
    .when(!on, (e) => e.text_color(t.dim).hover((s) => s.bg(t.hover).text_color(t.foreground)))
    .when(Boolean(tip), (e) => e.tooltip(tip)).on_click(action)
    .child(label)
    .when(count != null, (e) => e.child(div().text_size(11).text_color(t.dim).child(String(count))));
}

/** A text action. `primary`: filled; otherwise outlined. `large`: the 32px one of dialogs and bottom bars. */
export function button(id, label, action, { primary = false, large = false, disabled = false, tip } = {}) {
  const t = theme();
  return h_flex().id(id).h(large ? 32 : 26).flex_none().px(large ? 14 : 10).gap(6).items_center().justify_center().rounded(large ? 8 : 6)
    .border_1().border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
    .text_color(primary ? t.solid_foreground : t.foreground).text_size(large ? 12.5 : 12).font_medium()
    .when(Boolean(tip), (e) => e.tooltip(tip))
    .when(disabled, (e) => e.opacity(0.5))
    .when(!disabled, (e) => e.cursor_pointer().hover((s) => s.opacity(0.88)).on_click(action))
    .child(label);
}

/** A text action with no box (Cancel, Discard, Delete beside a filled button). */
export function textButton(id, label, action, { color, tip, large = false } = {}) {
  const t = theme();
  return h_flex().id(id).h(large ? 32 : 26).flex_none().px(8).items_center().rounded(6).text_size(12)
    .text_color(color ?? t.dim).cursor_pointer().hover((s) => s.bg(t.hover).text_color(color ?? t.foreground))
    .when(Boolean(tip), (e) => e.tooltip(tip)).on_click(action)
    .child(label);
}
