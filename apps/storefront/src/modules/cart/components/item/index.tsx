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
    <Table.Row className="w-full border-b border-neutral-200/50 last:border-b-0" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="flex small:w-24 w-12"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left py-6">
        <Text
          className="text-xs md:text-sm font-bold uppercase tracking-[0.05em] text-neutral-950 mb-1"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <div className="text-[11px] uppercase tracking-[0.05em] text-neutral-500">
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        </div>
      </Table.Cell>

      <Table.Cell>
          <div className="flex gap-4 items-center w-32">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <div className="flex items-center gap-x-2 border border-neutral-200 p-1">
              <button
                className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                onClick={() => changeQuantity(item.quantity - 1)}
                disabled={item.quantity <= 1 || updating}
                data-testid="decrease-quantity-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <span className="w-6 text-center text-xs font-semibold text-neutral-900" data-testid="product-quantity">
                {item.quantity}
              </span>
              <button
                className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                onClick={() => changeQuantity(item.quantity + 1)}
                disabled={item.quantity >= maxQuantity || updating}
                data-testid="increase-quantity-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            {updating && <Spinner />}
          </div>
          {managed && typeof stock === "number" && atMax && (
            <Text className="text-[11px] text-neutral-500 mt-1">
              Only {stock} in stock
            </Text>
          )}
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>

      <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      <Table.Cell className="!pr-0">
        <span className="!pr-0">
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
