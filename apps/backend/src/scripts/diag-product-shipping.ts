import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Read-only: which published products have no shipping profile?
 *
 * A product without one cannot pass the cart's validate-shipping step, so any
 * cart containing it fails to complete -- the payment succeeds but no order is
 * ever created, and nothing reaches Shiprocket.
 *
 *   npx medusa exec ./src/scripts/diag-product-shipping.ts
 */
export default async function diagProductShipping({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "status", "shipping_profile.id", "shipping_profile.name"],
  })

  const missing = (products as any[]).filter((p) => !p.shipping_profile?.id)
  const publishedMissing = missing.filter((p) => p.status === "published")

  logger.info(`total products:                    ${products.length}`)
  logger.info(`without shipping profile:          ${missing.length}`)
  logger.info(`PUBLISHED without shipping profile: ${publishedMissing.length}`)

  for (const p of publishedMissing.slice(0, 30)) {
    logger.info(`  ${p.handle}  ("${p.title}")  status=${p.status}`)
  }
}
