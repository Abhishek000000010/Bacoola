import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { getVariantCards } from "@lib/util/variant-cards"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  optionValueIds,
  grid = "4",
  q,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string | string[]
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
  grid?: string
  q?: string
}) {
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

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    optionValueIds,
    tier: "medium",
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  let gridClasses = "grid-cols-2 small:grid-cols-3 medium:grid-cols-4";
  if (grid === "2") {
    gridClasses = "grid-cols-1 small:grid-cols-2";
  } else if (grid === "6") {
    gridClasses = "grid-cols-3 small:grid-cols-4 medium:grid-cols-6";
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
    <>
      <ul
        className={`grid ${gridClasses} w-full gap-x-[2px] gap-y-8 bg-white`}
        data-testid="products-list"
      >
        {/*
          One tile per colourway rather than per product. Note this makes the
          number of tiles per page vary, since paging is still counted in
          products -- a 12-product page of two-colour shirts renders 24 tiles.
        */}
        {products.flatMap((p) =>
          getVariantCards(p).map((card) => (
            <li key={card.key}>
              <ProductPreview product={p} region={region} card={card} />
            </li>
          ))
        )}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
