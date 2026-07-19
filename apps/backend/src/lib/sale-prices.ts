import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import { createHash } from "crypto"
import { ulid } from "ulid"

/**
 * Category-driven sale pricing.
 *
 * A category opts in by carrying `metadata.sale_percent` (e.g. 40). Every product
 * in it *or in any category beneath it* gets a price list price of
 * base * (1 - percent/100) — a sale category is usually a shell whose products all
 * hang off its children (Jeans, Tops, ...), so pricing only the direct links would
 * leave the whole storefront listing at full price. A descendant that declares its
 * own sale_percent takes over its subtree. Medusa resolves
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
  parent_category_id: string | null
  metadata: Record<string, unknown> | null
}

/**
 * The category itself plus every category below it, stopping at any descendant
 * that declares its own sale_percent — that subtree belongs to the nested sale.
 */
function collectSubtree(
  rootId: string,
  childrenOf: Map<string, SaleCategory[]>
): string[] {
  const ids: string[] = []
  const queue = [rootId]

  while (queue.length) {
    const id = queue.shift()!
    ids.push(id)
    for (const child of childrenOf.get(id) ?? []) {
      if (parseSalePercent(child.metadata?.sale_percent) !== null) continue
      queue.push(child.id)
    }
  }

  return ids
}

/**
 * The category name with its percentage brought in line with sale_percent:
 * "Sale 40% off" at 60 becomes "Sale 60% off". Returns null when the name has no
 * percentage in it, which means leave it alone — a name someone wrote by hand is
 * theirs, and overwriting it with a template would be worse than a name that
 * simply never mentions a number.
 *
 * The handle is deliberately untouched. `women-sale-40-v2` reads wrong at 60%, but
 * it is the URL: rewriting it breaks live links, bookmarks and anything indexed,
 * to fix a string no customer reads as a claim.
 */
export function applyPercentToName(name: string, percent: number): string | null {
  // Only the first percentage: "Sale 40% off — up to 70% off selected lines" must
  // not have its second, unrelated number rewritten.
  const match = name.match(/\d+(\.\d+)?\s*%/)
  if (!match) return null

  const renamed = name.replace(match[0], `${percent}%`)
  return renamed === name ? null : renamed
}

/**
 * Identifies a generated list's exact contents. Stored on the list so a sync can
 * tell "nothing changed" from "rebuild needed" without diffing thousands of rows.
 *
 * This is what keeps the rename below from costing a second full rebuild: renaming
 * emits product-category.updated, which re-enters this sync, which would otherwise
 * dutifully rebuild all 8000 prices again for no reason.
 */
function fingerprint(
  percent: number,
  prices: { amount: number; currency_code: string; variant_id: string }[]
): string {
  const body = prices
    .map((p) => `${p.variant_id}:${p.currency_code}:${p.amount}`)
    .sort()
    .join(",")
  return createHash("sha1").update(`${percent}|${body}`).digest("hex")
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
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const scoped = opts.categoryIds?.length ? opts.categoryIds : null

  // Always load the full tree, even for a scoped run: a scoped category still
  // needs its descendants resolved, and they can sit anywhere in the tree.
  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "parent_category_id", "metadata"],
  })

  const allTree = allCategories as SaleCategory[]

  const childrenOf = new Map<string, SaleCategory[]>()
  for (const category of allTree) {
    if (!category.parent_category_id) continue
    const siblings = childrenOf.get(category.parent_category_id) ?? []
    siblings.push(category)
    childrenOf.set(category.parent_category_id, siblings)
  }

  const scopedIds = scoped ? new Set(scoped) : null
  const categories = scopedIds
    ? allTree.filter((c) => scopedIds.has(c.id))
    : allTree

  // Only price lists we generated carry the marker; everything else is off-limits.
  //
  // A category can accumulate MORE THAN ONE managed list if past syncs raced (the
  // metadata save and the rename echo, or rapid edits, processed concurrently by
  // the in-memory event bus). Track every list per category, not one: Medusa serves
  // the LOWEST price across all applicable lists, so a single stale list left behind
  // pins the storefront to the old, steeper discount even after the percent changes.
  const existing = await pricing.listPriceLists({}, { take: null })
  const owned = new Map<
    string,
    { id: string; metadata: Record<string, unknown> }[]
  >()
  for (const list of existing) {
    const metadata = list.metadata as Record<string, unknown> | null
    if (metadata?.managed_by === MANAGED_BY && metadata?.category_id) {
      const key = String(metadata.category_id)
      const group = owned.get(key) ?? []
      group.push({ id: list.id, metadata })
      owned.set(key, group)
    }
  }

  let synced = 0
  let cleared = 0

  // deletePriceListsWorkflow issues one SELECT per price row before deleting it.
  // At 416 prices that is merely slow (~42s); at 8032 — a sale category whose
  // subtree holds 251 products — the transaction dies with `write ECONNABORTED`,
  // the subscriber swallows it, and the stale list survives. The storefront then
  // charges the OLD percentage forever while the admin shows the new one.
  //
  // So delete set-based instead: three statements, no per-row cascade. Safe here
  // because it only ever runs against a list carrying our MANAGED_BY marker, and
  // those are disposable by definition — nothing references them and they hold no
  // hand-entered data. price_rule rows cascade off price via FK; price.price_list_id
  // has no FK, so prices must go explicitly.
  const dropManagedList = async (categoryId: string) => {
    // Re-read the managed lists for this category straight from the DB rather than
    // trust this run's `owned` snapshot: it drops every duplicate a past race left
    // behind, and also catches a list a concurrent sync created after we loaded the
    // snapshot. Leaving any one behind lets Medusa keep serving its (lower) price.
    const rows: { id: string }[] = await pg("price_list")
      .whereRaw(`"metadata"->>'managed_by' = ?`, [MANAGED_BY])
      .whereRaw(`"metadata"->>'category_id' = ?`, [categoryId])
      .select("id")
    const ids = rows.map((r) => r.id)
    if (!ids.length) return false

    await pg.transaction(async (trx) => {
      await trx("price").whereIn("price_list_id", ids).del()
      await trx("price_list_rule").whereIn("price_list_id", ids).del()
      await trx("price_list").whereIn("id", ids).del()
    })

    owned.delete(categoryId)
    return true
  }

  // The name is what the customer reads — in the mega menu and as the page
  // heading — so it has to track the percentage even for a category holding no
  // products, whose name is still on screen.
  //
  // Renaming emits product-category.updated, which re-enters this sync. Safe only
  // because callers rename *after* the rebuild has stored the new fingerprint: the
  // echoed pass then matches, skips, finds the name already correct and emits
  // nothing. Rename before the rebuild and the two passes race on the same list.
  const applyRename = async (category: SaleCategory, percent: number) => {
    // Re-read rather than trust the snapshot this run started with. A full sync
    // takes minutes; an admin who changes the percentage midway would otherwise
    // have their new value overwritten by a name computed from the old one, and
    // the store would advertise a discount it does not give.
    const { data: fresh } = await query.graph({
      entity: "product_category",
      fields: ["id", "name", "metadata"],
      filters: { id: category.id },
    })
    const current = fresh[0] as SaleCategory | undefined
    if (!current) return

    // Someone changed the percentage while we worked. Their edit triggers its own
    // sync, which will set the name from the newer value; leave it to that one.
    if (parseSalePercent(current.metadata?.sale_percent) !== percent) {
      logger.info(
        `${category.handle}: percent changed mid-sync, leaving the name to the newer run.`
      )
      return
    }

    const renamed = applyPercentToName(current.name, percent)
    if (!renamed) return

    await updateProductCategoriesWorkflow(container).run({
      input: { selector: { id: category.id }, update: { name: renamed } },
    })
    logger.info(
      `${category.handle}: renamed "${current.name}" -> "${renamed}" to match ${percent}%.`
    )
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

    // Walked from the categories rather than filtering products by category_id:
    // the product filter has no typed category_id key.
    const subtreeIds = collectSubtree(category.id, childrenOf)

    const { data: expanded } = await query.graph({
      entity: "product_category",
      fields: [
        "id",
        "products.id",
        "products.variants.id",
        "products.variants.prices.*",
      ],
      filters: { id: subtreeIds },
    })

    // One product can sit in several categories of the subtree (a "See all" child
    // alongside "Jeans"); dedupe or its variants get priced twice in one list.
    const products: any[] = []
    const seen = new Set<string>()
    for (const node of expanded as any[]) {
      for (const product of node.products ?? []) {
        if (seen.has(product.id)) continue
        seen.add(product.id)
        products.push(product)
      }
    }

    const prices: {
      amount: number
      currency_code: string
      variant_id: string
      // The variant's base price set. The generated price-list price must land in
      // the SAME set so Medusa resolves it for this variant — it's what we insert.
      price_set_id: string
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

          // No price set means nothing to attach the discount to; skip rather
          // than insert an orphaned row the pricing engine can never resolve.
          if (!price.price_set_id) continue

          const discounted = Math.round(Number(price.amount) * multiplier)
          if (!Number.isFinite(discounted) || discounted <= 0) continue

          prices.push({
            amount: discounted,
            currency_code: price.currency_code,
            variant_id: variant.id,
            price_set_id: price.price_set_id,
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
      // Nothing to price, but the name is still on screen and must not keep
      // advertising the old percentage.
      await applyRename(category, percent)
      continue
    }

    // The name the category is about to carry, for the description below. The
    // rename itself happens at the end of the loop.
    const finalName = applyPercentToName(category.name, percent) ?? category.name

    // Nothing to rebuild when the list already holds exactly these prices. Without
    // this, every product edit in a sale category rebuilds the whole list — 8000
    // prices and two minutes to change one product's title — and the rename below
    // would cost a second full rebuild on every percentage change.
    const stamp = fingerprint(percent, prices)
    const ownedLists = owned.get(category.id) ?? []
    // Up to date only when there is exactly one managed list and it already holds
    // these prices. More than one means a past race left duplicates behind: force
    // the rebuild so dropManagedList clears them all and one correct list replaces
    // them — otherwise the stale, cheaper list would win on the storefront forever.
    const upToDate =
      ownedLists.length === 1 && ownedLists[0].metadata?.fingerprint === stamp

    if (!upToDate) {
      // Rebuild rather than diff: the generated list is disposable by definition,
      // and this only ever deletes a list carrying our marker.
      await dropManagedList(category.id)

      // Insert the list and its prices directly instead of createPriceListsWorkflow.
      // The workflow inserts prices in small orchestrated batches and emits events
      // per step: ~40s to lay down 416 prices, which is what made a percentage
      // change feel like it never landed until a much later refresh. A single
      // chunked bulk insert writes the same rows in well under a second. Safe for
      // the same reason the set-based delete above is: it only ever touches a list
      // carrying our MANAGED_BY marker, and those rows are disposable, rule-free
      // (rules_count 0, so no price_list_rule/price_rule rows to weave) and hold no
      // hand-entered data. Amounts are BigNumber-backed: `amount` and `raw_amount`
      // must agree or the pricing engine reads the raw side and ignores `amount`.
      const priceListId = `plist_${ulid()}`
      const priceRows = prices.map((p) => ({
        id: `price_${ulid()}`,
        price_set_id: p.price_set_id,
        currency_code: p.currency_code,
        amount: p.amount,
        raw_amount: JSON.stringify({ value: String(p.amount), precision: 20 }),
        rules_count: 0,
        price_list_id: priceListId,
      }))

      await pg.transaction(async (trx) => {
        await trx("price_list").insert({
          id: priceListId,
          status: "active",
          // Handle, not name: two categories can both be called "Sale 40% off",
          // and identical titles in the admin's price list table help nobody.
          title: `${category.handle}: auto ${percent}% off`,
          description: `Generated from category ${category.handle} (${finalName}). Edits here are overwritten on the next sync; change metadata.sale_percent on the category instead.`,
          type: "sale",
          rules_count: 0,
          metadata: JSON.stringify({
            managed_by: MANAGED_BY,
            category_id: category.id,
            sale_percent: percent,
            fingerprint: stamp,
          }),
        })
        // Chunked so no single INSERT approaches Postgres' 65535-parameter cap
        // (each row binds ~7 columns, so 1000 rows ≈ 7000 params — comfortably under).
        await trx.batchInsert("price", priceRows, 1000)
      })

      synced++
      logger.info(
        `${category.handle}: ${percent}% off applied to ${prices.length} price(s) across ${products.length} product(s).` +
          (skippedRuled ? ` Skipped ${skippedRuled} rule-scoped base price(s).` : "")
      )
    }

    // Last, once the rebuild above has stored the new fingerprint — see applyRename.
    await applyRename(category, percent)
  }

  // A full run also reaps lists whose category was deleted outright — those never
  // appear in the loop above, so nothing else would ever clean them up.
  if (!scoped) {
    const liveIds = new Set(categories.map((c) => c.id))
    for (const categoryId of [...owned.keys()]) {
      if (liveIds.has(categoryId)) continue
      await dropManagedList(categoryId)
      cleared++
      logger.info(`Removed generated price list for deleted category ${categoryId}.`)
    }
  }

  return { synced, cleared }
}

/**
 * Sale categories whose pricing a product falls under. Used to narrow a sync to
 * just the categories a changed product could actually affect.
 *
 * Walks up from each of the product's categories: a product sits in "Jeans", and
 * it is the "Sale 70% off" ancestor that carries the percent. The nearest such
 * ancestor wins, matching the subtree the sync itself prices.
 */
export async function findSaleCategoriesForProduct(
  container: MedusaContainer,
  productId: string
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "categories.id"],
    filters: { id: productId },
  })

  const own: any[] = (data[0] as any)?.categories ?? []
  if (!own.length) return []

  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "parent_category_id", "metadata"],
  })

  const byId = new Map<string, SaleCategory>()
  for (const category of allCategories as SaleCategory[]) {
    byId.set(category.id, category)
  }

  const found = new Set<string>()
  for (const start of own) {
    let node = byId.get(start.id)
    while (node) {
      if (parseSalePercent(node.metadata?.sale_percent) !== null) {
        found.add(node.id)
        break
      }
      node = node.parent_category_id
        ? byId.get(node.parent_category_id)
        : undefined
    }
  }

  return [...found]
}
