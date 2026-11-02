import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, shared, setShared, run, exec, closeOverlay, props } from "herdr";

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
    this.showServices = false;
    this.expanded = new Set();
  }

  btn(t, id, label, onClick, danger) {
    return div().id(id).px(8).py(3).rounded(5).border(1).border_color(t.border).text_size(11)
      .text_color(danger ? t.blocked : t.foreground).cursor_pointer()
      .hover((s) => s.bg(t.raised))
      .on_mouse_down("left", stopDrag).on_click(onClick).child(label);
  }

  goto(se) {
    run("space.select", { id: se.space });
    run("tab.select", { id: se.tab });
    run("pane.focus", { pane: se.pane });
    closeOverlay(props().overlay);
  }

  signal(sig, it) {
    if (sig === "-TERM") setShared("procs.killed", [...(shared("procs.killed") ?? []).slice(-50), it.pid]);
    exec("kill", [sig, ...it.pids.map(String)]);
  }

  stopAll(se) {
    const tasks = se.items.filter((i) => !i.service);
    if (!tasks.length) return;
    setShared("procs.killed", [...(shared("procs.killed") ?? []).slice(-50), ...tasks.map((i) => i.pid)]);
    exec("kill", ["-TERM", ...tasks.flatMap((i) => i.pids.map(String))]);
  }

  row(t, se, it) {
    const dim = it.service;
    return h_flex().gap(8).items_center().px(10).py(6).rounded(6).bg(t.raised)
      .child(div().size(6).rounded(3).bg(it.paused ? t.working : dim ? t.dim : t.done))
      .child(v_flex().flex_1().min_w(0).gap(1)
        .child(div().truncate().text_size(12).text_color(dim ? t.muted : t.foreground).child(it.cmd))
        .child(div().text_size(10.5).text_color(t.dim)
          .child(`${it.paused ? "paused · " : ""}${age(it.age)} · CPU ${it.cpu.toFixed(1)}% · ${mem(it.rss)}${it.n > 1 ? ` · ${it.n} procs` : ""}`)))
      .child(this.btn(t, `pz-${se.address}-${it.pid}`, it.paused ? "Resume" : "Pause", () => this.signal(it.paused ? "-CONT" : "-STOP", it)));
  }

  session(t, se) {
    const open = this.expanded.has(se.address);
    const items = open ? se.items.filter((i) => this.showServices || !i.service) : [];
    const tasks = se.items.filter((i) => !i.service);
    const cpu = tasks.reduce((a, i) => a + i.cpu, 0);
    const rss = tasks.reduce((a, i) => a + i.rss, 0);
    const col = se.status === "blocked" ? t.blocked : se.status === "working" ? t.working : se.status === "done" ? t.done : t.idle;
    return v_flex().gap(6).p(10).rounded(8).border(1).border_color(t.border).bg(t.surface)
      .child(h_flex().gap(8).items_center()
        .child(div().id(`fold-${se.address}`).p(2).rounded(4).cursor_pointer().hover((x) => x.bg(t.raised))
          .on_mouse_down("left", stopDrag)
          .on_click((_e, cx) => { open ? this.expanded.delete(se.address) : this.expanded.add(se.address); cx.notify(); })
          .child(svg(`mods/workspace-chrome/${open ? "chevron-down" : "chevron-right"}.svg`).size(13)))
        .child(div().size(8).rounded(4).bg(col))
        .child(v_flex().flex_1().min_w(0)
          .child(div().truncate().font_semibold().text_size(13).text_color(t.foreground).child(se.title))
          .child(div().truncate().text_size(10.5).text_color(t.dim).child(se.where)))
        .child(div().text_size(11).text_color(t.muted).child(`${tasks.length} proc · ${cpu.toFixed(0)}% · ${mem(rss)}`))
        .child(this.btn(t, `go-${se.address}`, "Go to", () => this.goto(se)))
        .when(tasks.length > 0, (el) => el.child(this.btn(t, `stop-${se.address}`, "Stop all", () => this.stopAll(se), true))))
      .when(open && items.length === 0, (el) => el.child(div().px(10).text_size(11).text_color(t.dim).child("No running processes")))
      .children(items.map((it) => this.row(t, se, it)));
  }

  render() {
    const t = theme();
    const d = shared("procs");
    const sessions = d?.sessions ?? [];
    const tasks = sessions.flatMap((s) => s.items).filter((i) => !i.service);
    const cpu = tasks.reduce((a, i) => a + i.cpu, 0);
    const rss = tasks.reduce((a, i) => a + i.rss, 0);
    const sorted = [...sessions].sort((a, b) => b.items.filter((i) => !i.service).length - a.items.filter((i) => !i.service).length);
    return v_flex().id("proc-root").size_full().bg(t.popover).text_color(t.foreground)
      .track_focus(this.fh)
      .on_mouse_down("left", () => this.fh.focus())
      .on_key_down((e) => { if (e.key === "escape") closeOverlay(props().overlay); })
      .child(v_flex().px(14).py(10).gap(6).border_b(1).border_color(t.border)
        .child(h_flex().gap(8).items_center()
          .child(div().flex_1().font_semibold().text_size(14).child("Processes"))
          .child(this.btn(t, "fold-all", sessions.some((x) => this.expanded.has(x.address)) ? "Collapse all" : "Expand all", (_e, cx) => {
            if (sessions.some((x) => this.expanded.has(x.address))) this.expanded.clear();
            else sessions.forEach((x) => this.expanded.add(x.address));
            cx.notify();
          }))
          .child(this.btn(t, "svc", this.showServices ? "Hide services" : "Show services", (_e, cx) => { this.showServices = !this.showServices; cx.notify(); }))
          .child(this.btn(t, "close", "Close", () => closeOverlay(props().overlay))))
        .child(div().text_size(11.5).text_color(t.muted)
          .child(`${sessions.length} sessions · ${tasks.length} processes · CPU ${cpu.toFixed(0)}% · RAM ${mem(rss)}`)))
      .child(v_flex().id("proc-list").flex_1().overflow_y_scrollbar().gap(10).p(12)
        .when(!d, (el) => el.child(div().text_color(t.muted).child("Loading…")))
        .when(d && sessions.length === 0, (el) => el.child(div().text_color(t.muted).child("No Claude sessions running")))
        .children(sorted.map((se) => this.session(t, se))));
  }
}
