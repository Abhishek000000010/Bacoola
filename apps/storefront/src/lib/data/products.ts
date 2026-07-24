"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { cache } from "react"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

const PRODUCT_FETCH_TIERS = {
  light: "id,title,description,thumbnail,handle",
  // Listing tier. Variant titles/options/metadata are needed to split each
  // product into one card per colourway; without them every card falls back to
  // the bare product title. Kept to these fields rather than `*variants` so the
  // payload stays close to what it was.
  medium:
    "id,title,handle,thumbnail,*images,*variants.calculated_price,*options,variants.title,*variants.options,variants.metadata",
  full: "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags,",
}

type FetchTier = keyof typeof PRODUCT_FETCH_TIERS;

// Sorts the store API can't express, so they're applied after fetching.
const PRICE_SORTS: SortOptions[] = ["price_asc", "price_desc"]

// How many products to pull per request when a price sort forces us to load
// the full result set, and the ceiling on how much of it we'll load.
const PRICE_SORT_PAGE_SIZE = 100
const MAX_PRICE_SORT_PRODUCTS = 1000

export const listProducts = cache(async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  tier = "full",
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
  tier?: FetchTier
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields: PRODUCT_FETCH_TIERS[tier],
          ...queryParams,
        },
        headers,
        next,
      }
    )
    .then(({ products, count }: any) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
})

/**
 * Gets one product by ID, with full pricing and variants.
 */
export const retrievePricedProductById = cache(async ({
  id,
  regionId,
}: {
  id: string
  regionId: string
}) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions(["products", id].join("-"))),
  }

  return sdk.client
    .fetch<{ product: HttpTypes.StoreProduct }>(`/store/products/${id}`, {
      method: "GET",
      query: {
        region_id: regionId,
        fields: PRODUCT_FETCH_TIERS.full,
      },
      headers,
      next,
    })
    .then(({ product }: { product: HttpTypes.StoreProduct }) => product)
})

/**
 * This will fetch products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = cache(async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
  tier = "medium",
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
  tier?: FetchTier
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const _page = Math.max(page, 1)
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const baseQuery = {
    ...queryParams,
    ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
  }

  // "Latest arrivals" maps onto a backend order, so the store API can do the
  // sorting and the pagination for us and we only fetch the page being shown.
  //
  // Ordering by -id rather than -created_at: bulk-imported products share an
  // identical created_at, which makes that ordering unstable, so offset paging
  // returns duplicates on one page and drops products entirely from another.
  // Product ids are ULIDs whose prefix encodes creation time, so -id gives the
  // same newest-first order with unique, deterministic tie-breaking. The store
  // API rejects multi-field ordering, so a secondary sort key isn't an option.
  if (!PRICE_SORTS.includes(sortBy)) {
    const {
      response: { products, count },
    } = await listProducts({
      pageParam: _page,
      queryParams: { ...baseQuery, limit, order: "-id" },
      countryCode,
      tier,
    })

    return {
      response: { products, count },
      nextPage: count > _page * limit ? _page + 1 : null,
      queryParams,
    }
  }

  // The store API can't order by calculated_price, so price sorts have to be
  // applied across the whole result set before it can be sliced into pages.
  // Page one is fetched first to learn the real total, then the remaining
  // pages are fetched in parallel rather than in a waterfall. The stable -id
  // order matters here too: these offset pages get concatenated, so an
  // unstable order would duplicate and drop products before sorting.
  const first = await listProducts({
    pageParam: 1,
    queryParams: { ...baseQuery, limit: PRICE_SORT_PAGE_SIZE, order: "-id" },
    countryCode,
    tier,
  })

  const count = first.response.count
  let allProducts = first.response.products

  const fetchTotal = Math.min(count, MAX_PRICE_SORT_PRODUCTS)

  if (fetchTotal > PRICE_SORT_PAGE_SIZE) {
    const remainingPages: number[] = []
    for (
      let p = 2;
      p <= Math.ceil(fetchTotal / PRICE_SORT_PAGE_SIZE);
      p++
    ) {
      remainingPages.push(p)
    }

    const rest = await Promise.all(
      remainingPages.map((p) =>
        listProducts({
          pageParam: p,
          queryParams: { ...baseQuery, limit: PRICE_SORT_PAGE_SIZE, order: "-id" },
          countryCode,
          tier,
        })
      )
    )

    allProducts = allProducts.concat(
      ...rest.map((r) => r.response.products)
    )
  }

  const sortedProducts = sortProducts(allProducts, sortBy)

  const offset = (_page - 1) * limit
  const paginatedProducts = sortedProducts.slice(offset, offset + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage: count > _page * limit ? _page + 1 : null,
    queryParams,
  }
})
