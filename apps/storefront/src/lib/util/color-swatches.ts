import { HttpTypes } from "@medusajs/types"
import { getVariantCards } from "./variant-cards"

/**
 * A single colourway rendered as a clickable square on a product card.
 * `image` is the photo the card should switch to when the square is clicked.
 */
export type ColorSwatch = {
  key: string
  variantId?: string
  label: string
  /** CSS colour used to paint the square. */
  color: string
  image?: string | null
  href: string
}

/**
 * Best-effort colour-name -> CSS colour. Product colour options are free text
 * ("blueee", "Navy", "off white"), so this normalises and looks up known names,
 * falling back to a neutral grey for anything unrecognised.
 */
const COLOR_MAP: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  offwhite: "#f2efe9",
  ivory: "#fffff0",
  cream: "#f5f0e1",
  beige: "#e5ddc8",
  grey: "#9ca3af",
  gray: "#9ca3af",
  charcoal: "#36454f",
  silver: "#c0c0c0",
  red: "#d32f2f",
  maroon: "#800000",
  burgundy: "#800020",
  pink: "#f48fb1",
  rose: "#e91e63",
  orange: "#fb8c00",
  peach: "#ffcc99",
  yellow: "#fdd835",
  mustard: "#e1ad01",
  gold: "#d4af37",
  green: "#388e3c",
  olive: "#808000",
  khaki: "#c3b091",
  teal: "#008080",
  mint: "#98ff98",
  blue: "#1e88e5",
  navy: "#1a237e",
  skyblue: "#87ceeb",
  sky: "#87ceeb",
  denim: "#1560bd",
  purple: "#8e24aa",
  violet: "#7c4dff",
  lavender: "#b57edc",
  brown: "#795548",
  tan: "#d2b48c",
  camel: "#c19a6b",
  coffee: "#6f4e37",
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

/** Resolve a free-text colour name to a CSS colour. */
export function resolveColor(label: string): string {
  const key = normalise(label)
  if (COLOR_MAP[key]) return COLOR_MAP[key]

  // Loose contains-match so "light blue" or "navy blue" still land on a colour.
  for (const name of Object.keys(COLOR_MAP)) {
    if (key.includes(name)) return COLOR_MAP[name]
  }

  return "#d1d5db"
}

/**
 * The colour squares to show on a product card: one per colourway, each with
 * the image the card should switch to on click. Reuses `getVariantCards` so the
 * label/image assignment stays consistent with the per-colour listing tiles.
 */
export function getColorSwatches(product: HttpTypes.StoreProduct): ColorSwatch[] {
  return getVariantCards(product)
    .filter((card) => !!card.label)
    .map((card) => ({
      key: card.key,
      variantId: card.variantId,
      label: card.label as string,
      color: resolveColor(card.label as string),
      image: card.thumbnail,
      href: card.href,
    }))
}
