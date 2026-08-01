"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { XMark } from "@medusajs/icons"

import {
  applyFilterParams,
  cardMatches,
  CardFacet,
  EMPTY_FILTERS,
  FacetIndex,
  FilterState,
  parseFilterParams,
} from "@lib/util/product-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "NEWEST ARRIVALS" },
  { value: "price_asc", label: "PRICE: LOW TO HIGH" },
  { value: "price_desc", label: "PRICE: HIGH TO LOW" },
]

type Props = {
  open: boolean
  onClose: () => void
  facetIndex: FacetIndex
  /** One entry per grid card in this category — drives the live count. */
  facets: CardFacet[]
  sortBy: SortOptions
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

function Section({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-neutral-100">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left focus:outline-none"
        aria-expanded={open}
      >
        <span className="text-xs lg:text-sm font-semibold uppercase tracking-[0.15em] text-[#111111]">
          {title}
          {count ? (
            <sup className="ml-0.5 text-[12px] lg:text-[14px] font-normal">{count}</sup>
          ) : null}
        </span>
        <Chevron open={open} />
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  )
}

export default function CategoryFilterDrawer({
  open,
  onClose,
  facetIndex,
  facets,
  sortBy,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlFilters = useMemo(
    () => parseFilterParams(searchParams),
    [searchParams]
  )

  const [draft, setDraft] = useState<FilterState>(urlFilters)
  const [draftSort, setDraftSort] = useState<SortOptions>(sortBy)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    colour: true,
    size: false,
    price: false,
    sort: false,
  })

  // Re-sync whenever the drawer is opened, so a cancelled edit does not linger
  // and a back-navigation is reflected.
  useEffect(() => {
    if (open) {
      setDraft(urlFilters)
      setDraftSort(sortBy)
    }
  }, [open, urlFilters, sortBy])

  const priceFloor = facetIndex.priceMin ?? 0
  const priceCeil = facetIndex.priceMax ?? 0
  const hasPriceRange = priceCeil > priceFloor

  const minPrice = draft.minPrice ?? priceFloor
  const maxPrice = draft.maxPrice ?? priceCeil

  const matchCount = useMemo(
    () => facets.filter((f) => cardMatches(f, draft)).length,
    [facets, draft]
  )

  /**
   * Sizes still reachable given the OTHER active filters. A size that would
   * return nothing is shown greyed rather than hidden, so the grid of sizes
   * does not reflow as choices are made.
   */
  const reachableSizes = useMemo(() => {
    const withoutSize: FilterState = { ...draft, sizes: [] }
    const reachable = new Set<string>()
    for (const f of facets) {
      if (!cardMatches(f, withoutSize)) continue
      for (const s of f.sizes) reachable.add(s)
    }
    return reachable
  }, [facets, draft])

  const reachableColors = useMemo(() => {
    const withoutColor: FilterState = { ...draft, colors: [] }
    const reachable = new Set<string>()
    for (const f of facets) {
      if (!cardMatches(f, withoutColor)) continue
      if (f.family) reachable.add(f.family)
    }
    return reachable
  }, [facets, draft])

  const toggle = useCallback((key: "colors" | "sizes", value: string) => {
    setDraft((prev) => {
      const current = prev[key]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [key]: next }
    })
  }, [])

  const apply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    applyFilterParams(params, draft)

    if (draftSort && draftSort !== "created_at") {
      params.set("sortBy", draftSort)
    } else {
      params.delete("sortBy")
    }

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    onClose()
  }, [draft, draftSort, onClose, pathname, router, searchParams])

  const clear = useCallback(() => {
    setDraft(EMPTY_FILTERS)
    setDraftSort("created_at")
  }, [])

  const activeCount =
    draft.colors.length +
    draft.sizes.length +
    (draft.minPrice != null || draft.maxPrice != null ? 1 : 0)

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[9998] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white border-l border-neutral-100 z-[9999] shadow-xl flex flex-col transition-transform duration-300 ease-in-out select-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Filter and order"
      >
        <div className="flex pl-8 pr-6 py-6 items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#111111]">
            FILTER AND ORDER
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-black transition-colors duration-200 focus:outline-none"
            aria-label="Close filters"
          >
            <XMark className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 scrollbar-none">
          {facetIndex.colors.length > 0 && (
            <Section
              title="COLOUR"
              count={draft.colors.length}
              open={openSections.colour}
              onToggle={() =>
                setOpenSections((s) => ({ ...s, colour: !s.colour }))
              }
            >
              <div className="grid grid-cols-3 border-t border-l border-neutral-200">
                {facetIndex.colors.map((c) => {
                  const selected = draft.colors.includes(c.key)
                  const reachable = reachableColors.has(c.key)
                  return (
                    <button
                      key={c.key}
                      onClick={() => toggle("colors", c.key)}
                      disabled={!reachable && !selected}
                      className={`flex items-center gap-x-2 px-2 py-3 border-r border-b border-neutral-200 text-left text-[12px] lg:text-[14px] font-semibold tracking-wider transition-colors ${
                        selected
                          ? "bg-neutral-100 text-black"
                          : reachable
                            ? "text-neutral-700 hover:bg-neutral-50"
                            : "text-neutral-300 cursor-not-allowed"
                      }`}
                      aria-pressed={selected}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 border border-neutral-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {facetIndex.sizes.length > 0 && (
            <Section
              title="SIZE"
              count={draft.sizes.length}
              open={openSections.size}
              onToggle={() => setOpenSections((s) => ({ ...s, size: !s.size }))}
            >
              <div className="grid grid-cols-4 border-t border-l border-neutral-200">
                {facetIndex.sizes.map((s) => {
                  const selected = draft.sizes.includes(s.value)
                  const reachable = reachableSizes.has(s.value)
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggle("sizes", s.value)}
                      disabled={!reachable && !selected}
                      className={`px-2 py-3 border-r border-b border-neutral-200 text-center text-xs lg:text-sm tracking-wider transition-colors ${
                        selected
                          ? "bg-neutral-100 text-black font-semibold"
                          : reachable
                            ? "text-neutral-700 hover:bg-neutral-50"
                            : "text-neutral-300 cursor-not-allowed"
                      }`}
                      aria-pressed={selected}
                    >
                      {s.value}
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {hasPriceRange && (
            <Section
              title="PRICE"
              count={draft.minPrice != null || draft.maxPrice != null ? 1 : 0}
              open={openSections.price}
              onToggle={() => setOpenSections((s) => ({ ...s, price: !s.price }))}
            >
              <div className="pt-2">
                {/*
                  Two native range inputs stacked. The track is a plain div and
                  each thumb sits in its own transparent input, which avoids
                  pulling in a slider dependency for one control.
                */}
                <div className="relative h-6">
                  <div className="absolute top-1/2 h-[2px] w-full -translate-y-1/2 bg-neutral-200" />
                  <div
                    className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-black"
                    style={{
                      left: `${((minPrice - priceFloor) / (priceCeil - priceFloor)) * 100}%`,
                      right: `${100 - ((maxPrice - priceFloor) / (priceCeil - priceFloor)) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={priceFloor}
                    max={priceCeil}
                    value={minPrice}
                    onChange={(e) => {
                      const v = Math.min(Number(e.target.value), maxPrice)
                      setDraft((p) => ({ ...p, minPrice: v }))
                    }}
                    className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-black"
                    aria-label="Minimum price"
                  />
                  <input
                    type="range"
                    min={priceFloor}
                    max={priceCeil}
                    value={maxPrice}
                    onChange={(e) => {
                      const v = Math.max(Number(e.target.value), minPrice)
                      setDraft((p) => ({ ...p, maxPrice: v }))
                    }}
                    className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-black"
                    aria-label="Maximum price"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[12px] lg:text-[14px] font-semibold uppercase tracking-wider text-neutral-500">
                  <span>From Rs. {minPrice.toLocaleString("en-IN")}.00</span>
                  <span>To Rs. {maxPrice.toLocaleString("en-IN")}.00</span>
                </div>
              </div>
            </Section>
          )}

          <Section
            title="SORT BY"
            open={openSections.sort}
            onToggle={() => setOpenSections((s) => ({ ...s, sort: !s.sort }))}
          >
            <div className="flex flex-col gap-y-1 text-xs lg:text-sm tracking-wider">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setDraftSort(o.value)}
                  className={`py-1.5 text-left transition-colors ${
                    draftSort === o.value
                      ? "font-semibold text-black"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-y-2 p-6">
          <button
            onClick={apply}
            disabled={matchCount === 0}
            className="w-full border border-black bg-black py-4 text-xs lg:text-sm font-semibold uppercase tracking-[0.25em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {matchCount === 0
              ? "NO ITEMS"
              : `SHOW ${matchCount} ITEM${matchCount === 1 ? "" : "S"}`}
          </button>
          <button
            onClick={clear}
            disabled={activeCount === 0}
            className="w-full border border-neutral-300 py-4 text-xs lg:text-sm font-semibold uppercase tracking-[0.25em] text-black transition-colors hover:border-black disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            CLEAR FILTERS
          </button>
        </div>
      </div>
    </>
  )
}
