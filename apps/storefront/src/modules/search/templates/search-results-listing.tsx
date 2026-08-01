"use client"

import React, { useEffect, useRef, useState } from "react"

import { getCategoryFacets } from "@lib/data/category-facets"
import { CardFacet, FacetIndex } from "@lib/util/product-filters"
import CategoryFilterDrawer from "@modules/categories/components/category-filter-drawer"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import SearchCategoryBar, {
  SearchCategoryOption,
} from "../components/search-category-bar"

interface SearchResultsListingProps {
  countryCode: string
  query: string
  categories: SearchCategoryOption[]
  activeHandle?: string
  /** Category ids in scope for facets (empty when "All" is selected). */
  categoryIds: string[]
  sortBy?: SortOptions
  children: React.ReactNode
}

export default function SearchResultsListing({
  countryCode,
  query,
  categories,
  activeHandle,
  categoryIds,
  sortBy = "created_at",
  children,
}: SearchResultsListingProps) {
  const [cols, setCols] = useState<2 | 4 | 6>(4)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [facetData, setFacetData] = useState<{
    facetIndex: FacetIndex
    facets: CardFacet[]
  } | null>(null)

  // Facets cover the current search scope (query + selected category). They are
  // pulled the first time the drawer opens rather than on load.
  const facetsRequested = useRef(false)

  // A stable string key for the scope; depending on the categoryIds array
  // directly would give the fetch effect a new identity every render and let a
  // re-run cancel the in-flight request before it could store its result.
  const scopeKey = `${query}::${categoryIds.join(",")}`

  // Reset the cached facets whenever the scope changes.
  useEffect(() => {
    facetsRequested.current = false
    setFacetData(null)
  }, [scopeKey])

  // Prefetch facets as soon as the results render (in the background), so the
  // FILTER AND ORDER drawer opens instantly instead of loading on click.
  useEffect(() => {
    if (facetsRequested.current || !countryCode) return

    facetsRequested.current = true
    let cancelled = false

    getCategoryFacets({ categoryIds, countryCode, q: query })
      .then((data) => {
        if (!cancelled) setFacetData(data)
      })
      .catch(() => {
        facetsRequested.current = false
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, countryCode])

  return (
    <div className="relative w-full min-h-screen bg-white text-black font-sans pb-16 overflow-x-hidden">
      {/* Main category selector */}
      <div className="w-full pt-6">
        <SearchCategoryBar
          countryCode={countryCode}
          categories={categories}
          activeHandle={activeHandle}
          query={query}
        />
      </div>

      {/* Control bar: FILTER AND ORDER + column layout toggles */}
      <div className="w-full pt-4 md:pt-6 pb-2 px-4 sm:px-12 flex justify-between items-center select-none bg-white">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="text-[12px] lg:text-[14px] leading-none font-bold uppercase tracking-wider text-black hover:text-neutral-500 transition-colors duration-200"
        >
          FILTER AND ORDER
        </button>

        {/* 2, 4, or 6 Column Layout controls */}
        <div className="flex gap-x-3 items-center">
          <button
            onClick={() => setCols(2)}
            className={`p-1.5 focus:outline-none flex flex-col items-center transition-colors duration-200 ${
              cols === 2 ? "text-black" : "text-neutral-400 hover:text-neutral-600"
            }`}
            aria-label="2 Columns Layout"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="1" width="16" height="16" />
            </svg>
            <div className={`w-[22px] h-[1.5px] mt-[6px] ${cols === 2 ? "bg-black" : "bg-transparent"}`} />
          </button>

          <button
            onClick={() => setCols(4)}
            className={`p-1.5 focus:outline-none flex flex-col items-center transition-colors duration-200 ${
              cols === 4 ? "text-black" : "text-neutral-400 hover:text-neutral-600"
            }`}
            aria-label="4 Columns Layout"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="1" width="16" height="16" />
              <line x1="9" y1="1" x2="9" y2="17" />
            </svg>
            <div className={`w-[22px] h-[1.5px] mt-[6px] ${cols === 4 ? "bg-black" : "bg-transparent"}`} />
          </button>

          <button
            onClick={() => setCols(6)}
            className={`p-1.5 focus:outline-none flex flex-col items-center transition-colors duration-200 ${
              cols === 6 ? "text-black" : "text-neutral-400 hover:text-neutral-600"
            }`}
            aria-label="6 Columns Layout"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="1" width="16" height="16" />
              <line x1="9" y1="1" x2="9" y2="17" />
              <line x1="1" y1="9" x2="17" y2="9" />
            </svg>
            <div className={`w-[22px] h-[1.5px] mt-[6px] ${cols === 6 ? "bg-black" : "bg-transparent"}`} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-0 pb-6 sm:pb-10 pt-0 w-full">
        <div
          className={`transition-all duration-300 ${
            cols === 2
              ? "[&_ul]:!grid-cols-1 sm:[&_ul]:!grid-cols-2 small:[&_ul]:!grid-cols-2 [&_ul]:!gap-x-[2px] [&_ul]:!gap-y-12 [&_.pp-m-add-btn]:!flex sm:[&_.pp-m-add-btn]:!hidden [&_.pp-plus]:!hidden sm:[&_.pp-plus]:!flex small:[&_.pp-plus]:!hidden"
              : cols === 4
              ? "[&_ul]:!grid-cols-2 sm:[&_ul]:!grid-cols-3 lg:[&_ul]:!grid-cols-4 [&_ul]:!gap-x-[2px] [&_ul]:!gap-y-12"
              : "[&_ul]:!grid-cols-3 sm:[&_ul]:!grid-cols-4 lg:[&_ul]:!grid-cols-6 [&_ul]:!gap-x-[2px] [&_ul]:!gap-y-[2px] [&_.pp-d-details]:!hidden [&_.pp-m-details]:!hidden [&_.pp-plus]:!hidden"
          }`}
        >
          {children}
        </div>
      </div>

      {/* Filter drawer (facets scoped to the current search + category) */}
      {facetData ? (
        <CategoryFilterDrawer
          open={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          facetIndex={facetData.facetIndex}
          facets={facetData.facets}
          sortBy={sortBy}
        />
      ) : (
        <FilterDrawerSkeleton
          open={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  )
}

function FilterDrawerSkeleton({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[9998] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white border-l border-neutral-100 z-[9999] shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex pl-8 pr-6 py-6 items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#111111]">
            FILTER AND ORDER
          </h2>
        </div>
        <div className="flex-1 px-8 flex flex-col gap-y-6 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full animate-pulse bg-neutral-100" />
          ))}
        </div>
      </div>
    </>
  )
}
