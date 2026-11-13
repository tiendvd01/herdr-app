# Quickstart: Validate the Issues Panel

```sh
herdr-app check mods/issues     # load and render once; must pass
herdr-app status                # layout, focus, overlays, errors
ls mods/issues/*.error 2>/dev/null; cat layout.error 2>/dev/null
herdr-app shot /tmp/issues.png  # PNG of the last frame (use the scratchpad dir when scripted)
gh auth status                  # work account (tien-sora) active
```

## Manual scenarios

1. Focus a terminal in a GitHub repo, open the Issues panel (tab bar button). Header shows repo; list shows Open + Mine.
2. Toggle Open / Closed / All and Mine; list changes. Search a word + Enter; list narrows.
3. In a repo with more than 30 matches, scroll to the end; "Loading more…" then more rows.
4. Click an issue: description, comments, labels. Fold one comment, then Collapse comments / Expand comments. Click Back.
5. Open an issue with a mermaid block and a code fence; click the diagram to open the viewer.
6. Restart the app: the same issue reopens; list shows "updated … ago" then refreshes. Reload always refetches.
7. `cd` the terminal to a non-repo folder: "This folder is not a GitHub repo."
8. Click Summarize; summary card appears; add a comment on GitHub, Reload: card shows OUTDATED.
9. Confirm a personal-owner repo works without changing `gh auth status`.
