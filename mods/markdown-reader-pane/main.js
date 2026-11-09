import { View, div } from "gpui-kit";
import { focused, panes, spaces, props, run, closeOverlay, notify } from "herdr";

// A shortcut launcher: dismiss itself, then split the pane it was opened from.
export default class MarkdownBeside extends View {
  init(_props, cx) {
    const overlay = props()?.overlay;
    const f = focused(), pane = f?.pane;
    const space = spaces().find(s => s.id === f?.space) || spaces().find(s => s.active);
    const terminals = panes().filter(p => p.tab === f?.tab && p.terminal && p.cwd);
    const cwd = f?.cwd || terminals.find(p => p.focused)?.cwd || terminals[0]?.cwd || space?.folder;
    const address = f?.shown || f?.terminal;
    const on = address ? (address.includes("/") ? address.split("/")[0] : null) : space?.machine || null;
    if (!overlay) return;
    cx.timer.after(1, () => {
      closeOverlay(overlay);
      if (pane) run("pane.split", { pane, direction: "right", mod: "markdown-reader", props: { cwd, on } });
      else notify({ title: "Select a pane first", body: "Click a terminal or reader pane, then press Ctrl+Shift+R.", level: "info" });
    });
  }

  render() { return div().size(1); }
}
