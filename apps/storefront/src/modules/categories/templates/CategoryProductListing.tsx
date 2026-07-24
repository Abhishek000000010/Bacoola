"use client"

import React, { useState } from "react"
import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import CategorySubmenuBar from "../components/category-submenu-bar"

interface CategoryProductListingProps {
  category: HttpTypes.StoreProductCategory
  parents: HttpTypes.StoreProductCategory[]
  children: React.ReactNode
}

export default function CategoryProductListing({
  category,
  parents,
  children,
}: CategoryProductListingProps) {
  const [cols, setCols] = useState<1 | 2 | 4>(4)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="relative w-full min-h-screen bg-white text-black font-sans pb-16">
      
      {/* Category Submenu Bar */}
      <CategorySubmenuBar category={category} subcategories={category.category_children} parentHandle={parents?.[0]?.handle} />

      {/* Top Header / Control Bar */}
      <div className="w-full border-b border-neutral-100 py-6 px-8 sm:px-12 flex justify-between items-center select-none bg-white">
        <div className="flex gap-x-8 items-center">
          {/* Breadcrumbs and Title */}
          <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase text-[#111111]">
            {parents &&
              parents.map((parent) => (
                <span key={parent.id} className="text-neutral-400 flex items-center">
                  <LocalizedClientLink href={`/categories/${parent.handle}`} className="hover:text-black transition-colors">
                    {parent.name}
                  </LocalizedClientLink>
                  <span className="mx-2">/</span>
                </span>
              ))}
            <span>{category.name}</span>
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="text-xs uppercase tracking-[0.2em] font-semibold border-b border-black pb-0.5 hover:text-neutral-500 hover:border-neutral-500 transition-colors duration-200"
          >
            FILTER AND ORDER
          </button>
        </div>

        {/* 1, 2, or 4 Column Layout controls (Visible on Medium+ screens) */}
        <div className="hidden md:flex gap-x-4 items-center">
          <button
            onClick={() => setCols(1)}
            className={`p-1.5 focus:outline-none transition-colors duration-200 ${
              cols === 1 ? "text-black" : "text-neutral-300 hover:text-neutral-500"
            }`}
            aria-label="1 Column Layout"
          >
            <div className="w-[3px] h-5 bg-current" />
          </button>
          <button
            onClick={() => setCols(2)}
            className={`p-1.5 focus:outline-none flex gap-0.5 transition-colors duration-200 ${
              cols === 2 ? "text-black" : "text-neutral-300 hover:text-neutral-500"
            }`}
            aria-label="2 Columns Layout"
          >
            <div className="w-[3px] h-5 bg-current" />
            <div className="w-[3px] h-5 bg-current" />
          </button>
          <button
            onClick={() => setCols(4)}
            className={`p-1.5 focus:outline-none flex gap-0.5 transition-colors duration-200 ${
              cols === 4 ? "text-black" : "text-neutral-300 hover:text-neutral-500"
            }`}
            aria-label="4 Columns Layout"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-[3px] h-2 bg-current" />
              <div className="w-[3px] h-2 bg-current" />
              <div className="w-[3px] h-2 bg-current" />
              <div className="w-[3px] h-2 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {/* Grid Container wrapping children paginated lists */}
      <div className="px-8 sm:px-12 py-10 max-w-[1550px] mx-auto">
        <div
          className={`transition-all duration-300 ${
            cols === 1
              ? "[&_ul]:!grid-cols-1 max-w-xl mx-auto"
              : cols === 2
              ? "[&_ul]:!grid-cols-1 sm:[&_ul]:!grid-cols-2 [&_ul]:!gap-x-[2px] [&_ul]:!gap-y-8"
              : "[&_ul]:!grid-cols-1 sm:[&_ul]:!grid-cols-2 md:[&_ul]:!grid-cols-3 lg:[&_ul]:!grid-cols-4 [&_ul]:!gap-x-[2px] [&_ul]:!gap-y-8"
          }`}
        >
          {children}
        </div>
      </div>

      {/* Slide-out Filters Panel Drawer */}
      <div
        onClick={() => setIsFilterOpen(false)}
        className={`fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[9998] transition-opacity duration-300 ${
          isFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white border-l border-neutral-100 z-[9999] shadow-xl flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isFilterOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex pl-8 pr-6 py-6 border-b border-neutral-100 items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#111111]">
            FILTER AND ORDER
          </h2>
          <button
            onClick={() => setIsFilterOpen(false)}
            className="p-1 text-neutral-400 hover:text-black transition-colors duration-200 focus:outline-none"
            aria-label="Close filters"
          >
            <XMark className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-y-8 scrollbar-none">
          {/* Colors Filter */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-4">
              COLORS
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "BROWNS", hex: "#5C4033" },
                { name: "ECRU TONES", hex: "#F3EFE0" },
                { name: "GREENS", hex: "#7E7F6B" },
                { name: "GREYS", hex: "#888888" },
                { name: "WHITES", hex: "#FFFFFF" },
              ].map((color) => (
                <button
                  key={color.name}
                  className="flex items-center gap-x-3 p-3 border border-neutral-100 hover:border-neutral-300 transition-all rounded-sm text-left text-[11px] font-semibold tracking-wider text-neutral-700"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-neutral-200" style={{ backgroundColor: color.hex }} />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes Filter */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-4">
              SIZE
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {["38", "40", "42", "44", "46", "48", "50", "52", "S", "M", "L", "XL"].map((sz) => (
                <button
                  key={sz}
                  className="p-2 border border-neutral-100 hover:border-neutral-300 text-center text-xs tracking-wider rounded-sm text-neutral-700"
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-4">
              PRICE
            </h3>
            <div className="flex flex-col gap-2 text-xs text-neutral-600 tracking-wider">
              <label className="flex items-center gap-x-2 cursor-pointer">
                <input type="checkbox" className="accent-black" />
                Under Rs. 4,000
              </label>
              <label className="flex items-center gap-x-2 cursor-pointer">
                <input type="checkbox" className="accent-black" />
                Rs. 4,000 - Rs. 8,000
              </label>
              <label className="flex items-center gap-x-2 cursor-pointer">
                <input type="checkbox" className="accent-black" />
                Over Rs. 8,000
              </label>
            </div>
          </div>

          {/* Sorting */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-4">
              SORT BY
            </h3>
            <div className="flex flex-col gap-2 text-xs text-neutral-600 tracking-wider">
              <button className="text-left py-1 text-black font-semibold hover:text-black">NEWEST ARRIVALS</button>
              <button className="text-left py-1 hover:text-black">PRICE: LOW TO HIGH</button>
              <button className="text-left py-1 hover:text-black">PRICE: HIGH TO LOW</button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
          <button
            onClick={() => setIsFilterOpen(false)}
            className="w-full py-4 border border-black bg-black text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-white hover:text-black transition-colors"
          >
            SHOW PRODUCTS
          </button>
        </div>
      </div>
    </div>
  )
}
