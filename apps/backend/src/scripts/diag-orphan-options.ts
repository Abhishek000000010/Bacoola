import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Finds product_option rows that no product references.
 *
 * Some ways of creating an option (createProductOptionsWorkflow with a
 * product_id, productModule.createProductOptions) return a created option but
 * never attach it, leaving a row that belongs to nothing. These are invisible
 * in the admin and on the storefront, but they accumulate.
 *
 *   npx medusa exec ./src/scripts/diag-orphan-options.ts
 *   npx medusa exec ./src/scripts/diag-orphan-options.ts -- --apply   (deletes)
 */
export default async function diagOrphanOptions({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule: any = container.resolve(Modules.PRODUCT)
  const apply = process.argv.includes("--apply")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "options.id"],
  })

  const referenced = new Set<string>()
  for (const p of products as any[]) {
    for (const o of p.options ?? []) {
      referenced.add(o.id)
    }
  }

  const { data: options } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "created_at"],
  })

  const orphans = (options as any[]).filter((o) => !referenced.has(o.id))

  logger.info(`product_option rows:      ${options.length}`)
  logger.info(`referenced by a product:  ${referenced.size}`)
  logger.info(`ORPHANED:                 ${orphans.length}`)

  const byTitle: Record<string, number> = {}
  orphans.forEach((o) => (byTitle[o.title] = (byTitle[o.title] ?? 0) + 1))
  logger.info(`orphan titles: ${JSON.stringify(byTitle)}`)

  for (const o of orphans.slice(0, 20)) {
    logger.info(`  ${o.id}  "${o.title}"  ${o.created_at}`)
  }

  if (!apply) {
    logger.info("Dry run -- nothing deleted. Re-run with -- --apply to remove them.")
    return
  }

  if (orphans.length) {
    await productModule.deleteProductOptions(orphans.map((o) => o.id))
    logger.info(`Deleted ${orphans.length} orphaned options.`)
  }
}
