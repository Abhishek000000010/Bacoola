/**
 * Product details: the "DETAILS, COMPOSITION AND CARE" panel on the PDP.
 *
 * Same split as measurements (see ./measurements.ts): the per-product facts
 * (what it's made of, where it was made, how to wash it) come from
 * `product.metadata.details`, while the care-symbol vocabulary and the whole
 * deliveries/returns tab are store-wide and defined here.
 */

export type ProductDetails = {
  /** Supplier/style reference shown under the heading. */
  ref?: string
  composition: string[]
  origin: { label: string; value: string }[]
  /** Care codes, resolved against CARE_CODES below. */
  care: string[]
}

export type CareCode = {
  id: string
  label: string
  /** Minimal line-art symbol, drawn in a 24x24 viewBox. */
  icon: React.ReactNode
}

/**
 * DELIVERIES AND RETURNS content.
 *
 * Store-wide policy, not product data -- edit here rather than per product.
 * The prices are display copy only; actual charges come from the shipping
 * options configured in Medusa, so keep the two in sync by hand.
 */
export const DELIVERY_OPTIONS: {
  name: string
  time: string
  price: string
  note?: string
}[] = [
  {
    name: "Home delivery",
    time: "4 to 7 working days",
    price: "Rs. 99.00",
    note: "Free on orders over Rs. 2,000",
  },
]

export const RETURN_POLICY = {
  windowDays: 30,
  methods: [{ name: "Home pick-up", price: "Free" }],
  notes: [
    "For reasons of hygiene, sealed products such as innerwear and swimwear that do not have the label or protective seal attached cannot be returned.",
    "Items must be returned unworn and unwashed, with all original tags attached.",
  ],
}

/**
 * Standard textile care symbols.
 *
 * Keyed and additive: the admin ticks the ones that apply and the ids are what
 * gets stored, so the wording here can change without touching saved products.
 */
export const CARE_CODES: { id: string; label: string }[] = [
  { id: "wash_30", label: "Machine washing max 30°C / 85°F short spin dry" },
  { id: "wash_40", label: "Machine washing max 40°C / 105°F" },
  { id: "hand_wash", label: "Hand wash only" },
  { id: "do_not_wash", label: "Do not wash" },
  { id: "do_not_bleach", label: "Do not bleach" },
  { id: "iron_110", label: "Ironing max 110°C / 230°F" },
  { id: "iron_150", label: "Ironing max 150°C / 300°F" },
  { id: "do_not_iron", label: "Do not iron" },
  { id: "dry_clean_p", label: "Dry cleaning perchloroethylene" },
  { id: "do_not_dry_clean", label: "Do not dry clean" },
  { id: "tumble_dry_low", label: "Tumble dry low" },
  { id: "do_not_tumble_dry", label: "Do not tumble dry" },
]

export const careLabel = (id: string) =>
  CARE_CODES.find((c) => c.id === id)?.label ?? id

/** Which symbol family a code belongs to, so the panel can pick an icon. */
export const careIconKind = (
  id: string
): "wash" | "bleach" | "iron" | "dryclean" | "tumble" => {
  if (id.startsWith("wash") || id === "hand_wash" || id === "do_not_wash") return "wash"
  if (id.includes("bleach")) return "bleach"
  if (id.includes("iron")) return "iron"
  if (id.includes("dry_clean")) return "dryclean"
  return "tumble"
}

export const isProhibition = (id: string) => id.startsWith("do_not_")

const asStringArray = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string" && v.trim() !== "")
    : []

/**
 * Reads details off product metadata, tolerating anything malformed.
 *
 * Returns null when there is nothing worth showing, so the PDP can hide the
 * trigger entirely rather than opening an empty panel.
 */
export const parseProductDetails = (
  metadata: Record<string, unknown> | null | undefined
): ProductDetails | null => {
  if (!metadata) return null

  let data: any = metadata.details
  if (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      data = null
    }
  }
  data = data && typeof data === "object" ? data : {}

  const composition = asStringArray(data.composition)
  const care = asStringArray(data.care)
  const origin = Array.isArray(data.origin)
    ? data.origin
        .filter((o: any) => o && typeof o.label === "string" && typeof o.value === "string")
        .filter((o: any) => o.value.trim() !== "")
    : []

  // The Mango import already stores a style id; reuse it as the reference so
  // most products get a REF without anyone typing one.
  const ref =
    typeof data.ref === "string" && data.ref.trim() !== ""
      ? data.ref
      : typeof metadata.style_id === "string"
      ? metadata.style_id
      : undefined

  if (!composition.length && !care.length && !origin.length) return null

  return { ref, composition, origin, care }
}
