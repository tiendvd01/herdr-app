// Opens the focused terminal's folder in Zed. A folder on another machine
// opens through Zed's ssh:// remote projects.
//
// Run it with `mod.open {name: "open-zed"}`.
import { View, div } from "gpui-kit";
import { v_flex } from "gpui-base";
import { appHome, closeOverlay, exec, focused, hc, props, readTextFile, spaces, theme } from "herdr";
import { spaceFolder } from "./space-folder.js";

async function hostOf(machine) {
  const raw = await readTextFile(`${appHome()}/mods/open-vscode/hosts.json`).catch(() => null);
  const overrides = raw ? JSON.parse(raw) : {};
  if (overrides[machine]) return overrides[machine];
  const r = await hc(["machine", "ls", "--json"]);
  const m = (JSON.parse(r.stdout).machines ?? []).find((x) => x.name === machine);
  if (!m || m.via || !m.target || /\s/.test(m.target)) throw new Error(`No ssh host for "${machine}". Add it to mods/open-vscode/hosts.json: {"${machine}": "<Host in your ssh config>"}`);
  return m.target;
}

async function launch(folder, host) {
  const target = host ? `ssh://${host}${folder}` : folder;
  const r = await exec("zed", [target]).catch(() => null);
  if (r?.code === 0) return;
  const o = await exec("open", ["-a", "Zed", ...(host ? [] : [folder])]);
  if (o.code !== 0) throw new Error(o.stderr.trim() || `open exited with ${o.code}`);
}

export default class OpenZed extends View {
  init(_props, cx) {
    this.handle = cx.focus_handle();
    this.handle.focus();
    const f = focused();
    const space = spaces().find((s) => s.id === f?.space) ?? spaces().find((s) => s.active);
    this.folder = spaceFolder(space) || "";
    this.machine = space?.machine ?? null;
    this.error = this.folder ? null : "This space has no folder yet.";
    if (this.error) return;
    cx.spawn(async (cx) => {
      try {
        await launch(this.folder, this.machine ? await hostOf(this.machine) : null);
        closeOverlay(props().overlay);
      } catch (e) {
        this.error = e?.message ?? String(e);
        cx.notify();
      }
    });
  }

  render() {
    const t = theme();
    return v_flex().id("open-zed").track_focus(this.handle).size_full().p(16).gap(6).justify_center().bg(t.popover).text_size(13)
      .child(div().text_color(this.error ? t.blocked : t.foreground).font_semibold().child(this.error ? "Could not open Zed" : "Opening in Zed…"))
      .child(div().text_size(12).text_color(t.muted).child(this.error ?? `${this.machine ? `${this.machine}:` : ""}${this.folder}`));
  }
}
