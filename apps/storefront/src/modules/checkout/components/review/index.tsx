"use client"

import { Heading, Text } from "@modules/common/components/ui"
import PaymentButton from "../payment-button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "review"

  if (!isOpen) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6 border-b border-neutral-200 pb-4">
        <Heading
          level="h2"
          className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950"
        >
          Review Order
        </Heading>
      </div>
      <div className="flex items-start gap-x-1 w-full mb-6">
        <div className="w-full">
          <Text className="txt-medium-plus text-ui-fg-base mb-1">
            By clicking the Place Order button, you confirm that you have
            read, understand and accept our Terms of Use, Terms of Sale and
            Returns Policy and acknowledge that you have read Medusa
            Store&apos;s Privacy Policy.
          </Text>
        </div>
      </div>
      
      <PaymentButton cart={cart} data-testid="submit-order-button" />

      <div className="mt-8 pt-4 border-t border-neutral-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(pathname + "?step=payment", { scroll: false })}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600 hover:text-neutral-950 transition-colors flex items-center gap-x-2 py-2"
          data-testid="back-to-payment-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Payment
        </button>
      </div>
    </div>
  )
}

export default Review
