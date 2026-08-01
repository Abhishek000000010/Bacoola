"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"

import { getVariantCards } from "@lib/util/variant-cards"
import { loadStoreProducts } from "@lib/data/products"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ProductPreview from "@modules/products/components/product-preview"
import { FadeIn } from "@modules/common/components/fade-in"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/** Everything loadStoreProducts needs to fetch the next page of this same list. */
export type InfiniteProductsLoadParams = {
  sortBy?: SortOptions
  collectionId?: string
  categoryId?: string | string[]
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
  q?: string
}

/**
 * The listing grid as one continuous, infinitely scrolling column.
 *
 * Page one is rendered on the server and handed in as `initialProducts`; further
 * pages are pulled in as the shopper nears the bottom, via the loadStoreProducts
 * server action. Each colourway tile reveals with the same fade-in used by the
 * "You may also like" strip, so cards ease in as they scroll into view instead
 * of the page snapping between numbered pages.
 */
export default function InfiniteProducts({
  initialProducts,
  initialNextPage,
  region,
  gridClasses,
  loadParams,
}: {
  initialProducts: HttpTypes.StoreProduct[]
  initialNextPage: number | null
  region: HttpTypes.StoreRegion
  gridClasses: string
  loadParams: InfiniteProductsLoadParams
}) {
  const [products, setProducts] = useState(initialProducts)
  const [nextPage, setNextPage] = useState(initialNextPage)
  const [isLoading, setIsLoading] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  // A ref guards against the observer firing a second load while one is already
  // in flight -- state updates lag a frame behind, so the flag has to be sync.
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || nextPage == null) return

    loadingRef.current = true
    setIsLoading(true)

    try {
      const { products: more, nextPage: newNextPage } = await loadStoreProducts({
        page: nextPage,
        ...loadParams,
      })
      setProducts((prev) => [...prev, ...more])
      setNextPage(newNextPage)
    } catch {
      // Leave nextPage as-is so nearing the sentinel again can retry.
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [nextPage, loadParams])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || nextPage == null) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      // Start fetching before the sentinel is actually on screen so the next
      // tiles are usually ready by the time the shopper reaches them.
      { rootMargin: "800px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, nextPage])

  // One tile per colourway, matching the paginated grid it replaces.
  const cards = useMemo(
    () =>
      products.flatMap((p) => getVariantCards(p).map((card) => ({ p, card }))),
    [products]
  )

  return (
    <>
      <ul
        className={`grid ${gridClasses} w-full gap-x-[2px] gap-y-12 bg-white`}
        data-testid="products-list"
      >
        {cards.map(({ p, card }) => (
          <li key={card.key}>
            <FadeIn randomize={true}>
              <ProductPreview product={p} region={region} card={card} />
            </FadeIn>
          </li>
        ))}
      </ul>

      {nextPage != null && (
        <div
          ref={sentinelRef}
          className="flex justify-center w-full py-16"
          aria-hidden="true"
        >
          <div
            className={`h-6 w-6 rounded-full border-2 border-neutral-200 border-t-neutral-800 transition-opacity duration-200 ${
              isLoading ? "opacity-100 animate-spin" : "opacity-0"
            }`}
          />
        </div>
      )}
    </>
  )
}
