import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

// Import modular reusable landing components and configuration
import HeroBanner from "../components/HeroBanner"
import EditorialGrid from "../components/EditorialGrid"
import { categoryEditorialConfigs } from "../components/landing-configs"
import CategoryProductListing from "./CategoryProductListing"

export default function CategoryTemplate({
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

  // Verify if we should render an Editorial Landing Page (only for women, men, teen, kids)
  const editorialConfig = categoryEditorialConfigs[category.handle]

  if (editorialConfig) {
    return (
      <div className="relative w-full flex flex-col bg-neutral-900">
        
        {/* 1. Fullscreen Editorial Hero Banner Component */}
        <HeroBanner
          title={editorialConfig.heroTitle}
          image={editorialConfig.heroImage}
          ctaText={editorialConfig.heroCta}
          ctaHref={`/products/${category.handle}`}
        />

        {/* 2. Alternating Editorial Campaign Grids Components */}
        {editorialConfig.grid.map((row, index) => (
          <EditorialGrid
            key={index}
            leftTitle={row.leftTitle}
            leftImage={row.leftImage}
            leftHref={`/categories/${category.handle}/${row.leftSlug}`}
            leftSpan={row.leftSpan}
            rightTitle={row.rightTitle}
            rightImage={row.rightImage}
            rightHref={`/categories/${category.handle}/${row.rightSlug}`}
            rightSpan={row.rightSpan}
          />
        ))}
      </div>
    )
  }

  // Fallback to normal Product Listing Page (PLP) for subcategories
  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
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

  return (
    <CategoryProductListing category={category} parents={parents}>
      <Suspense
        fallback={
          <SkeletonProductGrid
            numberOfProducts={category.products?.length ?? 8}
          />
        }
      >
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={allCategoryIds}
          countryCode={countryCode}
          optionValueIds={optionValueIds}
        />
      </Suspense>
    </CategoryProductListing>
  )
}
