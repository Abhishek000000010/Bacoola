"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Heart } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { isEqual } from "lodash"
import ProductPrice from "../components/product-price"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

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
  const [isAdding, setIsAdding] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
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

  // Handle Add to Bag action
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
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      const imageIdsMap = new Map(selectedVariant.images.map((i: any) => [i.id, true]))
      const variantImages = product.images?.filter((i) => imageIdsMap.has(i.id)) ?? []
      if (variantImages.length > 0) {
        return variantImages
      }
    }
    if (images && images.length > 0) return images
    if (product.images && product.images.length > 0) return product.images
    return product.thumbnail ? [{ url: product.thumbnail }] : []
  }, [selectedVariant, images, product.images, product.thumbnail])

  return (
    <div className="relative w-full min-h-screen bg-white text-black font-sans pb-24">
      <div className="max-w-[1550px] mx-auto px-8 sm:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Section: Vertically Stacked Product Images */}
        <div className="lg:col-span-7 flex flex-col gap-y-6">
          {productImages.map((img, index) => (
            <div key={img.url || index} className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-50">
              {img.url ? (
                <Image
                  src={img.url}
                  alt={`${product.title ?? "Product Image"} angle ${index + 1}`}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
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

        {/* Right Section: Sticky Info and Purchase Actions */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[110px] flex flex-col items-start select-none">
            
            {/* Collection Badge */}
            <span className="text-[10px] uppercase tracking-widest text-[#D01313] font-semibold mb-2">
              {product.collection?.title || "NEW NOW"}
            </span>

            {/* Product Title */}
            <h1 className="text-xl sm:text-2xl font-light uppercase tracking-[0.12em] text-[#111111] mb-2 leading-snug">
              {product.title}
            </h1>

            {/* Product Price */}
            <div className="text-lg sm:text-xl font-semibold tracking-wider text-[#111111] mb-6">
              <ProductPrice product={product} variant={selectedVariant} />
            </div>

            {/* Dynamic Option Selectors */}
            {product.options?.map((option) => {
              const optionTitle = option.title?.toLowerCase() || ""
              const values = Array.from(new Set(option.values?.map((v) => v.value).filter(Boolean))) as string[]
              const currentValue = options[option.id]

              if (optionTitle === "color") {
                return (
                  <div key={option.id} className="flex flex-col mb-6 w-full">
                    <span className="text-[11px] font-semibold tracking-wider text-neutral-400 mb-3 uppercase">
                      COLOR: {currentValue || "SELECT COLOR"}
                    </span>
                    <div className="flex gap-x-3">
                      {values.map((val) => {
                        const hex = colorHexMap[val.toLowerCase()] || val.toLowerCase()
                        const isSelected = currentValue === val
                        return (
                          <button
                            key={val}
                            onClick={() => setOptionValue(option.id, val)}
                            className={`w-5 h-5 rounded-full border focus:outline-none transition-all duration-200 ${
                              isSelected ? "border-black scale-110" : "border-neutral-200"
                            }`}
                            style={{ backgroundColor: hex }}
                            title={val}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              }

              if (optionTitle === "size") {
                return (
                  <div key={option.id} className="flex flex-col mb-8 w-full">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                        SELECT SIZE
                      </span>
                      <button className="text-[10px] font-semibold tracking-wider uppercase border-b border-black pb-0.5 hover:text-neutral-500 hover:border-neutral-500 transition-colors">
                        SIZE GUIDE
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {values.map((val) => {
                        const isSelected = currentValue === val
                        return (
                          <button
                            key={val}
                            onClick={() => setOptionValue(option.id, val)}
                            className={`py-3 border text-center text-xs tracking-wider font-semibold rounded-sm transition-all focus:outline-none ${
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
                          className={`px-4 py-2 border text-xs font-semibold rounded-sm transition-all focus:outline-none ${
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
                className="flex-1 py-4 bg-black text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-800 transition-colors focus:outline-none disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
              >
                {isAdding
                  ? "ADDING TO BAG..."
                  : !selectedVariant && (product.variants?.length ?? 0) > 1
                  ? "SELECT OPTIONS"
                  : !inStock
                  ? "OUT OF STOCK"
                  : "ADD TO BAG"}
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="p-4 border border-neutral-200 hover:border-neutral-400 transition-colors focus:outline-none rounded-sm"
                aria-label="Add to favorites"
              >
                <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "text-red-500 fill-red-500" : "text-neutral-800"}`} />
              </button>
            </div>

            {/* Compositions & Shipping Accordion Details */}
            <div className="w-full border-t border-neutral-100 flex flex-col">
              
              {/* Accordion Item 1: Description */}
              {product.description && (
                <div className="border-b border-neutral-100 py-4 flex flex-col">
                  <button
                    onClick={() => toggleAccordion("description")}
                    className="flex justify-between items-center text-left focus:outline-none w-full"
                  >
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-800">
                      DESCRIPTION
                    </span>
                    <ChevronIcon isOpen={openAccordions.description} />
                  </button>
                  {openAccordions.description && (
                    <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed tracking-wide font-normal animate-in fade-in duration-300">
                      {product.description}
                    </p>
                  )}
                </div>
              )}

              {/* Accordion Item 2: Composition */}
              <div className="border-b border-neutral-100 py-4 flex flex-col">
                <button
                  onClick={() => toggleAccordion("composition")}
                  className="flex justify-between items-center text-left focus:outline-none w-full"
                >
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-800">
                    COMPOSITION AND CARE
                  </span>
                  <ChevronIcon isOpen={openAccordions.composition} />
                </button>
                {openAccordions.composition && (
                  <div className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed tracking-wide font-normal flex flex-col gap-y-2 animate-in fade-in duration-300">
                    <p><strong>Outer Shell:</strong> 52% Cotton, 45% Lyocell, 3% Elastane</p>
                    <p><strong>Lining:</strong> 100% Polyester</p>
                    <p>Do not wash. Do not bleach. Iron at a maximum of 110°C. Professional dry clean with PC121. Do not tumble dry.</p>
                  </div>
                )}
              </div>

              {/* Accordion Item 3: Shipping */}
              <div className="border-b border-neutral-100 py-4 flex flex-col">
                <button
                  onClick={() => toggleAccordion("shipping")}
                  className="flex justify-between items-center text-left focus:outline-none w-full"
                >
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-800">
                    FREE SHIPPING AND RETURNS
                  </span>
                  <ChevronIcon isOpen={openAccordions.shipping} />
                </button>
                {openAccordions.shipping && (
                  <div className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed tracking-wide font-normal flex flex-col gap-y-1 animate-in fade-in duration-300">
                    <p>• Standard delivery: Free over Rs. 5,000 (3-5 business days)</p>
                    <p>• Express delivery: Rs. 500 (1-2 business days)</p>
                    <p>• Free returns within 30 days of shipment receipt.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
