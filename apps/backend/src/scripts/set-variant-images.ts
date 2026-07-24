import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Pins a specific product image to each variant, via `metadata.thumbnail`.
 *
 * The storefront's listing cards fall back to guessing which image belongs to
 * which colourway (filename match, then leftovers). That guess fails whenever a
 * colour is spelled unusually -- "blueee" does not match "blue-plain-tee.jpg"
 * -- so anything that has to be right needs pinning here instead.
 *
 * Edit MAPPINGS and run:
 *   npx medusa exec ./src/scripts/set-variant-images.ts -- --apply
 */

/** product handle -> (variant title -> substring of the intended image URL) */
const MAPPINGS: Record<string, Record<string, string>> = {
  "demo-product-2": {
    red: "red-kalenji",
    blueee: "blue-plain",
    gleen: "GREEN",
  },
}

export default async function setVariantImages({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule: any = container.resolve(Modules.PRODUCT)
  const apply = process.argv.includes("--apply")

  for (const [handle, byVariant] of Object.entries(MAPPINGS)) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "images.url", "variants.id", "variants.title", "variants.metadata"],
      filters: { handle },
    })

    const product: any = data?.[0]
    if (!product) {
      logger.warn(`SKIP ${handle}: product not found`)
      continue
    }

    const urls: string[] = (product.images ?? []).map((i: any) => i.url).filter(Boolean)

    for (const variant of product.variants ?? []) {
      const needle = byVariant[variant.title]
      if (!needle) continue

      const url = urls.find((u) => u.toLowerCase().includes(needle.toLowerCase()))
      if (!url) {
        logger.warn(`SKIP ${handle}/${variant.title}: no image matching "${needle}"`)
        continue
      }

      logger.info(`${handle}/${variant.title} -> ${url.split("/").pop()}`)

      if (apply) {
        await productModule.updateProductVariants(variant.id, {
          metadata: { ...(variant.metadata ?? {}), thumbnail: url },
        })
      }
    }
  }

  if (!apply) {
    logger.info("Dry run -- nothing written. Re-run with -- --apply to commit.")
  }
}
