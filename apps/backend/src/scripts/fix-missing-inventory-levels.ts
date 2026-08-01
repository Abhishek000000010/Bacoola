import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

const STOCKED_QUANTITY = 100
const BATCH = 200

/**
 * Repairs inventory items that exist but have no location level, which Medusa
 * reports as out of stock. Complements fix-missing-inventory, which handles the
 * earlier failure mode of a variant having no inventory item at all.
 *
 * Only items with zero levels are touched, so this is safe to re-run: items that
 * already have a level are skipped rather than sent to the workflow, which would
 * throw on the duplicate and abort the whole run.
 */
export default async function fixMissingInventoryLevels({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Prefer the location wired to a sales channel -- this project has a stray
  // duplicate "Main Warehouse" that no channel points at, and stocking that one
  // would leave the storefront still reading zero.
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "stock_locations.id"],
  })
  const linkedLocationId = (channels as any[])
    .flatMap((c) => c.stock_locations ?? [])
    .map((l: any) => l.id)
    .find(Boolean)

  let stockLocationId = linkedLocationId
  if (!stockLocationId) {
    const { data: stockLocations } = await query.graph({
      entity: "stock_location",
      fields: ["id"],
    })
    stockLocationId = stockLocations[0]?.id
    logger.warn(
      `No stock location linked to a sales channel; falling back to ${stockLocationId}`
    )
  }

  if (!stockLocationId) {
    logger.error("No stock location found. Nothing to do.")
    return
  }
  logger.info(`Stocking at location ${stockLocationId}`)

  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.id"],
  })

  const missing = (items as any[]).filter((i) => !i.location_levels?.length)

  if (!missing.length) {
    logger.info("All inventory items already have a location level.")
    return
  }

  logger.info(`${missing.length}/${items.length} items missing a level. Repairing...`)

  let repaired = 0
  const failures: string[] = []

  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH)
    try {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: batch.map((item: any) => ({
            inventory_item_id: item.id,
            location_id: stockLocationId,
            stocked_quantity: STOCKED_QUANTITY,
          })),
        },
      })
      repaired += batch.length
      logger.info(`Repaired ${repaired}/${missing.length}`)
    } catch (e: any) {
      // Keep going: one bad batch should not strand the remaining items, which
      // is exactly how the original import left 1086 variants unstocked.
      failures.push(`batch at ${i}: ${e.message}`)
      logger.error(`Batch at offset ${i} failed: ${e.message}`)
    }
  }

  if (failures.length) {
    logger.error(`Finished with ${failures.length} failed batch(es).`)
  } else {
    logger.info(`Finished. Stocked ${repaired} inventory items.`)
  }
}
