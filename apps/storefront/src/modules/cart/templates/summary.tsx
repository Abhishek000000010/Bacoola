"use client"

import { Button, Heading } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col w-full">
      <CartTotals totals={cart} />
      
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-12 bg-black text-white hover:bg-neutral-800 transition-colors rounded-none uppercase tracking-widest text-[13px] font-semibold mt-6 mb-8 shadow-none border-none">
          Checkout
        </Button>
      </LocalizedClientLink>

      <DiscountCode cart={cart} />

      <div className="mt-6 flex flex-col gap-y-2 pt-6 border-t border-gray-100">
        <span className="text-[12px] text-neutral-800 font-medium">Free returns in 30 days</span>
        <LocalizedClientLink href="/returns" className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 hover:underline">
          View delivery and returns
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Summary
