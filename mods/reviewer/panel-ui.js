// GENERATED from lib/panel-ui.js by scripts/sync-github-lib.sh. Do not edit here.
// The app's UI kit: one look for buttons, their motion, and the common surfaces, shared by every
// personal screen (panels, dialogs, tab bar, Project Settings, inbox, status bar...). Spec 018;
// the gallery is mods/ui-gallery (herdr-app do mod.open '{"name":"ui-gallery"}').
// The button rule:
// - a well-known action (refresh, settings, close, edit, copy, open on GitHub) is an icon
//   with a tooltip: iconButton / btn kind "icon";
// - Back is an arrow plus the name of the screen it goes back to: backButton;
// - a filter or view switch (Open/Closed, Mine, Wrap, Preview/Source...) is a text chip: chip;
// - an action (Submit, Send, Search, Commit, Cancel...) is a text button: button (filled or
//   outlined) or textButton (no box, for Cancel/Discard beside a filled one); danger for Delete/Stop.
// Icons are Lucide, in lib/icons/<name>.svg. Colors come only from theme().
import { div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme } from "herdr";

/** Sizes, spacing, radius, text sizes and motion timings. Use these instead of literals. */
export const UI = {
  h: { sm: 22, md: 26, lg: 32 },
  radius: { sm: 4, md: 6, lg: 8, xl: 10 },
  text: { caption: 11, small: 12, body: 13, title: 14, heading: 16 },
  space: { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 16 },
  row: { header: 42, toolbar: 36 },
  motion: { hover: 120, press: 80, pulse: 1400, spin: 900 },
};

// Per size: height, horizontal padding, radius, text size, icon size.
const SIZE = {
  sm: { h: UI.h.sm, px: 8, r: UI.radius.md, text: UI.text.small, icon: 12 },
  md: { h: UI.h.md, px: 10, r: UI.radius.md, text: UI.text.small, icon: 14 },
  lg: { h: UI.h.lg, px: 14, r: UI.radius.lg, text: 12.5, icon: 15 },
};

/** An icon from lib/icons by name, or any app-relative svg path ("mods/x/y.svg"); tinted with the text color. */
export const icon = (name, size = 14) => svg(name.includes("/") ? name : `lib/icons/${name}.svg`).size(size);

// "#rrggbb" + alpha; other color forms are returned as they are.
const tint = (c, a) => (/^#[0-9a-f]{6}$/i.test(c ?? "") ? c + a : c);

/**
 * The one button. opts: kind ("primary" | "secondary" | "ghost" | "danger" | "icon" | "chip"),
  * size ("sm" | "md" | "lg"), label, icon (name or svg path), extra (element after the label), on, disabled, busy,
 * attention, tip, color (ghost text color), action.
 * Hover: a highlight layer fades in. Pressed: a short opacity dip. Busy: a spinner over the
 * hidden content (same width), clicks ignored. Attention: a slow accent ring pulse. All native.
 */
export function btn(id, opts = {}) {
  const t = theme();
  const { kind = "secondary", size = "md", label, extra, on = false, disabled = false, busy = false, attention = false, tip, color, action } = opts;
  const s = SIZE[size] ?? SIZE.md;
  // Icon buttons are square (a one-glyph label like "+" too) unless they carry extra content (a count).
  const square = !extra && (kind === "icon" || label == null);
  const live = !disabled && !busy;
  // Base look per kind.
  let bg = null, border = null, fg = t.foreground, hoverFg = null, layer = t.hover;
  if (kind === "primary") { bg = t.solid; border = t.solid; fg = t.solid_foreground; layer = tint(t.solid_foreground, "22"); }
  else if (kind === "secondary") { bg = t.raised; border = t.input; }
  else if (kind === "danger") { border = tint(t.ansi1, "66"); fg = t.ansi1; layer = tint(t.ansi1, "22"); }
  else if (kind === "chip") { fg = t.dim; hoverFg = t.foreground; }
  else { // ghost, icon: a neutral color (muted/dim) brightens on hover; a signal color (red...) keeps itself
    fg = color ?? (kind === "icon" ? t.muted : t.dim);
    hoverFg = color && color !== t.muted && color !== t.dim ? color : t.foreground;
  }
  // "on" is for toggles (chip, icon, ghost); filled and outlined actions have no selected state.
  if (on && (kind === "chip" || kind === "icon" || kind === "ghost")) { bg = t.selected; fg = t.foreground; }
  const content = h_flex().gap(UI.space.md).items_center().justify_center().min_w(0)
    .when(busy, (e) => e.opacity(0))
    .when(Boolean(opts.icon), (e) => e.child(icon(opts.icon, s.icon).flex_none()))
    .when(label != null, (e) => e.child(div().truncate().child(label)))
    .when(Boolean(extra), (e) => e.child(extra));
  return h_flex().id(id).relative().flex_none().h(s.h).items_center().justify_center().rounded(s.r)
    .when(square, (e) => e.w(s.h))
    .when(!square, (e) => e.px(kind === "ghost" || kind === "chip" ? Math.max(6, s.px - 2) : s.px).min_w(0))
    .text_size(s.text).text_color(fg).when(kind === "primary" || kind === "secondary", (e) => e.font_medium())
    .when(Boolean(bg), (e) => e.bg(bg)).when(Boolean(border), (e) => e.border_1().border_color(border))
    .when(Boolean(tip), (e) => e.tooltip(tip).accessibility_label(tip))
    .when(disabled, (e) => e.opacity(0.45))
    .when(live, (e) => e.cursor_pointer()
      .when(Boolean(hoverFg), (x) => x.hover((st) => st.text_color(hoverFg)))
      .active((st) => st.opacity(0.75)).transition("opacity", { duration: UI.motion.press, easing: "ease-out" })
      .when(Boolean(action), (x) => x.on_click(action)))
    // Hover highlight: fades in over the base, under the content.
    .when(live, (e) => e.child(div().absolute().inset_0().rounded(s.r).bg(layer).opacity(0)
      .hover((st) => st.opacity(1)).transition("opacity", { duration: UI.motion.hover, easing: "ease-out" })))
    .when(attention && !disabled, (e) => e.child(div().absolute().inset_0().rounded(s.r).border_1().border_color(t.accent)
      .loop("opacity", { from: 0.2, to: 1, period: UI.motion.pulse })))
    .child(content)
    .when(busy, (e) => e.child(h_flex().absolute().inset_0().items_center().justify_center()
      .child(icon("spinner", s.icon).spin(UI.motion.spin))));
}

// ---------- the panel buttons (unchanged signatures, now on btn) ----------

/** An icon-only button with a tooltip. `small`: the one used inside list rows. */
export function iconButton(id, name, tip, action, { active = false, small = false } = {}) {
  if (name === "spinner") return btn(id, { kind: "icon", size: small ? "sm" : "md", tip, busy: true });
  return btn(id, { kind: "icon", size: small ? "sm" : "md", icon: name, tip, action, on: active });
}

/** Back: an arrow plus where it goes ("List", "Issues", "Files"...). */
export function backButton(id, label, action) {
  return btn(id, { kind: "ghost", icon: "back", label, tip: `Back to ${label}`, action, color: theme().muted });
}

/** A filter or view switch. `count`: a number shown after the label. */
export function chip(id, label, on, action, { tip, count } = {}) {
  const t = theme();
  return btn(id, { kind: "chip", size: "sm", label, on, tip, action,
    extra: count != null ? div().text_size(UI.text.caption).text_color(t.dim).child(String(count)) : null });
}

/** A text action. `primary`: filled; otherwise outlined. `large`: the one of dialogs and bottom bars. */
export function button(id, label, action, { primary = false, large = false, disabled = false, tip, busy = false, danger = false } = {}) {
  return btn(id, { kind: danger ? "danger" : primary ? "primary" : "secondary", size: large ? "lg" : "md", label, action, disabled, busy, tip });
}

/** A text action with no box (Cancel, Discard, Delete beside a filled button). */
export function textButton(id, label, action, { color, tip, large = false } = {}) {
  return btn(id, { kind: "ghost", size: large ? "lg" : "md", label, action, color, tip });
}

// ---------- common surfaces ----------

/** The frame of a dialog opened with frame "none": one border, rounded, shadow, clipped. The only dialog frame:
 *  pair it with mod.json overlay.frame "none"; scripts/check-dialog-frames.mjs checks the rule (spec 024). */
export function dialogFrame(el) {
  const t = theme();
  return el.rounded(UI.radius.xl).overflow_hidden().bg(t.background).border_1().border_color(t.border).shadow_lg();
}

/** A raised box for a group of things. */
export function card() {
  const t = theme();
  return v_flex().p(UI.space.xl - 2).gap(UI.space.md).rounded(UI.radius.lg).border_1().border_color(t.border).bg(t.raised);
}

/** The box around an Input / Textarea; accent border while focused. */
export function inputFrame(focused = false) {
  const t = theme();
  return h_flex().h(30).px(UI.space.xl - 2).items_center().rounded(UI.radius.md).border_1()
    .border_color(focused ? t.accent : t.input).bg(t.background).text_color(t.foreground);
}

/** A 1px line between sections. */
export function divider() {
  return div().h(1).w_full().flex_none().bg(theme().border);
}

/** A small dim heading above a list or group. */
export function sectionTitle(label) {
  return div().h(26).flex().items_center().text_size(UI.text.caption).text_color(theme().dim).child(label);
}

/** The top bar of a panel or dialog: title on the left, actions on the right. */
export function headerRow() {
  const t = theme();
  return h_flex().h(UI.row.header).flex_none().px(14).gap(UI.space.lg).items_center().border_b(1).border_color(t.border);
}

/** Nothing to show: an icon, a title and a hint, centered. */
export function emptyState(iconName, title, hint) {
  const t = theme();
  return v_flex().size_full().items_center().justify_center().gap(UI.space.md).p(UI.space.xxl)
    .child(div().text_color(t.dim).child(icon(iconName, 20)))
    .child(div().text_size(UI.text.body).font_semibold().text_color(t.foreground).child(title))
    .when(Boolean(hint), (e) => e.child(div().text_size(UI.text.small).text_color(t.dim).child(hint)));
}
