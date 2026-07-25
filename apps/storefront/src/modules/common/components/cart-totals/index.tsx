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
      <div className="flex flex-col gap-y-2 text-[13px] text-neutral-900 font-medium">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-normal" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span className="font-normal" data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
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
      </div>

      <div className="flex items-start justify-between text-neutral-900 font-bold text-[13px] mt-6">
        <div className="flex flex-col">
          <span>TOTAL</span>
          {!!tax_total && <span className="text-[10px] font-normal text-neutral-500 mt-1 uppercase">Includes taxes</span>}
        </div>
        <span
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
    </div>
  )
}

export default CartTotals
