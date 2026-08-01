"use client"

import { Button } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
  shippingOptions?: HttpTypes.StoreCartShippingOption[]
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

// Amount the customer still needs to add before delivery becomes free, derived
// from whichever shipping option drops to 0 once `item_total` clears a rule.
function getFreeDeliveryRemaining(
  cart: HttpTypes.StoreCart,
  shippingOptions: HttpTypes.StoreCartShippingOption[]
): number | null {
  const itemTotal = cart.item_total ?? 0

  const targets = shippingOptions
    .flatMap((option) => option.prices ?? [])
    .filter(
      (price) =>
        price.amount === 0 &&
        price.currency_code === cart.currency_code &&
        (price.price_rules || []).some((r) => r.attribute === "item_total")
    )
    .map((price) => {
      const rule = (price.price_rules || []).find(
        (r) => r.attribute === "item_total"
      )!
      return parseFloat(rule.value)
    })
    .filter((target) => !Number.isNaN(target) && target > itemTotal)

  if (!targets.length) {
    return null
  }

  return Math.min(...targets) - itemTotal
}

const Summary = ({ cart, shippingOptions = [] }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const remaining = getFreeDeliveryRemaining(cart, shippingOptions)

  return (
    <div className="flex flex-col w-full">
      {remaining !== null && (
        <p className="text-[12px] lg:text-[14px] text-neutral-900 font-normal mb-6">
          Free home delivery if you add{" "}
          {convertToLocale({
            amount: remaining,
            currency_code: cart.currency_code,
          })}{" "}
          to your shopping bag
        </p>
      )}

      <CartTotals totals={cart} />

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-12 bg-black text-white border border-black hover:bg-white hover:text-black transition-colors rounded-none uppercase tracking-widest text-[12px] lg:text-[14px] font-semibold mt-6 mb-8 shadow-none">
          Checkout
        </Button>
      </LocalizedClientLink>

      <DiscountCode cart={cart} />

      <div className="mt-4 flex flex-col gap-y-2 border-0">
        <span className="text-[12px] lg:text-[14px] text-neutral-800 font-medium">Free returns in 30 days</span>
        <LocalizedClientLink href="/returns" className="nav-underline w-fit text-[12px] lg:text-[14px] font-bold uppercase tracking-wide text-black">
          View delivery and returns
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Summary
