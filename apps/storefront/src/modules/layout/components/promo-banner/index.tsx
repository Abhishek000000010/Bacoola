"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

interface PromoBannerProps {
  categories: HttpTypes.StoreProductCategory[]
}

/**
 * Dynamically displays the sale percentage based on the current category section.
 * When on /categories/women → shows Women's sale %
 * When on /categories/men → shows Men's sale %
 * When on /categories/teen → shows Teen's sale %
 * When on /categories/kids → shows Kids' sale %
 * Fallback: shows Women's sale or the first sale found.
 */
const PromoBanner: React.FC<PromoBannerProps> = ({ categories }) => {
  const pathname = usePathname()

  // Determine which root section we're in based on the URL
  const segments = pathname?.split("/").filter(Boolean) || []
  // Strip locale code (e.g. "/in/categories/men" → ["categories", "men"])
  const cleanSegments =
    segments.length > 0 && segments[0].length === 2 ? segments.slice(1) : segments

  let currentSection = ""
  if (cleanSegments[0] === "categories" && cleanSegments[1]) {
    currentSection = cleanSegments[1].toLowerCase()
  }

  // Find the sale category that matches the current section
  let saleCategory: HttpTypes.StoreProductCategory | undefined

  if (currentSection) {
    // Look for a sale category whose handle starts with the current section
    // e.g. "women-sale", "men-sale", "teen-girl-sale", "kids-girls-sale"
    saleCategory = categories.find(
      (c) =>
        c.handle.startsWith(`${currentSection}-sale`) ||
        c.handle.startsWith(`${currentSection}-`) && c.name.toUpperCase().includes("SALE")
    )

    // If not found directly, check if we're in a sub-category page
    // and trace up to the root section
    if (!saleCategory) {
      const currentCat = categories.find((c) => c.handle === currentSection)
      if (currentCat?.parent_category) {
        const parentHandle = currentCat.parent_category.handle
        saleCategory = categories.find(
          (c) =>
            c.handle.startsWith(`${parentHandle}-sale`) ||
            (c.handle.includes(parentHandle) && c.name.toUpperCase().includes("SALE"))
        )
      }
    }
  }

  // Fallback: prioritize women's sale, then any sale category
  if (!saleCategory) {
    saleCategory =
      categories.find((c) => c.handle.includes("women-sale")) ||
      categories.find(
        (c) => c.name.toUpperCase().includes("SALE") && c.name.match(/\d+\s*%/)
      )
  }

  // Extract percentage and build text
  let bannerText = "SALE"
  let bannerLink = "/store"

  if (saleCategory) {
    bannerLink = `/categories/${saleCategory.handle}`
    const match = saleCategory.name.match(/(\d+)\s*%/)
    if (match) {
      bannerText = `SALE UP TO ${match[1]}% OFF`
    } else {
      bannerText = saleCategory.name.toUpperCase()
    }
  }

  return (
    <LocalizedClientLink href={bannerLink}>
      <div className="w-full bg-[#B22222] text-white py-2.5 px-4 flex justify-center items-center gap-x-6 text-xs sm:text-sm font-semibold tracking-wider hover:opacity-90 transition-opacity cursor-pointer">
        <span>{bannerText}</span>
        <span className="underline underline-offset-4">SHOP NOW</span>
      </div>
    </LocalizedClientLink>
  )
}

export default PromoBanner
