import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Cuts the generated mock catalog down to KEEP_PER_CATEGORY products per leaf
 * category, so a dev store stays small enough to iterate on.
 *
 * 13k variants makes every sale-price rebuild a two-minute affair and pushed the
 * price-list delete past the point where its per-row cascade survives. This keeps
 * one representative product per category instead.
 *
 * Only ever deletes products the seeder made — their titles carry MOCK_MARKER.
 * Anything created by hand in the admin has no marker and is never touched.
 *
 *   npx medusa exec ./src/scripts/trim-mock-catalog.ts
 */

const KEEP_PER_CATEGORY = 1
const MOCK_MARKER = "Essential Collection"
const DELETE_BATCH = 25

export default async function trimMockCatalog({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "variants.id", "categories.id"],
  })

  const isMock = (p: any) => String(p.title ?? "").includes(MOCK_MARKER)

  const keep = new Set<string>()
  const perCategory = new Map<string, number>()

  // Hand-made products are off-limits regardless of category.
  for (const p of products as any[]) {
    if (!isMock(p)) keep.add(p.id)
  }

  // Then keep a few mock products per category. A product in several categories
  // counts for each of them, so this walks products once and claims slots.
  for (const p of products as any[]) {
    if (!isMock(p)) continue

    const categories: any[] = p.categories ?? []
    const needed = categories.some(
      (c) => (perCategory.get(c.id) ?? 0) < KEEP_PER_CATEGORY
    )
    if (!needed) continue

    keep.add(p.id)
    for (const c of categories) {
      perCategory.set(c.id, (perCategory.get(c.id) ?? 0) + 1)
    }
  }

  const doomed = (products as any[]).filter((p) => !keep.has(p.id))
  const keptVariants = (products as any[])
    .filter((p) => keep.has(p.id))
    .reduce((n, p) => n + (p.variants?.length ?? 0), 0)

  logger.info(
    `TRIM plan: ${products.length} products -> keep ${keep.size} (${keptVariants} variants), delete ${doomed.length}`
  )

  // Batched: deleting products cascades per row through variants, price sets and
  // prices. One 690-product transaction is exactly the shape that dies with
  // ECONNABORTED, so keep each transaction small.
  for (let i = 0; i < doomed.length; i += DELETE_BATCH) {
    const batch = doomed.slice(i, i + DELETE_BATCH)
    await deleteProductsWorkflow(container).run({
      input: { ids: batch.map((p) => p.id) },
    })
    logger.info(
      `TRIM deleted ${Math.min(i + DELETE_BATCH, doomed.length)}/${doomed.length}`
    )
  }

  const { data: after } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id"],
  })
  const variantsAfter = (after as any[]).reduce(
    (n, p) => n + (p.variants?.length ?? 0),
    0
  )

  logger.info(`TRIM done: ${after.length} products / ${variantsAfter} variants remain`)
}
