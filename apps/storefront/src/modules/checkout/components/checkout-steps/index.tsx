"use client"

import { clx } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const steps = [
  { id: "address", label: "Delivery" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Confirmation" },
]

const CheckoutSteps = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStep = searchParams.get("step") || "address"
  // Map 'delivery' step parameter to index 0 ("Delivery") so both 'address' and 'delivery' light up Delivery
  let activeIndex = 0
  if (currentStep === "payment") {
    activeIndex = 1
  } else if (currentStep === "review") {
    activeIndex = 2
  }

  const handleStepClick = (stepId: string, index: number) => {
    if (index <= activeIndex) {
      router.push(`${pathname}?step=${stepId}`, { scroll: false })
    }
  }

  return (
    <div className="mb-12 flex w-full gap-x-1" data-testid="checkout-steps">
      {steps.map((step, index) => {
        const isActive = index === activeIndex
        const isAccessible = index <= activeIndex

        return (
          <div
            key={step.id}
            className={clx("flex flex-col flex-1 transition-opacity", {
              "cursor-pointer hover:opacity-80": isAccessible,
              "cursor-not-allowed": !isAccessible,
            })}
            onClick={() => handleStepClick(step.id, index)}
          >
            <div
              className={clx("h-[2px] w-full bg-neutral-200 transition-colors", {
                "bg-neutral-950": isActive,
              })}
            />
            <span
              className={clx(
                "pt-3 text-[12px] font-normal tracking-[0.01em] text-neutral-400 transition-colors",
                {
                  "text-neutral-950 font-medium": isActive,
                }
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default CheckoutSteps
