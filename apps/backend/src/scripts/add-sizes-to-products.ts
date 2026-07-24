import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductOptionsWorkflow,
  createProductVariantsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Adds a Size option to products that were created without one.
 *
 * Hand-made products only ever got a colour (or Medusa's placeholder "Default
 * option"), so their pages render no size picker at all -- there is nothing for
 * a customer to choose. This builds the missing size variants.
 *
 * Existing variants are kept by id and gain Size = M, so their price, stock and
 * inventory links survive. The other sizes are created alongside them.
 *
 * STOCK: new sizes are created with NO inventory level, i.e. 0 available. The
 * existing stock stays where it is rather than being copied onto every size --
 * duplicating it would invent inventory that does not exist and oversell. Set
 * real quantities per size in the admin afterwards.
 *
 * Medusa's "Default option" placeholder is dropped for products that only had
 * that, since it is not a real choice and would otherwise render as a stray
 * picker next to Size.
 *
 * Dry run by default -- pass --apply to write:
 *   npx medusa exec ./src/scripts/add-sizes-to-products.ts
 *   npx medusa exec ./src/scripts/add-sizes-to-products.ts -- --apply
 */

const SIZES = ["XS", "S", "M", "L", "XL"]

/** Size that inherits each existing variant's price and stock. */
const KEEP_SIZE = "M"

const SIZE_OPTION = /^sizes?$/i
const PLACEHOLDER_OPTION = /^default option$/i

export default async function addSizesToProducts({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const apply = process.argv.includes("--apply")

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "title",
      "options.id",
      "options.title",
      "options.values.value",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.manage_inventory",
      "variants.weight",
      "variants.length",
      "variants.width",
      "variants.height",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "variants.options.value",
      "variants.options.option_id",
    ],
  })

  const targets = (products as any[]).filter(
    (p) => !(p.options ?? []).some((o: any) => SIZE_OPTION.test((o.title ?? "").trim()))
  )

  logger.info(`${targets.length} products need a Size option (apply=${apply})`)

  for (const product of targets) {
    const allOptions = product.options ?? []

    // Keep real options (e.g. colour); drop Medusa's placeholder.
    const realOptions = allOptions.filter(
      (o: any) => !PLACEHOLDER_OPTION.test((o.title ?? "").trim())
    )

    const optionById = new Map<string, any>(allOptions.map((o: any) => [o.id, o]))

    const valuesOf = (variant: any): Record<string, string> => {
      const out: Record<string, string> = {}
      for (const ov of variant.options ?? []) {
        const option = optionById.get(ov.option_id)
        const title = (option?.title ?? "").trim()
        if (title && !PLACEHOLDER_OPTION.test(title)) {
          out[title] = ov.value
        }
      }
      return out
    }

    const existing = product.variants ?? []

    // Existing variants keep their id (and therefore their stock); the rest are
    // new rows.
    const updates = existing.map((variant: any) => ({
      id: variant.id,
      options: { ...valuesOf(variant), Size: KEEP_SIZE },
    }))

    const creations: any[] = []

    for (const variant of existing) {
      const base = valuesOf(variant)
      const labelBase = Object.values(base).join(" / ")

      for (const size of SIZES) {
        if (size === KEEP_SIZE) continue

        creations.push({
          product_id: product.id,
          title: labelBase ? `${labelBase} / ${size}` : size,
          sku: variant.sku ? `${variant.sku}-${size}` : undefined,
          options: { ...base, Size: size },
          manage_inventory: variant.manage_inventory ?? true,
          weight: variant.weight,
          length: variant.length,
          width: variant.width,
          height: variant.height,
          prices: (variant.prices ?? []).map((p: any) => ({
            amount: p.amount,
            currency_code: p.currency_code,
          })),
        })
      }
    }

    logger.info(
      `  ${product.handle}: options [${allOptions
        .map((o: any) => o.title)
        .join(", ")}] + Size, ` +
        `${existing.length} variants kept, ${creations.length} created`
    )

    if (!apply) continue

    try {
      // The option is ADDED rather than the option set being replaced. Replacing
      // it deletes the rows existing variants point at, which fails with
      // "Cannot set field 'id' of Product product option to null".
      await createProductOptionsWorkflow(container).run({
        input: { product_options: [{ product_id: product.id, title: "Size", values: SIZES }] },
      })

      // Existing variants have no Size value yet; give them one before any new
      // variant claims the same combination.
      await updateProductVariantsWorkflow(container).run({
        input: { product_variants: updates } as any,
      })

      await createProductVariantsWorkflow(container).run({
        input: { product_variants: creations } as any,
      })
    } catch (e: any) {
      logger.error(`  ${product.handle}: FAILED -- ${e?.message}`)
    }
  }

  if (!apply) {
    logger.info("Dry run -- nothing written. Re-run with -- --apply to commit.")
    return
  }

  // Re-read rather than trusting the workflow: a product left without variants
  // or prices is unsellable, and that is not visible from the caller's side.
  const { data: after } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "options.title", "variants.id", "variants.prices.amount"],
  })

  const stillMissing = (after as any[]).filter(
    (p) => !(p.options ?? []).some((o: any) => SIZE_OPTION.test((o.title ?? "").trim()))
  )
  const unpriced = (after as any[]).filter((p) =>
    (p.variants ?? []).some((v: any) => !v.prices?.length)
  )

  logger.info(`Applied. Still without Size: ${stillMissing.length}`)
  logger.info(`Products with an unpriced variant: ${unpriced.length}`)
  if (unpriced.length) {
    logger.warn(`  ${unpriced.map((p) => p.handle).join(", ")}`)
  }
}
