/**
 * Product measurements: the "MEASUREMENTS" panel on the product detail page.
 *
 * Three separate kinds of data feed that panel, and only the first is per-product:
 *
 *  1. The numbers themselves (chest 52cm at S, 54cm at M, ...) -- entered by the
 *     admin per product and stored on `product.metadata.measurements`.
 *  2. The row definitions and how-to-measure copy -- fixed per garment type,
 *     defined here and reused across every product of that type.
 *  3. The international size-equivalents chart -- global, defined here.
 *
 * Values are always STORED in centimetres. Inches are a display conversion only,
 * so there is one source of truth per garment and the CM/IN toggle can never
 * disagree with itself.
 */

export type MeasurementUnit = "cm" | "in"

/** rowKey -> size label -> value in centimetres. */
export type MeasurementTable = Record<string, Record<string, number>>

export type ProductMeasurements = {
  garmentType: string
  /** Size labels in display order, e.g. ["S","M","L","XL","XXL"]. */
  sizes: string[]
  /** The garment laid flat. */
  article: MeasurementTable
  /** The body the garment fits. */
  body: MeasurementTable
}

export type MeasurementRow = {
  key: string
  label: string
  /** How the shopper takes this measurement themselves. */
  howTo: string
}

export type GarmentType = {
  id: string
  label: string
  article: MeasurementRow[]
  body: MeasurementRow[]
}

/**
 * Garment types and their measurement rows.
 *
 * Rows are keyed, not positional, so reordering or inserting a row here does not
 * scramble measurements already saved against a product. Removing a key hides
 * that row; the stored numbers stay in metadata untouched.
 */
export const GARMENT_TYPES: GarmentType[] = [
  {
    id: "top",
    label: "Top / T-shirt / Shirt",
    article: [
      { key: "length", label: "Length", howTo: "From the top to the bottom of the article." },
      { key: "back", label: "Back", howTo: "From shoulder to shoulder, across the back." },
      { key: "chest", label: "Chest", howTo: "Across the chest, just below the arm seam." },
      { key: "sleeve_width", label: "Sleeve width", howTo: "From side to side, across the widest point of the sleeve." },
      { key: "sleeve_length", label: "Sleeve length", howTo: "From the shoulder seam to the end of the sleeve." },
    ],
    body: [
      { key: "bust", label: "Bust", howTo: "Measure around the bust at its most prominent point." },
      { key: "waist", label: "Waist", howTo: "Measure around the narrowest part of the abdomen." },
    ],
  },
  {
    id: "bottom",
    label: "Trousers / Jeans / Shorts",
    article: [
      { key: "waist", label: "Waist", howTo: "Across the waistband, from side to side." },
      { key: "hip", label: "Hip", howTo: "Across the widest point below the waistband." },
      { key: "inseam", label: "Inside leg", howTo: "From the crotch seam to the bottom of the leg." },
      { key: "outseam", label: "Outside leg", howTo: "From the top of the waistband to the bottom of the leg." },
      { key: "leg_opening", label: "Leg opening", howTo: "Across the bottom of the leg, from side to side." },
    ],
    body: [
      { key: "waist", label: "Waist", howTo: "Measure around the narrowest part of the abdomen." },
      { key: "hip", label: "Hip", howTo: "Measure around the widest part of the hips." },
    ],
  },
  {
    id: "dress",
    label: "Dress / Skirt",
    article: [
      { key: "length", label: "Length", howTo: "From the top to the bottom of the article." },
      { key: "chest", label: "Chest", howTo: "Across the chest, just below the arm seam." },
      { key: "waist", label: "Waist", howTo: "Across the narrowest point of the article." },
      { key: "sleeve_length", label: "Sleeve length", howTo: "From the shoulder seam to the end of the sleeve." },
    ],
    body: [
      { key: "bust", label: "Bust", howTo: "Measure around the bust at its most prominent point." },
      { key: "waist", label: "Waist", howTo: "Measure around the narrowest part of the abdomen." },
      { key: "hip", label: "Hip", howTo: "Measure around the widest part of the hips." },
    ],
  },
]

export const getGarmentType = (id?: string): GarmentType =>
  GARMENT_TYPES.find((g) => g.id === id) ?? GARMENT_TYPES[0]

/**
 * International size equivalents, keyed by the Europe letter size.
 *
 * Global, not per-product: an L is an L in the UK and a G in Mexico for every
 * garment in the catalogue.
 */
export const SIZE_EQUIVALENT_REGIONS = [
  "Europe",
  "Italy",
  "United Kingdom",
  "USA",
  "Mexico",
  "China",
  "South Korea",
] as const

export const SIZE_EQUIVALENTS: Record<string, Record<string, string>> = {
  XS: { Europe: "XS", Italy: "XS", "United Kingdom": "XS", USA: "XS", Mexico: "XCH", China: "165/84A", "South Korea": "XS" },
  S: { Europe: "S", Italy: "S", "United Kingdom": "S", USA: "S", Mexico: "CH", China: "170/92A", "South Korea": "S" },
  M: { Europe: "M", Italy: "M", "United Kingdom": "M", USA: "M", Mexico: "M", China: "175/96A", "South Korea": "M" },
  L: { Europe: "L", Italy: "L", "United Kingdom": "L", USA: "L", Mexico: "G", China: "185/104A", "South Korea": "L" },
  XL: { Europe: "XL", Italy: "XL", "United Kingdom": "XL", USA: "XL", Mexico: "EG", China: "190/108A", "South Korea": "XL" },
  XXL: { Europe: "XXL", Italy: "XXL", "United Kingdom": "XXL", USA: "XXL", Mexico: "EEG", China: "190/112A", "South Korea": "XXL" },
}

const CM_PER_INCH = 2.54

/** Formats a stored centimetre value for display in the requested unit. */
export const formatMeasurement = (cm: number, unit: MeasurementUnit): string => {
  const value = unit === "cm" ? cm : cm / CM_PER_INCH
  // One decimal, but no trailing ".0" -- matches how size charts are written.
  const rounded = Math.round(value * 100) / 100
  const shown = unit === "cm" ? Math.round(rounded * 10) / 10 : Math.round(rounded * 100) / 100
  return `${shown} ${unit}`
}

/**
 * The three sizes shown side by side: the selected one and its neighbours.
 *
 * Shoppers compare against the next size up or down far more often than they
 * read the whole grid, so the table is a sliding window rather than every size
 * at once. At either end the window shifts instead of shrinking.
 */
export const sizeWindow = (sizes: string[], selected: string): string[] => {
  if (sizes.length <= 3) return sizes
  const i = Math.max(0, sizes.indexOf(selected))
  const start = Math.min(Math.max(i - 1, 0), sizes.length - 3)
  return sizes.slice(start, start + 3)
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const parseTable = (raw: unknown): MeasurementTable => {
  const out: MeasurementTable = {}
  if (!raw || typeof raw !== "object") return out
  for (const [rowKey, bySize] of Object.entries(raw as Record<string, unknown>)) {
    if (!bySize || typeof bySize !== "object") continue
    const row: Record<string, number> = {}
    for (const [size, value] of Object.entries(bySize as Record<string, unknown>)) {
      const n = toNumber(value)
      if (n !== null) row[size] = n
    }
    if (Object.keys(row).length) out[rowKey] = row
  }
  return out
}

/**
 * Reads measurements off product metadata, tolerating anything malformed.
 *
 * Metadata is free-form and hand-edited, so this never throws: a bad blob simply
 * means no panel. Returns null when there is nothing worth showing.
 */
export const parseMeasurements = (
  metadata: Record<string, unknown> | null | undefined
): ProductMeasurements | null => {
  const raw = metadata?.measurements
  if (!raw) return null

  let data: any = raw
  // Some admin paths store metadata values as strings.
  if (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (!data || typeof data !== "object") return null

  const article = parseTable(data.article)
  const body = parseTable(data.body)
  if (!Object.keys(article).length && !Object.keys(body).length) return null

  const sizes: string[] = Array.isArray(data.sizes)
    ? data.sizes.filter((s: unknown) => typeof s === "string" && s.trim() !== "")
    : []

  // Fall back to whatever sizes the stored rows actually mention, so a blob
  // written without an explicit size list still renders.
  const fromRows = new Set<string>()
  for (const table of [article, body]) {
    for (const row of Object.values(table)) {
      Object.keys(row).forEach((s) => fromRows.add(s))
    }
  }
  const resolvedSizes = sizes.length ? sizes.filter((s) => fromRows.has(s)) : [...fromRows]
  if (!resolvedSizes.length) return null

  return {
    garmentType: typeof data.garment_type === "string" ? data.garment_type : "top",
    sizes: resolvedSizes,
    article,
    body,
  }
}
