import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncSalePrices } from "../lib/sale-prices"

/**
 * Regenerates every category-driven sale price list.
 *
 * The subscriber keeps things current as the admin works; this is the full
 * rebuild — useful after a bulk import, or to repair drift.
 *
 *   npx medusa exec ./src/scripts/sync-sale-prices.ts
 */
export default async function syncSalePricesScript({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { synced, cleared } = await syncSalePrices(container)

  logger.info(
    `Sale price sync complete. ${synced} category(ies) priced, ${cleared} list(s) cleared.`
  )
}
