import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import InfiniteProducts from "@modules/store/components/infinite-products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  optionValueIds,
  grid = "4",
  q,
}: {
  sortBy?: SortOptions
  /**
   * Kept for backwards compatibility with callers that still pass a URL page.
   * The grid now scrolls continuously and always starts from the first page.
   */
  page?: number
  collectionId?: string
  categoryId?: string | string[]
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
  grid?: string
  q?: string
}) {
  const sort = sortBy || "created_at"

  const queryParams: PaginatedProductsParams & { q?: string } = {
    limit: 12,
  }

  if (q) {
    queryParams["q"] = q
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = Array.isArray(categoryId) ? categoryId : [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sort === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Page one is fetched on the server so the listing is present in the initial
  // HTML (SEO + no layout shift); InfiniteProducts takes over from there.
  const {
    response: { products },
    nextPage,
  } = await listProductsWithSort({
    page: 1,
    queryParams,
    sortBy: sort,
    countryCode,
    optionValueIds,
    tier: "medium",
  })

  // Mirrors the client toggle in CategoryProductListing / search: 2 / 4 / 6, with
  // the 6-up view stripped down to thumbnails only and a tight 2px row gap.
  let gridClasses = "grid-cols-2 small:grid-cols-3 medium:grid-cols-4";
  if (grid === "2") {
    gridClasses = "grid-cols-2";
  } else if (grid === "6") {
    gridClasses =
      "grid-cols-3 small:grid-cols-4 medium:grid-cols-6 !gap-y-[2px] [&_.pp-d-details]:!hidden [&_.pp-m-details]:!hidden [&_.pp-plus]:!hidden";
  }

  if (products.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 mb-6 text-neutral-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-2xl font-medium text-neutral-900 tracking-tight mb-3">No products found</h3>
        <p className="text-neutral-500 max-w-md mx-auto text-sm">
          We couldn't find any products in this category. Check back later or explore our other collections.
        </p>
      </div>
    )
  }

  return (
    <InfiniteProducts
      // Re-fetching for a new sort/filter changes this key, so the client grid
      // remounts with the fresh first page instead of appending onto the old one.
      key={JSON.stringify({ sort, collectionId, categoryId, productsIds, optionValueIds, q })}
      initialProducts={products}
      initialNextPage={nextPage}
      region={region}
      gridClasses={gridClasses}
      loadParams={{
        sortBy: sort,
        collectionId,
        categoryId,
        productsIds,
        countryCode,
        optionValueIds,
        q,
      }}
    />
  )
}
