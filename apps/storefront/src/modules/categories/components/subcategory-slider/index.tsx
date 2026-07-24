"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronRight } from "@medusajs/icons"
import { useRef } from "react"

export default function SubcategorySlider({
  category,
}: {
  category: HttpTypes.StoreProductCategory
}) {
  const scrollRef = useRef<HTMLUListElement>(null)

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  if (!category.category_children || category.category_children.length === 0) {
    return null
  }

  // Flatten all descendants into a single array
  const descendants: HttpTypes.StoreProductCategory[] = []
  const collectDescendants = (cat: HttpTypes.StoreProductCategory) => {
    if (cat.category_children) {
      cat.category_children.forEach(child => {
        descendants.push(child)
        collectDescendants(child)
      })
    }
  }
  collectDescendants(category)

  return (
    <div className="w-full bg-white py-4 border-t border-b border-neutral-200 relative group">
      <div className="max-w-[1550px] mx-auto px-8 sm:px-12 flex items-center w-full">
        <div className="font-bold text-xs mr-8 shrink-0 uppercase tracking-widest text-neutral-900">
          {category.name}
        </div>
        
        <div className="flex-1 overflow-hidden relative pr-12">
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scroll::-webkit-scrollbar {
              display: none;
            }
            .hide-scroll {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}} />
          <ul 
            ref={scrollRef}
            className="flex items-center gap-x-8 overflow-x-auto hide-scroll scrollbar-none scroll-smooth whitespace-nowrap pb-1"
          >
            <li>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className="text-[12px] font-bold text-neutral-900 hover:text-neutral-500 uppercase tracking-wider"
              >
                SEE ALL
              </LocalizedClientLink>
            </li>
            
            {descendants.map((child) => (
              <li key={child.id}>
                <LocalizedClientLink
                  href={`/categories/${child.handle}`}
                  className="text-[12px] font-bold text-neutral-900 hover:text-neutral-500 uppercase tracking-wider"
                >
                  {child.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
          
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white pl-4 pr-1 h-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 z-10 border-l border-transparent hover:border-neutral-200 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  )
}
