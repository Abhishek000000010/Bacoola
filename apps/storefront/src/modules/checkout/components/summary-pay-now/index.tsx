"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useSearchParams } from "next/navigation"
import PaymentButton from "../payment-button"

/**
 * Renders the "Pay now" button and purchase-confirmation copy inside the order
 * summary sidebar. It only appears once the customer reaches the payment step,
 * matching the MANGO checkout where the primary action lives next to the totals.
 */
const SummaryPayNow = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const step = searchParams.get("step")

  if (step !== "payment" && step !== "review") {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4 border-b border-neutral-200 pb-6">
      <PaymentButton cart={cart} data-testid="summary-pay-now-button" />
      <p className="text-[12px] lg:text-[14px] leading-relaxed text-neutral-600">
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
  )
}

export default SummaryPayNow
