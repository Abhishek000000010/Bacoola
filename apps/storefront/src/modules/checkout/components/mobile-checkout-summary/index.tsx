"use client"

import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PaymentButton from "../payment-button"

/**
 * Mobile-only order summary + Pay-now.
 *
 * Desktop shows the summary in the sticky right column; phones have no side
 * column. Here Subtotal/Delivery scroll with the page, while only the TOTAL and
 * the Pay-now button are pinned to the bottom of the screen
 * (`position: sticky; bottom: 0`) so the primary action is always reachable and
 * the empty space below it is used up. Both parts are direct children of the
 * (tall) checkout column so the sticky part can travel the full scroll and only
 * release at its natural position at the end of the page.
 *
 * Rendered only on the payment/review steps so it never duplicates the
 * shopping-bag total on the address step.
 */
const MobileCheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const step = useSearchParams().get("step")

  if (step !== "payment" && step !== "review") {
    return null
  }

  const money = (amount?: number | null) =>
    convertToLocale({
      amount: amount || 0,
      currency_code: cart.currency_code,
    })

  return (
    <>
      {/* Subtotal + delivery: scroll normally */}
      <div className="lg:hidden flex flex-col gap-y-3 pt-6">
        <div className="flex items-center justify-between text-[12px] text-neutral-950">
          <span>Subtotal</span>
          <span>{money(cart.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-[12px] text-neutral-950">
          <span>Delivery</span>
          <span>{cart.shipping_total === 0 ? "FREE" : money(cart.shipping_total)}</span>
        </div>
      </div>

      {/* Total + Pay-now: pinned to the bottom of the screen */}
      <div className="lg:hidden sticky bottom-0 z-20 -mx-4 bg-white px-4 pb-4 pt-4">
        <div className="mb-4 flex items-center justify-between text-[12px] font-bold text-neutral-950">
          <span className="uppercase tracking-[0.05em]">Total</span>
          <span>{money(cart.total)}</span>
        </div>

        <PaymentButton cart={cart} data-testid="summary-pay-now-button" />

        <p className="mt-4 text-[12px] leading-relaxed text-neutral-600">
          By completing your purchase, you confirm that you have read, understood
          and agree to the{" "}
          <LocalizedClientLink
            href="/terms-conditions"
            className="font-bold text-neutral-950 underline underline-offset-2 hover:text-neutral-500"
          >
            Conditions of Sale
          </LocalizedClientLink>{" "}
          and the{" "}
          <LocalizedClientLink
            href="/privacy-policy"
            className="font-bold text-neutral-950 underline underline-offset-2 hover:text-neutral-500"
          >
            Privacy Policy
          </LocalizedClientLink>
          .
        </p>
      </div>
    </>
  )
}

export default MobileCheckoutSummary
