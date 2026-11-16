#!/usr/bin/env node
// Measure computed styles + boxes of named targets across viewports and UI states.
// usage: node capture.mjs --url <url> --spec <spec.json> --side demo|app --out <file.json>
//        [--viewports 1600x900,1280x800] [--states read,edit] [--lang ja-JP|en-US]
//        [--cookie name=value]... [--post '/path={"json":1}']... [--ls key=value]... [--shots <dir>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { Cdp, launchChrome, newPage } from './cdp.mjs'

const STANDARD_VIEWPORTS = ['1920x1080', '1600x900', '1440x900', '1280x800', '1024x768', '768x1024', '390x844']
const DEFAULT_PROPS = [
  'fontSize', 'fontWeight', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderBottomWidth', 'borderBottomStyle', 'borderTopLeftRadius', 'boxShadow',
  'minHeight', 'color', 'backgroundColor', 'borderBottomColor', 'display', 'position',
]

function parseArgs(argv) {
  const a = { cookie: [], ls: [], post: [] }
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i]
    if (!k.startsWith('--')) continue
    const key = k.slice(2)
    const v = argv[++i]
    if (key === 'cookie' || key === 'ls' || key === 'post') a[key].push(v)
    else a[key] = v
  }
  return a
}

const pick = (v, side) => (v && typeof v === 'object' ? v[side] : v)

/** Runs in the page: returns one record per matched element. */
const MEASURE_FN = `(selector, props, limit) => {
  const els = [...document.querySelectorAll(selector)].slice(0, limit)
  return els.map((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const out = { text: (el.innerText || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 24) }
    for (const p of props) out[p] = cs[p]
    out.width = +r.width.toFixed(2)
    out.height = +r.height.toFixed(2)
    out.clipped = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
    return out
  })
}`

async function runStep(page, step, side) {
  if (step.only && step.only !== side) return
  if (step.waitFor) await page.waitFor(pick(step.waitFor, side))
  else if (step.click) {
    const sel = JSON.stringify(pick(step.click, side))
    await page.waitFor(pick(step.click, side))
    await page.eval(`document.querySelector(${sel}).click()`)
  } else if (step.clickText) {
    const text = JSON.stringify(step.clickText)
    const within = JSON.stringify(step.within ?? 'button,[role=button],a')
    const exact = step.exact ? 'true' : 'false'
    const find = `(() => { const el = [...document.querySelectorAll(${within})].find(e => e.innerText && (${exact} ? e.innerText.trim() === ${text} : e.innerText.trim().includes(${text}))); if (!el) return false; el.click(); return true })()`
    let ok = false
    for (let i = 0; i < 40 && !ok; i++) { ok = await page.eval(find); if (!ok) await new Promise((r) => setTimeout(r, 250)) }
    if (!ok) throw new Error(`clickText not found: ${step.clickText}`)
  } else if (step.wait) await new Promise((r) => setTimeout(r, step.wait))
  else throw new Error(`unknown step ${JSON.stringify(step)}`)
  await new Promise((r) => setTimeout(r, step.settle ?? 250))
}

async function main() {
  const args = parseArgs(process.argv)
  if (!args.url || !args.spec || !args.out) throw new Error('need --url --spec --out')
  const side = args.side ?? 'app'
  const spec = JSON.parse(readFileSync(args.spec, 'utf8'))
  const viewports = (args.viewports ? args.viewports.split(',') : spec.viewports ?? STANDARD_VIEWPORTS)
  const wanted = args.states ? args.states.split(',') : null
  const states = spec.states.filter((s) => !wanted || wanted.includes(s.name))
  const lang = args.lang ?? 'ja-JP'

  const chrome = await launchChrome({ lang })
  const cdp = await Cdp.connect(chrome.wsUrl)
  const results = {}
  try {
    const page = await newPage(cdp)
    await page.send('Emulation.setLocaleOverride', { locale: lang }).catch(() => {})
    await page.send('Network.setExtraHTTPHeaders', { headers: { 'Accept-Language': lang } })
    const origin = new URL(args.url)
    for (const c of args.cookie) {
      const i = c.indexOf('=')
      await page.send('Network.setCookie', { name: c.slice(0, i), value: c.slice(i + 1), url: origin.origin })
    }
    // --post '<path>=<json>': same-origin POST before measuring (e.g. a local dev-login that sets the session cookie).
    for (const p of args.post) {
      const i = p.indexOf('=')
      await page.goto(origin.origin + '/', 0)
      const status = await page.eval(`fetch(${JSON.stringify(p.slice(0, i))}, {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:${JSON.stringify(p.slice(i + 1))}}).then(r => r.status)`)
      if (status >= 400) throw new Error(`--post ${p.slice(0, i)} → HTTP ${status}`)
    }
    if (args.ls.length) {
      const pairs = args.ls.map((s) => { const i = s.indexOf('='); return [s.slice(0, i), s.slice(i + 1)] })
      await page.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try{${pairs.map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)})`).join(';')}}catch(e){}`,
      })
    }
    if (args.shots) mkdirSync(args.shots, { recursive: true })

    for (const vp of viewports) {
      const [w, h] = vp.split('x').map(Number)
      await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
      results[vp] = {}
      for (const state of states) {
        // A hash-only URL (HashRouter) would be a same-document navigation and keep the previous state.
        await page.goto('about:blank', 0)
        await page.goto(args.url)
        if (spec.ready) await page.waitFor(pick(spec.ready, side))
        for (const step of state.steps ?? []) await runStep(page, step, side)
        const rec = {}
        for (const t of spec.targets) {
          if (t.states && !t.states.includes(state.name)) continue
          const sel = pick(t.selector, side)
          if (!sel) continue
          const props = t.props ?? spec.props ?? DEFAULT_PROPS
          rec[t.name] = await page.eval(`(${MEASURE_FN})(${JSON.stringify(sel)}, ${JSON.stringify(props)}, ${t.limit ?? 1})`)
        }
        results[vp][state.name] = rec
        if (args.shots) writeFileSync(join(args.shots, `${side}-${vp}-${state.name}.png`), await page.screenshot())
      }
    }
  } finally {
    cdp.close(); chrome.close()
  }
  writeFileSync(args.out, JSON.stringify({ meta: { url: args.url, side, lang, spec: spec.name, at: new Date().toISOString() }, results }, null, 2))
  console.log(`captured ${viewports.length} viewport(s) × ${states.length} state(s) → ${args.out}`)
}

main().catch((e) => { console.error(`capture failed: ${e.message}`); process.exit(2) })
