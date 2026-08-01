import { HttpTypes } from "@medusajs/types"
import { getVariantCards, VariantCard } from "./variant-cards"

/**
 * Category filtering, shared by the drawer and the grid.
 *
 * Filtering happens per COLOURWAY, not per product: the grid renders one card
 * per colourway, so filtering "blues" on an eight-colour shirt has to leave
 * just the blue card standing. Counting products instead would show a count
 * that disagrees with the number of tiles on screen.
 *
 * Both the client drawer and the server grid import `cardMatches` from here so
 * the live "SHOW N ITEMS" count and the rendered result can never disagree.
 */

export const FILTER_KEYS = {
  color: "color",
  size: "size",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
} as const

export type FilterState = {
  /** Colour FAMILY keys (e.g. "blues"), not individual colour names. */
  colors: string[]
  sizes: string[]
  minPrice?: number
  maxPrice?: number
}

export const EMPTY_FILTERS: FilterState = { colors: [], sizes: [] }

/**
 * Colour families, mirroring how fashion listings group colour rather than
 * listing every shade. `matches` are the individual colour option values the
 * catalogue actually uses; anything unrecognised falls into `other`.
 */
export const COLOR_FAMILIES: {
  key: string
  label: string
  hex: string
  matches: string[]
}[] = [
  { key: "beige", label: "BEIGE TONES", hex: "#D9CDB8", matches: ["beige", "stone", "tan", "camel"] },
  { key: "blacks", label: "BLACKS", hex: "#111111", matches: ["black", "charcoal"] },
  { key: "blues", label: "BLUES", hex: "#3D6FB5", matches: ["blue", "navy", "sky"] },
  { key: "browns", label: "BROWNS", hex: "#5C4033", matches: ["brown", "khaki", "rust"] },
  { key: "ecru", label: "ECRU TONES", hex: "#F3EFE0", matches: ["off-white", "cream"] },
  { key: "greens", label: "GREENS", hex: "#6B7042", matches: ["green", "olive", "teal"] },
  { key: "greys", label: "GREYS", hex: "#888888", matches: ["grey", "silver"] },
  { key: "whites", label: "WHITES", hex: "#FFFFFF", matches: ["white"] },
  { key: "reds", label: "REDS", hex: "#C01A1A", matches: ["red", "burgundy", "maroon"] },
  { key: "pinks", label: "PINKS", hex: "#E8A0B4", matches: ["pink"] },
  { key: "purples", label: "PURPLES", hex: "#6A4C93", matches: ["purple", "lilac"] },
  { key: "yellows", label: "YELLOWS", hex: "#E8C33A", matches: ["yellow", "mustard"] },
  { key: "oranges", label: "ORANGES", hex: "#E8833A", matches: ["orange"] },
]

const FAMILY_BY_COLOR = new Map<string, string>()
for (const fam of COLOR_FAMILIES) {
  for (const m of fam.matches) FAMILY_BY_COLOR.set(m, fam.key)
}

export const OTHER_FAMILY = { key: "other", label: "OTHER", hex: "#C4C4C4" }

export function familyForColor(colorName?: string | null): string | null {
  if (!colorName) return null
  const n = colorName.trim().toLowerCase()
  // Import-generated names can carry a numeric suffix when two colourways of one
  // garment landed on the same palette entry ("navy-2").
  const base = n.replace(/-\d+$/, "")
  return FAMILY_BY_COLOR.get(base) ?? FAMILY_BY_COLOR.get(n) ?? OTHER_FAMILY.key
}

const SIZE_ORDER = [
  "ONE SIZE", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
]
export function sizeRank(value: string): number {
  const v = value.trim().toUpperCase()
  const i = SIZE_ORDER.indexOf(v)
  if (i !== -1) return i
  // Numeric sizes (38, 40, …) sort after lettered ones, numerically.
  const n = parseFloat(v)
  return Number.isFinite(n) ? 1000 + n : 9999
}

const isColourOption = (o: any) => /^colou?rs?$/i.test((o?.title ?? "").trim())
const isSizeOption = (o: any) => /^sizes?$/i.test((o?.title ?? "").trim())

const optionValue = (variant: any, optionId?: string): string | undefined => {
  if (!optionId) return undefined
  return (variant?.options ?? []).find((o: any) => o.option_id === optionId)?.value
}

const variantAmount = (v: any): number | null => {
  const amt = v?.calculated_price?.calculated_amount
  return typeof amt === "number" ? amt : null
}

/** Everything needed to decide whether one grid card passes the filters. */
export type CardFacet = {
  key: string
  productId: string
  colorName: string | null
  family: string | null
  sizes: string[]
  price: number | null
}

/**
 * Facet data for every card a product will render, aligned with the cards
 * `getVariantCards` produces so the two stay in step.
 */
export function getCardFacets(product: HttpTypes.StoreProduct): CardFacet[] {
  const cards = getVariantCards(product)
  const colourOption = (product.options ?? []).find(isColourOption)
  const sizeOption = (product.options ?? []).find(isSizeOption)
  const variants: any[] = (product.variants as any[]) ?? []

  return cards.map((card) => {
    const cardVariant = variants.find((v) => v.id === card.variantId)
    const colorName = colourOption
      ? optionValue(cardVariant, colourOption.id) ?? card.label ?? null
      : card.label ?? null

    // Siblings of this colourway: same colour value, any size. With no colour
    // option the card already represents a single variant.
    const siblings = colourOption && colorName
      ? variants.filter((v) => optionValue(v, colourOption.id) === colorName)
      : cardVariant
        ? [cardVariant]
        : []

    const sizes = sizeOption
      ? Array.from(
          new Set(
            siblings
              .map((v) => optionValue(v, sizeOption.id))
              .filter((s): s is string => Boolean(s))
          )
        )
      : []

    const prices = siblings
      .map(variantAmount)
      .filter((n): n is number => n !== null)

    return {
      key: card.key,
      productId: product.id,
      colorName,
      family: colourOption ? familyForColor(colorName) : null,
      sizes,
      price: prices.length ? Math.min(...prices) : null,
    }
  })
}

/**
 * AND across facet types, OR within one. Selecting two colours widens the
 * result; adding a size then narrows it.
 */
export function cardMatches(facet: CardFacet, filters: FilterState): boolean {
  if (filters.colors.length) {
    if (!facet.family || !filters.colors.includes(facet.family)) return false
  }

  if (filters.sizes.length) {
    if (!facet.sizes.some((s) => filters.sizes.includes(s))) return false
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    // A card with no resolvable price cannot satisfy a price filter.
    if (facet.price == null) return false
    if (filters.minPrice != null && facet.price < filters.minPrice) return false
    if (filters.maxPrice != null && facet.price > filters.maxPrice) return false
  }

  return true
}

export function hasActiveFilters(f: FilterState): boolean {
  return Boolean(
    f.colors.length || f.sizes.length || f.minPrice != null || f.maxPrice != null
  )
}

/** Options offered by the drawer, derived from the category's own cards. */
export type FacetIndex = {
  colors: { key: string; label: string; hex: string; count: number }[]
  sizes: { value: string; count: number }[]
  priceMin: number | null
  priceMax: number | null
  totalCards: number
}

export function buildFacetIndex(facets: CardFacet[]): FacetIndex {
  const colorCounts = new Map<string, number>()
  const sizeCounts = new Map<string, number>()
  let priceMin: number | null = null
  let priceMax: number | null = null

  for (const f of facets) {
    if (f.family) colorCounts.set(f.family, (colorCounts.get(f.family) ?? 0) + 1)
    for (const s of f.sizes) sizeCounts.set(s, (sizeCounts.get(s) ?? 0) + 1)
    if (f.price != null) {
      priceMin = priceMin == null ? f.price : Math.min(priceMin, f.price)
      priceMax = priceMax == null ? f.price : Math.max(priceMax, f.price)
    }
  }

  const known = COLOR_FAMILIES.filter((f) => colorCounts.has(f.key)).map((f) => ({
    key: f.key,
    label: f.label,
    hex: f.hex,
    count: colorCounts.get(f.key)!,
  }))
  if (colorCounts.has(OTHER_FAMILY.key)) {
    known.push({ ...OTHER_FAMILY, count: colorCounts.get(OTHER_FAMILY.key)! })
  }

  return {
    colors: known,
    sizes: Array.from(sizeCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => sizeRank(a.value) - sizeRank(b.value)),
    priceMin: priceMin == null ? null : Math.floor(priceMin),
    priceMax: priceMax == null ? null : Math.ceil(priceMax),
    totalCards: facets.length,
  }
}

// ---- URL params -------------------------------------------------------

type ParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

const readAll = (params: ParamsLike, key: string): string[] => {
  if (typeof (params as URLSearchParams).getAll === "function") {
    const all = (params as URLSearchParams).getAll(key)
    return all.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean)
  }
  const raw = (params as Record<string, string | string[] | undefined>)[key]
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean)
  }
  if (typeof raw === "string") {
    return raw.split(",").map((v) => v.trim()).filter(Boolean)
  }
  return []
}

const readNumber = (params: ParamsLike, key: string): number | undefined => {
  const [first] = readAll(params, key)
  if (first == null) return undefined
  const n = Number(first)
  return Number.isFinite(n) ? n : undefined
}

export function parseFilterParams(params: ParamsLike): FilterState {
  return {
    colors: Array.from(new Set(readAll(params, FILTER_KEYS.color))),
    sizes: Array.from(new Set(readAll(params, FILTER_KEYS.size))),
    minPrice: readNumber(params, FILTER_KEYS.minPrice),
    maxPrice: readNumber(params, FILTER_KEYS.maxPrice),
  }
}

/** Writes filters onto existing params, dropping empties so URLs stay clean. */
export function applyFilterParams(
  params: URLSearchParams,
  filters: FilterState
): URLSearchParams {
  for (const key of Object.values(FILTER_KEYS)) params.delete(key)

  if (filters.colors.length) params.set(FILTER_KEYS.color, filters.colors.join(","))
  if (filters.sizes.length) params.set(FILTER_KEYS.size, filters.sizes.join(","))
  if (filters.minPrice != null) params.set(FILTER_KEYS.minPrice, String(filters.minPrice))
  if (filters.maxPrice != null) params.set(FILTER_KEYS.maxPrice, String(filters.maxPrice))

  // Any filter change invalidates the current page offset.
  params.delete("page")
  return params
}

/** Cards for a page of products, filtered and flattened. */
export function filterProductCards(
  products: HttpTypes.StoreProduct[],
  filters: FilterState
): { product: HttpTypes.StoreProduct; card: VariantCard }[] {
  const out: { product: HttpTypes.StoreProduct; card: VariantCard }[] = []

  for (const product of products) {
    const cards = getVariantCards(product)
    const facets = getCardFacets(product)
    const byKey = new Map(facets.map((f) => [f.key, f]))

    for (const card of cards) {
      const facet = byKey.get(card.key)
      if (!facet) continue
      if (!cardMatches(facet, filters)) continue
      out.push({ product, card })
    }
  }

  return out
}
