// Minimal Chrome DevTools Protocol client — zero dependencies (Node >= 22 has global WebSocket + fetch).
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

export function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!found) throw new Error('Chrome not found — set CHROME_BIN')
  return found
}

export async function launchChrome({ lang = 'ja-JP', port = 0 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-measure-'))
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    `--lang=${lang}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars=false',
    '--force-device-scale-factor=1',
    '--disable-gpu',
    'about:blank',
  ]
  const proc = spawn(findChrome(), args, { stdio: ['ignore', 'ignore', 'pipe'] })
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = ''
    const t = setTimeout(() => reject(new Error('Chrome did not start in 15s')), 15000)
    proc.stderr.on('data', (d) => {
      buf += d.toString()
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/)
      if (m) { clearTimeout(t); resolve(m[1]) }
    })
    proc.on('exit', (c) => reject(new Error(`Chrome exited early (${c}): ${buf.slice(-300)}`)))
  })
  const close = () => { try { proc.kill() } catch { /* already gone */ } try { rmSync(dir, { recursive: true, force: true }) } catch { /* best effort */ } }
  return { wsUrl, close }
}

export class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    this.listeners = []
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result)
      } else if (msg.method) this.listeners.forEach((l) => l(msg))
    })
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej) })
    return new Cdp(ws)
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params, sessionId }))
    })
  }
  on(fn) { this.listeners.push(fn) }
  close() { this.ws.close() }
}

/** Open a fresh page target and return a session-bound helper. */
export async function newPage(cdp) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
  const s = (m, p) => cdp.send(m, p, sessionId)
  await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable')
  return {
    send: s,
    async eval(expression) {
      const r = await s('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
      return r.result.value
    },
    async goto(url, waitMs = 600) {
      await s('Page.navigate', { url })
      await this.waitLoad()
      await new Promise((r) => setTimeout(r, waitMs))
    },
    async waitLoad(timeout = 30000) {
      const t0 = Date.now()
      while (Date.now() - t0 < timeout) {
        if ((await this.eval('document.readyState')) === 'complete') return
        await new Promise((r) => setTimeout(r, 100))
      }
      throw new Error('page load timeout')
    },
    async waitFor(selector, timeout = 30000) {
      const t0 = Date.now()
      const sel = JSON.stringify(selector)
      while (Date.now() - t0 < timeout) {
        if (await this.eval(`!!document.querySelector(${sel})`)) return
        await new Promise((r) => setTimeout(r, 150))
      }
      throw new Error(`waitFor timeout: ${selector}`)
    },
    async screenshot() {
      const { data } = await s('Page.captureScreenshot', { format: 'png' })
      return Buffer.from(data, 'base64')
    },
  }
}
