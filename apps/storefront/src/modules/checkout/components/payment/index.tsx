"use client"
import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

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

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
        data: {
          cart_id: cart.id,
        },
      })
    }
  }

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
          data: {
            cart_id: cart.id,
          },
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-8 border-b border-neutral-200 pb-4">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row items-baseline gap-x-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment Method
        </Heading>
        {!isOpen && paymentReady && (
          <div>
            <button
              onClick={handleEdit}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 transition-colors hover:text-neutral-950"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </div>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {availablePaymentMethods?.length > 0 && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}



          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push(pathname + "?step=delivery", { scroll: false })}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600 hover:text-neutral-950 transition-colors flex items-center gap-x-2 py-3"
              data-testid="back-to-delivery-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Delivery
            </button>
            <Button
              size="large"
              className="h-[50px] w-full rounded-none bg-[#111111] px-6 text-[13px] font-bold uppercase tracking-[0.05em] text-white hover:bg-black small:w-auto small:min-w-[280px]"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
                !selectedPaymentMethod
              }
              data-testid="submit-payment-button"
            >
              {!activeSession && isStripeLike(selectedPaymentMethod)
                ? " Enter card details"
                : "Continue to review"}
            </Button>
          </div>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex flex-col border border-neutral-200 p-5 mt-2">
              <div className="flex items-center gap-x-3 text-[13px] font-bold text-neutral-950 uppercase tracking-[0.05em]">
                <CreditCard className="w-5 h-5 text-neutral-700" />
                <span>
                  {paymentInfoMap[activeSession?.provider_id ?? ""]?.title || activeSession?.provider_id}
                </span>
              </div>
              <div className="mt-5 text-[13px] text-neutral-950">
                <span className="font-semibold uppercase tracking-[0.05em]">Details:</span>{" "}
                {isStripeLike(selectedPaymentMethod) && cardBrand
                  ? cardBrand
                  : "Proceed to next step to complete"}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
