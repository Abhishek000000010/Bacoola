import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createHash } from "crypto"
import { v2 as cloudinary } from "cloudinary"

/**
 * Re-hosts product imagery that still points at Mango's CDN onto our own
 * Cloudinary account, then rewrites the stored URLs.
 *
 * Hotlinking mango.com works on localhost but breaks the moment they enable
 * referer checks or retire a product, so nothing public should depend on it.
 *
 * Cloudinary fetches each source URL server-side rather than us downloading and
 * re-encoding it, which is the difference between minutes and hours for ~800
 * images. That means bypassing the File Module (its provider only accepts
 * base64), but product images are stored as plain URLs either way, so nothing
 * downstream can tell the difference.
 *
 * Idempotent: the Cloudinary public_id is derived from the source URL, so a
 * second run re-resolves the same asset instead of duplicating it, and
 * already-migrated products are skipped outright.
 *
 * Run: npx medusa exec ./src/scripts/migrate-mango-images.ts -- --apply
 */

const MANGO_HOSTS = ["media.mango.com", "shop.mango.com", "st.mngbcn.com"]
const CONCURRENCY = 6
const MAX_RETRIES = 3

const isMangoUrl = (u: unknown): u is string =>
  typeof u === "string" && MANGO_HOSTS.some((h) => u.includes(h))

/** Stable, readable public_id: the asset name from the path plus a URL hash. */
function publicIdFor(url: string, folder: string): string {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 10)
  const base =
    (url.split("?")[0].split("/").pop() || "img").replace(/[^a-zA-Z0-9._-]/g, "") ||
    "img"
  return `${folder}/mango/${base}-${hash}`
}

async function uploadWithRetry(
  url: string,
  folder: string,
  logger: any
): Promise<string | null> {
  const public_id = publicIdFor(url, folder)
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(url, {
        public_id,
        resource_type: "image",
        // Re-running must not re-upload: same id resolves to the same asset.
        overwrite: false,
        unique_filename: false,
        use_filename: false,
      })
      return res.secure_url
    } catch (e: any) {
      const msg = e?.message ?? String(e)
      if (attempt === MAX_RETRIES) {
        logger.error(`  upload failed after ${MAX_RETRIES} tries: ${url} -- ${msg}`)
        return null
      }
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
    }
  }
  return null
}

/** Runs `worker` over `items` with bounded concurrency. */
async function pooled<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      await worker(items[i], i)
    }
  })
  await Promise.all(runners)
}

export default async function migrateMangoImages({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule: any = container.resolve(Modules.PRODUCT)

  const apply = process.argv.includes("--apply")
  const folder = process.env.CLOUDINARY_FOLDER || "bacoola"

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
    logger.error("Cloudinary credentials missing from env. Aborting.")
    return
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "images.id",
      "images.url",
      "variants.id",
      "variants.metadata",
    ],
  })

  // Collect every distinct Mango URL still referenced anywhere.
  const urls = new Set<string>()
  const affected: any[] = []

  for (const p of products as any[]) {
    let touches = false
    if (isMangoUrl(p.thumbnail)) {
      urls.add(p.thumbnail)
      touches = true
    }
    for (const img of p.images ?? []) {
      if (isMangoUrl(img.url)) {
        urls.add(img.url)
        touches = true
      }
    }
    for (const v of p.variants ?? []) {
      const t = v.metadata?.thumbnail
      if (isMangoUrl(t)) {
        urls.add(t)
        touches = true
      }
    }
    if (touches) affected.push(p)
  }

  logger.info(
    `${affected.length} products reference Mango-hosted images; ${urls.size} distinct URLs to migrate.`
  )

  if (!urls.size) {
    logger.info("Nothing to do -- no Mango URLs remain.")
    return
  }

  if (!apply) {
    logger.warn("DRY RUN. Re-run with `-- --apply` to upload and rewrite.")
    for (const u of [...urls].slice(0, 5)) {
      logger.info(`  would upload: ${u}`)
      logger.info(`            as: ${publicIdFor(u, folder)}`)
    }
    return
  }

  logger.info(`Uploading ${urls.size} images to Cloudinary (concurrency ${CONCURRENCY})...`)

  const map = new Map<string, string>()
  let done = 0
  let failed = 0

  await pooled([...urls], CONCURRENCY, async (url) => {
    const dest = await uploadWithRetry(url, folder, logger)
    if (dest) {
      map.set(url, dest)
    } else {
      failed++
    }
    done++
    if (done % 50 === 0 || done === urls.size) {
      logger.info(`  ${done}/${urls.size} uploaded (${failed} failed)`)
    }
  })

  logger.info(`Upload complete: ${map.size} succeeded, ${failed} failed.`)

  // Rewrite stored URLs. Any image that failed to upload keeps its original
  // Mango URL rather than being dropped, so a partial run degrades instead of
  // destroying references -- re-running picks the stragglers back up.
  logger.info("Rewriting product records...")
  let updatedProducts = 0
  let updatedVariants = 0

  for (const p of affected) {
    const patch: Record<string, any> = {}

    if (isMangoUrl(p.thumbnail) && map.has(p.thumbnail)) {
      patch.thumbnail = map.get(p.thumbnail)
    }

    const imgs = p.images ?? []
    if (imgs.some((i: any) => isMangoUrl(i.url) && map.has(i.url))) {
      patch.images = imgs.map((i: any) => ({ url: map.get(i.url) ?? i.url }))
    }

    if (Object.keys(patch).length) {
      try {
        await productModule.updateProducts(p.id, patch)
        updatedProducts++
      } catch (e: any) {
        logger.error(`  failed to update ${p.handle}: ${e.message}`)
      }
    }

    for (const v of p.variants ?? []) {
      const t = v.metadata?.thumbnail
      if (isMangoUrl(t) && map.has(t)) {
        try {
          await productModule.updateProductVariants(v.id, {
            metadata: { ...v.metadata, thumbnail: map.get(t) },
          })
          updatedVariants++
        } catch (e: any) {
          logger.error(`  failed to update variant ${v.id}: ${e.message}`)
        }
      }
    }

    if (updatedProducts % 25 === 0 && updatedProducts) {
      logger.info(`  rewritten ${updatedProducts}/${affected.length} products`)
    }
  }

  logger.info(
    `Done. Rewrote ${updatedProducts} products and ${updatedVariants} variants.`
  )
  if (failed) {
    logger.warn(
      `${failed} image(s) failed to upload and still point at Mango. Re-run to retry just those.`
    )
  }
}
