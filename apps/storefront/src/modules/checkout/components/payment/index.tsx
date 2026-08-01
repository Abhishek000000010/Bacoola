"use client"
import { RadioGroup } from "@headlessui/react"
import { paymentInfoMap, isManual } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  // Manual Payment is a test-only provider; only real gateways (Razorpay) are
  // offered at checkout, on both desktop and mobile.
  const paymentMethods = (availablePaymentMethods ?? []).filter(
    (method) => !isManual(method.id)
  )

  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    try {
      await initiatePaymentSession(cart, {
        provider_id: method,
        data: { cart_id: cart.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Auto-select the first available method (and open its payment session) so
  // the "Pay now" button in the summary sidebar is ready without an extra click.
  useEffect(() => {
    if (isOpen && !selectedPaymentMethod && paymentMethods.length) {
      setPaymentMethod(paymentMethods[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, availablePaymentMethods])

  if (!isOpen) {
    return null
  }

  return (
    <div className="bg-white">
      <h2 className="mb-4 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.05em] text-neutral-950">
        Payment Method
      </h2>

      <div className="border border-black p-5">
        {paymentMethods.length > 0 && (
          <RadioGroup
            value={selectedPaymentMethod}
            onChange={(value: string) => setPaymentMethod(value)}
          >
            {paymentMethods.map((paymentMethod) => (
              <div key={paymentMethod.id}>
                <PaymentContainer
                  paymentInfoMap={paymentInfoMap}
                  paymentProviderId={paymentMethod.id}
                  selectedPaymentOptionId={selectedPaymentMethod}
                />
              </div>
            ))}
          </RadioGroup>
        )}

        <ErrorMessage error={error} data-testid="payment-method-error-message" />

        {/* Accepted cards */}
        <div className="mt-6">
          <p className="mb-3 text-[12px] lg:text-[14px] text-neutral-800">We accept</p>
          <div className="flex items-center gap-x-3">
            <span className="flex h-6 w-10 items-center justify-center rounded-[3px] border border-neutral-200 text-[12px] lg:text-[14px] font-bold italic tracking-tight text-[#1a1f71]">
              VISA
            </span>
            <span className="flex h-6 w-10 items-center justify-center rounded-[3px] border border-neutral-200">
              <span className="flex items-center">
                <span className="block h-4 w-4 rounded-full bg-[#eb001b]" />
                <span className="-ml-1.5 block h-4 w-4 rounded-full bg-[#f79e1b] opacity-90" />
              </span>
            </span>
          </div>
        </div>

        {/* Safety note */}
        <div className="mt-5 flex items-center gap-x-2 text-[12px] lg:text-[14px] text-neutral-800">
          <span>
            Your payment{" "}
            <span className="font-bold underline underline-offset-2">
              always safe
            </span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 text-neutral-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default Payment
