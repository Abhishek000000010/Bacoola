import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Backfills the shipping profile on products that have none.
 *
 * A product without a shipping profile cannot be checked out: the cart's
 * validate-shipping step matches each item's profile against the chosen
 * shipping method, an absent one never matches, and cart completion throws.
 * The customer pays, no order is created, and nothing reaches Shiprocket.
 *
 * The profile is taken from the store's own shipping options rather than
 * guessed, so the backfilled products satisfy the same methods customers
 * actually pick at checkout.
 *
 * Dry run by default -- pass --apply to write:
 *   npx medusa exec ./src/scripts/fix-missing-shipping-profiles.ts
 *   npx medusa exec ./src/scripts/fix-missing-shipping-profiles.ts -- --apply
 */
export default async function fixMissingShippingProfiles({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const apply = process.argv.includes("--apply")

  // Whichever profile the live shipping options use is the only one that lets a
  // cart complete, so prefer it over the "default" profile.
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "shipping_profile_id"],
  })

  const counts = new Map<string, number>()
  for (const o of options as any[]) {
    if (o.shipping_profile_id) {
      counts.set(o.shipping_profile_id, (counts.get(o.shipping_profile_id) ?? 0) + 1)
    }
  }

  let profileId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  if (!profileId) {
    const { data: profiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id", "name", "type"],
    })
    profileId = (profiles as any[]).find((p) => p.type === "default")?.id
  }

  if (!profileId) {
    throw new Error(
      "fix-missing-shipping-profiles: no shipping profile found to assign. " +
        "Create one (and attach it to your shipping options) first."
    )
  }

  logger.info(`Using shipping profile: ${profileId}`)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "status", "shipping_profile.id"],
  })

  const missing = (products as any[]).filter((p) => !p.shipping_profile?.id)

  logger.info(`${missing.length} products without a shipping profile (apply=${apply})`)
  for (const p of missing) {
    logger.info(`  ${p.handle}  ("${p.title}")  status=${p.status}`)
  }

  if (!apply) {
    logger.info("Dry run -- nothing written. Re-run with -- --apply to commit.")
    return
  }

  for (const p of missing) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: p.id },
        update: { shipping_profile_id: profileId },
      },
    })
  }

  // Re-read: a partially applied fix is indistinguishable from a successful one
  // from the caller's side, and the failure mode here is silently taking money.
  const { data: after } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "shipping_profile.id"],
  })
  const stillMissing = (after as any[]).filter((p) => !p.shipping_profile?.id)

  logger.info(`Applied. Products still without a shipping profile: ${stillMissing.length}`)

  if (stillMissing.length) {
    throw new Error(
      `fix-missing-shipping-profiles: still missing on ` +
        stillMissing.map((p) => p.handle).join(", ")
    )
  }
}
