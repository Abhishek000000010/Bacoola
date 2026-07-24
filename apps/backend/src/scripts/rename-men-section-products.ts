import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Renames products that now live in Men but still carry women-* handles.
 *
 * The mock catalog names each product after the category it was generated for,
 * so the products moved into Men by fix-cross-section-categories still resolve
 * to /products/women-new-now-v2-essential-5. The category link is correct, but
 * the URL and title read as a women's product, which is indistinguishable from
 * the original bug to anyone looking at the storefront.
 *
 * Only products whose sole section is Men are touched, so this cannot rename a
 * genuine women's product.
 *
 * Dry run by default -- pass --apply to write:
 *   npx medusa exec ./src/scripts/rename-men-section-products.ts
 *   npx medusa exec ./src/scripts/rename-men-section-products.ts -- --apply
 */

const MEN_SECTION = "men"

export default async function renameMenSectionProducts({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const apply = process.argv.includes("--apply")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
  })
  const catById = new Map<string, any>(categories.map((c: any) => [c.id, c]))

  const rootOf = (categoryId: string): string => {
    let current = catById.get(categoryId)
    let guard = 0
    while (current?.parent_category_id && guard++ < 10) {
      current = catById.get(current.parent_category_id)
    }
    return current?.handle ?? "(unknown)"
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "categories.id"],
  })

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
  })
  const takenHandles = new Set((existing as any[]).map((p) => p.handle))

  const renames: { id: string; from: string; to: string; title: string }[] = []

  for (const p of products as any[]) {
    const cats = p.categories ?? []
    if (!cats.length) continue

    const roots = [...new Set<string>(cats.map((c: any): string => rootOf(c.id)))]

    // Only products that are unambiguously Men, but still named women-*.
    if (roots.length !== 1 || roots[0] !== MEN_SECTION) continue
    if (!p.handle.startsWith("women")) continue

    // The original numbering collides -- these came from three different women
    // categories that each had their own "essential-5" -- so renumber the set
    // sequentially instead of carrying the old suffix over.
    let index = renames.length + 1
    let candidate = `men-sale-essential-${index}`
    while (takenHandles.has(candidate)) {
      candidate = `men-sale-essential-${++index}`
    }
    takenHandles.add(candidate)

    renames.push({
      id: p.id,
      from: p.handle,
      to: candidate,
      title: `Men Sale - Essential Collection ${index}`,
    })
  }

  logger.info(`${renames.length} products to rename (apply=${apply})`)
  for (const r of renames) {
    logger.info(`  ${r.from} -> ${r.to}  ("${r.title}")`)
  }

  if (!apply) {
    logger.info("Dry run -- nothing written. Re-run with -- --apply to commit.")
    return
  }

  for (const r of renames) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: r.id },
        update: { handle: r.to, title: r.title },
      },
    })
  }

  const { data: after } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id"],
  })
  const stragglers = (after as any[]).filter((p) => {
    const cats = p.categories ?? []
    if (!cats.length) return false
    const roots = [...new Set<string>(cats.map((c: any): string => rootOf(c.id)))]
    return roots.length === 1 && roots[0] === MEN_SECTION && p.handle.startsWith("women")
  })

  logger.info(`Applied. Men products still named women-*: ${stragglers.length}`)
}
