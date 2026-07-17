import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { parseSalePercent, syncSalePrices } from "../lib/sale-prices"

/**
 * Seeds `metadata.sale_percent` onto the section-level sale categories.
 *
 * The pricing logic in lib/sale-prices.ts is already category-agnostic: it walks
 * every category and acts on whichever ones carry `sale_percent`. Men worked
 * only because it was the one category with the metadata set; women, teen and
 * kids needed no code, just the value.
 *
 * The starting percent is read from the category's own name ("Sale 40% off" ->
 * 40) so the site matches what it already advertises. From here the admin owns
 * it: edit sale_percent on the category and the subscriber reprices.
 *
 * Idempotent, and deliberately non-destructive: a category that already has a
 * sale_percent is left alone, so re-running never stamps on a value the admin
 * has since changed (men is on 45 despite being named 40).
 *
 * Run: npx medusa exec ./src/scripts/seed-sale-percents.ts
 */

// The nine sale sections. Sub-categories inside them are not listed: a product
// sits in both its section sale category and its sub-category, so marking both
// would build two overlapping price lists for the same variant.
const SECTION_SALE_HANDLES = [
  "men-sale-40-v2",
  "women-sale-40-v2",
  "teen-boy-sale-70",
  "teen-girl-sale-70",
  "kids-boys-sale-40",
  "kids-girls-sale-40",
  "kids-babyboy-sale-40",
  "kids-babygirl-sale-40",
  "kids-newborn-sale-40",
]

/** "Sale 40% off" -> 40. Returns null when the name carries no percent. */
export function percentFromName(name: string | null | undefined): number | null {
  const match = String(name ?? "").match(/(\d{1,2})\s*%/)
  return match ? parseSalePercent(Number(match[1])) : null
}

export default async function seedSalePercents({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule: any = container.resolve(Modules.PRODUCT)

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
    filters: { handle: SECTION_SALE_HANDLES },
  })

  const found = new Set(categories.map((c: any) => c.handle))
  for (const handle of SECTION_SALE_HANDLES) {
    if (!found.has(handle)) {
      logger.warn(`seed-sale-percents: category '${handle}' not found; skipping`)
    }
  }

  const touched: string[] = []

  for (const category of categories as any[]) {
    const existing = parseSalePercent(category.metadata?.sale_percent)
    if (existing !== null) {
      logger.info(
        `seed-sale-percents: ${category.handle} already at ${existing}% — left alone`
      )
      continue
    }

    const percent = percentFromName(category.name)
    if (percent === null) {
      logger.warn(
        `seed-sale-percents: cannot read a percent from '${category.name}' (${category.handle}); set metadata.sale_percent by hand`
      )
      continue
    }

    await productModule.updateProductCategories(category.id, {
      metadata: { ...(category.metadata ?? {}), sale_percent: percent },
    })
    touched.push(`${category.handle}=${percent}%`)
    logger.info(`seed-sale-percents: ${category.handle} -> sale_percent=${percent}`)
  }

  if (!touched.length) {
    logger.info("seed-sale-percents: nothing to seed; every section already set")
    return
  }

  // Build the price lists now rather than relying on the update events: the
  // admin should not have to wait for a background sync on first setup.
  logger.info(`seed-sale-percents: seeded ${touched.length} — generating price lists...`)
  const { synced, cleared } = await syncSalePrices(container)
  logger.info(
    `seed-sale-percents: done. seeded=[${touched.join(", ")}], priced=${synced}, cleared=${cleared}`
  )
}
