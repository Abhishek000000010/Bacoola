"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div className="py-2">
      <div className="flex flex-col gap-y-2.5 text-sm text-neutral-800 font-normal">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-normal text-neutral-900" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span className="font-normal text-neutral-900" data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {shipping_subtotal === 0 || !shipping_subtotal 
              ? "Free" 
              : convertToLocale({ amount: shipping_subtotal, currency_code })}
          </span>
        </div>

        {!!discount_subtotal && (
          <div className="flex items-center justify-between text-emerald-700">
            <span>Discount</span>
            <span
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}

        {!!tax_total && (
          <div className="flex items-center justify-between text-neutral-600 text-xs">
            <span>Taxes</span>
            <span data-testid="cart-taxes" data-value={tax_total || 0}>
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>

      <div className="my-4 border-b border-neutral-200" />

      <div className="flex items-center justify-between text-neutral-950 font-bold text-base pt-1">
        <span>Total</span>
        <span
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>

      <div className="my-4 border-b border-neutral-200" />
    </div>
  )
}

export default CartTotals
