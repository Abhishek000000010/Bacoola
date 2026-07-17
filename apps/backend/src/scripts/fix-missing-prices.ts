import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Backfills prices onto variants that have none.
 *
 * A `seed-mock-products` run half-failed: one batch of 50 products created the
 * products, variants, dimensions and inventory, but never reached the price
 * step. That loop caught the error and carried on, so the seed reported success
 * and left 800 variants with no price at all.
 *
 * Such variants cannot be mis-sold — Medusa refuses to add a priceless variant
 * to a cart — but the storefront renders a permanent loading shimmer where the
 * price belongs, and the add button only fails once clicked.
 *
 * `updateProductVariantsWorkflow` is not usable here: it can only update a
 * price set that already exists and rejects these variants outright with
 * "do not have prices associated". Instead this mirrors what
 * createProductVariantsWorkflow does internally — create a price set, then link
 * it to the variant — via the pricing module and the remote link directly.
 *
 * Prices mirror the seed's own ranges so backfilled products are
 * indistinguishable from those that seeded correctly. Idempotent: variants that
 * already have a price set are skipped, so re-running is a no-op.
 */

const BATCH_SIZE = 100

export default async function fixMissingPrices({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)
  const pricing = container.resolve(Modules.PRICING)

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "product.title", "prices.*"],
  })

  const unpriced = variants.filter((v: any) => !v.prices?.length)

  if (!unpriced.length) {
    logger.info("fix-missing-prices: every variant already has a price; nothing to do")
    return
  }

  logger.info(
    `fix-missing-prices: ${unpriced.length} of ${variants.length} variants have no price; backfilling`
  )

  let fixed = 0
  const failures: string[] = []

  for (let i = 0; i < unpriced.length; i += BATCH_SIZE) {
    const batch = unpriced.slice(i, i + BATCH_SIZE)
    const batchNo = Math.floor(i / BATCH_SIZE) + 1

    // Unlike the seed, a failed batch is recorded and re-thrown at the end. A
    // silently swallowed failure is what produced the priceless variants.
    try {
      const priceSets = await pricing.createPriceSets(
        batch.map(() => ({
          prices: [
            {
              amount: Math.floor(Math.random() * (4999 - 999 + 1) + 999),
              currency_code: "inr",
            },
            {
              amount: Math.floor(Math.random() * (99 - 19 + 1) + 19),
              currency_code: "usd",
            },
          ],
        }))
      )

      await remoteLink.create(
        batch.map((v: any, idx: number) => ({
          [Modules.PRODUCT]: { variant_id: v.id },
          [Modules.PRICING]: { price_set_id: priceSets[idx].id },
        }))
      )

      fixed += batch.length
      logger.info(`fix-missing-prices: batch ${batchNo} ok (${fixed}/${unpriced.length})`)
    } catch (err: any) {
      const msg = `batch ${batchNo} failed: ${err?.message ?? err}`
      logger.error(`fix-missing-prices: ${msg}`)
      failures.push(msg)
    }
  }

  // Verify against the database rather than trusting the calls above.
  const { data: after } = await query.graph({
    entity: "product_variant",
    fields: ["id", "prices.*"],
  })
  const stillUnpriced = after.filter((v: any) => !v.prices?.length).length

  logger.info(
    `fix-missing-prices: done. backfilled=${fixed}, still unpriced=${stillUnpriced}`
  )

  if (failures.length || stillUnpriced) {
    throw new Error(
      `fix-missing-prices: incomplete — ${stillUnpriced} variants still have no price. ` +
        (failures.length ? `Failures: ${failures.join("; ")}` : "")
    )
  }
}
