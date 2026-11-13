# Quickstart: validating Inbox

```sh
herdr-app check mods/inbox     # must pass
cat inbox.error 2>/dev/null; ls *.error   # no new errors
herdr-app status               # inbox block present, no errors
herdr-app shot /tmp/inbox.png  # inspect the sidebar list
herdr-app commands | rg inbox  # inbox.open-latest, inbox.done-all
herdr-app do inbox.done-all    # all entries move to Done
```

## Manual scenarios

1. Agent blocked: in an unfocused space make an agent ask for permission; a "Needs you" entry appears with a red `!`. Focus the agent: it turns read.
2. Agent finished: let an agent complete in an unfocused space; a "Finished" entry appears.
3. Startup quiet: restart the app with an agent already blocked; no entry appears.
4. PR event: on one of your open PRs, have another account request changes or break CI; within about 5 minutes an entry and a toast appear. Click the toast: the newest entry opens.
5. Go to PR: from another space click the PR entry; the matching space is selected, the Pull requests panel opens on that PR.
6. Done: hover and use the check, header check, Remove, Clear; confirm persistence after restart (`items` key).
7. Narrow sidebar: drag below about 160 px; the icon with unread badge appears and clicking jumps to the top entry.
8. Offline: disconnect network; no error is shown and entries stay.
