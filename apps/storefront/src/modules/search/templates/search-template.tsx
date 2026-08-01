"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const RECENT_SEARCHES_KEY = "bacoola:recent-searches"

export default function SearchTemplate({
  countryCode,
  query,
  children,
  suggestedProducts = [],
}: {
  countryCode: string
  query?: string
  children?: React.ReactNode
  suggestedProducts?: HttpTypes.StoreProduct[]
}) {
  const router = useRouter()
  const [q, setQ] = useState(query || "")
  const [recent, setRecent] = useState<string[]>([])

  // Load stored recent searches on mount.
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"))
    } catch {
      setRecent([])
    }
  }, [])

  // Whenever a query is active, record it at the top of the recent list.
  useEffect(() => {
    if (!query) {
      return
    }
    try {
      const prev: string[] = JSON.parse(
        localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"
      )
      const next = [
        query,
        ...prev.filter((x) => x.toLowerCase() !== query.toLowerCase()),
      ].slice(0, 8)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      setRecent(next)
    } catch {
      /* ignore storage errors */
    }
  }, [query])

  const runSearch = (term: string) => {
    const trimmed = term.trim()
    router.push(
      trimmed
        ? `/${countryCode}/search?q=${encodeURIComponent(trimmed)}`
        : `/${countryCode}/search`
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(q)
  }

  return (
    <div className="w-full pb-16">
      {/* Search field + panels sit within the padded content area */}
      <div className="px-4 pt-4 sm:px-8 xl:px-12">
        <form onSubmit={handleSearch} className="w-full max-w-[400px]">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SEARCH"
            aria-label="Search"
            autoFocus
            className="w-full border-b border-gray-300 bg-transparent pb-3 text-[12px] lg:text-[14px] leading-none font-semibold uppercase tracking-wider text-neutral-950 outline-none placeholder:text-neutral-500"
          />
        </form>

        {!query && (
          <>
            {recent.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-[12px] lg:text-[14px] font-bold uppercase tracking-wider text-neutral-950">
                  Recent searches
                </h2>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {recent.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => runSearch(term)}
                      className="text-[12px] lg:text-[14px] font-bold uppercase tracking-wider text-neutral-950 transition-colors hover:text-neutral-500"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {suggestedProducts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-[12px] lg:text-[14px] font-bold uppercase tracking-wider text-neutral-950 mb-6">
                  You also viewed
                </h2>
              </section>
            )}
          </>
        )}
      </div>

      {/* Search results: category bar + filters + grid, rendered full width */}
      {query && children}

      {/* Full-bleed product strip */}
      {!query && suggestedProducts.length > 0 && (
        <div className="w-full grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-0">
          {suggestedProducts.map((product) => (
            <LocalizedClientLink
              key={product.id}
              href={`/products/${product.handle}`}
              className="group block aspect-[3/4] overflow-hidden bg-[#F3F3F3]"
            >
              {product.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumbnail}
                  alt={product.title ?? ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </LocalizedClientLink>
          ))}
        </div>
      )}
    </div>
  )
}
