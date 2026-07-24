import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Read-only audit of product -> category links.
 *
 * Reports how many products sit in more than one category, and how many are
 * linked across different root sections (women/men/teen/kids) — the state that
 * makes a women's product show up on a men's sale page.
 *
 *   npx medusa exec ./src/scripts/audit-product-categories.ts
 */
export default async function auditProductCategories({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "parent_category_id"],
  })

  const byId = new Map(categories.map((c: any) => [c.id, c]))

  /** Walk a category up to its root and return the root handle. */
  const rootOf = (categoryId: string): string => {
    let current: any = byId.get(categoryId)
    let guard = 0
    while (current?.parent_category_id && guard++ < 10) {
      current = byId.get(current.parent_category_id)
    }
    return current?.handle ?? "(unknown)"
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "categories.id", "categories.handle"],
  })

  let multiCategory = 0
  let crossSection = 0
  const crossExamples: string[] = []
  const sectionPairs = new Map<string, number>()

  for (const p of products as any[]) {
    const cats = p.categories ?? []
    if (cats.length > 1) multiCategory++

    const roots = [...new Set(cats.map((c: any) => rootOf(c.id)))]
    if (roots.length > 1) {
      crossSection++
      const key = roots.sort().join(" + ")
      sectionPairs.set(key, (sectionPairs.get(key) ?? 0) + 1)
      if (crossExamples.length < 20) {
        crossExamples.push(
          `  ${p.handle}  [${roots.join(", ")}]  cats: ${cats
            .map((c: any) => c.handle)
            .join(", ")}`
        )
      }
    }
  }

  logger.info(`total products:            ${products.length}`)
  logger.info(`in >1 category:            ${multiCategory}`)
  logger.info(`spanning >1 root section:  ${crossSection}`)

  logger.info("cross-section combinations:")
  for (const [pair, count] of [...sectionPairs].sort((a, b) => b[1] - a[1])) {
    logger.info(`  ${pair}: ${count}`)
  }

  logger.info("examples:")
  crossExamples.forEach((e) => logger.info(e))

  // Products with no category at all would silently disappear from every
  // listing page, so surface them here too.
  const orphans = (products as any[]).filter((p) => !p.categories?.length)
  logger.info(`products with no category: ${orphans.length}`)
}
