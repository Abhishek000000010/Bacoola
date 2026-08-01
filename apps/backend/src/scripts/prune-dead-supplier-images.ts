import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Drops product images still pointing at the supplier CDN.
 *
 * migrate-mango-images re-hosts everything it can, but a handful of scraped
 * URLs are already dead at the source (403) and will never upload. Leaving them
 * is worse than dropping them: they render as broken boxes, and a dead URL sat
 * in the thumbnail slot means a blank grid card.
 *
 * Run this only AFTER migrate-mango-images has had a clean retry -- it cannot
 * tell "dead upstream" from "not uploaded yet". Re-run set-mango-variant-images
 * afterwards, because removing an image invalidates the ids in image_order.
 *
 * Run: npx medusa exec ./src/scripts/prune-dead-supplier-images.ts -- --apply
 */

const SUPPLIER_HOSTS = ["media.mango.com", "shop.mango.com"]

export default async function pruneDeadSupplierImages({
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
    fields: ["id", "handle", "thumbnail", "images.id", "images.url"],
  })

  const isSupplier = (u: string) =>
    SUPPLIER_HOSTS.some((h) => String(u || "").includes(h))

  const affected = (products as any[]).filter(
    (p) => (p.images ?? []).some((i: any) => isSupplier(i.url)) || isSupplier(p.thumbnail)
  )
  logger.info(`${affected.length} product(s) still reference the supplier CDN.`)

  let fixed = 0
  for (const p of affected) {
    const keep = (p.images ?? []).filter((i: any) => !isSupplier(i.url))
    if (!keep.length) {
      // Removing every image would leave a card with nothing to show, which is
      // a worse failure than a broken one. Flag it for a re-scrape instead.
      logger.warn(`  ${p.handle}: all ${p.images.length} images are supplier URLs -- left alone.`)
      continue
    }

    const thumbnail = isSupplier(p.thumbnail) ? keep[0].url : p.thumbnail
    logger.info(
      `  ${p.handle}: dropping ${(p.images?.length ?? 0) - keep.length} image(s)` +
        (thumbnail !== p.thumbnail ? ", repointing thumbnail" : "")
    )

    if (apply) {
      try {
        await productModule.updateProducts(p.id, {
          images: keep.map((i: any) => ({ url: i.url })),
          thumbnail,
        })
      } catch (e: any) {
        logger.error(`  ${p.handle}: ${e.message}`)
        continue
      }
    }
    fixed++
  }

  logger.info(`${apply ? "Fixed" : "Would fix"} ${fixed} product(s).`)
  if (!apply) logger.warn("DRY RUN. Re-run with `-- --apply` to write.")
  else logger.info("Now re-run set-mango-variant-images.ts -- --apply (image ids changed).")
}
