import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"
import csv from "csv-parser"

/**
 * Imports the Men -> New Now scrape into the `men-new-now-v2` category.
 *
 * Same shape as import-mango-v2 (a row is one COLOURWAY, style id and colour
 * code both come out of the product URL) but this scrape differs in three ways
 * that the T-shirt importer would get wrong:
 *
 *  - It is a MIXED feed -- shirts, jeans, blazers, shorts, a backpack, a pair of
 *    sunglasses. One folded-apparel dimension set does not fit all of it, so
 *    dimensions are chosen per garment type from the URL. Shiprocket rejects
 *    fulfilment on variants with no dims, and a 400g box for a backpack would
 *    just be a different kind of wrong.
 *  - Sizes are numeric (38-56) as well as lettered, so ranking cannot be a
 *    lookup in a fixed list.
 *  - The product URL lands in a different column for the grid's first tile
 *    (`imageLink href` rather than `mediaWrapper href`), so every href column is
 *    tried.
 *
 * Its marker is its own: MANGO_MARKER ("mango-newnow-v2") belongs to the
 * T-shirt import, and re-using it here would make each import delete the other.
 *
 * Run: npx medusa exec ./src/scripts/import-men-newnow.ts -- --apply
 * Then: migrate-mango-images.ts, fix-missing-inventory-levels.ts,
 *       set-mango-variant-images.ts
 */

const CSV_PATH = process.env.MANGO_CSV || "c:/Projects/bacoola-2/Men_NewNow.csv"
const COLORS_PATH = path.join(__dirname, "mango-colors.json")
const MANIFEST_PATH = path.join(__dirname, "mango-colourways.json")

/** Marks rows this importer owns, so a rerun replaces only its own products. */
export const NEWNOW_MARKER = "mango-men-newnow-v1"

const CATEGORY_HANDLE = "men-new-now-v2"

const USD_RATE = Number(process.env.MANGO_USD_RATE || 85)

/**
 * Shipping dimensions by the category segment of the product URL
 * (".../p/men/blazers/..."). Estimates, but the right order of magnitude --
 * the previous import's single folded-apparel figure is the fallback.
 */
const DIMS_DEFAULT = { weight: 400, length: 30, width: 25, height: 4 }
const DIMS_BY_TYPE: Record<string, typeof DIMS_DEFAULT> = {
  "backpacks-and-bags": { weight: 900, length: 45, width: 32, height: 18 },
  sunglasses: { weight: 150, length: 18, width: 9, height: 7 },
  "scarves--caps-and-gloves": { weight: 200, length: 25, width: 20, height: 6 },
  blazers: { weight: 900, length: 45, width: 35, height: 10 },
  jackets: { weight: 900, length: 45, width: 35, height: 10 },
  overshirts: { weight: 700, length: 40, width: 30, height: 8 },
  "sweaters-and-cardigans": { weight: 600, length: 40, width: 30, height: 8 },
  jeans: { weight: 700, length: 35, width: 28, height: 7 },
  trousers: { weight: 550, length: 35, width: 28, height: 6 },
}

const COL = {
  title: "ProductTitle-module__7eNKla__productTitle",
  price: "SinglePrice-module__y_asRG__center",
  priceWas: "SinglePrice-module__y_asRG__crossed",
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"]

/**
 * Lettered sizes sort by the usual order; numeric waist sizes sort numerically
 * after them (no product mixes the two, so the offset only keeps the comparator
 * total). "One size" goes last.
 */
const sizeRank = (s: string) => {
  const v = s.trim().toUpperCase()
  const i = LETTER_SIZES.indexOf(v)
  if (i !== -1) return i
  const n = Number(v)
  if (Number.isFinite(n)) return 100 + n
  return 9999
}

const styleOf = (u: string) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[1]
const colourOf = (u: string) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[2]
const typeOf = (u: string) => (String(u || "").match(/\/p\/men\/([^/]+)\//) || [])[1] || ""

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

function toUsd(inr: number): number {
  const whole = Math.max(1, Math.round(inr / USD_RATE))
  return Number((whole - 0.01).toFixed(2))
}

type Colourway = {
  code: string
  name: string
  hex: string | null
  images: string[]
  sizes: string[]
  /** Sizes Mango currently shows as sold out. Kept for reference, not stock. */
  soldOut: string[]
  price: number
}

/** scripts/fetch-mango-colourways.js output. */
type Manifest = Record<
  string,
  {
    title: string
    type: string
    colours: Record<
      string,
      {
        name: string
        swatch: string | null
        sizes: { size: string; available: boolean }[]
        price: number
      }
    >
  }
>

export default async function importMenNewNow({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule: any = container.resolve(Modules.PRODUCT)
  const apply = process.argv.includes("--apply")

  if (!fs.existsSync(CSV_PATH)) {
    logger.error(`Missing CSV at ${CSV_PATH}.`)
    return
  }
  if (!fs.existsSync(COLORS_PATH)) {
    logger.error(`Missing ${COLORS_PATH}. Run scripts/extract-swatch-colors.js first.`)
    return
  }
  const COLORS: Record<string, { name: string; hex: string | null }> = JSON.parse(
    fs.readFileSync(COLORS_PATH, "utf8")
  )

  const [{ data: salesChannels }, { data: profiles }, { data: cats }] =
    await Promise.all([
      query.graph({ entity: "sales_channel", fields: ["id", "name", "stock_locations.id"] }),
      query.graph({ entity: "shipping_profile", fields: ["id"] }),
      query.graph({ entity: "product_category", fields: ["id", "name", "handle"] }),
    ])

  // Prefer the channel that actually has a stock location, since the store has a
  // stray duplicate channel that nothing is linked to.
  const channel =
    (salesChannels as any[]).find((c) => c.stock_locations?.length) ??
    (salesChannels as any[])[0]
  const shippingProfileId = (profiles as any[])[0]?.id
  const category = (cats as any[]).find((c) => c.handle === CATEGORY_HANDLE)

  if (!channel?.id || !shippingProfileId) {
    logger.error("Missing sales channel or shipping profile.")
    return
  }
  // Landing in no category means the products exist but never appear under
  // Men -> New Now, which is the entire point of this import.
  if (!category) {
    logger.error(`No product category with handle "${CATEGORY_HANDLE}".`)
    return
  }
  logger.info(`Channel: ${channel.name} | Category: ${category.handle}`)

  // ---- parse + regroup -------------------------------------------------
  const rows: any[] = []
  await new Promise((res, rej) =>
    fs.createReadStream(CSV_PATH).pipe(csv())
      .on("data", (d) => rows.push(d)).on("end", res).on("error", rej)
  )

  const hrefKeys = Object.keys(rows[0] ?? {}).filter((k) => k.endsWith("href"))
  const linkOf = (r: any) =>
    hrefKeys.map((k) => r[k]).find((v) => styleOf(v)) || ""

  const styles = new Map<
    string,
    { title: string; type: string; colours: Map<string, Colourway> }
  >()
  let skipped = 0

  for (const r of rows) {
    const href = linkOf(r)
    const style = styleOf(href)
    const code = colourOf(href)
    const title = (r[COL.title] || "").trim()
    const priceStr = r[COL.price] || r[COL.priceWas] || ""

    if (!style || !code || !title || !priceStr) {
      skipped++
      continue
    }

    // "Rs. 3,899.00" -> 3899. Strip to digits, then drop the paise pair.
    const price = parseInt(priceStr.replace(/[^0-9]/g, ""), 10) / 100
    if (!Number.isFinite(price) || price <= 0) {
      skipped++
      continue
    }

    const images: string[] = []
    for (const key of Object.keys(r)) {
      if (!key.startsWith("ProductMedia-") || !key.includes("src")) continue
      const v = (r[key] || "").trim()
      if (v.startsWith("http") && !images.includes(v)) images.push(v)
    }

    const sizes: string[] = []
    for (let i = 1; i <= 8; i++) {
      const key =
        i === 1
          ? "SizePicker-module__WzYwuW__sizePickerAddToBagButton"
          : `SizePicker-module__WzYwuW__sizePickerAddToBagButton ${i}`
      const v = (r[key] || "").trim()
      if (v && !sizes.includes(v)) sizes.push(v)
    }
    if (!sizes.length) sizes.push("One Size")
    sizes.sort((a, b) => sizeRank(a) - sizeRank(b))

    if (!styles.has(style)) {
      styles.set(style, { title, type: typeOf(href), colours: new Map() })
    }
    const entry = styles.get(style)!

    // Duplicate scrapes of the same colourway: keep the richer row.
    const existing = entry.colours.get(code)
    if (existing && existing.images.length >= images.length) continue

    const meta = COLORS[`${style}-${code}`]
    entry.colours.set(code, {
      code,
      name: meta?.name ?? `colour-${code}`,
      hex: meta?.hex ?? null,
      images,
      sizes,
      soldOut: [],
      price,
    })
  }

  // ---- overlay the colourway manifest ----------------------------------
  // The scrape only ever caught one colourway per style. The manifest is read
  // off each product page, so it has every sibling colour, its REAL name, and
  // crucially its own size run -- 23 of 39 multi-colour styles here have a
  // different set of available sizes per colour, so a shared size run would
  // have invented variants.
  //
  // Images stay whatever the CSV had (only the scraped colour has any);
  // repair-mango-galleries fills in the rest by probing the CDN afterwards.
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
    let addedColours = 0
    let renamed = 0

    for (const [style, s] of Object.entries(manifest)) {
      if (!styles.has(style)) continue
      const entry = styles.get(style)!
      if (s.title) entry.title = s.title

      for (const [code, c] of Object.entries(s.colours)) {
        const sizes = c.sizes.map((x) => x.size).sort((a, b) => sizeRank(a) - sizeRank(b))
        const soldOut = c.sizes.filter((x) => !x.available).map((x) => x.size)
        const meta = COLORS[`${style}-${code}`]
        const existing = entry.colours.get(code)

        if (existing) {
          if (c.name && c.name !== existing.name) renamed++
          existing.name = c.name || existing.name
          existing.sizes = sizes.length ? sizes : existing.sizes
          existing.soldOut = soldOut
          if (c.price > 0) existing.price = c.price
          continue
        }

        entry.colours.set(code, {
          code,
          name: c.name || `colour-${code}`,
          hex: meta?.hex ?? null,
          images: [],
          sizes: sizes.length ? sizes : ["One Size"],
          soldOut,
          price: c.price > 0 ? c.price : [...entry.colours.values()][0]?.price ?? 0,
        })
        addedColours++
      }
    }
    logger.info(
      `Manifest: +${addedColours} colourways recovered, ${renamed} colour names corrected.`
    )
  } else {
    logger.warn(
      `No ${MANIFEST_PATH}. Products will have only the scraped colourway. ` +
        `Run scripts/fetch-mango-colourways.js first.`
    )
  }

  logger.info(
    `Parsed ${rows.length} rows -> ${styles.size} products, ` +
      `${[...styles.values()].reduce((s, v) => s + v.colours.size, 0)} colourways ` +
      `(${skipped} rows skipped)`
  )

  // ---- build product payloads -----------------------------------------
  const products: any[] = []
  const usedHandles = new Set<string>()

  for (const [style, { title, type, colours }] of styles) {
    const list = [...colours.values()]
    const dims = DIMS_BY_TYPE[type] ?? DIMS_DEFAULT

    // Names are unique per style by construction, but guard anyway -- a
    // duplicate option value would make the variant options ambiguous.
    const seen = new Set<string>()
    for (const c of list) {
      let n = c.name
      let i = 2
      while (seen.has(n)) n = `${c.name}-${i++}`
      c.name = n
      seen.add(n)
    }

    let handle = `${slug(title)}-${style}`
    while (usedHandles.has(handle)) handle = `${handle}-x`
    usedHandles.add(handle)

    const allImages: string[] = []
    for (const c of list) {
      for (const u of c.images) if (!allImages.includes(u)) allImages.push(u)
    }

    const sizeValues = [...new Set(list.flatMap((c) => c.sizes))].sort(
      (a, b) => sizeRank(a) - sizeRank(b)
    )

    const variants = list.flatMap((c) =>
      c.sizes.map((size) => ({
        title: `${c.name} / ${size}`,
        sku: `MNG-${style}-${c.code}-${size}`.toUpperCase().replace(/\s+/g, ""),
        options: { Color: c.name, Size: size },
        manage_inventory: true,
        ...dims,
        prices: [
          { amount: c.price, currency_code: "inr" },
          { amount: toUsd(c.price), currency_code: "usd" },
        ],
        metadata: {
          [NEWNOW_MARKER]: true,
          style_id: style,
          color_code: c.code,
          color_hex: c.hex,
          // What the supplier had in stock at import time. Bacoola holds its
          // own inventory, so this is provenance, not a stock level.
          supplier_sold_out: c.soldOut.includes(size),
          // Resolved to image ids by set-mango-variant-images once the product
          // exists and its images have been re-hosted.
          source_images: c.images,
        },
      }))
    )

    products.push({
      title,
      handle,
      description:
        `${title}. Part of the Men's New Now selection. ` +
        `Available in ${list.length} colour${list.length === 1 ? "" : "s"}.`,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      category_ids: [category.id],
      thumbnail: allImages[0],
      images: allImages.map((url) => ({ url })),
      options: [
        { title: "Color", values: list.map((c) => c.name) },
        { title: "Size", values: sizeValues },
      ],
      variants,
      sales_channels: [{ id: channel.id }],
      metadata: { [NEWNOW_MARKER]: true, style_id: style, product_type: type },
    })
  }

  const variantCount = products.reduce((s, p) => s + p.variants.length, 0)
  logger.info(`Built ${products.length} products / ${variantCount} variants.`)

  const byType = products.reduce<Record<string, number>>((acc, p) => {
    const t = p.metadata.product_type || "(unknown)"
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  logger.info(
    `Types: ${Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(", ")}`
  )

  const noImages = products.filter((p) => !p.images.length)
  if (noImages.length) {
    logger.warn(`${noImages.length} products have no images: ${noImages.map((p) => p.handle).join(", ")}`)
  }

  const sample = products[0]
  logger.info(
    `Sample: ${sample.title} | ${sample.options[0].values.length} colours ` +
      `-> ${sample.variants.length} variants | ${sample.images.length} images | ` +
      `sizes ${sample.options[1].values.join(",")}`
  )

  // ---- find what we would replace --------------------------------------
  // Scoped to this importer's own marker only. The T-shirt import's products
  // carry `mango-newnow-v2` and must survive.
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "categories.id"],
  })
  const stale = (existing as any[]).filter((p) => p.metadata?.[NEWNOW_MARKER])
  logger.info(`${stale.length} existing ${NEWNOW_MARKER} products would be deleted first.`)

  // The New Now feed overlaps the T-shirt import: the same garment is genuinely
  // in both. Creating it again would mean two products for one style (and a
  // handle collision), so adopt the existing product into the category instead.
  const owned = new Set(stale.map((p) => p.id))
  const foreign = new Map<string, any>()
  for (const p of existing as any[]) {
    const sid = p.metadata?.style_id
    if (sid && !owned.has(p.id)) foreign.set(String(sid), p)
  }

  const adopt = products
    .map((p) => ({ product: foreign.get(p.metadata.style_id), style: p.metadata.style_id }))
    .filter((x) => x.product)
  const before = products.length
  const fresh = products.filter((p) => !foreign.has(p.metadata.style_id))
  products.length = 0
  products.push(...fresh)
  if (before !== products.length) {
    logger.info(
      `${before - products.length} style(s) already exist from another import; ` +
        `they will be added to ${CATEGORY_HANDLE} rather than duplicated: ` +
        adopt.map((x) => x.product.handle).join(", ")
    )
  }

  if (!apply) {
    logger.warn("DRY RUN. Re-run with `-- --apply` to write.")
    return
  }

  if (stale.length) {
    logger.info(`Deleting ${stale.length} old products...`)
    for (let i = 0; i < stale.length; i += 50) {
      const batch = stale.slice(i, i + 50)
      await deleteProductsWorkflow(container).run({
        input: { ids: batch.map((p) => p.id) },
      })
    }
    logger.info("Deleted.")
  }

  logger.info("Creating products...")
  let created = 0
  const failures: string[] = []
  for (let i = 0; i < products.length; i += 20) {
    const batch = products.slice(i, i + 20)
    try {
      await createProductsWorkflow(container).run({ input: { products: batch } })
      created += batch.length
      logger.info(`  ${created}/${products.length}`)
    } catch (e: any) {
      failures.push(`batch at ${i}: ${e.message}`)
      logger.error(`  batch at ${i} failed: ${e.message}`)
    }
  }

  logger.info(`Created ${created}/${products.length} products.`)
  if (failures.length) logger.error(`${failures.length} batch(es) failed.`)

  // Append the category; sending only the new one would drop T-Shirts.
  let adopted = 0
  for (const { product } of adopt) {
    const ids = new Set<string>((product.categories ?? []).map((c: any) => c.id))
    if (ids.has(category.id)) continue
    ids.add(category.id)
    try {
      await productModule.updateProducts(product.id, {
        categories: [...ids].map((id) => ({ id })),
      })
      adopted++
    } catch (e: any) {
      logger.error(`  adopt ${product.handle}: ${e.message}`)
    }
  }
  if (adopt.length) logger.info(`Added ${adopted} existing product(s) to ${CATEGORY_HANDLE}.`)
  logger.info(
    "Next: migrate-mango-images.ts -- --apply, fix-missing-inventory-levels.ts, set-mango-variant-images.ts -- --apply"
  )
}
