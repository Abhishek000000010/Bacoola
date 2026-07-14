import React, { useState, useEffect } from "react"
import { XMark } from "@medusajs/icons"
import { navigationData, CategoryKey } from "./navigation-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface MegaMenuProps {
  activeCategory: CategoryKey | null
  setActiveCategory: (category: CategoryKey | null) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

// Age ranges description text mapping
const getKidsAgeLabel = (group: string) => {
  switch (group) {
    case "GIRLS":
    case "BOYS":
      return "From 4 to 14 years"
    case "BABY GIRLS":
    case "BABY BOYS":
      return "From 9 months to 6 years"
    case "NEWBORN":
      return "From 0 to 12 months"
    default:
      return ""
  }
}

// Subcategory mapping configurations for Kids sub-navigation
const kidsSubCategoryMap: Record<string, Record<string, string[]>> = {
  "GIRLS": {
    "SALE 40% OFF": ["Girls Sale", "Baby Sale", "Shoes Sale", "Accessories Sale"],
    "NEW NOW": ["New In Girls", "New In Shoes", "New In Accessories"],
    "SUMMER CLUB": ["Swimwear", "Beach Dresses", "Linen Clothing", "Sandals"],
    "CLOTHING": ["T-Shirts", "Shorts & Pants", "Sweaters", "Dresses", "Jackets", "Skirts", "Jeans", "View All"],
    "SHOES AND ACCESSORIES": ["Sandals", "Sneakers", "Bags", "Hair Accessories", "Socks & Tights", "View All"],
    "COLLECTIONS": ["Organic Cotton", "Matching Sets", "Premium Linens"],
    "FEATURED": ["Birthday Outfits", "Summer Playtime", "Best Sellers"]
  },
  "BOYS": {
    "SALE 40% OFF": ["Boys Sale", "Baby Sale", "Shoes Sale", "Accessories Sale"],
    "NEW NOW": ["New In Boys", "New In Shoes", "New In Accessories"],
    "SUMMER CLUB": ["Swim Shorts", "T-Shirts", "Sandals", "Hats"],
    "CLOTHING": ["T-Shirts", "Shorts & Pants", "Sweaters", "Shirts", "Jackets", "Jeans", "View All"],
    "SHOES AND ACCESSORIES": ["Sandals", "Sneakers", "Caps", "Backpacks", "Socks", "View All"],
    "COLLECTIONS": ["Organic Cotton", "Sporty Essentials", "Play Outfits"],
    "FEATURED": ["Weekend Outfits", "Summer Camp", "Best Sellers"]
  },
  "BABY GIRLS": {
    "SALE 40% OFF": ["Baby Sale", "Shoes Sale", "Accessories Sale"],
    "NEW NOW": ["New In Baby Girls", "New Arrivals"],
    "SUMMER CLUB": ["Swimwear", "Sun Hats", "Lightweight Sets"],
    "CLOTHING": ["Rompers", "Dresses", "T-Shirts", "Pants & Leggings", "Knitwear", "View All"],
    "SHOES AND ACCESSORIES": ["Soft Shoes", "Sneakers", "Bibs & Socks", "View All"],
    "COLLECTIONS": ["Organic Newborn", "Pastel Dreams"],
    "FEATURED": ["Gift Sets", "First Steps", "Best Sellers"]
  },
  "BABY BOYS": {
    "SALE 40% OFF": ["Baby Sale", "Shoes Sale", "Accessories Sale"],
    "NEW NOW": ["New In Baby Boys", "New Arrivals"],
    "SUMMER CLUB": ["Swim Shorts", "Sun Hats", "Lightweight Sets"],
    "CLOTHING": ["Rompers", "T-Shirts", "Pants", "Knitwear", "Shorts", "View All"],
    "SHOES AND ACCESSORIES": ["Soft Shoes", "Sneakers", "Bibs & Socks", "View All"],
    "COLLECTIONS": ["Organic Newborn", "Playtime Essentials"],
    "FEATURED": ["Gift Sets", "First Outfits", "Best Sellers"]
  },
  "NEWBORN": {
    "SALE 40% OFF": ["Newborn Sale", "Baby Sale"],
    "NEW NOW": ["New In Newborn", "New Collections"],
    "SUMMER CLUB": ["Bodies & Rompers", "Sun Protection"],
    "CLOTHING": ["Bodies & Rompers", "Sets & Outfits", "Kits & Layettes", "Blankets", "View All"],
    "SHOES AND ACCESSORIES": ["Booties", "Socks & Mittens", "Caps & Beanies", "Bibs", "View All"],
    "COLLECTIONS": ["Pure Organic Cotton", "Sensory Toys"],
    "FEATURED": ["Hospital Bag Essentials", "Welcome Baby Gift Sets"]
  }
}

const MegaMenu: React.FC<MegaMenuProps> = ({
  activeCategory,
  setActiveCategory,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [lastCategory, setLastCategory] = useState<CategoryKey>("women")
  const [activeSubItem, setActiveSubItem] = useState<string>("CLOTHING")
  const [activeKidsGroup, setActiveKidsGroup] = useState<string>("GIRLS")

  // Keep track of the last active category so content doesn't disappear during exit animation
  useEffect(() => {
    if (activeCategory) {
      setLastCategory(activeCategory)
    }
  }, [activeCategory])

  // Reset active sub-item when active parent category changes
  useEffect(() => {
    const data = navigationData[lastCategory]
    if (data && data.menuItems.length > 0) {
      const clothingItem = data.menuItems.find(
        (item) => item.name.toUpperCase() === "CLOTHING"
      )
      if (clothingItem) {
        setActiveSubItem("CLOTHING")
      } else {
        setActiveSubItem(data.menuItems[0].name)
      }
    }
  }, [lastCategory])

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onMouseLeave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onMouseLeave])

  const isOpen = activeCategory !== null
  const currentCategoryData = navigationData[lastCategory]
  const currentMenuItems = currentCategoryData?.menuItems || []

  // Resolve active right-side subcategory links
  let subcategoryList: string[] = []
  if (lastCategory === "kids") {
    subcategoryList = kidsSubCategoryMap[activeKidsGroup]?.[activeSubItem] || []
  } else {
    const activeSubCategoryData = currentMenuItems.find(
      (item) => item.name === activeSubItem
    )
    subcategoryList = activeSubCategoryData?.items.map((sub) => sub.name) || []
  }

  const categories: { key: CategoryKey; label: string }[] = [
    { key: "women", label: "WOMEN" },
    { key: "men", label: "MEN" },
    { key: "teen", label: "TEEN" },
    { key: "kids", label: "KIDS" },
  ]

  const kidsGroups = ["GIRLS", "BOYS", "BABY GIRLS", "BABY BOYS", "NEWBORN"]

  const getSubcategoryHref = (name: string) => {
    if (name.toLowerCase() === "view all") {
      return `/products/${lastCategory}`
    }
    return `/categories/${lastCategory}/${slugify(name)}`
  }

  return (
    <>
      {/* 1. Backdrop Overlay (fades in/out) */}
      <div
        onClick={onMouseLeave}
        className={`fixed top-[76px] left-0 right-0 bottom-0 bg-black/15 z-[998] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 2. Full-height sliding side panel */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`fixed top-[76px] left-0 bottom-0 w-full max-w-[650px] bg-white border-r border-[#ECECEC] z-[999] transition-transform duration-300 ease-in-out select-none flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Floating Close Button in Top Right (takes 0 layout height) */}
        <button
          onClick={onMouseLeave}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-black transition-colors duration-200 focus:outline-none z-10"
          aria-label="Close menu"
        >
          <XMark className="w-5 h-5 stroke-[1.2px]" />
        </button>

        {/* Dynamic Nested Kids Header Navigation Row (shifted up to top) */}
        {lastCategory === "kids" && (
          <div className="flex flex-col pl-8 pt-10 pb-4 border-b border-neutral-100 bg-white gap-y-2">
            <div className="flex items-center gap-x-4">
              {kidsGroups.map((group) => {
                const isActiveGroup = activeKidsGroup === group
                return (
                  <button
                    key={group}
                    onMouseEnter={() => setActiveKidsGroup(group)}
                    className={`text-[10px] sm:text-xs font-bold tracking-wider transition-all px-3 py-1 focus:outline-none ${
                      isActiveGroup
                        ? "border border-black text-black font-extrabold"
                        : "text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    {group}
                  </button>
                )
              })}
            </div>
            {/* Age guide label */}
            <span className="text-[10px] text-neutral-400 font-medium tracking-wide">
              {getKidsAgeLabel(activeKidsGroup)}
            </span>
          </div>
        )}

        {/* Panel Body: Two Columns Layout (shifted up to top pt-10, or pt-6 if Kids header is present) */}
        <div className={`flex-1 overflow-y-auto scrollbar-none flex pl-8 pr-8 pb-8 gap-x-24 ${
          lastCategory === "kids" ? "pt-6" : "pt-10"
        }`}>
          
          {/* Left Column (Menu Sections - standard gap-y-6) */}
          <div className="flex flex-col gap-y-6 flex-shrink-0">
            {currentMenuItems.map((item) => {
              const isSale = item.isHighlight || item.name.toUpperCase().includes("SALE")
              const isActiveItem = activeSubItem === item.name

              return (
                <div key={item.name} className="relative flex items-center">
                  <button
                    onMouseEnter={() => setActiveSubItem(item.name)}
                    className={`text-left text-xs uppercase tracking-[0.1em] transition-colors duration-200 focus:outline-none relative py-0.5 ${
                      isSale
                        ? "text-[#D01313] font-semibold"
                        : isActiveItem
                        ? "text-black font-semibold"
                        : "text-neutral-500 hover:text-neutral-900 font-medium"
                    }`}
                  >
                    {item.name}
                    {isActiveItem && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1.2px] bg-black" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Right Column (Subcategories - standard gap-y-6) */}
          <div className="flex-1 flex flex-col gap-y-6">
            {subcategoryList.map((subItemName) => (
              <div key={subItemName} className="flex items-center">
                <LocalizedClientLink
                  href={getSubcategoryHref(subItemName)}
                  onClick={onMouseLeave}
                  className="text-left text-xs uppercase tracking-[0.1em] font-normal text-neutral-800 hover:text-neutral-500 transition-colors duration-200"
                >
                  {subItemName}
                </LocalizedClientLink>
              </div>
            ))}
            {subcategoryList.length === 0 && (
              <div className="text-neutral-300 text-xs tracking-wider uppercase font-medium">
                No items available
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

export default MegaMenu
