"use client"

import { clx } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"

const steps = [
  { id: "address", label: "Delivery" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Confirmation" },
]

const CheckoutSteps = () => {
  const searchParams = useSearchParams()
  const currentStep = searchParams.get("step") || "address"
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep)
  )

  return (
    <div className="mb-12 grid grid-cols-3 gap-x-2">
      {steps.map((step, index) => {
        const isActive = index === activeIndex

        return (
          <div key={step.id} className="flex flex-col">
            <div
              className={clx("h-px w-full bg-neutral-300", {
                "bg-neutral-950": isActive,
              })}
            />
            <span
              className={clx(
                "pt-3 text-[12px] font-normal tracking-[0.01em] text-neutral-500",
                {
                  "text-neutral-950": isActive,
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
