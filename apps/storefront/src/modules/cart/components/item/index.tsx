"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // `inventory_quantity` is absent from the raw cart response and is filled in
  // by retrieveCart. If it is still missing the stock is genuinely unknown, so
  // hold the line at the current quantity rather than assuming a default --
  // guessing high is what allowed 10 of a 6-stock variant into the cart.
  const stock = item.variant?.inventory_quantity
  const managed = item.variant?.manage_inventory

  const maxQuantity = !managed
    ? 100
    : typeof stock === "number"
    ? stock
    : item.quantity

  const atMax = item.quantity >= maxQuantity

  if (type === "preview") {
    return (
      <div className="flex gap-x-4 py-5 border-b border-neutral-200/60 last:border-b-0 w-full" data-testid="product-row">
        <LocalizedClientLink href={`/products/${item.product_handle}`} className="shrink-0 w-[97px] h-[136px] bg-neutral-100 relative overflow-hidden">
          <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="full" className="object-cover absolute inset-0 w-full h-full" />
        </LocalizedClientLink>
        <div className="flex flex-col flex-1 text-xs text-neutral-800 justify-between">
          <div className="flex justify-between items-start gap-x-2">
            <div className="flex flex-col pr-2">
              <LocalizedClientLink href={`/products/${item.product_handle}`}>
                <Text className="text-sm font-normal text-neutral-900 leading-tight mb-2 hover:text-black" data-testid="product-title">{item.product_title}</Text>
              </LocalizedClientLink>
              <div className="text-neutral-600 flex flex-col gap-y-0.5 text-xs">
                <div>Quantity: <span className="text-neutral-900">{item.quantity}</span></div>
                <LineItemOptions variant={item.variant} data-testid="product-variant" />
              </div>
            </div>
            <div className="text-right text-sm font-medium text-neutral-900 shrink-0">
              <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
            </div>
          </div>
          <div className="pt-2">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-x-4 w-full" data-testid="product-row">
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="w-[120px] sm:w-[160px] aspect-[3/4] shrink-0 bg-neutral-100 overflow-hidden relative"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="full"
          className="object-cover absolute inset-0 w-full h-full"
        />
      </LocalizedClientLink>

      <div className="flex flex-col flex-1 py-1 relative">
        <div className="absolute top-0 right-0 flex gap-x-3 items-center">
          <button className="text-neutral-400 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          <DeleteButton id={item.id} className="text-neutral-400 hover:text-black" data-testid="product-delete-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DeleteButton>
        </div>

        <div className="pr-16 flex flex-col gap-y-1">
          <LocalizedClientLink href={`/products/${item.product_handle}`}>
            <Text className="text-[13px] font-normal text-neutral-900 leading-snug" data-testid="product-title">
              {item.product_title}
            </Text>
          </LocalizedClientLink>
          <div className="text-[13px] font-normal text-neutral-900">
            <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-y-3 text-[13px]">
          <div className="flex items-center gap-x-4 text-neutral-900">
            <button
              className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-black transition-colors disabled:opacity-30"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || updating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <span className="font-medium text-[13px]">{item.quantity}</span>
            <button
              className="w-5 h-5 flex items-center justify-center text-neutral-500 hover:text-black transition-colors disabled:opacity-30"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={item.quantity >= maxQuantity || updating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            {updating && <Spinner />}
          </div>

          <div className="flex items-center text-neutral-600 mt-1">
            <div className="text-[12px] font-normal text-neutral-600 flex items-center gap-x-1">
              <LineItemOptions variant={item.variant} data-testid="product-variant" />
            </div>
            <button className="text-[11px] uppercase tracking-wider text-neutral-500 underline ml-2 hover:text-black transition-colors">
              Edit
            </button>
          </div>
        </div>

        <ErrorMessage error={error} data-testid="product-error-message" className="mt-2" />
      </div>
    </div>
  )
}

export default Item
