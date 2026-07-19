"use client"

import React, { useRef, useState } from "react"
import Image from "next/image"
import { Heart, ChevronLeft, ChevronRight } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"

interface CarouselProps {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

const WishlistButton: React.FC = () => {
  const [active, setActive] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setActive(!active)
      }}
      className="p-1.5 bg-white/90 hover:bg-white text-black rounded-full shadow-sm transition-all duration-200 focus:outline-none"
      aria-label="Add to wishlist"
    >
      <Heart
        size={14}
        className={active ? "fill-red-600 text-red-600 scale-110 transition-transform" : "text-black"}
        strokeWidth={1.8}
      />
    </button>
  )
}

export const Carousel: React.FC<CarouselProps> = ({ products, region }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  if (!products || products.length === 0) return null

  const handleScroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.75
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="w-full mt-24 mb-16 px-4 max-w-[1440px] mx-auto">
      {/* Header with scroll controls */}
      <div className="flex justify-between items-center mb-8 border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-900">
          May Interest You
        </h3>
        <div className="flex gap-x-3">
          <button
            onClick={() => handleScroll("left")}
            className="p-2 border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-colors focus:outline-none"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-2 border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-colors focus:outline-none"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll container */}
      <div
        ref={containerRef}
        className="flex gap-x-6 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const { cheapestPrice } = getProductPrice({ product })
          const thumbnail = product.thumbnail || "/images/campaign-1.jpg"
          
          // Try to extract sizes
          const sizes = product.options?.find(
            (o: any) => o.title?.toLowerCase() === "size" || o.title?.toLowerCase() === "sizes"
          )?.values?.map((v: any) => v.value) || []

          return (
            <div
              key={product.id}
              className="min-w-[240px] w-[240px] sm:min-w-[280px] sm:w-[280px] snap-start group flex flex-col relative"
            >
              <LocalizedClientLink href={`/products/${product.handle}`} className="block">
                {/* Image Wrap */}
                <div 
                  className="relative w-full overflow-hidden bg-neutral-50 mb-3 border border-neutral-100 transition-all duration-300 block"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  <Image
                    src={thumbnail}
                    alt={product.title || "Product"}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 240px, 280px"
                  />

                  {/* Wishlist Button absolute overlay */}
                  <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <WishlistButton />
                  </div>

                  {/* Sizes overlay bottom hover */}
                  {sizes.length > 0 && (
                    <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-2.5 flex flex-wrap justify-center gap-1.5 border-t border-neutral-100">
                      {sizes.slice(0, 6).map((sz: string) => (
                        <span
                          key={sz}
                          className="text-[10px] font-medium text-neutral-700 border border-neutral-200 px-1.5 py-0.5 rounded-sm hover:border-black hover:text-black transition-colors"
                        >
                          {sz}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col items-start gap-y-1 mt-1">
                  <h4 className="text-xs font-normal text-neutral-800 tracking-wide line-clamp-1 group-hover:text-black">
                    {product.title}
                  </h4>
                  
                  {/* Price */}
                  {cheapestPrice ? (
                    <div className="flex items-center gap-x-2 mt-0.5 text-xs text-neutral-900 font-medium">
                      {cheapestPrice.price_type === "sale" && (
                        <span className="line-through text-neutral-400 font-normal">
                          {cheapestPrice.original_price}
                        </span>
                      )}
                      <span className={cheapestPrice.price_type === "sale" ? "text-rose-600 font-semibold" : ""}>
                        {cheapestPrice.calculated_price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400">Pricing unavailable</span>
                  )}
                </div>
              </LocalizedClientLink>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Carousel
