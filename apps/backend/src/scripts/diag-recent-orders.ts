import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Read-only: why did the latest orders not reach Shiprocket?
 *
 *   npx medusa exec ./src/scripts/diag-recent-orders.ts
 */
export default async function diagRecentOrders({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "status",
      "metadata",
      "fulfillments.id",
      "fulfillments.provider_id",
      "fulfillments.data",
      "shipping_methods.name",
      "shipping_methods.shipping_option_id",
      "items.title",
      "items.variant_id",
    ],
  })

  const recent = (orders as any[])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  logger.info(`total orders: ${orders.length}`)

  for (const o of recent) {
    logger.info(`--- order #${o.display_id} (${o.id})  status=${o.status}  ${o.created_at}`)
    logger.info(`    items: ${(o.items ?? []).map((i: any) => i.title).join(", ")}`)
    logger.info(
      `    shipping methods: ${
        (o.shipping_methods ?? [])
          .map((m: any) => `${m.name} (option ${m.shipping_option_id})`)
          .join(", ") || "NONE"
      }`
    )
    logger.info(
      `    fulfillments: ${
        (o.fulfillments ?? [])
          .map((f: any) => `${f.id} provider=${f.provider_id}`)
          .join(", ") || "NONE"
      }`
    )
    const meta = o.metadata ?? {}
    logger.info(`    auto_fulfill_error: ${meta.auto_fulfill_error ?? "(none)"}`)
    logger.info(`    auto_fulfill_failed_at: ${meta.auto_fulfill_failed_at ?? "(none)"}`)
  }

  // The shipping options themselves decide whether anything routes to Shiprocket.
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id", "shipping_profile_id"],
  })
  logger.info("--- shipping options:")
  for (const s of options as any[]) {
    logger.info(
      `    ${s.name}  provider=${s.provider_id}  profile=${s.shipping_profile_id}`
    )
  }
}
