import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Auto-create a fulfillment as soon as an order is placed.
 *
 * Orders only reach Shiprocket when a fulfillment is created against a
 * Shiprocket-backed shipping option (the plugin's `createFulfillment` runs at
 * that point, creating the Shiprocket order + AWB). By default that is a manual
 * admin step; this subscriber does it automatically right after checkout so a
 * paid order shows up on the Shiprocket dashboard with no human action.
 *
 * The fulfillment provider is derived from the shipping option the customer
 * picked, so the store's shipping options must use `shiprocket_shiprocket`
 * (see initial-data-seed.ts) for this to route to Shiprocket. If they use the
 * manual provider, a manual fulfillment is created and nothing is pushed.
 */
export default async function autoFulfillOrderHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderId = event.data.id

  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "items.id",
      "items.quantity",
      "items.raw_quantity",
      "items.detail.quantity",
      "items.detail.fulfilled_quantity",
      "fulfillments.id",
    ],
    filters: { id: orderId },
  })

  if (!order) {
    logger.warn(`auto-fulfill: order ${orderId} not found; skipping`)
    return
  }

  // Idempotency: an order.placed event may be retried. Don't double-fulfill.
  if (order.fulfillments?.length) {
    logger.info(
      `auto-fulfill: order ${order.display_id ?? orderId} already has a fulfillment; skipping`
    )
    return
  }

  // Quantities can arrive as a plain number, a raw BigNumber ({ value }), or
  // under `detail` depending on how far the order.placed transaction has
  // settled. Parse defensively so we never compute NaN (which silently drops
  // the item and leaves the order un-fulfilled).
  const num = (...candidates: any[]): number => {
    for (const c of candidates) {
      const n = Number(typeof c === "object" && c ? c.value : c)
      if (Number.isFinite(n)) return n
    }
    return 0
  }

  // Only fulfill the still-unfulfilled quantity of each line item.
  const items = (order.items ?? [])
    .map((item: any) => {
      const ordered = num(item.detail?.quantity, item.quantity, item.raw_quantity)
      const fulfilled = num(item.detail?.fulfilled_quantity)
      return { id: item.id as string, quantity: ordered - fulfilled }
    })
    .filter((i) => i.quantity > 0)

  if (!items.length) {
    logger.info(
      `auto-fulfill: order ${order.display_id ?? orderId} has nothing to fulfill; skipping`
    )
    return
  }

  try {
    await createOrderFulfillmentWorkflow(container).run({
      input: { order_id: orderId, items },
    })
    logger.info(
      `auto-fulfill: created fulfillment for order ${order.display_id ?? orderId}`
    )
    await recordFulfillmentError(container, orderId, null)
  } catch (err: any) {
    const reason = err?.message ?? String(err)

    // This failure is invisible to everyone: the customer has paid, the order
    // looks complete, and only Shiprocket is missing. Throwing here would just
    // retry against the same bad data and crash the worker, so instead the
    // reason is written onto the order itself where the admin can see it --
    // logs are not something anyone reads before shipping day.
    logger.error(
      `auto-fulfill: NOT SHIPPED — order ${
        order.display_id ?? orderId
      } was paid but no fulfillment could be created: ${reason}`
    )

    await recordFulfillmentError(container, orderId, reason)
  }
}

/**
 * Records (or clears) the auto-fulfil failure reason on the order's metadata so
 * it is visible in the admin rather than only in the server log.
 *
 * `updateOrders` MERGES metadata and cannot remove a key, so clearing writes an
 * explicit null rather than deleting: a key left over from an earlier failure
 * would otherwise make a since-fixed order look permanently broken.
 *
 * Never throws: a bookkeeping failure must not mask the original error or take
 * down the event bus worker.
 */
async function recordFulfillmentError(
  container: SubscriberArgs<{ id: string }>["container"],
  orderId: string,
  reason: string | null
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const orderModule: any = container.resolve(Modules.ORDER)

    await orderModule.updateOrders(orderId, {
      metadata: {
        auto_fulfill_error: reason,
        auto_fulfill_failed_at: reason ? new Date().toISOString() : null,
      },
    })
  } catch (err: any) {
    logger.warn(
      `auto-fulfill: could not record fulfillment status on order ${orderId}: ${
        err?.message ?? err
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
