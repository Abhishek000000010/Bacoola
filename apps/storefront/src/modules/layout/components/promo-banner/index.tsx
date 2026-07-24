"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

interface PromoBannerProps {
  categories: HttpTypes.StoreProductCategory[]
}

/** Root sections that have their own landing page and sale tree. */
const ROOT_SECTIONS = ["women", "men", "teen", "kids"]

/** Section used when the current page isn't tied to one (home, cart, account…). */
const FALLBACK_SECTION = "women"

/**
 * Sale percentage for a category, or null if it isn't a "sale headline" category.
 * `metadata.sale_percent` wins so the banner follows admin edits; otherwise the
 * percentage is read off the name (e.g. "Sale 90% off").
 */
const getSalePercent = (
  category: HttpTypes.StoreProductCategory
): number | null => {
  const meta = (category.metadata as Record<string, unknown> | null)?.sale_percent
  if (meta !== undefined && meta !== null && `${meta}`.trim() !== "") {
    const parsed = parseInt(`${meta}`.replace(/[^\d]/g, ""), 10)
    if (!isNaN(parsed)) return parsed
  }

  // Only headline sale categories carry a percentage in the name. Their
  // children ("Tops", "Jeans") are sale items but have no percentage of
  // their own, so they must not win the lookup.
  const isSale =
    /sale/i.test(category.name) || /(^|-)sale(-|$)/i.test(category.handle)
  if (!isSale) return null

  const match = category.name.match(/(\d+)\s*%/)
  return match ? parseInt(match[1], 10) : null
}

const PromoBanner: React.FC<PromoBannerProps> = ({ categories }) => {
  const pathname = usePathname()

  // Strip the locale prefix: "/in/landingpage/men" → ["landingpage", "men"]
  const segments = pathname?.split("/").filter(Boolean) || []
  const cleanSegments =
    segments.length > 0 && segments[0].length === 2 ? segments.slice(1) : segments

  // A product page belongs to no section, so any percentage shown here is a
  // guess — and a wrong one contradicts the discount on the product itself.
  if (cleanSegments[0] === "products") {
    return null
  }

  // Once the visitor is in the cart or checkout they are past browsing; a sale
  // link here only pulls them out of the purchase flow.
  if (cleanSegments[0] === "cart" || cleanSegments[0] === "checkout") {
    return null
  }

  const byId = new Map(categories.map((c) => [c.id, c]))

  /** Walk from a category up to its root, nearest ancestor first. */
  const ancestorChain = (
    category: HttpTypes.StoreProductCategory
  ): HttpTypes.StoreProductCategory[] => {
    const chain: HttpTypes.StoreProductCategory[] = []
    let current: HttpTypes.StoreProductCategory | undefined = category
    // Depth guard: category trees here are 3 deep; this only stops bad data
    // from looping forever.
    while (current && chain.length < 10) {
      chain.push(current)
      const parentId: string | undefined =
        current.parent_category?.id ?? (current as any).parent_category_id
      current = parentId ? byId.get(parentId) : undefined
    }
    return chain
  }

  // Resolve which root section the visitor is browsing.
  let section = ""
  let currentCategory: HttpTypes.StoreProductCategory | undefined

  if (cleanSegments[0] === "landingpage" && cleanSegments[1]) {
    // Landing pages name their section directly: /landingpage/men
    section = cleanSegments[1].toLowerCase()
  } else if (cleanSegments[0] === "categories" && cleanSegments[1]) {
    // Category pages can be several levels deep (tg-sale-tops → teen-girl →
    // teen), so trace up to the root rather than reading the URL segment.
    const handle = decodeURIComponent(cleanSegments[1]).toLowerCase()
    currentCategory = categories.find((c) => c.handle.toLowerCase() === handle)
    if (currentCategory) {
      const chain = ancestorChain(currentCategory)
      section = chain[chain.length - 1].handle.toLowerCase()
    }
  }

  if (!ROOT_SECTIONS.includes(section)) {
    section = FALLBACK_SECTION
  }

  // Prefer the sale the visitor is actually inside — on a Teen Boy sale page
  // that's Teen Boy's 54%, not Teen's highest.
  let saleCategory: HttpTypes.StoreProductCategory | undefined
  if (currentCategory) {
    saleCategory = ancestorChain(currentCategory).find(
      (c) => getSalePercent(c) !== null
    )
  }

  // Otherwise take the best sale anywhere in the section, matching the
  // "SALE UP TO" wording.
  if (!saleCategory) {
    saleCategory = categories
      .filter((c) => getSalePercent(c) !== null)
      .filter((c) => {
        const chain = ancestorChain(c)
        return chain[chain.length - 1].handle.toLowerCase() === section
      })
      .sort((a, b) => (getSalePercent(b) ?? 0) - (getSalePercent(a) ?? 0))[0]
  }

  if (!saleCategory) {
    return null
  }

  const percent = getSalePercent(saleCategory)
  const bannerText =
    percent !== null ? `SALE UP TO ${percent}% OFF` : saleCategory.name.toUpperCase()

  return (
    <LocalizedClientLink href={`/categories/${saleCategory.handle}`}>
      <div className="w-full bg-[#BA0000] text-white py-2.5 px-4 flex justify-center items-center gap-x-6 text-xs sm:text-sm font-semibold tracking-wider hover:opacity-90 transition-opacity cursor-pointer">
        <span>{bannerText}</span>
        <span className="underline underline-offset-4">SHOP NOW</span>
      </div>
    </LocalizedClientLink>
  )
}

export default PromoBanner
