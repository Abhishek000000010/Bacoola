"use client"

import React, { useMemo, useState } from "react"
import Image from "next/image"
import {
  MeasurementUnit,
  ProductMeasurements,
  SIZE_EQUIVALENTS,
  SIZE_EQUIVALENT_REGIONS,
  formatMeasurement,
  getGarmentType,
  sizeWindow,
} from "@lib/util/measurements"
import PanelShell, { PanelSection, PanelTabs } from "../panel-shell"

type Tab = "article" | "body"

/**
 * Technical drawing of a top, with numbered callouts that line up with the
 * ARTICLE rows in GARMENT_TYPES (1 length, 2 back, 3 chest, 4 sleeve width,
 * 5 sleeve length). Reordering those rows means redrawing this.
 *
 * Only the "top" garment type has a diagram; the others fall back to the
 * numbered definition list on its own, which still explains every row.
 */
const TopDiagram = () => (
  <Image
    src="/images/measurements/tshirt-article.png"
    alt="T-shirt with numbered measurement guides"
    width={1024}
    height={1536}
    className="h-auto w-full max-w-[300px]"
  />
)

/**
 * The BODY counterpart: where to measure on the wearer, numbered to match the
 * body rows (1 bust, 2 waist).
 */
const BodyDiagram = () => (
  <Image
    src="/images/measurements/tshirt-body.png"
    alt="Where to measure on the body"
    width={582}
    height={813}
    className="h-auto w-full max-w-[300px]"
  />
)

/**
 * Slide-over showing a product's measurements, as a size chart the shopper can
 * compare against a garment they already own.
 *
 * ARTICLE is the garment laid flat, BODY is the wearer it fits. The table shows
 * the selected size flanked by its neighbours (see sizeWindow) rather than the
 * whole grid, because the common question is "should I size up?".
 */
export default function MeasurementsPanel({
  measurements,
  initialSize,
  onClose,
}: {
  measurements: ProductMeasurements
  initialSize?: string
  onClose: () => void
}) {
  const { sizes } = measurements
  const garment = getGarmentType(measurements.garmentType)

  const [tab, setTab] = useState<Tab>("article")
  const [unit, setUnit] = useState<MeasurementUnit>("cm")
  const [selected, setSelected] = useState(
    initialSize && sizes.includes(initialSize) ? initialSize : sizes[0]
  )
  const [equivalentsOpen, setEquivalentsOpen] = useState(true)

  const table = tab === "article" ? measurements.article : measurements.body
  const rows = useMemo(
    () => (tab === "article" ? garment.article : garment.body).filter((r) => table[r.key]),
    [tab, garment, table]
  )

  const shownSizes = sizeWindow(sizes, selected)
  const hasEquivalents = sizes.some((s) => SIZE_EQUIVALENTS[s.toUpperCase()])

  // Each tab has its own artwork: the garment laid flat for ARTICLE, the wearer
  // for BODY. Only the "top" garment type is illustrated so far; other types
  // fall back to the numbered list alone.
  const Diagram =
    garment.id !== "top" ? null : tab === "article" ? TopDiagram : BodyDiagram

  const availableTabs = (["article", "body"] as Tab[])
    .filter((t) => Object.keys(t === "article" ? measurements.article : measurements.body).length)
    .map((t) => ({ id: t, label: t }))

  return (
    <PanelShell title="Measurements" onClose={onClose}>
      {availableTabs.length > 1 && (
        <PanelTabs<Tab> tabs={availableTabs} active={tab} onChange={setTab} />
      )}

      {/* Scale label + unit toggle */}
      <div className={`flex items-center justify-between ${availableTabs.length > 1 ? "mt-8" : ""}`}>
        <span className="text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.12em] text-neutral-500">
          Europe
        </span>
        <div className="flex border border-neutral-200">
          {(["cm", "in"] as MeasurementUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`px-3 py-1.5 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] transition-colors ${
                unit === u
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div className="mt-4 flex">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setSelected(size)}
            // Selected reads as a darker, heavier outline rather than a filled
            // block. The inset ring thickens the border without changing the
            // box size, so the row doesn't shift as the selection moves.
            className={`h-[52px] flex-1 border text-[12px] lg:text-[14px] font-bold uppercase tracking-normal transition-all ${
              selected === size
                ? "relative z-10 border-neutral-900 shadow-[inset_0_0_0_1px_#111111] text-neutral-900"
                : "-ml-px border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

        {/* The selected size and its neighbours */}
        {rows.length > 0 ? (
          <table className="mt-9 w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="w-[40%]" />
                {shownSizes.map((size) => (
                  <th
                    key={size}
                    className={`pb-3 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] ${
                      size === selected ? "text-neutral-900" : "text-neutral-400"
                    }`}
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="py-3.5 pr-4 text-[12px] lg:text-[14px] text-neutral-500">{row.label}</td>
                  {shownSizes.map((size) => {
                    const value = table[row.key]?.[size]
                    return (
                      <td
                        key={size}
                        className={`py-3.5 text-[12px] lg:text-[14px] tabular-nums ${
                          size === selected
                            ? "font-bold text-neutral-900"
                            : "font-normal text-neutral-400"
                        }`}
                      >
                        {value === undefined ? "—" : formatMeasurement(value, unit)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-10 text-[12px] lg:text-[14px] text-neutral-500">
            No measurements available for this view.
          </p>
        )}

        <p className="mt-6 text-[12px] lg:text-[14px] leading-relaxed text-neutral-500">
          {tab === "article"
            ? "Measurements were taken with the item laid flat and may vary slightly depending on the material or the manufacturing process. They serve as a guide when choosing a size."
            : "These are the body measurements this size is designed to fit. They serve as a guide when choosing a size."}
        </p>

        {/* International size equivalents (BODY only, like the reference) */}
        {tab === "body" && hasEquivalents && (
          <div className="mt-12">
            <button
              type="button"
              onClick={() => setEquivalentsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-x-2 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-neutral-900"
            >
              International size equivalents
              <svg
                className={`h-4 w-4 transition-transform ${equivalentsOpen ? "" : "rotate-180"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeWidth="1.5" d="M5 15l7-7 7 7" />
              </svg>
            </button>

            {equivalentsOpen && (
              <table className="mt-5 w-full border-collapse text-left">
                <tbody>
                  {SIZE_EQUIVALENT_REGIONS.map((region) => (
                    <tr key={region}>
                      <td className="w-[40%] py-3 pr-4 text-[12px] lg:text-[14px] text-neutral-500">
                        {region}
                      </td>
                      {shownSizes.map((size) => (
                        <td
                          key={size}
                          className={`py-3 text-[12px] lg:text-[14px] ${
                            size === selected
                              ? "font-bold text-neutral-900"
                              : "font-normal text-neutral-400"
                          }`}
                        >
                          {SIZE_EQUIVALENTS[size.toUpperCase()]?.[region] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* How to measure */}
        {rows.length > 0 && (
          <div className="mt-12">
            <PanelSection title="How to measure">
              {/* The artwork carries its own light background, so no box around
                  it -- a wrapper tint would seam against the image. */}
              {Diagram && (
                <div className="flex justify-center">
                  <Diagram />
                </div>
              )}

              <ol className={Diagram ? "mt-8 space-y-5" : "space-y-5"}>
                {rows.map((row, i) => (
                  <li key={row.key} className="flex gap-x-4">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-neutral-900 text-[12px] lg:text-[14px] font-bold text-neutral-900">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-[12px] lg:text-[14px] font-bold text-neutral-900">{row.label}</div>
                      <p className="mt-1 text-[12px] lg:text-[14px] leading-relaxed text-neutral-500">
                        {row.howTo}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </PanelSection>
          </div>
        )}
    </PanelShell>
  )
}
