import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, shared, setShared, run, exec, hc, notify, closeOverlay, props, terminals } from "herdr";

const age = (s) => {
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${s}s`;
};
const mem = (b) => (b >= 1073741824 ? `${(b / 1073741824).toFixed(1)} GB` : `${Math.round(b / 1048576)} MB`);
const stopDrag = (_e, cx) => cx.stop_propagation();

export default class Processes extends View {
  init(_props, cx) {
    this.fh = cx.focus_handle();
    this.fh.focus();
    this.expanded = new Set();
    this.restarting = new Set();
    this.removed = new Set();
  }

  // /exit, wait until Claude is gone, resume the same conversation in that terminal, then /compact it.
  // Runs as a detached shell job, so closing this dialog doesn't cancel it half way.
  restart(se, cx) {
    if (this.restarting.has(se.address)) return;
    this.restarting.add(se.address);
    cx.notify();
    const script = `
addr="$1"; root="$2"; log="$HOME/.config/herdr-app/data/restart-session.log"
alive() { [ -n "$(ps -p "$root" -o pid= 2>/dev/null)" ]; }
fail() { echo "$(date '+%F %T') $addr: $1" >> "$log"; exit 1; }
hc send --force "$addr" /exit
i=0; while alive && [ $i -lt 40 ]; do sleep 0.5; i=$((i+1)); done
id=$(hc read "$addr" --lines 40 | grep -oE 'claude --resume [0-9a-f]{8}-[0-9a-f-]{27}' | tail -1 | awk '{print $3}')
alive && fail "session did not exit"
if [ -n "$id" ]; then hc send --force "$addr" "claude --resume $id"; else hc send --force "$addr" "claude --continue"; fi
sleep 3
ready=0; i=0
while [ $ready -eq 0 ] && [ $i -lt 54 ]; do
  t=$(hc read "$addr" --lines 15)
  if echo "$t" | grep -qE '\? for shortcuts|shift\+tab to cycle|bypass permissions|accept edits' && echo "$t" | grep -qE '❯|> '; then ready=1; else sleep 0.5; i=$((i+1)); fi
done
[ $ready -eq 1 ] || fail "resumed, but Claude was not ready: /compact not sent"
hc send --force "$addr" /compact
`;
    cx.spawn(async (cx) => {
      try {
        // The trailing & detaches the job; exec returns at once and the job outlives this dialog.
        await exec("sh", ["-c", `nohup sh -c '${script.replace(/'/g, "'\\''")}' sh "$0" "$1" >/dev/null 2>&1 &`, se.address, String(se.root)]);
      } catch (e) {
        notify({ title: "Restart session failed", body: String(e?.message ?? e), level: "error" });
      }
      // Show the spinner for a while; the job itself isn't tracked from here.
      await exec("sleep", ["8"]);
      this.restarting.delete(se.address);
      cx.notify();
    });
  }

  btn(t, id, label, onClick, danger) {
    return div().id(id).px(8).py(3).rounded(5).border(1).border_color(t.border).text_size(12)
      .text_color(danger ? t.blocked : t.foreground).cursor_pointer()
      .hover((s) => s.bg(t.raised))
      .on_mouse_down("left", stopDrag).on_click(onClick).child(label);
  }

  iconBtn(t, id, icon, onClick, { danger, dim, spin } = {}) {
    return div().id(id).px(7).py(3).rounded(5).border(1).border_color(t.border).cursor_pointer()
      .text_color(danger ? t.blocked : dim ? t.dim : t.foreground).hover((x) => x.bg(t.raised))
      .on_mouse_down("left", stopDrag).on_click(onClick)
      .child(svg(`mods/processes/${icon}.svg`).size(15).when(spin, (el) => el.spin(900)));
  }

  goto(se) {
    run("space.select", { id: se.space });
    run("tab.select", { id: se.tab });
    run("pane.focus", { pane: se.pane });
    closeOverlay(props().overlay);
  }

  signal(sig, it) {
    exec("kill", [sig, ...it.pids.map(String)]);
  }

  // Delete the session: kill its terminal (closes the pane).
  // Hide it right away and poll again: the list comes from status-usage every 4s.
  remove(se, cx) {
    if (this.removed.has(se.address)) return;
    this.removed.add(se.address);
    if (terminals().some((x) => x.address === se.address)) run("terminal.kill", { terminal: se.address });
    setShared("procs.refresh", Date.now());
    cx.notify();
  }

  stopAll(se) {
    const tasks = se.items;
    if (!tasks.length) return;
    exec("kill", ["-TERM", ...tasks.flatMap((i) => i.pids.map(String))]);
  }

  row(t, se, it) {
    return h_flex().gap(8).items_center().px(10).py(6).rounded(6).bg(t.raised)
      .child(div().size(6).rounded(3).bg(it.paused ? t.working : t.done))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(div().min_w(0).text_size(11).text_color(t.foreground).child(it.cmd))
        .child(div().text_size(12).text_color(t.dim)
          .child(`${it.paused ? "paused · " : ""}${age(it.age)} · CPU ${it.cpu.toFixed(1)}% · ${mem(it.rss)}${it.n > 1 ? ` · ${it.n} procs` : ""}`)))
      .child(this.btn(t, `pz-${se.address}-${it.pid}`, it.paused ? "Resume" : "Pause", () => this.signal(it.paused ? "-CONT" : "-STOP", it)));
  }

  session(t, se) {
    const open = this.expanded.has(se.address);
    const items = open ? se.items : [];
    const tasks = se.items;
    const cpu = se.items.reduce((a, i) => a + i.cpu, 0);
    const rss = se.items.reduce((a, i) => a + i.rss, 0);
    const busy = (se.busyCpu ?? 0) >= 10;
    const col = se.status === "blocked" ? t.blocked : se.status === "working" ? t.working : se.status === "done" ? t.done : t.idle;
    return v_flex().gap(6).p(10).rounded(8).border(1).border_color(t.border).bg(t.surface)
      .child(h_flex().gap(8).items_center()
        .child(div().id(`fold-${se.address}`).p(2).rounded(4).cursor_pointer().hover((x) => x.bg(t.raised))
          .on_mouse_down("left", stopDrag)
          .on_click((_e, cx) => { open ? this.expanded.delete(se.address) : this.expanded.add(se.address); cx.notify(); })
          .child(svg(`mods/workspace-chrome/${open ? "chevron-down" : "chevron-right"}.svg`).size(15)))
        .child(div().size(8).rounded(4).bg(col))
        .child(v_flex().flex_1().min_w(0)
          .child(h_flex().gap(6).items_center()
            .child(div().truncate().font_semibold().text_size(14).text_color(t.foreground).child(se.title))
            .when(busy, (el) => el.child(h_flex().gap(4).items_center().px(6).py(1).rounded(8).bg(t.raised)
              .child(svg("mods/workspace-chrome/spinner.svg").size(11).text_color(t.working).spin(900))
              .child(div().text_size(11).text_color(t.working).child("Running")))))
          .child(div().truncate().text_size(12).text_color(t.dim).child(se.where)))
        .child(div().text_size(12).text_color(t.muted).child(`${se.age != null ? `${age(se.age)} · ` : ""}${tasks.length} proc · ${cpu.toFixed(0)}% · ${mem(rss)}`))
        .child(this.iconBtn(t, `rs-${se.address}`, "rotate-cw", (_e, cx) => this.restart(se, cx),
          { dim: this.restarting.has(se.address), spin: this.restarting.has(se.address) }))
        .child(this.iconBtn(t, `go-${se.address}`, "arrow-up-right", () => this.goto(se)))
        .when(tasks.length > 0, (el) => el.child(this.iconBtn(t, `stop-${se.address}`, "square", () => this.stopAll(se), { danger: true })))
        .child(this.iconBtn(t, `del-${se.address}`, "trash", (_e, cx) => this.remove(se, cx), { danger: true })))
      .when(open && items.length === 0, (el) => el.child(div().px(10).text_size(12).text_color(t.dim).child("No running processes")))
      .children(items.map((it) => this.row(t, se, it)));
  }

  render() {
    const t = theme();
    const d = shared("procs");
    // Only sessions whose terminal still exists, so a stale snapshot never shows a closed one.
    const live = new Set(terminals().map((x) => x.address));
    const sessions = (d?.sessions ?? []).filter((s) => live.has(s.address) && !this.removed.has(s.address));
    const tasks = sessions.flatMap((s) => s.items);
    const all = sessions.flatMap((s) => s.items);
    const cpu = all.reduce((a, i) => a + i.cpu, 0);
    const rss = all.reduce((a, i) => a + i.rss, 0);
    const sorted = [...sessions].sort((a, b) => b.items.length - a.items.length);
    return v_flex().id("proc-root").size_full().bg(t.popover).text_color(t.foreground)
      .track_focus(this.fh)
      .on_mouse_down("left", () => this.fh.focus())
      .on_key_down((e) => { if (e.key === "escape") closeOverlay(props().overlay); })
      .child(v_flex().px(14).py(10).gap(6).border_b(1).border_color(t.border)
        .child(h_flex().gap(8).items_center()
          .child(div().flex_1().font_semibold().text_size(14).child("Sessions"))
          .child(this.iconBtn(t, "refresh", "rotate-cw", () => setShared("procs.refresh", Date.now())))
          .child(this.btn(t, "fold-all", sessions.some((x) => this.expanded.has(x.address)) ? "Collapse all" : "Expand all", (_e, cx) => {
            if (sessions.some((x) => this.expanded.has(x.address))) this.expanded.clear();
            else sessions.forEach((x) => this.expanded.add(x.address));
            cx.notify();
          }))
          .child(this.btn(t, "close", "Close", () => closeOverlay(props().overlay))))
        .child(div().text_size(12).text_color(t.muted)
          .child(`${sessions.length} sessions · ${tasks.length} processes · CPU ${cpu.toFixed(0)}% · RAM ${mem(rss)}`)))
      .child(v_flex().id("proc-list").flex_1().overflow_y_scrollbar().gap(10).p(12)
        .when(!d, (el) => el.child(div().text_color(t.muted).child("Loading…")))
        .when(d && sessions.length === 0, (el) => el.child(div().text_color(t.muted).child("No Claude sessions running")))
        .children(sorted.map((se) => this.session(t, se))));
  }
}
