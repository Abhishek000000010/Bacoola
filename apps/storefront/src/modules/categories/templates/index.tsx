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

import { getLandingSections } from "@lib/data/landing-pages"

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

  // Verify if we should render an Editorial Landing Page (only for women, men, teen, kids)
  const editorialConfig = categoryEditorialConfigs[category.handle]

  if (editorialConfig) {
    // Fetch dynamic CMS data for this page
    const cmsSections = await getLandingSections(category.handle)

    // Helper to find CMS section by layout_type
    const getCmsSection = (layoutType: string) =>
      cmsSections.find((s) => s.layout_type === layoutType)

    const heroSection = getCmsSection("hero_slider")
    const splitSection =
      getCmsSection("split_banner") || getCmsSection("editorial_banner")

    // Merge Hero Data
    const heroItem = heroSection?.items?.[0]
    const heroTitle = heroItem?.title || editorialConfig.heroTitle
    const heroImage = heroItem?.desktop_image || editorialConfig.heroImage
    const heroCta = heroItem?.button_text || editorialConfig.heroCta
    const heroHref = heroItem?.button_link || `/products/${category.handle}`
    const heroImagePosition = heroItem?.image_position || "center center"

    return (
      <div className="relative w-full flex flex-col bg-neutral-900">

        {/* 1. Fullscreen Editorial Hero Banner Component */}
        <HeroBanner
          title={heroTitle}
          image={heroImage}
          ctaText={heroCta}
          ctaHref={heroHref}
          imagePosition={heroImagePosition}
        />

        {/* 2. Alternating Editorial Campaign Grids Components */}
        {editorialConfig.grid.map((row, index) => {
          // Find CMS items for this row (2 items per row)
          const cmsLeft = splitSection?.items?.[index * 2]
          const cmsRight = splitSection?.items?.[index * 2 + 1]

          return (
            <EditorialGrid
              key={index}
              leftTitle={cmsLeft?.title || row.leftTitle}
              leftImage={cmsLeft?.desktop_image || row.leftImage}
              leftHref={cmsLeft?.button_link || `/categories/${category.handle}/${row.leftSlug}`}
              leftSpan={row.leftSpan}
              leftImagePosition={cmsLeft?.image_position || "center center"}
              rightTitle={cmsRight?.title || row.rightTitle}
              rightImage={cmsRight?.desktop_image || row.rightImage}
              rightHref={cmsRight?.button_link || `/categories/${category.handle}/${row.rightSlug}`}
              rightSpan={row.rightSpan}
              rightImagePosition={cmsRight?.image_position || "center center"}
            />
          )
        })}
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
