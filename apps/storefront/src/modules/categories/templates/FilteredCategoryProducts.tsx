import { getRegion } from "@lib/data/regions"
import { listAllCategoryProducts } from "@lib/data/category-facets"
import {
  cardMatches,
  FilterState,
  getCardFacets,
} from "@lib/util/product-filters"
import { getVariantCards } from "@lib/util/variant-cards"
import ProductPreview from "@modules/products/components/product-preview"
import { FadeIn } from "@modules/common/components/fade-in"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/**
 * The category grid while filters are active.
 *
 * Filtering is per colourway, and the store API can only filter per product, so
 * the category has to be pulled in full and narrowed here. That is the same
 * trade the price sort already makes. When no filter is set the caller uses the
 * ordinary infinite-scroll path instead, so this cost is only paid on demand.
 *
 * The whole filtered set is already resolved here, so it renders as one
 * continuous grid rather than numbered pages -- each tile fades in as it scrolls
 * into view, matching the unfiltered listing.
 */

export default async function FilteredCategoryProducts({
  categoryIds,
  countryCode,
  filters,
  sortBy,
  q,
}: {
  categoryIds: string[]
  countryCode: string
  filters: FilterState
  sortBy?: SortOptions
  /** Optional free-text search so this backs the search page as well. */
  q?: string
}) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const products = await listAllCategoryProducts({ categoryIds, countryCode, q })

  const matched: {
    productIndex: number
    cardIndex: number
    price: number | null
  }[] = []

  products.forEach((product, productIndex) => {
    const facets = getCardFacets(product)
    facets.forEach((facet, cardIndex) => {
      if (!cardMatches(facet, filters)) return
      matched.push({ productIndex, cardIndex, price: facet.price })
    })
  })

  if (sortBy === "price_asc" || sortBy === "price_desc") {
    const dir = sortBy === "price_asc" ? 1 : -1
    matched.sort((a, b) => {
      // Cards with no price sink to the bottom either way.
      if (a.price == null) return 1
      if (b.price == null) return -1
      return (a.price - b.price) * dir
    })
  }

  if (!matched.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 px-4 text-center">
        <h3 className="text-2xl font-medium text-neutral-900 tracking-tight mb-3">
          No products match these filters
        </h3>
        <p className="text-neutral-500 max-w-md mx-auto text-sm">
          Try removing a filter or widening the price range.
        </p>
      </div>
    )
  }

  return (
    <ul
      className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 w-full gap-x-[2px] gap-y-8 bg-white"
      data-testid="products-list"
    >
      {matched.map(({ productIndex, cardIndex }) => {
        const product = products[productIndex]
        const card = getVariantCards(product)[cardIndex]
        if (!card) return null
        return (
          <li key={card.key}>
            <FadeIn randomize={true}>
              <ProductPreview product={product} region={region} card={card} />
            </FadeIn>
          </li>
        )
      })}
    </ul>
  )
}
