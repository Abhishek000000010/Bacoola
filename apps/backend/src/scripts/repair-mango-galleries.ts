import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Rebuilds product galleries from the supplier CDN instead of from the scrape.
 *
 * A grid scrape only captures the tiles the page had lazily rendered, so 22 of
 * the 72 New Now products arrived with a single image -- and for two of them
 * that one image was a `-009` asset, which is not a photo of the garment but a
 * COMPOSITE: two editorial shots side by side in one wide file, letterboxed.
 * That is what a "wrong image" on the PDP actually is.
 *
 * Mango asset URLs are fully derivable (`{style}-{colour}-{suffix}`), so the
 * real image set can be recovered by probing suffixes rather than re-scraping.
 * Verified meanings, sampled from the live CDN:
 *
 *   500/501/505/508   hero + editorial crops (508 is landscape)
 *   001-008, 010-012  model shots: front, back, side, detail
 *   052-055, 900      flat packshot on white (accessories use the 05x range)
 *   022/023/030       fabric macro -- fine deeper in the gallery, poor as a card
 *   009               COMPOSITE two-up. Never usable. Excluded.
 *
 * ORDER below is also the gallery order: model shots first, packshot, then
 * fabric detail. Anything already re-hosted keeps its Cloudinary URL so
 * migrate-mango-images has nothing to re-upload for it.
 *
 * Run: npx medusa exec ./src/scripts/repair-mango-galleries.ts -- --apply
 * Then: migrate-mango-images.ts, set-mango-variant-images.ts (image ids change).
 */

const MARKER = process.env.REPAIR_MARKER || "mango-men-newnow-v1"

/** Probed in this order, and stored in this order. `009` is deliberately absent. */
const ORDER = [
  "500", "501", "505", "508",
  "001", "002", "003", "004", "005", "006", "007", "008", "010", "011", "012",
  "900", "052", "053", "054", "055",
  "022", "023", "030",
]

const assetUrl = (style: string, colour: string, sfx: string) =>
  `https://media.mango.com/is/image/punto/${style}-${colour}-${sfx}?wid=2048`

/** Cheap existence check -- 40px wide is enough to know the asset resolves. */
async function exists(style: string, colour: string, sfx: string): Promise<boolean> {
  const url = `https://media.mango.com/is/image/punto/${style}-${colour}-${sfx}?wid=40`
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
      // 403 is how this CDN says "no such asset"; anything else may be transient.
      if (res.status === 403 || res.status === 404) return false
    } catch {
      /* retry once */
    }
  }
  return false
}

async function pooled<T>(items: T[], limit: number, worker: (t: T) => Promise<void>) {
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await worker(items[i++])
    })
  )
}

/** "…/37051330-56-009-a6bd071feb.jpg" or "…/37051330-56-009?wid=2048" -> key */
function assetKey(url: string): string | null {
  const base = String(url || "").split("?")[0].split("/").pop() || ""
  const m = base.match(/^(\d{6,}-\d+-\d{3})/)
  return m ? m[1] : null
}

export default async function repairMangoGalleries({
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
    fields: ["id", "handle", "thumbnail", "metadata", "images.url", "variants.metadata"],
  })

  const mine = (products as any[]).filter((p) => p.metadata?.[MARKER])
  logger.info(`${mine.length} products carry ${MARKER}.`)
  if (!mine.length) return

  // Colourways in variant order, so the gallery leads with the colour the
  // product's own thumbnail shows.
  type Job = { product: any; style: string; colours: string[] }
  const jobs: Job[] = []
  for (const p of mine) {
    const style = String(p.metadata?.style_id || "")
    const colours: string[] = []
    for (const v of p.variants ?? []) {
      const c = v.metadata?.color_code
      if (c && !colours.includes(String(c))) colours.push(String(c))
    }
    if (!style || !colours.length) {
      logger.warn(`  ${p.handle}: no style_id/colour codes, skipped.`)
      continue
    }
    jobs.push({ product: p, style, colours })
  }

  const probes = jobs.flatMap((j) =>
    j.colours.flatMap((c) => ORDER.map((sfx) => ({ job: j, colour: c, sfx })))
  )
  logger.info(`Probing ${probes.length} asset URLs across ${jobs.length} products...`)

  const live = new Set<string>()
  let done = 0
  await pooled(probes, 8, async (p) => {
    if (await exists(p.job.style, p.colour, p.sfx)) {
      live.add(`${p.job.style}-${p.colour}-${p.sfx}`)
    }
    if (++done % 250 === 0) logger.info(`  probed ${done}/${probes.length}`)
  })
  logger.info(`Found ${live.size} live assets.`)

  let changed = 0
  let added = 0
  let dropped = 0

  for (const { product: p, style, colours } of jobs) {
    // Keep the Cloudinary URL for anything already re-hosted.
    const hosted = new Map<string, string>()
    for (const img of p.images ?? []) {
      const k = assetKey(img.url)
      if (k && img.url.includes("cloudinary")) hosted.set(k, img.url)
    }

    const wanted: string[] = []
    for (const colour of colours) {
      for (const sfx of ORDER) {
        const key = `${style}-${colour}-${sfx}`
        if (!live.has(key)) continue
        wanted.push(hosted.get(key) ?? assetUrl(style, colour, sfx))
      }
    }

    if (!wanted.length) {
      logger.warn(`  ${p.handle}: probing found nothing, leaving as is.`)
      continue
    }

    const beforeKeys = (p.images ?? []).map((i: any) => assetKey(i.url)).filter(Boolean)
    const afterKeys = wanted.map(assetKey).filter(Boolean)
    const gained = afterKeys.filter((k) => !beforeKeys.includes(k)).length
    const lost = beforeKeys.filter((k) => !afterKeys.includes(k)).length
    if (!gained && !lost && beforeKeys.join(",") === afterKeys.join(",")) continue

    added += gained
    dropped += lost
    logger.info(
      `  ${p.handle}: ${beforeKeys.length} -> ${afterKeys.length} images (+${gained}/-${lost})`
    )

    if (apply) {
      try {
        await productModule.updateProducts(p.id, {
          images: wanted.map((url) => ({ url })),
          thumbnail: wanted[0],
        })
      } catch (e: any) {
        logger.error(`  ${p.handle}: ${e.message}`)
        continue
      }
    }
    changed++
  }

  logger.info(
    `${apply ? "Rebuilt" : "Would rebuild"} ${changed} galleries: +${added} images, -${dropped} removed.`
  )
  if (!apply) logger.warn("DRY RUN. Re-run with `-- --apply` to write.")
  else {
    logger.info(
      "Next: migrate-mango-images.ts -- --apply, then set-mango-variant-images.ts -- --apply"
    )
  }
}
