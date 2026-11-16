#!/usr/bin/env node
// Compare two captures (demo vs app). Exit 1 on any difference.
// usage: node diff.mjs <demo.json> <app.json> [--tol 0.5] [--ignore-colors] [--ignore prop,prop] [--md <report.md>]
import { readFileSync, writeFileSync } from 'node:fs'

const COLOR_PROPS = new Set(['color', 'backgroundColor', 'borderBottomColor', 'borderTopColor', 'borderColor', 'boxShadow'])
const args = process.argv.slice(2)
const files = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').match(/^--(tol|ignore|md)$/))
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const tol = Number(opt('tol') ?? 0.5)
const ignore = new Set((opt('ignore') ?? '').split(',').filter(Boolean))
if (args.includes('--ignore-colors')) COLOR_PROPS.forEach((p) => ignore.add(p))
if (files.length < 2) { console.error('need <demo.json> <app.json>'); process.exit(2) }

const [demo, app] = files.map((f) => JSON.parse(readFileSync(f, 'utf8')))
const num = (v) => typeof v === 'number' ? v : (typeof v === 'string' && /^-?[\d.]+(px)?$/.test(v) ? parseFloat(v) : null)
const same = (a, b) => {
  const x = num(a), y = num(b)
  return x !== null && y !== null ? Math.abs(x - y) <= tol : a === b
}

const rows = []
let compared = 0
for (const [vp, states] of Object.entries(demo.results)) {
  for (const [state, targets] of Object.entries(states)) {
    for (const [name, demoEls] of Object.entries(targets)) {
      const appEls = app.results?.[vp]?.[state]?.[name]
      if (!appEls) { rows.push({ vp, state, name, prop: '(target)', demo: 'present', app: 'missing' }); continue }
      if (demoEls.length !== appEls.length) rows.push({ vp, state, name, prop: '(count)', demo: demoEls.length, app: appEls.length })
      demoEls.slice(0, appEls.length).forEach((d, i) => {
        for (const prop of Object.keys(d)) {
          if (prop === 'text' || ignore.has(prop)) continue
          compared++
          if (!same(d[prop], appEls[i][prop])) rows.push({ vp, state, name: demoEls.length > 1 ? `${name}[${i}]` : name, prop, demo: d[prop], app: appEls[i][prop] })
        }
      })
    }
  }
}

const head = `UI diff — demo ${demo.meta.url} vs app ${app.meta.url}\n tolerance ${tol}px · ignored: ${[...ignore].join(', ') || 'none'} · ${compared} values compared · ${rows.length} difference(s)`
// Collapse the same (viewport, state, target, property, demo, app) across many elements (e.g. 14 headers).
const groups = new Map()
for (const r of rows) {
  const m = /^(.*)\[(\d+)\]$/.exec(r.name)
  const base = m ? m[1] : r.name
  const key = [r.vp, r.state, base, r.prop, r.demo, r.app].join('\u0000')
  const g = groups.get(key) ?? { ...r, name: base, idx: [] }
  if (m) g.idx.push(Number(m[2]))
  groups.set(key, g)
}
let md = `${head}\n`
if (rows.length) {
  md += '\n| viewport | state | target | property | demo | app |\n|---|---|---|---|---|---|\n'
  for (const g of groups.values()) md += `| ${g.vp} | ${g.state} | ${g.idx.length > 1 ? `${g.name} ×${g.idx.length} (${g.idx.join(',')})` : g.idx.length ? `${g.name}[${g.idx[0]}]` : g.name} | ${g.prop} | ${g.demo} | ${g.app} |\n`
}
console.log(md)
if (opt('md')) writeFileSync(opt('md'), md)
process.exit(rows.length ? 1 : 0)
