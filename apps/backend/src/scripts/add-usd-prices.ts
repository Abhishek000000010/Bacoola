import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Backfills a USD price on every variant that only has INR.
 *
 * The store has a United States region in `usd`, but the Mango import wrote INR
 * only, so those products render priceless (or fail outright) outside /in.
 *
 * Derived from the INR price at a fixed rate rather than a live FX feed -- this
 * is catalogue seed data, not accounting. Override with MANGO_USD_RATE.
 *
 * Idempotent: variants that already carry a USD price are skipped, and the
 * existing INR price is always re-sent because the workflow replaces a
 * variant's whole price set rather than merging into it.
 *
 * Run: npx medusa exec ./src/scripts/add-usd-prices.ts -- --apply
 */

const RATE = Number(process.env.MANGO_USD_RATE || 85)
const BATCH = 100

/** ₹3,899 -> $45.99: convert, round to a whole dollar, then shade to .99. */
function toUsd(inr: number): number {
  const whole = Math.max(1, Math.round(inr / RATE))
  return Number((whole - 0.01).toFixed(2))
}

export default async function addUsdPrices({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const apply = process.argv.includes("--apply")

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["currency_code"],
  })
  const currencies = new Set(
    (regions as any[]).map((r) => String(r.currency_code).toLowerCase())
  )
  if (!currencies.has("usd")) {
    logger.warn("No USD region exists. Nothing to do.")
    return
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "product.title",
      "prices.amount",
      "prices.currency_code",
    ],
  })

  type Job = { id: string; prices: { amount: number; currency_code: string }[] }
  const jobs: Job[] = []
  let skipped = 0
  let noInr = 0

  for (const v of variants as any[]) {
    const prices = (v.prices ?? []) as any[]
    const has = (c: string) =>
      prices.some((p) => String(p.currency_code).toLowerCase() === c)

    if (has("usd")) {
      skipped++
      continue
    }
    const inr = prices.find(
      (p) => String(p.currency_code).toLowerCase() === "inr"
    )
    if (!inr) {
      noInr++
      continue
    }

    jobs.push({
      id: v.id,
      prices: [
        // Re-sent verbatim: omitting it would wipe the INR price.
        { amount: Number(inr.amount), currency_code: "inr" },
        { amount: toUsd(Number(inr.amount)), currency_code: "usd" },
      ],
    })
  }

  logger.info(`Variants: ${variants.length}`)
  logger.info(`  already have USD: ${skipped}`)
  logger.info(`  no INR to convert: ${noInr}`)
  logger.info(`  to update:         ${jobs.length}   (rate: 1 USD = ${RATE} INR)`)

  if (!jobs.length) {
    logger.info("Nothing to do.")
    return
  }

  for (const j of jobs.slice(0, 3)) {
    const inr = j.prices[0].amount
    const usd = j.prices[1].amount
    logger.info(`  e.g. ${inr} inr -> ${usd} usd`)
  }

  if (!apply) {
    logger.warn("DRY RUN. Re-run with `-- --apply` to write.")
    return
  }

  let updated = 0
  const failures: string[] = []

  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH)
    try {
      await updateProductVariantsWorkflow(container).run({
        input: {
          // Batch form takes flat objects carrying their own id; the
          // selector/update form is only for applying one change to many.
          product_variants: batch.map((j) => ({
            id: j.id,
            prices: j.prices,
          })),
        } as any,
      })
      updated += batch.length
      logger.info(`  ${updated}/${jobs.length}`)
    } catch (e: any) {
      failures.push(`batch at ${i}: ${e.message}`)
      logger.error(`  batch at ${i} failed: ${e.message}`)
    }
  }

  logger.info(`Done. Updated ${updated}/${jobs.length} variants.`)
  if (failures.length) {
    logger.error(`${failures.length} batch(es) failed.`)
  }
}
