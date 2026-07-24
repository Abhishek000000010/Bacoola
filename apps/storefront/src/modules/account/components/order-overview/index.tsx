"use client"

import { Button } from "@modules/common/components/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-gray-200 pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center justify-center min-h-[400px] text-center"
      data-testid="no-orders-container"
    >
      <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.05em] text-neutral-950 mb-3">
        You still don&apos;t have any purchases
      </h2>
      <p className="text-[13px] sm:text-[14px] font-normal text-neutral-800 mb-8 max-w-[400px] leading-relaxed">
        Be inspired by the latest news and get new pieces for your wardrobe
      </p>
      
      <LocalizedClientLink href="/" passHref>
        <button 
          className="border border-black bg-black text-white hover:bg-white hover:text-black text-xs font-semibold uppercase tracking-[0.1em] px-16 py-4 transition-colors focus:outline-none"
          data-testid="continue-shopping-button"
        >
          See what&apos;s new
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
