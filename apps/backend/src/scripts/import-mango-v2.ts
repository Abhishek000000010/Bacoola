import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"
import csv from "csv-parser"

/**
 * Rebuilds the Mango catalogue with colour as a real option.
 *
 * The first import treated every row of the scrape as its own product, but a
 * row is one COLOURWAY, not one garment -- 193 rows are really 90 styles in 184
 * colours. That left products with only a Size option, so the storefront's
 * card splitter (lib/util/variant-cards.ts) hit its no-colour fallback and
 * emitted one grid tile per size instead of one per colour.
 *
 * The style id and colour code both live in the scraped product URL
 * (".../slim-fit-t-shirt-180gsm/37011432/96/00"), which is what makes the
 * regrouping possible. Colour NAMES are read from mango-colors.json, produced by
 * sampling each swatch image, because the scrape only captured numeric codes.
 *
 * Options are titled exactly "Color" and "Size": CustomProductDetails matches
 * those strings to decide between swatch and size-chip rendering.
 *
 * Sizes are per-colourway rather than a union, so a colour that never offered
 * XXL does not gain a phantom variant.
 *
 * Run: npx medusa exec ./src/scripts/import-mango-v2.ts -- --apply
 * Then: migrate-mango-images.ts, fix-missing-inventory-levels.ts,
 *       set-mango-variant-images.ts
 */

const CSV_PATH = process.env.MANGO_CSV || "c:/Projects/bacoola-2/shop.csv"
const COLORS_PATH = path.join(__dirname, "mango-colors.json")

/** Marks rows this importer owns, so a rerun replaces only its own products. */
export const MANGO_MARKER = "mango-newnow-v2"

const USD_RATE = Number(process.env.MANGO_USD_RATE || 85)
const DIMS = { weight: 400, length: 30, width: 25, height: 4 }

const COL = {
  href: "ProductMedia-module__xopx3q__mediaWrapper href",
  title: "ProductTitle-module__7eNKla__productTitle",
  price: "SinglePrice-module__y_asRG__center",
  priceWas: "SinglePrice-module__y_asRG__crossed",
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ONE SIZE"]
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.trim().toUpperCase())
  return i === -1 ? 999 : i
}

const styleOf = (u: string) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[1]
const colourOf = (u: string) => (String(u || "").match(/\/(\d{6,})\/(\d+)\//) || [])[2]

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
  price: number
}

export default async function importMangoV2({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const apply = process.argv.includes("--apply")

  if (!fs.existsSync(COLORS_PATH)) {
    logger.error(`Missing ${COLORS_PATH}. Generate it before importing.`)
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
  const category =
    (cats as any[]).find((c) => /t-?shirts?/i.test(c.handle)) ??
    (cats as any[]).find((c) => /t-?shirts?/i.test(c.name))

  if (!channel?.id || !shippingProfileId) {
    logger.error("Missing sales channel or shipping profile.")
    return
  }
  logger.info(`Channel: ${channel.name} | Category: ${category?.handle ?? "NONE"}`)

  // ---- parse + regroup -------------------------------------------------
  const rows: any[] = []
  await new Promise((res, rej) =>
    fs.createReadStream(CSV_PATH).pipe(csv())
      .on("data", (d) => rows.push(d)).on("end", res).on("error", rej)
  )

  const styles = new Map<string, { title: string; colours: Map<string, Colourway> }>()
  let skipped = 0

  for (const r of rows) {
    const href = r[COL.href]
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

    if (!styles.has(style)) styles.set(style, { title, colours: new Map() })
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
      price,
    })
  }

  logger.info(
    `Parsed ${rows.length} rows -> ${styles.size} products, ` +
      `${[...styles.values()].reduce((s, v) => s + v.colours.size, 0)} colourways ` +
      `(${skipped} rows skipped)`
  )

  // ---- build product payloads -----------------------------------------
  const products: any[] = []
  const usedHandles = new Set<string>()

  for (const [style, { title, colours }] of styles) {
    const list = [...colours.values()]

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
        ...DIMS,
        prices: [
          { amount: c.price, currency_code: "inr" },
          { amount: toUsd(c.price), currency_code: "usd" },
        ],
        metadata: {
          [MANGO_MARKER]: true,
          style_id: style,
          color_code: c.code,
          color_hex: c.hex,
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
        `${title}. Part of the New Now selection. ` +
        `Available in ${list.length} colour${list.length === 1 ? "" : "s"}.`,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      category_ids: category ? [category.id] : [],
      thumbnail: allImages[0],
      images: allImages.map((url) => ({ url })),
      options: [
        { title: "Color", values: list.map((c) => c.name) },
        { title: "Size", values: sizeValues },
      ],
      variants,
      sales_channels: [{ id: channel.id }],
      metadata: { [MANGO_MARKER]: true, style_id: style },
    })
  }

  const variantCount = products.reduce((s, p) => s + p.variants.length, 0)
  logger.info(`Built ${products.length} products / ${variantCount} variants.`)

  const sample = products[0]
  logger.info(
    `Sample: ${sample.title} | ${sample.options[0].values.length} colours ` +
      `x sizes -> ${sample.variants.length} variants | ${sample.images.length} images`
  )
  logger.info(`  colours: ${sample.options[0].values.join(", ")}`)

  // ---- find what we would replace --------------------------------------
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "description", "metadata"],
  })
  const stale = (existing as any[]).filter(
    (p) =>
      p.metadata?.[MANGO_MARKER] ||
      p.description?.includes("Premium quality T-shirt from Mango")
  )
  logger.info(`${stale.length} existing imported products would be deleted first.`)

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
  logger.info(
    "Next: migrate-mango-images.ts -- --apply, fix-missing-inventory-levels.ts, set-mango-variant-images.ts -- --apply"
  )
}
