"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

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

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  // A variant with no price cannot be added to a cart -- Medusa rejects it
  // server-side. Treat it as unavailable up front rather than letting the
  // customer click an enabled button that can only fail.
  const hasPrice = useMemo(() => {
    if (!selectedVariant) {
      return (product.variants ?? []).some(
        (v: any) => v.calculated_price?.calculated_amount != null
      )
    }
    return (
      (selectedVariant as any).calculated_price?.calculated_amount != null
    )
  }, [selectedVariant, product.variants])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const [isAddedSuccess, setIsAddedSuccess] = useState(false)

  // add the selected variant to the cart with instant feedback
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)
    setIsAddedSuccess(true)
    setAddError(null)

    // Fire instant update event to header bag counter
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart-updated"))
    }

    setTimeout(() => {
      setIsAddedSuccess(false)
    }, 1500)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
    } catch (error: any) {
      setAddError(error?.message ?? "Could not add to bag. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        {/* Price at the top */}
        <div className="mb-2">
           <ProductPrice product={product} variant={selectedVariant} />
        </div>

        {/* Color Swatches Mock */}
        <div className="flex items-center justify-between border-b border-gray-300 pb-3">
           <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-[#6e4e55] border border-gray-300 cursor-pointer ring-1 ring-offset-2 ring-black"></div>
              <div className="w-4 h-4 bg-[#324554] border border-gray-300 cursor-pointer"></div>
              <div className="w-4 h-4 bg-[#e5e0d8] border border-gray-300 cursor-pointer relative">
                 <div className="absolute inset-0 bg-white/50"></div>
                 <div className="absolute inset-0 border-t border-gray-400 rotate-45 transform origin-center scale-150"></div>
              </div>
           </div>
           <span className="text-xs font-medium text-gray-800">Plum</span>
        </div>

        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4">
           {/* Add Button & Heart */}
           <div className="flex gap-2 h-12">
             <Button
               onClick={handleAddToCart}
               disabled={
                 !inStock ||
                 !selectedVariant ||
                 !!disabled ||
                 isAdding ||
                 !isValidVariant ||
                 !hasPrice
               }
               className="flex-1 bg-gray-900 text-white rounded-none hover:bg-gray-800 tracking-widest text-xs font-bold uppercase transition-colors !h-full"
               isLoading={isAdding}
               data-testid="add-product-button"
             >
                {isAddedSuccess
                  ? "ADDED TO BAG ✓"
                  : !hasPrice
                  ? "Unavailable"
                  : !selectedVariant
                  ? "Select options"
                  : !inStock || !isValidVariant
                  ? "Out of stock"
                  : "Add"}
             </Button>
             <button className="w-12 h-full flex items-center justify-center border border-black bg-white hover:bg-gray-50 transition-colors shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
               </svg>
             </button>
           </div>
           {!hasPrice && (
             <p className="text-[10px] tracking-wide text-gray-500 uppercase">
               This item has no price yet and cannot be purchased.
             </p>
           )}
           {addError && (
             <p
               className="text-[10px] tracking-wide text-red-600"
               data-testid="add-product-error"
             >
               {addError}
             </p>
           )}
        </div>

        {/* Delivery Info & Tags */}
        <div className="mt-2 flex flex-col gap-6">
           <p className="text-[10px] tracking-wide text-gray-500 uppercase">Free delivery to store</p>
           
           <div className="flex gap-4">
              <span className="text-[10px] tracking-wide font-semibold text-black uppercase border-b border-black pb-0.5">Regular fit</span>
              <span className="text-[10px] tracking-wide font-semibold text-gray-400 uppercase">Standard length</span>
           </div>
        </div>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
