import { HttpTypes } from "@medusajs/types"

/**
 * One grid card per colourway of a product.
 *
 * Listing pages show a single card per product, so a shirt sold in red, green
 * and blue occupies one tile and only ever shows whichever image happens to be
 * the thumbnail. Fashion listings are expected to show each colourway as its
 * own tile.
 *
 * Cards are split on the COLOUR option, not on every variant. Splitting per
 * variant would multiply by size as well -- a shirt in 3 colours x 5 sizes
 * would take 15 near-identical tiles -- which is never what a listing wants.
 * Products with no colour option fall back to one card per variant, so a
 * colour-less product still behaves sensibly.
 */
export type VariantCard = {
  key: string
  variantId?: string
  /** Just the colourway, e.g. "blueee". */
  label?: string
  /** Card heading, e.g. "demo product 2-(blueee)". */
  title: string
  thumbnail?: string | null
  href: string
}

/** Matches "color", "Colour", "COLOR" -- spelling is inconsistent across products. */
const isColourOption = (option: any): boolean =>
  /^colou?rs?$/i.test((option?.title ?? "").trim())

const valueForOption = (variant: any, optionId: string): string | undefined =>
  (variant?.options ?? []).find((o: any) => o.option_id === optionId)?.value

const explicitImage = (variant: any): string | undefined => {
  const meta = variant?.metadata ?? {}
  const explicit = meta.thumbnail ?? meta.image ?? meta.image_url
  return typeof explicit === "string" && explicit.trim() ? explicit : undefined
}

/**
 * Assigns one image per card.
 *
 * Medusa has no variant->image relation, so this has to be worked out. In
 * priority order:
 *
 *   1. `metadata.thumbnail` / `.image` / `.image_url` on the variant. The only
 *      source that stays correct however images are reordered -- set this to be
 *      certain.
 *   2. An image whose filename mentions the colour ("…/blue-plain-tee.jpg" for
 *      "blueee"). Upload order is unreliable, but filenames usually are not.
 *   3. Whatever images are left, in order, for colours that matched nothing.
 *      Assigning leftovers rather than indexing blindly means one unmatched
 *      colour cannot shunt every other card onto the wrong photo.
 *   4. The product thumbnail.
 *
 * Steps 2-3 are conventions, not guarantees. Set the metadata when a colourway
 * has to be right.
 */
const assignImages = (
  product: HttpTypes.StoreProduct,
  entries: { label?: string; variant: any }[]
): (string | null | undefined)[] => {
  const images = (product.images ?? []).map((i: any) => i.url).filter(Boolean)
  const result: (string | null | undefined)[] = new Array(entries.length)
  const used = new Set<number>()

  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

  entries.forEach((entry, i) => {
    const explicit = explicitImage(entry.variant)
    if (explicit) {
      result[i] = explicit
    }
  })

  // Pass 1: filename mentions the colour.
  entries.forEach((entry, i) => {
    if (result[i] || !entry.label) return

    const label = normalise(entry.label)
    if (label.length < 3) return

    const match = images.findIndex(
      (url: string, idx: number) => !used.has(idx) && normalise(url).includes(label)
    )

    if (match !== -1) {
      used.add(match)
      result[i] = images[match]
    }
  })

  // Pass 2: hand out the remaining images to whatever is still unassigned.
  let next = 0
  entries.forEach((_entry, i) => {
    if (result[i]) return
    while (next < images.length && used.has(next)) next++
    if (next < images.length) {
      used.add(next)
      result[i] = images[next]
    } else {
      result[i] = product.thumbnail
    }
  })

  return result
}

export function getVariantCards(product: HttpTypes.StoreProduct): VariantCard[] {
  const base = `/products/${product.handle}`
  const variants: any[] = (product.variants as any[]) ?? []

  // Nothing to split on -- keep the product's own card.
  if (!variants.length) {
    return [
      {
        key: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        href: base,
      },
    ]
  }

  const colourOption = (product.options ?? []).find(isColourOption)

  // Group by colourway, preserving the order variants come back in.
  let grouped: { label?: string; variant: any }[] = []

  if (colourOption) {
    const seen = new Set<string>()
    for (const variant of variants) {
      const value = valueForOption(variant, colourOption.id)
      const key = (value ?? "").toLowerCase()
      if (!value || seen.has(key)) continue
      seen.add(key)
      grouped.push({ label: value, variant })
    }
  }

  // No colour option, or none of the variants carry a colour value.
  if (!grouped.length) {
    grouped = variants.map((variant) => ({
      label: variant.title ?? undefined,
      variant,
    }))
  }

  const images = assignImages(product, grouped)

  return grouped.map(({ label, variant }, index) => ({
    key: variant.id,
    variantId: variant.id,
    label,
    title: label ? `${product.title}-(${label})` : product.title,
    thumbnail: images[index],
    href: `${base}?v_id=${variant.id}`,
  }))
}
