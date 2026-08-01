"use server"

import { HttpTypes } from "@medusajs/types"

import { listProducts } from "./products"
import {
  buildFacetIndex,
  CardFacet,
  FacetIndex,
  getCardFacets,
} from "@lib/util/product-filters"

/**
 * Facet data for a category's filter drawer.
 *
 * Deliberately a server action rather than something the category page always
 * renders: computing facets needs every product in the category, and pulling
 * ~100 products costs several seconds against a page that otherwise only needs
 * the 12 being shown. The drawer calls this the first time it opens, so an
 * unfiltered category page stays as fast as it was.
 *
 * The payload is one small record per grid card, which is what lets the drawer
 * recompute "SHOW N ITEMS" instantly as filters are toggled instead of making
 * a round trip per click.
 */

/** Ceiling on how much of a category we will pull to build facets. */
const FACET_PRODUCT_LIMIT = 200

export async function getCategoryFacets({
  categoryIds,
  countryCode,
  q,
}: {
  categoryIds: string[]
  countryCode: string
  /** When set, facets are computed over the search results instead of (or in
      addition to) a category — used by the search page's filter drawer. */
  q?: string
}): Promise<{ facetIndex: FacetIndex; facets: CardFacet[] }> {
  const empty = {
    facetIndex: {
      colors: [],
      sizes: [],
      priceMin: null,
      priceMax: null,
      totalCards: 0,
    },
    facets: [],
  }

  if ((!categoryIds?.length && !q) || !countryCode) {
    return empty
  }

  try {
    const products = await listAllCategoryProducts({
      categoryIds,
      countryCode,
      q,
      tier: "facet",
    })
    const facets = products.flatMap((p) => getCardFacets(p))
    return { facetIndex: buildFacetIndex(facets), facets }
  } catch {
    // A failed facet load should leave the grid working, just unfiltered.
    return empty
  }
}

/**
 * Every product in a category, paged out to FACET_PRODUCT_LIMIT.
 *
 * Ordered by -id for the same reason the rest of the listing code is: bulk
 * imports share a created_at, so that ordering is unstable across offset pages
 * and would duplicate some products while dropping others.
 */
export async function listAllCategoryProducts({
  categoryIds,
  countryCode,
  q,
  tier = "medium",
}: {
  categoryIds: string[]
  countryCode: string
  /** Optional free-text search, so this can back the search page too. */
  q?: string
  /** "facet" pulls a far lighter payload — enough to build filters, not to
      render the grid. Defaults to "medium" for the actual product grid. */
  tier?: "medium" | "facet"
}): Promise<HttpTypes.StoreProduct[]> {
  const PAGE = 100

  const buildQuery = (page: number) => {
    const query: any = { limit: PAGE, order: "-id" }
    if (categoryIds?.length) query.category_id = categoryIds
    if (q) query.q = q
    return { pageParam: page, countryCode, tier, queryParams: query }
  }

  const first = await listProducts(buildQuery(1))

  const count = first.response.count
  let products = first.response.products

  const target = Math.min(count, FACET_PRODUCT_LIMIT)
  if (target > PAGE) {
    const pages: number[] = []
    for (let p = 2; p <= Math.ceil(target / PAGE); p++) pages.push(p)

    const rest = await Promise.all(pages.map((p) => listProducts(buildQuery(p))))
    products = products.concat(...rest.map((r) => r.response.products))
  }

  return products
}
