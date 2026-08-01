/**
 * Fetches the real colourway data a grid scrape cannot capture.
 *
 * A scraped CSV row is one colourway, and the New Now scrape only ever caught
 * one per style -- so the storefront showed a single swatch where Mango shows
 * six. The product page carries the rest, server-rendered:
 *
 *   - every sibling colourway: code from the href, NAME from the swatch alt
 *     text ("Colour Emerald Green"), which beats sampling a 40px swatch and
 *     guessing from a palette
 *   - that colourway's exact size run, with availability encoded in the button
 *     id: `pdp.productInfo.sizeSelector.sizeAvailable.38` vs `sizeUnavailable.46`
 *   - the price, from the `itemProp="price"` meta
 *
 * Parsing keys off element IDs and itemProps rather than CSS class names. The
 * classes carry a per-build hash (`SizePicker-module__WzYwuW__…` in the scrape
 * is `SizeItem-module__Zv0vzW__…` today) and break on every deploy.
 *
 * A plain fetch is enough -- the site sits behind Akamai, but it is the
 * automation footprint that gets blocked, not ordinary requests. Concurrency is
 * deliberately low.
 *
 * Run: MANGO_CSV=/path/to/file.csv node scripts/fetch-mango-colourways.js
 * Out: src/scripts/mango-colourways.json
 */
const fs = require("fs")
const BE = "C:/Projects/bacoola-2/apps/backend"
const csv = require(require.resolve("csv-parser", { paths: [BE] }))

const CSV_PATH = process.env.MANGO_CSV || "C:/Projects/bacoola-2/Men_NewNow.csv"
const OUT = BE + "/src/scripts/mango-colourways.json"
const CONCURRENCY = Number(process.env.MANGO_CONCURRENCY || 4)

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

const styleOf = (u) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[1]
const colourOf = (u) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[2]
const typeOf = (u) => (String(u || "").match(/\/p\/men\/([^/]+)\//) || [])[1] || ""

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9" },
      })
      if (res.ok) return await res.text()
      if (res.status === 404) return null
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)))
  }
  return null
}

function parsePdp(html, ownStyle) {
  if (!html) return null

  // Sibling colourways: the swatch link carries the code, its img alt the name.
  //
  // The swatch strip is NOT always one garment in several colours. On suiting,
  // every swatch links to a DIFFERENT style id -- they are separate products
  // sharing a colour picker. Taking the code without checking the style invents
  // colourways like `37031360-56` that have no assets on the CDN at all, which
  // then surface as variants with no images. Keep only same-style swatches.
  const colours = []
  const seen = new Set()
  let foreign = 0
  for (const m of html.matchAll(
    /href="([^"]*\/(\d{6,})\/(\d+)\/00)"[\s\S]{0,400}?alt="Colour ([^"]+)"/g
  )) {
    const code = m[3]
    if (m[2] !== ownStyle) {
      foreign++
      continue
    }
    if (seen.has(code)) continue
    seen.add(code)
    colours.push({ code, name: m[4].trim(), href: m[1] })
  }

  // The colour the page is currently showing is a <span>, not an <a>, and its
  // alt reads "Colour Navy selected" -- so it is absent from the loop above and
  // would otherwise be the one colourway left unnamed.
  const sel = html.match(
    /alt="Colour ([^"]+?) selected"[\s\S]{0,400}?-(\d+)-020/
  )
  if (sel && !seen.has(sel[2])) {
    colours.push({ code: sel[2], name: sel[1].trim(), href: null })
    seen.add(sel[2])
  }

  // Availability comes from the button id (`sizeAvailable` / `sizeUnavailable`)
  // but the LABEL does not: the id's trailing segment is Mango's internal size
  // code, and for lettered garments those diverge -- a shirt's XS-XXL run is
  // `…sizeAvailable.19` through `.24`. Waist-sized items happen to have code ==
  // label, which is what made the bug look like correct data at first. Read the
  // label out of the nested sizeInfo span instead.
  const sizes = []
  for (const m of html.matchAll(
    /id="pdp\.productInfo\.sizeSelector\.size(Available|Unavailable)\.([^"]+)"([\s\S]{0,600}?)<\/button>/g
  )) {
    // Sold-out sizes append a class to the same span (`sizeInfo …__notAvailable`),
    // so the class attribute cannot be assumed to end right after `sizeInfo`.
    const label = (m[3].match(/sizeInfo[^"]*"><span[^>]*>([^<]+)<\/span>/) || [])[1]
    const size = (label || m[2]).trim()
    if (!size || sizes.some((s) => s.size === size)) continue
    sizes.push({ size, available: m[1] === "Available", code: m[2].trim() })
  }

  const price = Number((html.match(/itemProp="price" content="(\d+(?:\.\d+)?)"/) || [])[1])
  // og:title is "Slim-fit 100% linen bermuda shorts - Men | MANGO India".
  const title = ((html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || "")
    // Usually "… - Men | MANGO India", but the gender segment is sometimes
    // absent, so drop everything from the pipe regardless.
    .replace(/\s*-\s*(Men|Women|Teen|Kids)\s*\|.*$/i, "")
    .replace(/\s*\|\s*MANGO.*$/i, "")
    .trim()

  // The page's own swatch, so colour hex can still be measured from it later.
  // Must stop at whitespace: these sit in a srcSet, so `[^"]*` would swallow
  // the descriptor and the second URL and yield something unfetchable.
  const swatchOf = (code) =>
    (html.match(
      new RegExp(`(https://media\\.mango\\.com/[^"\\s]*?-${code}-020[^"\\s]*)`)
    ) || [])[1]

  return { colours, sizes, price, title, swatchOf, foreign }
}

async function pooled(items, limit, worker) {
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await worker(items[i++])
    })
  )
}

;(async () => {
  const rows = []
  await new Promise((res, rej) =>
    fs.createReadStream(CSV_PATH).pipe(csv()).on("data", (d) => rows.push(d)).on("end", res).on("error", rej)
  )
  const hrefKeys = Object.keys(rows[0] || {}).filter((k) => k.endsWith("href"))

  // One seed URL per style -- the scraped colourway.
  const seeds = new Map()
  for (const r of rows) {
    const href = hrefKeys.map((k) => r[k]).find((v) => styleOf(v)) || ""
    const style = styleOf(href)
    if (style && !seeds.has(style)) seeds.set(style, href)
  }
  console.log(`${seeds.size} styles to expand.`)

  const out = {}
  let done = 0
  const failed = []

  // Pass 1: seed page -> the full colour list for that style.
  const pending = []
  await pooled([...seeds.entries()], CONCURRENCY, async ([style, href]) => {
    const parsed = parsePdp(await get(href), style)
    if (!parsed) {
      failed.push(`${style} (seed)`)
      return
    }
    const seedCode = colourOf(href)
    out[style] = {
      title: parsed.title || "",
      type: typeOf(href),
      colours: {},
    }
    // The seed page is already parsed -- record its own colourway now.
    out[style].colours[seedCode] = {
      name:
        parsed.colours.find((c) => c.code === seedCode)?.name ||
        `colour-${seedCode}`,
      swatch: parsed.swatchOf(seedCode) || null,
      sizes: parsed.sizes,
      price: parsed.price,
    }
    for (const c of parsed.colours) {
      // The selected swatch is a <span> with no href, but it is always the seed
      // colour, which is already recorded above.
      if (c.code === seedCode || !c.href) continue
      pending.push({ style, code: c.code, name: c.name, href: c.href })
    }
    if (++done % 15 === 0) console.log(`  seeds ${done}/${seeds.size}`)
  })

  console.log(`Seeds done. ${pending.length} sibling colourways to fetch.`)

  // Pass 2: each sibling colourway, for ITS size run -- sizes differ per colour
  // and are the one thing that cannot be derived from a URL.
  done = 0
  await pooled(pending, CONCURRENCY, async (p) => {
    const url = p.href.startsWith("http") ? p.href : `https://shop.mango.com${p.href}`
    const parsed = parsePdp(await get(url), p.style)
    if (!parsed || !parsed.sizes.length) {
      failed.push(`${p.style}-${p.code}`)
      return
    }
    out[p.style].colours[p.code] = {
      name: p.name,
      swatch: parsed.swatchOf(p.code) || null,
      sizes: parsed.sizes,
      price: parsed.price,
    }
    if (++done % 25 === 0) console.log(`  siblings ${done}/${pending.length}`)
  })

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))

  const styles = Object.keys(out).length
  const cw = Object.values(out).reduce((s, v) => s + Object.keys(v.colours).length, 0)
  const variants = Object.values(out).reduce(
    (s, v) => s + Object.values(v.colours).reduce((n, c) => n + c.sizes.length, 0),
    0
  )
  console.log(`\nwrote ${styles} styles / ${cw} colourways / ${variants} size rows -> ${OUT}`)
  if (failed.length) console.log(`${failed.length} failed: ${failed.slice(0, 10).join(", ")}`)

  const dist = {}
  for (const s of Object.values(out)) {
    const n = Object.keys(s.colours).length
    dist[n] = (dist[n] || 0) + 1
  }
  console.log("colours per style:", JSON.stringify(dist))
})().catch((e) => console.log("THREW:", e.message))
