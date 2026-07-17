import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

const STOCKED_QUANTITY = 100

/**
 * Repairs variants that have manage_inventory=true but no inventory item linked,
 * which Medusa reports as permanently out of stock. Uses the inventory workflows
 * so the BigNumber raw_* fields are written correctly -- a raw SQL insert leaves
 * them null and the quantity reads back as 0.
 */
export default async function fixMissingInventory({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocationId = stockLocations[0]?.id
  if (!stockLocationId) {
    logger.error("No stock location found.")
    return
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "sku", "title", "manage_inventory", "inventory_items.*"],
  })

  const broken = variants.filter(
    (v: any) => v.manage_inventory && !v.inventory_items?.length
  )

  if (!broken.length) {
    logger.info("No variants missing inventory items. Nothing to do.")
    return
  }

  logger.info(`Found ${broken.length} variants without inventory items. Repairing...`)

  const BATCH = 200
  for (let i = 0; i < broken.length; i += BATCH) {
    const batch = broken.slice(i, i + BATCH)

    const { result: items } = await createInventoryItemsWorkflow(container).run({
      input: {
        items: batch.map((v: any) => ({
          sku: v.sku ?? undefined,
          title: v.title ?? undefined,
        })),
      },
    })

    await link.create(
      batch.map((v: any, idx: number) => ({
        [Modules.PRODUCT]: { variant_id: v.id },
        [Modules.INVENTORY]: { inventory_item_id: items[idx].id },
        data: { required_quantity: 1 },
      }))
    )

    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: items.map((item: any) => ({
          inventory_item_id: item.id,
          location_id: stockLocationId,
          stocked_quantity: STOCKED_QUANTITY,
        })),
      },
    })

    logger.info(`Repaired ${Math.min(i + BATCH, broken.length)}/${broken.length}`)
  }

  logger.info("Finished repairing missing inventory.")
}
