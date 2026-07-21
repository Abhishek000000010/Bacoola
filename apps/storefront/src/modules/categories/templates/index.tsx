import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

// Import unified architecture components
import LandingRenderer from "@modules/home/components/landing-renderer"
import CategoryProductListing from "./CategoryProductListing"

import { getLandingSections } from "@lib/data/landing-pages"

const EDITORIAL_CATEGORIES = ["women", "men", "kids", "teen", "home"]

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  // Collect parents
  const parents = [] as HttpTypes.StoreProductCategory[]
  const getParents = (cat: HttpTypes.StoreProductCategory) => {
    if (cat.parent_category) {
      parents.push(cat.parent_category)
      getParents(cat.parent_category)
    }
  }
  getParents(category)

  // Collect this category and all descendant IDs so we fetch products from all subcategories
  const allCategoryIds: string[] = []
  const collectIds = (cat: HttpTypes.StoreProductCategory) => {
    allCategoryIds.push(cat.id)
    if (cat.category_children) {
      cat.category_children.forEach(collectIds)
    }
  }
  collectIds(category)

  const productGrid = (
    <Suspense fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} />}>
      <PaginatedProducts
        sortBy={sort}
        page={pageNumber}
        categoryId={allCategoryIds}
        countryCode={countryCode}
        optionValueIds={optionValueIds}
      />
    </Suspense>
  )

  // Unified Architecture for Landing Pages
  if (EDITORIAL_CATEGORIES.includes(category.handle)) {
    const cmsSections = await getLandingSections(category.handle)
    return (
      <div className="relative w-full flex flex-col bg-neutral-900">
        <LandingRenderer sections={cmsSections || []} pageName={category.handle} />
        
        {/* Render product grid below editorial flow */}
        <div className="w-full bg-white">
          <div className="content-container py-12 md:py-24">
            <div className="flex flex-col gap-8">
              <h2 className="text-3xl font-medium tracking-tight uppercase border-b pb-4 border-neutral-200 text-neutral-900">
                Shop {category.name}
              </h2>
              {productGrid}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback to normal Product Listing Page (PLP) for subcategories
  return (
    <CategoryProductListing category={category} parents={parents}>
      {productGrid}
    </CategoryProductListing>
  )
}
