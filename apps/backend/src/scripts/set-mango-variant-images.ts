import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MANGO_MARKER } from "./import-mango-v2"
import { NEWNOW_MARKER } from "./import-men-newnow"

/** Every importer's marker -- each category import owns a distinct one. */
const MARKERS = [MANGO_MARKER, NEWNOW_MARKER]

/**
 * Pins each colourway's gallery and card image.
 *
 * Medusa has no variant->image relation, so the storefront resolves a variant's
 * photos two ways, both of which this fills in:
 *   - `metadata.image_order`: ordered product-image IDs, the source of truth for
 *     the PDP gallery (CustomProductDetails).
 *   - `metadata.thumbnail`: the grid card's image (lib/util/variant-cards.ts),
 *     which otherwise falls back to guessing by filename.
 *
 * Colour is recovered from the image filename rather than the stored source
 * list, because Mango asset names ("37011432-96-002") survive re-hosting -- the
 * Cloudinary public_id keeps the same basename. That keeps this runnable before
 * or after migrate-mango-images.
 *
 * Must run AFTER migrate-mango-images, since replacing a product's images mints
 * new image IDs and would strand any order written beforehand.
 *
 * Run: npx medusa exec ./src/scripts/set-mango-variant-images.ts -- --apply
 */

/** "…/37011432-96-002-4b1fbfdc45.jpg" or "…/37011432-96-002?wid=2048" */
function parseAsset(url: string): { style: string; colour: string } | null {
  const base = String(url || "").split("?")[0].split("/").pop() || ""
  const m = base.match(/^(\d{6,})-(\d+)-/)
  return m ? { style: m[1], colour: m[2] } : null
}

export default async function setMangoVariantImages({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule: any = container.resolve(Modules.PRODUCT)
  const apply = process.argv.includes("--apply")

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "metadata",
      "images.id",
      "images.url",
      "variants.id",
      "variants.title",
      "variants.metadata",
    ],
  })

  const mango = (products as any[]).filter((p) =>
    MARKERS.some((m) => p.metadata?.[m])
  )
  logger.info(`${mango.length} products carry an importer marker (${MARKERS.join(", ")}).`)
  if (!mango.length) return

  let variantsSet = 0
  let variantsUnmatched = 0
  let productsTouched = 0
  const unmatchedSamples: string[] = []

  for (const p of mango) {
    // colour code -> product image ids, in the order the images are stored.
    const byColour = new Map<string, { id: string; url: string }[]>()
    for (const img of p.images ?? []) {
      const parsed = parseAsset(img.url)
      if (!parsed) continue
      if (!byColour.has(parsed.colour)) byColour.set(parsed.colour, [])
      byColour.get(parsed.colour)!.push({ id: img.id, url: img.url })
    }

    let touched = false

    for (const v of p.variants ?? []) {
      const code = v.metadata?.color_code
      if (!code) continue

      const shots = byColour.get(String(code))
      if (!shots?.length) {
        variantsUnmatched++
        if (unmatchedSamples.length < 5) {
          unmatchedSamples.push(`${p.handle} / ${v.title} (code ${code})`)
        }
        continue
      }

      const image_order = shots.map((s) => s.id)
      const thumbnail = shots[0].url

      const already =
        Array.isArray(v.metadata?.image_order) &&
        v.metadata.image_order.join(",") === image_order.join(",") &&
        v.metadata?.thumbnail === thumbnail

      if (already) continue

      if (apply) {
        try {
          await productModule.updateProductVariants(v.id, {
            metadata: {
              ...v.metadata,
              image_order,
              thumbnail,
              // The full source list has served its purpose; drop it so the
              // metadata blob stays readable in the admin.
              source_images: undefined,
            },
          })
        } catch (e: any) {
          logger.error(`  ${p.handle} / ${v.title}: ${e.message}`)
          continue
        }
      }
      variantsSet++
      touched = true
    }

    if (touched) productsTouched++
    if (productsTouched && productsTouched % 20 === 0) {
      logger.info(`  ${productsTouched}/${mango.length} products`)
    }
  }

  logger.info(
    `${apply ? "Set" : "Would set"} images on ${variantsSet} variants across ${productsTouched} products.`
  )
  if (variantsUnmatched) {
    logger.warn(
      `${variantsUnmatched} variants had no image matching their colour code. e.g. ${unmatchedSamples.join("; ")}`
    )
  }
  if (!apply) logger.warn("DRY RUN. Re-run with `-- --apply` to write.")
}
