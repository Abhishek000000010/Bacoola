import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Cards",
  description: "Manage your saved payment methods.",
}

export default function CardsPage() {
  return (
    <div className="w-full max-w-[500px] mx-auto pt-0 font-sans text-[#111111]">
      <div className="mb-12">
        <h1 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.05em] mb-4">
          My Cards
        </h1>
        <p className="text-[14px] font-normal tracking-wide leading-relaxed">
          Manage your saved payment methods for faster checkout.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-[#f9f9f9] p-8">
        <h2 className="text-[14px] font-bold uppercase tracking-[0.05em] text-neutral-950 mb-3">
          No saved cards
        </h2>
        <p className="text-[13px] font-normal text-neutral-800 mb-8 max-w-[300px] leading-relaxed">
          You currently have no saved payment methods. Add a card during your next checkout to save it here.
        </p>
      </div>
    </div>
  )
}
