"use client"

import React, { useState, useRef } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import MegaMenu from "../navigation/MegaMenu"

const NAV_LINKS = [
  { label: "Home", href: "/", key: "home" },
  { label: "Women", href: "/landingpage/women", key: "women" },
  { label: "Men", href: "/landingpage/men", key: "men" },
  { label: "Teen", href: "/landingpage/teen", key: "teen" },
  { label: "Kids", href: "/landingpage/kids", key: "kids" },
]

import { HttpTypes } from "@medusajs/types"
export const HeaderLinks: React.FC<{ categories?: HttpTypes.StoreProductCategory[] }> = ({ categories = [] }) => {
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isActive = (href: string) => {
    if (!pathname) return false

    // Normalize path by stripping the locale code (e.g. "/us/categories/men" -> "/categories/men")
    const segments = pathname.split("/").filter(Boolean)
    const cleanSegments =
      segments.length > 0 && segments[0].length === 2 ? segments.slice(1) : segments
    const cleanPath = "/" + cleanSegments.join("/")

    if (href === "/") {
      return cleanPath === "/"
    }
    return cleanPath.startsWith(href)
  }

  // Handle cursor entering a link trigger
  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (key === "home") {
      setActiveCategory(null)
    } else {
      setActiveCategory(key)
    }
  }

  // Handle cursor leaving a link trigger
  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
    }, 150) // small delay to allow cursor to reach the menu dropdown
  }

  // Handle cursor entering the mega menu dropdown directly
  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Handle cursor leaving the mega menu dropdown
  const handleMenuMouseLeave = () => {
    setActiveCategory(null)
  }

  return (
    <div className="flex items-center gap-x-[28px] h-full relative">
      {NAV_LINKS.map(({ label, href, key }) => {
        const active = isActive(href)
        return (
          <div
            key={label}
            onMouseEnter={() => handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
            className="h-full flex items-center"
          >
            <LocalizedClientLink
              href={href}
              className={clx(
                "relative h-full flex items-center text-[14px] font-semibold uppercase tracking-wider transition-colors duration-200 focus:outline-none",
                active ? "text-[#111111]" : "text-[#111111] hover:text-[#555555]"
              )}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111111]" />
              )}
            </LocalizedClientLink>
          </div>
        )
      })}

      {/* Render the Dropdown Panel below Navbar */}
      <MegaMenu
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onMouseEnter={handleMenuMouseEnter}
        onMouseLeave={handleMenuMouseLeave}
        categories={categories}
      />
    </div>
  )
}

export default HeaderLinks
