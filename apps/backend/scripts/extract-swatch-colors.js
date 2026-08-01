/**
 * Reads a scraped CSV, finds each colourway's swatch image, samples its average
 * colour with sharp, and names it from a fixed palette. Writes a JSON map for
 * the importer so colour names are measured, not guessed at from Mango's codes.
 *
 * The map is shared by every category importer and is MERGED, never replaced --
 * overwriting it would strip the colour names an earlier category still reads.
 *
 * Run: MANGO_CSV=/path/to/file.csv node scripts/extract-swatch-colors.js
 */
const fs = require("fs")
const BE = "C:/Projects/bacoola-2/apps/backend"
const csv = require(require.resolve("csv-parser", { paths: [BE] }))
const sharp = require(require.resolve("sharp", { paths: [BE] }))

const CSV_PATH = process.env.MANGO_CSV || "C:/Projects/bacoola-2/shop.csv"
const OUT = BE + "/src/scripts/mango-colors.json"

// Names are all either in the storefront's colorHexMap or valid CSS colours,
// so a swatch still renders even if per-variant hex is unavailable.
const PALETTE = {
  black: "#111111", charcoal: "#36454F", grey: "#888888", silver: "#C0C0C0",
  white: "#FFFFFF", "off-white": "#F5F5F0", cream: "#FFFDD0", beige: "#F5F5DC",
  stone: "#D2C8B8", tan: "#D2B48C", camel: "#C19A6B", khaki: "#8F8165",
  brown: "#5C4033", rust: "#B85A38", orange: "#E8833A", mustard: "#D4A017",
  yellow: "#FFDE43", olive: "#6B7042", green: "#7E7F6B", teal: "#2A7F7F",
  sky: "#87CEEB", blue: "#4A7FB5", navy: "#1F2A44", purple: "#6A4C93",
  lilac: "#C8A2C8", pink: "#FFC0CB", red: "#D01313", burgundy: "#6E1F2B",
  maroon: "#800000",
}

const hexToRgb = (h) => [
  parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
]
const toHex = (r, g, b) =>
  "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()

/** "Redmean" distance -- cheap and noticeably closer to human perception than raw RGB. */
function dist([r1, g1, b1], [r2, g2, b2]) {
  const rm = (r1 + r2) / 2
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
}

const PAL = Object.entries(PALETTE).map(([name, hex]) => ({ name, rgb: hexToRgb(hex) }))

const styleOf = (u) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[1]
const colourOf = (u) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[2]

async function pooled(items, limit, worker) {
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await worker(items[i++])
    })
  )
}

;(async () => {
  // The colourway manifest, when present, is a superset of the CSV: it holds
  // every sibling colourway the grid scrape never saw. Sample those too, or
  // the recovered colours have no hex and fall back to the coarse colorHexMap.
  const MANIFEST = BE + "/src/scripts/mango-colourways.json"
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {}

  const rows = []
  await new Promise((res, rej) =>
    fs.createReadStream(CSV_PATH)
      .pipe(csv()).on("data", (d) => rows.push(d)).on("end", res).on("error", rej)
  )
  console.log(`read ${rows.length} rows from ${CSV_PATH}`)

  const BULLET = "ColorBullet-module__BR9stq__colorBullet src"
  const T = "ProductTitle-module__7eNKla__productTitle"

  // Which column holds the product URL varies with the page template the scrape
  // ran against (a grid's first tile uses a different wrapper), so try them all.
  const hrefKeys = Object.keys(rows[0] || {}).filter((k) => k.endsWith("href"))
  const linkOf = (r) => hrefKeys.map((k) => r[k]).find((v) => styleOf(v)) || ""

  // First bullet in a row is that row's own colourway (verified against the
  // colour code in its href), the rest are its siblings.
  const entries = new Map()
  for (const r of rows) {
    const href = linkOf(r)
    const style = styleOf(href)
    const colour = colourOf(href)
    if (!style || !colour) continue
    const key = `${style}-${colour}`
    if (entries.has(key)) continue
    // Single-colour products render no bullets, but the swatch asset still
    // exists at the standard "-020" suffix, so build the URL when it is absent.
    const swatch =
      r[BULLET] ||
      `https://media.mango.com/is/image/punto/${style}-${colour}-020?wid=40`
    entries.set(key, { style, colour, swatch, title: r[T] })
  }

  for (const [style, s] of Object.entries(manifest)) {
    for (const [colour, c] of Object.entries(s.colours)) {
      const key = `${style}-${colour}`
      if (entries.has(key)) continue
      entries.set(key, {
        style,
        colour,
        swatch:
          c.swatch ||
          `https://media.mango.com/is/image/punto/${style}-${colour}-020?wid=40`,
        title: s.title,
      })
    }
  }

  // Nothing to gain from re-fetching swatches an earlier run already resolved.
  const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {}
  for (const key of Object.keys(previous)) {
    if (previous[key]?.hex) entries.delete(key)
  }

  const list = [...entries.values()]
  console.log(`${list.length} distinct colourways across ${new Set(list.map((e) => e.style)).size} styles`)

  let done = 0
  const reasons = {}
  const fail = (e, why) => {
    reasons[why] = (reasons[why] || 0) + 1
    e.rgb = null
    if ((reasons[why] || 0) <= 2) console.log(`  ! ${why}: ${e.style}-${e.colour} ${e.swatch || "(no url)"}`)
  }

  await pooled(list, 8, async (e) => {
    try {
      if (!e.swatch) return fail(e, "no swatch url")
      const res = await fetch(e.swatch)
      if (!res.ok) return fail(e, `http ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())

      const meta = await sharp(buf).metadata()
      const w = meta.width || 0
      const h = meta.height || 0
      if (!w || !h) return fail(e, "no dimensions")

      // Crop the middle 50% so the bullet's border ring cannot skew the mean,
      // sized from the actual image rather than assuming 40x40.
      const cw = Math.max(1, Math.floor(w * 0.5))
      const ch = Math.max(1, Math.floor(h * 0.5))
      const { data } = await sharp(buf)
        .extract({
          left: Math.floor((w - cw) / 2),
          top: Math.floor((h - ch) / 2),
          width: cw,
          height: ch,
        })
        .resize(1, 1, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true })

      e.rgb = [data[0], data[1], data[2]]
      e.hex = toHex(...e.rgb)
    } catch (err) {
      fail(e, "sharp: " + String(err.message).slice(0, 60))
    }
    if (++done % 40 === 0) console.log(`  sampled ${done}/${list.length}`)
  })
  console.log(`sampled ${done}; failures by reason:`, JSON.stringify(reasons))

  // Name greedily per style so two colourways of the same shirt never collide.
  const byStyle = new Map()
  for (const e of list) {
    if (!byStyle.has(e.style)) byStyle.set(e.style, [])
    byStyle.get(e.style).push(e)
  }

  const out = { ...previous }
  for (const [style, group] of byStyle) {
    // Seed with names this style already holds so a second scrape of the same
    // garment cannot hand two colourways the same option value.
    const taken = new Set(
      Object.entries(previous)
        .filter(([k]) => k.startsWith(`${style}-`))
        .map(([, v]) => v.name)
    )
    for (const e of group) {
      if (!e.rgb) {
        e.name = `colour-${e.colour}`
      } else {
        const ranked = PAL.map((p) => ({ name: p.name, d: dist(e.rgb, p.rgb) }))
          .sort((a, b) => a.d - b.d)
        const pick = ranked.find((r) => !taken.has(r.name)) || ranked[0]
        e.name = pick.name
      }
      taken.add(e.name)
      out[`${style}-${e.colour}`] = {
        name: e.name,
        hex: e.hex || null,
        swatch: e.swatch || null,
      }
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`wrote ${Object.keys(out).length} entries -> ${OUT}`)

  const tally = {}
  for (const v of Object.values(out)) tally[v.name] = (tally[v.name] || 0) + 1
  console.log("\nname distribution:")
  Object.entries(tally).sort((a, b) => b[1] - a[1])
    .forEach(([n, c]) => console.log(`  ${n}: ${c}`))

  console.log("\nsample (style 37011432 -- the 8-colour shirt):")
  Object.entries(out).filter(([k]) => k.startsWith("37011432-"))
    .forEach(([k, v]) => console.log(`  ${k} -> ${v.name} ${v.hex}`))
})().catch((e) => console.log("THREW:", e.message))
