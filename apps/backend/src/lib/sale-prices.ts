import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  PriceListStatus,
} from "@medusajs/framework/utils"
import {
  createPriceListsWorkflow,
  deletePriceListsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Category-driven sale pricing.
 *
 * A category opts in by carrying `metadata.sale_percent` (e.g. 40). Every product
 * linked to it gets a price list price of base * (1 - percent/100). Medusa resolves
 * a `sale` price list by keeping `original_amount` at the base price and taking the
 * lowest of (price list, base) as `calculated_amount` — that gap is what renders the
 * strikethrough and the -40% badge on the storefront.
 *
 * Ownership: only price lists whose metadata carries MANAGED_BY are ever created,
 * updated, or deleted here. Price lists built by hand in the admin have no marker
 * and are invisible to this code, so both flows can run side by side. Where both
 * apply to a variant, Medusa serves the lowest price.
 */

export const MANAGED_BY = "auto-sale"

type SaleCategory = {
  id: string
  name: string
  handle: string
  metadata: Record<string, unknown> | null
}

export function parseSalePercent(value: unknown): number | null {
  const percent = typeof value === "string" ? Number(value) : value
  if (typeof percent !== "number" || !Number.isFinite(percent)) return null
  if (percent <= 0 || percent >= 100) return null
  return percent
}

export async function syncSalePrices(
  container: MedusaContainer,
  opts: { categoryIds?: string[] } = {}
): Promise<{ synced: number; cleared: number }> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)

  const scoped = opts.categoryIds?.length ? opts.categoryIds : null

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
    ...(scoped ? { filters: { id: scoped } } : {}),
  })

  const categories = allCategories as SaleCategory[]

  // Only price lists we generated carry the marker; everything else is off-limits.
  const existing = await pricing.listPriceLists({}, { take: null })
  const owned = new Map<string, string>()
  for (const list of existing) {
    const metadata = list.metadata as Record<string, unknown> | null
    if (metadata?.managed_by === MANAGED_BY && metadata?.category_id) {
      owned.set(String(metadata.category_id), list.id)
    }
  }

  let synced = 0
  let cleared = 0

  // Deleting a generated list is the slow half of a sync: ~42s for 416 prices,
  // against a database that touches the same rows in 0.07s via raw SQL. The cost
  // is Medusa's per-row cascade, not the DB, and the pricing module's own
  // softDeletePriceLists is no faster (~48s). Rebuilding a category therefore
  // takes ~35-48s end to end, which is why a percent change needs a moment
  // before the storefront reflects it. Left on the workflow: it is the supported
  // path and swapping it buys nothing.
  const dropManagedList = async (categoryId: string) => {
    const id = owned.get(categoryId)
    if (!id) return false
    await deletePriceListsWorkflow(container).run({ input: { ids: [id] } })
    owned.delete(categoryId)
    return true
  }

  for (const category of categories) {
    const percent = parseSalePercent(category.metadata?.sale_percent)

    // Percent removed or invalid: the discount must stop, so drop our list.
    // Without this the old prices would linger and quietly stay on sale.
    if (percent === null) {
      if (await dropManagedList(category.id)) {
        cleared++
        logger.info(
          `${category.handle}: no sale_percent, removed generated price list.`
        )
      }
      continue
    }

    const multiplier = 1 - percent / 100

    // Walked from the category rather than filtering products by category_id:
    // the product filter has no typed category_id key.
    const { data: expanded } = await query.graph({
      entity: "product_category",
      fields: [
        "id",
        "products.id",
        "products.variants.id",
        "products.variants.prices.*",
      ],
      filters: { id: category.id },
    })

    const products: any[] = (expanded[0] as any)?.products ?? []

    const prices: {
      amount: number
      currency_code: string
      variant_id: string
    }[] = []
    let skippedRuled = 0

    for (const product of products) {
      for (const variant of product.variants ?? []) {
        for (const price of variant.prices ?? []) {
          // variants.prices returns price list prices too; only base prices
          // (no price_list_id) are a valid discount reference.
          if (price.price_list_id) continue

          // Region/customer-scoped base prices would need their rules copied to
          // stay correct. Out of scope, so leave them at full price rather than
          // silently discount the wrong audience.
          if (price.rules_count && price.rules_count > 0) {
            skippedRuled++
            continue
          }

          const discounted = Math.round(Number(price.amount) * multiplier)
          if (!Number.isFinite(discounted) || discounted <= 0) continue

          prices.push({
            amount: discounted,
            currency_code: price.currency_code,
            variant_id: variant.id,
          })
        }
      }
    }

    if (!prices.length) {
      logger.warn(
        `${category.handle}: no base prices found across ${products.length} product(s). Skipping.`
      )
      if (await dropManagedList(category.id)) {
        cleared++
        logger.info(`${category.handle}: removed now-empty generated price list.`)
      }
      continue
    }

    // Rebuild rather than diff: the generated list is disposable by definition,
    // and this only ever deletes a list carrying our marker.
    await dropManagedList(category.id)

    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: `${category.name} (${percent}% off)`,
            description: `Generated from category ${category.handle}. Edits here are overwritten on the next sync; change metadata.sale_percent on the category instead.`,
            status: PriceListStatus.ACTIVE,
            prices,
            metadata: {
              managed_by: MANAGED_BY,
              category_id: category.id,
              sale_percent: percent,
            },
          },
        ],
      },
    })

    synced++
    logger.info(
      `${category.handle}: ${percent}% off applied to ${prices.length} price(s) across ${products.length} product(s).` +
        (skippedRuled ? ` Skipped ${skippedRuled} rule-scoped base price(s).` : "")
    )
  }

  // A full run also reaps lists whose category was deleted outright — those never
  // appear in the loop above, so nothing else would ever clean them up.
  if (!scoped) {
    const liveIds = new Set(categories.map((c) => c.id))
    for (const [categoryId, listId] of owned) {
      if (liveIds.has(categoryId)) continue
      await deletePriceListsWorkflow(container).run({ input: { ids: [listId] } })
      cleared++
      logger.info(`Removed generated price list for deleted category ${categoryId}.`)
    }
  }

  return { synced, cleared }
}

/**
 * Sale categories a product belongs to. Used to narrow a sync to just the
 * categories a changed product could actually affect.
 */
export async function findSaleCategoriesForProduct(
  container: MedusaContainer,
  productId: string
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "categories.id", "categories.metadata"],
    filters: { id: productId },
  })

  const categories: any[] = (data[0] as any)?.categories ?? []
  return categories
    .filter((c) => parseSalePercent(c.metadata?.sale_percent) !== null)
    .map((c) => c.id)
}
