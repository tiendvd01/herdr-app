# UI contract: 037

## Floating button (copy in layout `floating`, `placement()` non-null)
- Inbox icon, plus an unread count pill (1–99, `99+`) when > 0; dim icon when 0.
- Tooltip `Inbox · N unread`. Accent look while `inbox.dialog` is set.
- Click: `run("mod.open", { name: "inbox" })` (toggles the dialog).

## Dialog (copy opened by `mod.open`, `props().overlay` set)
- `dialogFrame` root, header: "Inbox" + unread pill, "Mark all as done", close ✕.
- List: live PR rows, folded Done group with Clear; empty state "No PR news yet. Reviews, comments, failed CI and conflicts on your open PRs show up here."
- Row click: mark read, close dialog, open Pull requests on the PR.
- Esc closes.

## Commands (keys.json / toast)
- `inbox.open-latest`, `inbox.done-all`: handled by the floating copy.
