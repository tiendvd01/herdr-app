# Contract: UI kit (`lib/panel-ui.js`, synced as `<mod>/panel-ui.js`)

## Tokens
`UI.h = { sm: 22, md: 26, lg: 32 }`, `UI.radius = { sm: 4, md: 6, lg: 8, xl: 10 }`,
`UI.text = { caption: 11, small: 12, body: 13, title: 14, heading: 16 }`,
`UI.space = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, xxl: 16 }`, `UI.row = { header: 42, toolbar: 36 }`,
`UI.motion = { hover: 120, press: 80, pulse: 1400, spin: 900 }`.

## Button
`btn(id, opts)` → element. `opts`:
- `kind`: `"primary" | "secondary" | "ghost" | "danger" | "icon" | "chip"` (default `"secondary"`)
- `size`: `"sm" | "md" | "lg"` (default `"md"`)
- `label?`, `icon?` (name in `lib/icons/`), `extra?` (element after the label, e.g. a count)
- `on?` (selected), `disabled?`, `busy?`, `attention?`, `tip?` (required when no label), `color?` (ghost text color)
- `action?` (click handler, `(e, cx)`); never runs while disabled or busy.

States: hover = highlight layer fades in (120 ms); pressed = opacity 0.75 (80 ms); on = `selected` background;
disabled = opacity 0.45; busy = spinner over hidden content (same width); attention = accent ring pulsing.

## Wrappers (unchanged signatures)
`icon(name, size)`, `iconButton(id, name, tip, action, {active, small})`, `backButton(id, label, action)`,
`chip(id, label, on, action, {tip, count})`, `button(id, label, action, {primary, large, disabled, tip})`,
`textButton(id, label, action, {color, tip, large})`.

## Surfaces
`dialogFrame(el)`, `card()`, `inputFrame(focused)`, `divider()`, `sectionTitle(label)`, `headerRow()`,
`emptyState(iconName, title, hint)`.
