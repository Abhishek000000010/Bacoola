import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import {
  EMPTY_FILTERS,
  FilterState,
  hasActiveFilters,
} from "@lib/util/product-filters"
import FilteredCategoryProducts from "./FilteredCategoryProducts"

// Import unified architecture components
import LandingRenderer from "@modules/home/components/landing-renderer"
import CategoryProductListing from "./CategoryProductListing"
import SubcategorySlider from "../components/subcategory-slider"

import { getLandingSections } from "@lib/data/landing-pages"
import { listCategories } from "@lib/data/categories"

const EDITORIAL_CATEGORIES = ["women", "men", "kids", "teen", "home"]

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  filters,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  filters?: FilterState
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const activeFilters = filters ?? EMPTY_FILTERS

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

  // Collect category IDs from this category, its descendants, and matching equivalent categories by name
  const allCategories = await listCategories({ limit: 500 }).catch(() => [])

  const targetName = category.name?.toLowerCase().trim()
  const allCategoryIds: string[] = []

  const collectIds = (cat: HttpTypes.StoreProductCategory) => {
    if (cat?.id && !allCategoryIds.includes(cat.id)) {
      allCategoryIds.push(cat.id)
    }
    if (cat?.category_children) {
      cat.category_children.forEach(collectIds)
    }
  }
  collectIds(category)

  // Fallback: match any categories in the store with identical category names (e.g. Sale vs Clothing categories)
  if (targetName && allCategories.length > 0) {
    allCategories.forEach((cat: any) => {
      const catName = cat.name?.toLowerCase().trim()
      if (catName === targetName) {
        collectIds(cat)
      }
    })
  }

  // Filtering is per colourway, which the store API cannot express, so it needs
  // the whole category loaded. Only take that cost when a filter is actually
  // set -- an unfiltered page still fetches just the 12 products it shows.
  const productGrid = (
    <Suspense fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} />}>
      {hasActiveFilters(activeFilters) ? (
        <FilteredCategoryProducts
          categoryIds={allCategoryIds}
          countryCode={countryCode}
          filters={activeFilters}
          sortBy={sort}
        />
      ) : (
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={allCategoryIds}
          countryCode={countryCode}
          optionValueIds={optionValueIds}
        />
      )}
    </Suspense>
  )

  // Render unified Product Listing Page (Page 2 Layout) for all category pages
  return (
    <CategoryProductListing
      category={category}
      parents={parents}
      categoryIds={allCategoryIds}
      countryCode={countryCode}
      sortBy={sort}
    >
      {productGrid}
    </CategoryProductListing>
  )
}
