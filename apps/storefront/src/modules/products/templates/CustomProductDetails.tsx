"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Heart } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { isEqual } from "lodash"
import ProductPrice from "../components/product-price"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import WishlistButton from "@modules/common/components/wishlist-button"

interface CustomProductDetailsProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className="w-4 h-4 text-neutral-500 transition-transform duration-200"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
    />
  </svg>
)

const colorHexMap: Record<string, string> = {
  khaki: "#8F8165",
  black: "#111111",
  white: "#FFFFFF",
  "off-white": "#F5F5F0",
  brown: "#5C4033",
  rust: "#B85A38",
  blue: "#AED8E6",
  grey: "#888888",
  green: "#7E7F6B",
  yellow: "#FFDE43",
  red: "#D01313",
  pink: "#FFC0CB",
  beige: "#F5F5DC",
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const getRowLayout = (n: number) => {
  if (n === 1) return [1]
  if (n === 2) return [2]
  if (n === 3) return [2, 1]
  if (n === 4) return [2, 2]
  if (n === 5) return [2, 3]
  if (n === 6) return [2, 4]
  if (n === 7) return [2, 2, 3]
  if (n === 8) return [2, 2, 4]
  if (n === 9) return [2, 3, 4]
  if (n === 10) return [2, 4, 4]
  if (n === 11) return [2, 2, 3, 4]
  if (n === 12) return [2, 2, 4, 4]
  
  const layout = [2]
  let remaining = n - 2
  while (remaining > 0) {
    if (remaining >= 4) {
      layout.push(4)
      remaining -= 4
    } else {
      layout.push(remaining)
      remaining = 0
    }
  }
  return layout
}

const getGridColsClass = (size: number) => {
  switch (size) {
    case 1: return "grid-cols-1"
    case 2: return "grid-cols-2"
    case 3: return "grid-cols-3"
    case 4: return "grid-cols-4"
    default: return "grid-cols-1"
  }
}

/**
 * Full-screen image viewer.
 *
 * Shows a single image at full width. A thumbnail rail on the left selects which
 * image is shown: hovering a thumbnail previews it temporarily, and the preview
 * reverts to the selected image on hover-out; clicking a thumbnail selects it
 * for good and resets the scroll to the top of that image. Scrolling pans within
 * the one displayed image only (it never advances to another image), and the
 * scrollbar is hidden. Esc or the close button dismisses it.
 */
const Lightbox = ({
  images,
  initialIndex,
  title,
  onClose,
}: {
  images: { url?: string }[]
  initialIndex: number
  title?: string
  onClose: () => void
}) => {
  // The clicked/committed image; hover only previews without changing it.
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const displayedIndex = hoverIndex ?? selectedIndex
  const displayed = images[displayedIndex]

  // Lock body scroll while open and close on Escape.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  const select = (i: number) => {
    setSelectedIndex(i)
    setHoverIndex(null)
    // A newly selected image starts from its top.
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      {/* Hide the scrollbar on the image column (all engines) without losing scroll. */}
      <style>{`.lb-scroll{scrollbar-width:none;-ms-overflow-style:none}.lb-scroll::-webkit-scrollbar{display:none}`}</style>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-5 right-5 z-[120] flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-neutral-900 backdrop-blur transition-colors hover:bg-neutral-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* Thumbnail rail */}
      <div
        className="fixed left-3 top-1/2 z-[110] hidden max-h-[92vh] -translate-y-1/2 flex-col gap-2 overflow-y-auto lb-scroll md:flex"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {images.map((img, i) => (
          <button
            key={img.url || i}
            type="button"
            onClick={() => select(i)}
            onMouseEnter={() => setHoverIndex(i)}
            aria-label={`View image ${i + 1}`}
            className={`relative w-14 shrink-0 overflow-hidden bg-neutral-100 transition-opacity duration-200 aspect-[3/4] ${
              i === selectedIndex ? "opacity-100" : "opacity-40 hover:opacity-100"
            }`}
          >
            {img.url && (
              <img src={img.url} alt="" className="h-full w-full object-cover object-center" />
            )}
          </button>
        ))}
      </div>

      {/* Single full-width image; scrolling stays within this image only. */}
      <div ref={scrollRef} className="h-full overflow-y-auto lb-scroll">
        {displayed?.url ? (
          <img
            src={displayed.url}
            alt={`${title ?? "Product image"} ${displayedIndex + 1}`}
            className="w-full object-contain"
          />
        ) : null}
      </div>
    </div>
  )
}

export default function CustomProductDetails({
  product,
  region,
  countryCode,
  images,
}: CustomProductDetailsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    composition: false,
    shipping: false,
  })

  // Preselect options if v_id query parameter is present or if only 1 variant exists
  useEffect(() => {
    const vId = searchParams.get("v_id")
    if (vId && product.variants) {
      const variant = product.variants.find((v) => v.id === vId)
      if (variant) {
        const variantOptions = optionsAsKeymap(variant.options)
        setOptions(variantOptions ?? {})
      }
    } else if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants, searchParams])

  // Compute selected variant based on option choices
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Check variant validation
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Update URL search parameters when the selected variant changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString(), { scroll: false })
  }, [selectedVariant, isValidVariant, pathname, router, searchParams])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  // Check inventory stock status
  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }
    if (selectedVariant?.allow_backorder) {
      return true
    }
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }
    return false
  }, [selectedVariant])

  // Handle Add to Bag action with accurate loading state
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Prioritize selected variant's images, fallback to product images if empty
  const productImages = useMemo(() => {
    let finalImages: HttpTypes.StoreProductImage[] = []

    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      const imageIdsMap = new Map(selectedVariant.images.map((i: any) => [i.id, true]))
      const variantImages = product.images?.filter((i) => imageIdsMap.has(i.id)) ?? []
      if (variantImages.length > 0) {
        // Honour the admin-defined per-variant order (metadata.image_order) when
        // present. Images not in the list (added after the order was saved) keep
        // their natural position at the end. Falls back to product image order.
        const savedOrder = (selectedVariant.metadata as any)?.image_order
        if (Array.isArray(savedOrder) && savedOrder.length > 0) {
          const rank = new Map<string, number>(
            savedOrder.map((id: string, i: number) => [id, i])
          )
          const ordered = [...variantImages].sort((a, b) => {
            const ra = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER
            const rb = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER
            return ra - rb
          })
          finalImages = ordered
        } else {
          finalImages = variantImages
        }
      }
    }

    if (finalImages.length === 0 && images && images.length > 0) {
      finalImages = images
    }

    if (finalImages.length === 0 && product.images && product.images.length > 0) {
      finalImages = product.images
    }

    // Filter out the thumbnail from the gallery if we have other images to show,
    // to prevent the thumbnail from duplicating across all variants.
    if (finalImages.length > 1 && product.thumbnail) {
      const withoutThumbnail = finalImages.filter(img => img.url !== product.thumbnail)
      if (withoutThumbnail.length > 0) {
        return withoutThumbnail
      }
    }

    if (finalImages.length > 0) {
      return finalImages
    }

    return product.thumbnail ? [{ url: product.thumbnail }] : []
  }, [selectedVariant, images, product.images, product.thumbnail])

  const memoizedImageGallery = useMemo(() => {
    const layout = getRowLayout(productImages.length)
    let imgIndex = 0

    return (
      <div className="lg:col-span-7 flex flex-col w-full relative">
        {/* Mobile Carousel (hidden on desktop) */}
        <div className="flex lg:hidden flex-col w-full relative">
          <div 
            className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
            onScroll={(e) => {
              const container = e.currentTarget
              const scrollLeft = container.scrollLeft
              const width = container.offsetWidth
              const newIndex = Math.round(scrollLeft / width)
              if (newIndex !== activeSlide) {
                setActiveSlide(newIndex)
              }
            }}
          >
            {productImages.map((img, index) => (
              <div
                key={`mobile-${img.url || index}`}
                className="w-full flex-shrink-0 snap-center relative aspect-[3/4] bg-neutral-50"
                onClick={() => img.url && setLightboxIndex(index)}
              >
                {img.url ? (
                  <Image
                    src={img.url}
                    alt={`${product.title ?? "Product Image"} ${index + 1}`}
                    fill
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
                    NO IMAGE
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Dots Indicator */}
          {productImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {productImages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 transition-all duration-300 ${
                    i === activeSlide ? "bg-black w-4" : "bg-neutral-300 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Grid (hidden on mobile) */}
        <div className="hidden lg:flex flex-col gap-1 h-fit w-full">
          {layout.map((rowSize, rowIndex) => {
            const rowImages = productImages.slice(imgIndex, imgIndex + rowSize)
            const currentRowIndex = imgIndex
            imgIndex += rowSize

            return (
              <div key={rowIndex} className={`grid ${getGridColsClass(rowSize)} gap-1 w-full`}>
                {rowImages.map((img, index) => (
                  <div
                    key={img.url || index}
                    className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-50 cursor-zoom-in"
                    onClick={() => img.url && setLightboxIndex(currentRowIndex + index)}
                  >
                    {img.url ? (
                      <Image
                        src={img.url}
                        alt={`${product.title ?? "Product Image"} angle ${currentRowIndex + index + 1}`}
                        fill
                        priority={rowIndex === 0}
                        loading={rowIndex === 0 ? undefined : "lazy"}
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
                        NO IMAGE
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [productImages, product.title, activeSlide])

  return (
    <div className="relative w-full min-h-screen bg-white text-black font-sans pb-24">
      <div className="max-w-[1550px] mx-auto lg:px-12 pt-0 pb-10 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Section: Vertically Stacked Product Images */}
        {memoizedImageGallery}

        {/* Right Section: Sticky Info and Purchase Actions */}
        <div className="lg:col-span-5 px-5 lg:px-0">
          <div className="lg:sticky lg:top-[110px] flex flex-col items-start select-none">
            
            {/* Collection Badge */}
            <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-900 mb-1">
              {product.collection?.title || "NEW NOW"}
            </span>

            {/* Product Title */}
            <h1 className="text-lg font-bold uppercase tracking-wide text-neutral-900 mb-1">
              {product.title}
            </h1>

            {/* Product Price */}
            <div className="text-sm font-normal text-neutral-600 mb-8">
              <ProductPrice product={product} variant={selectedVariant} />
            </div>

            {/* Dynamic Option Selectors */}
            {product.options?.map((option) => {
              const optionTitle = option.title?.toLowerCase() || ""
              const values = Array.from(new Set(option.values?.map((v) => v.value).filter(Boolean))) as string[]
              const currentValue = options[option.id]

              if (optionTitle === "color") {
                return (
                  <div key={option.id} className="flex flex-col mb-8 w-full">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-x-2">
                        {values.map((val) => {
                          const hex = colorHexMap[val.toLowerCase()] || val.toLowerCase()
                          const isSelected = currentValue === val
                          return (
                            <button
                              key={val}
                              onClick={() => setOptionValue(option.id, val)}
                              className={`w-3 h-4 rounded-none border focus:outline-none transition-all duration-200 ${
                                isSelected ? "border-black scale-110" : "border-neutral-200"
                              }`}
                              style={{ backgroundColor: hex }}
                              title={val}
                            />
                          )
                        })}
                      </div>
                      <span className="text-xs font-medium text-neutral-900 capitalize">
                        {currentValue || ""}
                      </span>
                    </div>
                  </div>
                )
              }

              if (optionTitle === "size") {
                return (
                  <div key={option.id} className="flex flex-col mb-8 w-full">
                    <div className="flex flex-row flex-wrap gap-x-8 gap-y-4 w-full text-xs font-semibold text-neutral-900 mt-2">
                      {values.map((val) => {
                        const isSelected = currentValue === val
                        return (
                          <button
                            key={val}
                            onClick={() => setOptionValue(option.id, val)}
                            className={`flex justify-center items-center py-2 focus:outline-none transition-colors relative ${
                              isSelected
                                ? "text-black font-bold"
                                : "text-neutral-500 hover:text-black"
                            }`}
                          >
                            <span className="uppercase tracking-widest">{val}</span>
                            {isSelected && (
                              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              // Fallback default selector for other option types
              return (
                <div key={option.id} className="flex flex-col mb-6 w-full">
                  <span className="text-[11px] font-semibold tracking-wider text-neutral-400 mb-3 uppercase">
                    {option.title}: {currentValue || `SELECT ${option.title}`}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {values.map((val) => {
                      const isSelected = currentValue === val
                      return (
                        <button
                          key={val}
                          onClick={() => setOptionValue(option.id, val)}
                          className={`px-4 py-2 border text-xs font-semibold rounded-none transition-all focus:outline-none ${
                            isSelected
                              ? "border-black bg-black text-white"
                              : "border-neutral-200 hover:border-neutral-400 text-neutral-800"
                          }`}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Add to Bag and Wishlist Action Buttons */}
            <div className="flex gap-x-4 w-full mb-8">
              <button
                onClick={handleAddToCart}
                disabled={
                  (product.variants?.length ?? 0) > 0 &&
                  (!isValidVariant || !selectedVariant || !inStock || isAdding)
                }
                className="flex-1 py-4 border border-black bg-black text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-white hover:text-black transition-colors focus:outline-none disabled:bg-neutral-200 disabled:text-neutral-400 disabled:border-neutral-200 disabled:cursor-not-allowed"
              >
                {isAdding
                  ? "ADDING TO BAG..."
                  : !selectedVariant && (product.variants?.length ?? 0) > 1
                  ? "SELECT OPTIONS"
                  : !inStock
                  ? "OUT OF STOCK"
                  : "ADD TO BAG"}
              </button>
              <WishlistButton
                product={product}
                iconClassName="w-5 h-5"
                className="p-4 border border-neutral-200 hover:border-neutral-400 rounded-none shrink-0"
              />
            </div>



          </div>
        </div>

      </div>

      {lightboxIndex !== null && productImages.length > 0 && (
        <Lightbox
          images={productImages}
          initialIndex={lightboxIndex}
          title={product.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
