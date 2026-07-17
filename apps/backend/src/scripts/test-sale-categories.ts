import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

/**
 * End-to-end check of category sale pricing.
 *
 * Drives each sale category through the same workflow the admin uses, then checks
 * every price in the generated list against the variant's base price. Verifying a
 * sample would not answer the question actually being asked — whether *all* the
 * variants move — so this checks the lot.
 *
 *   npx medusa exec ./src/scripts/test-sale-categories.ts
 */

const TESTS: { handle: string; percent: number }[] = [
  { handle: "teen-girl-sale-70", percent: 55 },
  { handle: "teen-boy-sale-70", percent: 45 },
  { handle: "kids-girls-sale-40", percent: 25 },
  { handle: "kids-boys-sale-40", percent: 30 },
  { handle: "kids-babygirl-sale-40", percent: 35 },
  { handle: "kids-babyboy-sale-40", percent: 20 },
  { handle: "kids-newborn-sale-40", percent: 15 },
]

const SETTLE_MS = 300_000

export default async function testSaleCategories({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricing = container.resolve(Modules.PRICING)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name", "metadata"],
  })

  const targets = TESTS.map((t) => ({
    ...t,
    cat: (cats as any[]).find((c) => c.handle === t.handle),
  })).filter((t) => {
    if (!t.cat) logger.info(`TEST ${t.handle}: CATEGORY NOT FOUND`)
    return !!t.cat
  })

  // Phase 1 — drive every category through the admin's own workflow.
  for (const t of targets) {
    logger.info(
      `TEST ${t.handle}: was percent=${t.cat.metadata?.sale_percent} name="${t.cat.name}" -> setting ${t.percent}`
    )
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: t.cat.id },
        update: { metadata: { ...(t.cat.metadata ?? {}), sale_percent: t.percent } },
      },
    })
  }

  logger.info(`TEST waiting ${SETTLE_MS / 1000}s for subscribers to rebuild...`)
  await new Promise((r) => setTimeout(r, SETTLE_MS))

  // Phase 2 — verify against the database, not against our own logs.
  const { data: freshCats } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name", "metadata"],
  })
  const lists = await pricing.listPriceLists({}, { take: null })

  for (const t of targets) {
    const cat: any = (freshCats as any[]).find((c) => c.id === t.cat.id)
    const list: any = (lists as any[]).find(
      (l) => (l.metadata as any)?.category_id === t.cat.id
    )

    if (!list) {
      logger.info(
        `TEST RESULT ${t.handle}: NO PRICE LIST (category has no products to discount) | name="${cat.name}"`
      )
      continue
    }

    const prices: any[] = await pricing.listPrices(
      { price_list_id: list.id },
      { take: null }
    )

    // price rows carry price_set_id; walk back to the variant to find its base.
    // take: null on both — the default page size silently truncates these lookups,
    // which shows up as prices that appear unchecked rather than as an error.
    const setIds = [...new Set(prices.map((p) => p.price_set_id))]
    const { data: links } = await query.graph({
      entity: "product_variant_price_set",
      fields: ["variant_id", "price_set_id"],
      filters: { price_set_id: setIds },
      pagination: { take: null },
    } as any)
    const variantOfSet = new Map<string, string>()
    for (const l of links as any[]) variantOfSet.set(l.price_set_id, l.variant_id)

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "prices.*"],
      filters: { id: [...new Set([...variantOfSet.values()])] },
      pagination: { take: null },
    } as any)
    const baseOf = new Map<string, number>()
    for (const v of variants as any[]) {
      for (const p of v.prices ?? []) {
        if (p.price_list_id) continue
        baseOf.set(`${v.id}|${p.currency_code}`, Number(p.amount))
      }
    }

    let checked = 0
    let wrong = 0
    let sample = ""
    for (const p of prices) {
      const variantId = variantOfSet.get(p.price_set_id)
      const base = baseOf.get(`${variantId}|${p.currency_code}`)
      if (!variantId || !base) continue

      checked++
      // Against the rounded amount, not a percentage tolerance: USD bases are two
      // digits, so a correct round(61 * 0.55) = 34 works out to 44.26% and a naive
      // "within 0.5% of 45" check calls it a failure. Rounding is the expected
      // behaviour; the discount is only wrong if the stored number is.
      const expected = Math.round(base * (1 - t.percent / 100))
      if (Number(p.amount) !== expected) wrong++
      if (!sample && p.currency_code === "inr") {
        sample = `${base} -> ${p.amount} inr`
      }
    }

    const nameOk = cat.name.includes(`${t.percent}%`)
    logger.info(
      `TEST RESULT ${t.handle}: percent=${cat.metadata?.sale_percent} list=${list.metadata?.sale_percent} | ` +
        `prices=${prices.length} checked=${checked} wrongPercent=${wrong} | sample ${sample} | ` +
        `name="${cat.name}" ${nameOk ? "NAME OK" : "NAME STALE"} | ` +
        `${wrong === 0 && checked > 0 && String(cat.metadata?.sale_percent) === String(list.metadata?.sale_percent) ? "PASS" : "FAIL"}`
    )
  }
}
