import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Diagnoses why imported products read as out of stock: reports, for the
 * variants created by import-mango, whether they have an inventory item at all
 * and whether that item has a level at the stock location.
 */
export default async function diagMangoStock({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  logger.info(
    `Stock locations: ${stockLocations.map((l: any) => `${l.name} (${l.id})`).join(", ") || "NONE"}`
  )

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "sku",
      "manage_inventory",
      "inventory_items.inventory_item_id",
      "inventory_items.inventory.location_levels.id",
      "inventory_items.inventory.location_levels.location_id",
      "inventory_items.inventory.location_levels.stocked_quantity",
    ],
  })

  let noItem = 0
  let noLevel = 0
  let stockZero = 0
  let healthy = 0
  const sampleNoLevel: string[] = []
  const sampleNoItem: string[] = []

  for (const v of variants as any[]) {
    if (!v.manage_inventory) {
      healthy++
      continue
    }
    const items = v.inventory_items ?? []
    if (!items.length) {
      noItem++
      if (sampleNoItem.length < 5) sampleNoItem.push(v.sku)
      continue
    }
    const levels = items.flatMap(
      (i: any) => i.inventory?.location_levels ?? []
    )
    if (!levels.length) {
      noLevel++
      if (sampleNoLevel.length < 5) sampleNoLevel.push(v.sku)
      continue
    }
    const total = levels.reduce(
      (s: number, l: any) => s + Number(l.stocked_quantity ?? 0),
      0
    )
    if (total <= 0) stockZero++
    else healthy++
  }

  logger.info(`Total variants:            ${variants.length}`)
  logger.info(`  OK (in stock/untracked): ${healthy}`)
  logger.info(`  MISSING inventory item:  ${noItem}   e.g. ${sampleNoItem.join(", ")}`)
  logger.info(`  item but NO LEVEL:       ${noLevel}   e.g. ${sampleNoLevel.join(", ")}`)
  logger.info(`  level but qty 0:         ${stockZero}`)

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "stock_locations.id"],
  })
  for (const c of channels as any[]) {
    logger.info(
      `Sales channel "${c.name}" -> stock locations: ${
        (c.stock_locations ?? []).map((s: any) => s.id).join(", ") || "NONE LINKED"
      }`
    )
  }
}
