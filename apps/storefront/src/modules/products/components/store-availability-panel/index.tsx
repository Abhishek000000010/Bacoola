"use client"

import React, { useMemo, useState } from "react"
import { STORES, Store, searchStores, storeDirectionsUrl, storeMapUrl } from "@lib/util/stores"
import PanelShell from "../panel-shell"

/**
 * Slide-over listing the physical stores, with the selected one pinned on a map.
 *
 * Shows where the shops are, not what is in them: per-store stock would need a
 * Medusa stock location per shop with inventory split across them, which does
 * not exist yet. Better to say nothing than to promise stock we can't verify.
 */
export default function StoreAvailabilityPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState("")
  const [selectedId, setSelectedId] = useState(STORES[0]?.id)

  const results = useMemo(() => searchStores(submitted), [submitted])
  const selected: Store | undefined =
    results.find((s) => s.id === selectedId) ?? results[0]

  return (
    <PanelShell
      title="Store availability"
      onClose={onClose}
      maxWidth="880px"
      bodyClassName="flex flex-col overflow-hidden"
    >
      {/* List and map are siblings that each own their scroll, so the map
          stays put while a long store list scrolls beside it. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 w-full flex-col lg:max-w-[360px]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(query)
              }}
              className="flex shrink-0 px-6 pb-5 pt-6 sm:px-8"
            >
              <div className="flex flex-1 items-center gap-x-2 border border-neutral-300 px-3 py-2.5 focus-within:border-black">
                <svg className="h-4 w-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeWidth="1.5" d="M20 20l-4-4" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City or store"
                  aria-label="Search stores"
                  className="w-full bg-transparent text-[12px] lg:text-[14px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear"
                    onClick={() => {
                      setQuery("")
                      setSubmitted("")
                    }}
                    className="text-neutral-500 hover:text-neutral-900"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeWidth="1.5" d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="border border-l-0 border-neutral-300 px-4 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] text-neutral-900 transition-colors hover:bg-black hover:text-white"
              >
                Search
              </button>
            </form>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-8">
              <p className="pb-4 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] text-neutral-500">
                {results.length} {results.length === 1 ? "store" : "stores"}
              </p>

              {results.length === 0 ? (
                <p className="text-[12px] lg:text-[14px] leading-relaxed text-neutral-800">
                  No stores match that search. Try another location.
                </p>
              ) : (
                <ul className="space-y-2 pb-6">
                  {results.map((store) => {
                    const isSelected = selected?.id === store.id
                    return (
                      <li key={store.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(store.id)}
                          aria-current={isSelected}
                          className={`w-full border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-black bg-neutral-50"
                              : "border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-x-3">
                            <span className="text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] text-neutral-900">
                              {store.name}
                            </span>
                            {isSelected && (
                              <svg className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="1.4" d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
                                <circle cx="12" cy="10" r="2.4" strokeWidth="1.4" />
                              </svg>
                            )}
                          </div>
                          <div className="mt-2 text-[12px] lg:text-[14px] leading-[1.6] text-neutral-700">
                            {store.address.map((line) => (
                              <div key={line}>{line}</div>
                            ))}
                            <div>{store.city}</div>
                          </div>
                          {(store.hours || store.phone) && (
                            <div className="mt-3 text-[12px] lg:text-[14px] text-neutral-500">
                              {store.hours && <div>{store.hours}</div>}
                              {store.phone && <div>{store.phone}</div>}
                            </div>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <p className="shrink-0 px-6 pb-6 pt-2 text-[12px] lg:text-[14px] leading-relaxed text-neutral-500 sm:px-8">
              Stock varies by store. Please contact the store to confirm
              availability before travelling.
            </p>
          </div>

          {/* Map fills whatever height is left rather than a fixed box, so the
              panel never ends in dead white space. */}
          {selected && (
            <div className="relative min-h-[320px] flex-1 bg-neutral-100">
              <iframe
                key={selected.id}
                title={`Map showing ${selected.name}`}
                src={storeMapUrl(selected)}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
              />
              <a
                href={storeDirectionsUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-5 left-5 bg-white px-4 py-3 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] text-neutral-900 shadow-[0_1px_6px_rgba(0,0,0,0.18)] transition-colors hover:bg-black hover:text-white"
              >
                Get directions
              </a>
            </div>
          )}
      </div>
    </PanelShell>
  )
}
