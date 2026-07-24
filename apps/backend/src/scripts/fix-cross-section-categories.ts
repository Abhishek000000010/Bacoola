import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Forces every product to belong to a single root section.
 *
 * A product linked into two sections shows up under both, which is how women's
 * products ended up on the men's sale page: `men-sale-40-v2` held 12 products
 * whose other category was `women-new-now-v2` and friends. The storefront was
 * rendering those links faithfully — the links themselves were wrong.
 *
 * Products keep every category inside their winning section (a product can be
 * in both "Clothing > T-shirts" and "Sale"); only links reaching into a
 * *different* section are removed.
 *
 * Dry run by default — pass --apply to write:
 *   npx medusa exec ./src/scripts/fix-cross-section-categories.ts
 *   npx medusa exec ./src/scripts/fix-cross-section-categories.ts -- --apply
 */

const ROOT_SECTIONS = ["women", "men", "teen", "kids"]

/**
 * Products deliberately moved into Men. The catalog seed only ever generated
 * women's products, so Men had nothing to sell; these were already half-linked
 * to the men's sale category, which makes them the natural stock to move rather
 * than inventing new products.
 */
const FORCE_MEN_CATEGORY = "men-sale-40-v2"

/** Hand-made products whose correct section is not obvious from the handle. */
const SECTION_OVERRIDES: Record<string, string> = {
  "everyday-henley": "men",
  "classic-crew-tee": "men",
  "signature-pique-polo": "men",
  "womens-pique-polo": "women",
  "red-suit": "men",
  "black-suit": "men",
  "polos-essential-5": "men",
  "abhishek-shirt": "men",
}

export default async function fixCrossSectionCategories({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const apply = process.argv.includes("--apply")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "parent_category_id"],
  })
  const catById = new Map(categories.map((c: any) => [c.id, c]))

  const rootOf = (categoryId: string): string => {
    let current: any = catById.get(categoryId)
    let guard = 0
    while (current?.parent_category_id && guard++ < 10) {
      current = catById.get(current.parent_category_id)
    }
    return current?.handle ?? "(unknown)"
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id", "categories.handle"],
  })

  const changes: {
    id: string
    handle: string
    section: string
    keep: string[]
    drop: string[]
  }[] = []

  for (const p of products as any[]) {
    const cats = p.categories ?? []
    if (cats.length < 2) continue

    const roots: string[] = [
      ...new Set<string>(cats.map((c: any): string => rootOf(c.id))),
    ]
    if (roots.length < 2) continue

    // Decide the one section this product belongs to.
    let section: string | undefined = SECTION_OVERRIDES[p.handle]

    if (!section && cats.some((c: any) => c.handle === FORCE_MEN_CATEGORY)) {
      section = "men"
    }

    // Mock products are named after the category they were generated for, so
    // the handle prefix is a reliable tiebreaker for the rest.
    if (!section) {
      section = ROOT_SECTIONS.find((s) => p.handle.startsWith(s))
    }

    // Last resort: whichever real section it is already linked to.
    if (!section) {
      section = roots.find((r) => ROOT_SECTIONS.includes(r))
    }

    if (!section) {
      logger.warn(`SKIP ${p.handle}: cannot determine section from [${roots.join(", ")}]`)
      continue
    }

    const keep = cats.filter((c: any) => rootOf(c.id) === section)
    const drop = cats.filter((c: any) => rootOf(c.id) !== section)

    // Dropping every category would hide the product from all listings.
    if (!keep.length) {
      logger.warn(`SKIP ${p.handle}: no category left under "${section}"`)
      continue
    }

    changes.push({
      id: p.id,
      handle: p.handle,
      section,
      keep: keep.map((c: any) => c.handle),
      drop: drop.map((c: any) => c.handle),
    })
  }

  logger.info(`${changes.length} products to correct (apply=${apply})`)
  for (const c of changes) {
    logger.info(`  ${c.handle} -> ${c.section} | keep: ${c.keep.join(", ")} | drop: ${c.drop.join(", ")}`)
  }

  if (!apply) {
    logger.info("Dry run — nothing written. Re-run with -- --apply to commit.")
    return
  }

  for (const c of changes) {
    const keepIds = (products as any[])
      .find((p) => p.id === c.id)
      .categories.filter((cat: any) => rootOf(cat.id) === c.section)
      .map((cat: any) => cat.id)

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: c.id },
        update: { category_ids: keepIds },
      },
    })
  }

  // Re-read rather than trusting the workflow: a partially applied fix looks
  // identical to a successful one from the caller's side.
  const { data: after } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id"],
  })
  const stillCrossed = (after as any[]).filter((p) => {
    const roots = [...new Set((p.categories ?? []).map((c: any) => rootOf(c.id)))]
    return roots.length > 1
  })

  logger.info(`Applied. Products still spanning sections: ${stillCrossed.length}`)
  if (stillCrossed.length) {
    throw new Error(
      `fix-cross-section-categories: ${stillCrossed.length} products still cross sections: ` +
        stillCrossed.map((p) => p.handle).join(", ")
    )
  }
}
