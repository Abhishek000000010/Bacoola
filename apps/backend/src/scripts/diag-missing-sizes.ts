import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Read-only: which products have no Size option?
 *
 *   npx medusa exec ./src/scripts/diag-missing-sizes.ts
 */
const SIZE_OPTION = /^sizes?$/i

export default async function diagMissingSizes({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "title",
      "status",
      "options.id",
      "options.title",
      "variants.id",
      "variants.title",
      "variants.manage_inventory",
    ],
  })

  const missing = (products as any[]).filter(
    (p) => !(p.options ?? []).some((o: any) => SIZE_OPTION.test((o.title ?? "").trim()))
  )

  logger.info(`total products: ${products.length}`)
  logger.info(`without a Size option: ${missing.length}`)

  for (const p of missing) {
    logger.info(
      `  ${p.handle}  status=${p.status}  options=[${(p.options ?? [])
        .map((o: any) => o.title)
        .join(", ") || "NONE"}]  variants=${(p.variants ?? []).length} (${(p.variants ?? [])
        .map((v: any) => v.title)
        .join("/")})`
    )
  }
}
