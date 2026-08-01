import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Audits the products created by import-mango against what a sellable product
 * actually needs: options, per-region prices, shipping profile, shipping
 * dimensions, thumbnail, and duplicate handles.
 */
export default async function auditMangoImport({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })
  logger.info("=== REGIONS ===")
  for (const r of regions as any[]) {
    logger.info(
      `  ${r.name} | ${r.currency_code} | ${(r.countries ?? []).map((c: any) => c.iso_2).join(",")}`
    )
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name", "type"],
  })
  logger.info("=== SHIPPING PROFILES ===")
  for (const p of profiles as any[]) {
    logger.info(`  ${p.name} (${p.type}) ${p.id}`)
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "status",
      "weight",
      "length",
      "height",
      "width",
      "material",
      "images.id",
      "options.title",
      "options.values.value",
      "categories.handle",
      "shipping_profile.id",
      "shipping_profile.name",
      "variants.id",
      "variants.title",
      "variants.weight",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
  })

  // The import stamps every description with this string, so it is a reliable
  // marker for the products it created.
  const mango = (products as any[]).filter((p) =>
    p.description?.includes("Premium quality T-shirt from Mango")
  )
  logger.info(`=== IMPORTED PRODUCTS: ${mango.length} of ${products.length} total ===`)

  const optionSets = new Map<string, number>()
  const currencyCount = new Map<string, number>()
  const titleCount = new Map<string, number>()
  let noThumb = 0
  let noImages = 0
  let noProfile = 0
  let noWeight = 0
  let noCategory = 0
  let variantsNoPrice = 0
  let totalVariants = 0

  for (const p of mango) {
    const opts = (p.options ?? []).map((o: any) => o.title).sort().join("+") || "(none)"
    optionSets.set(opts, (optionSets.get(opts) ?? 0) + 1)
    titleCount.set(p.title, (titleCount.get(p.title) ?? 0) + 1)

    if (!p.thumbnail) noThumb++
    if (!p.images?.length) noImages++
    if (!p.shipping_profile?.id) noProfile++
    if (!p.weight) noWeight++
    if (!p.categories?.length) noCategory++

    for (const v of p.variants ?? []) {
      totalVariants++
      const prices = v.prices ?? []
      if (!prices.length) variantsNoPrice++
      for (const pr of prices) {
        currencyCount.set(pr.currency_code, (currencyCount.get(pr.currency_code) ?? 0) + 1)
      }
    }
  }

  logger.info("--- OPTIONS PER PRODUCT ---")
  for (const [k, v] of optionSets) logger.info(`  [${k}] -> ${v} products`)

  logger.info("--- PRICES BY CURRENCY (variant-price rows) ---")
  for (const [k, v] of currencyCount) logger.info(`  ${k}: ${v}`)
  logger.info(`  variants with NO price at all: ${variantsNoPrice} / ${totalVariants}`)

  const dupes = [...titleCount.entries()].filter(([, n]) => n > 1)
  logger.info(`--- DUPLICATE TITLES: ${dupes.length} titles appear more than once ---`)
  for (const [t, n] of dupes.slice(0, 10)) logger.info(`  ${n}x  ${t}`)
  const dupExtra = dupes.reduce((s, [, n]) => s + n - 1, 0)
  logger.info(`  extra product rows caused by duplicates: ${dupExtra}`)

  logger.info("--- MISSING FIELDS ---")
  logger.info(`  no thumbnail:         ${noThumb}`)
  logger.info(`  no images:            ${noImages}`)
  logger.info(`  no shipping profile:  ${noProfile}`)
  logger.info(`  no weight (shipping): ${noWeight}`)
  logger.info(`  no category:          ${noCategory}`)

  const sample = mango[0]
  if (sample) {
    logger.info("--- SAMPLE PRODUCT ---")
    logger.info(`  ${sample.title} | handle=${sample.handle} | status=${sample.status}`)
    logger.info(`  profile=${sample.shipping_profile?.name} weight=${sample.weight} material=${sample.material}`)
    logger.info(`  categories=${(sample.categories ?? []).map((c: any) => c.handle).join(",")}`)
    logger.info(`  images=${sample.images?.length} thumbnail=${sample.thumbnail ? "yes" : "NO"}`)
    logger.info(`  description="${sample.description}"`)
    for (const v of (sample.variants ?? []).slice(0, 3)) {
      logger.info(
        `    variant ${v.title}: ${(v.prices ?? []).map((p: any) => `${p.amount} ${p.currency_code}`).join(", ") || "NO PRICE"}`
      )
    }
  }
}
