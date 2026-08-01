import { HttpTypes } from "@medusajs/types"
import { getVariantCards, VariantCard } from "./variant-cards"

/**
 * A colourway tile plus the product slice it renders from.
 *
 * Listing grids are client components, so every product handed to them is
 * serialised into the page as RSC flight data. Passing the products straight
 * through shipped the whole `medium` tier -- every variant, every variant's
 * price object, every variant's metadata, and timestamps on all of it -- to
 * render a thumbnail, a title and one price. On a category page that was 465KB
 * of payload for 12 products (74% of a 917KB document), and serialising it is
 * CPU work the server pays on every request.
 *
 * `toProductCards` moves the colourway split to the server and hands the client
 * only the fields the tile reads, which measured 11x smaller on the same data.
 */
export type ProductCard = {
  card: VariantCard
  /**
   * Deliberately a trimmed `StoreProduct` rather than a bespoke view model:
   * `ProductPreview` and the wishlist entry it writes keep their existing
   * shape, so only the volume of data changes, not any component's contract.
   */
  product: HttpTypes.StoreProduct
}

/** The hover bar lists sizes; no other option is rendered on a tile. */
const isSizeOption = (option: any): boolean =>
  /^sizes?$/i.test((option?.title ?? "").trim())

/**
 * Keeps only what `ProductPreview` actually reads: handle/title/thumbnail for
 * the link and heading, images for the carousel, the size option for the hover
 * bar, and one priced variant per colourway.
 *
 * Every tile of a product shares this one object so React's flight serialiser
 * writes it once and references it thereafter -- building a separate slice per
 * card would serialise the image list once per colourway instead of once per
 * product, costing more than it saved.
 */
const trimToCardFields = (
  product: HttpTypes.StoreProduct,
  cards: VariantCard[]
): HttpTypes.StoreProduct => {
  const cardVariantIds = new Set(cards.map((c) => c.variantId).filter(Boolean))
  const sizeOption = (product.options ?? []).find(isSizeOption)

  const variants = ((product.variants ?? []) as any[])
    .filter((v) => cardVariantIds.has(v.id))
    .map((v) => ({
      id: v.id,
      // Only the fields getPricesForVariant reads.
      calculated_price: v.calculated_price && {
        calculated_amount: v.calculated_price.calculated_amount,
        original_amount: v.calculated_price.original_amount,
        currency_code: v.calculated_price.currency_code,
        calculated_price: {
          price_list_type: v.calculated_price.calculated_price?.price_list_type,
        },
      },
    }))

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    thumbnail: product.thumbnail,
    images: (product.images ?? []).map((i: any) => ({ url: i.url })),
    options: sizeOption
      ? [
          {
            title: sizeOption.title,
            values: (sizeOption.values ?? []).map((v: any) => ({
              value: v.value,
            })),
          },
        ]
      : [],
    variants,
    // A structurally partial product: the cast is the point of this module, and
    // is safe only because the fields above are exactly the ones a tile reads.
  } as unknown as HttpTypes.StoreProduct
}

/**
 * Splits products into one tile per colourway, each paired with the trimmed
 * slice that tile renders from.
 *
 * Must run on the server -- doing the split in the browser is what forced the
 * full variant list to be shipped in the first place.
 */
export function toProductCards(
  products: HttpTypes.StoreProduct[]
): ProductCard[] {
  return products.flatMap((product) => {
    const cards = getVariantCards(product)
    const trimmed = trimToCardFields(product, cards)
    return cards.map((card) => ({ card, product: trimmed }))
  })
}
