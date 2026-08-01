import { cookies as nextCookies } from "next/headers"

import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  const money = (amount?: number | null) =>
    convertToLocale({ amount: amount || 0, currency_code: order.currency_code })

  const itemCount = order.items?.reduce((n, i) => n + i.quantity, 0) || 0
  const discount = (order as { discount_total?: number }).discount_total ?? 0

  return (
    <div className="bg-white">
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-y-8 px-4 py-10 lg:py-16"
        data-testid="order-complete-container"
      >
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="h-7 w-7"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>

          <h1 className="mt-5 text-[26px] font-bold uppercase leading-tight tracking-[0.02em] text-neutral-950 lg:text-[32px]">
            Thank you!
          </h1>
          <p className="mt-2 text-[13px] text-neutral-600 lg:text-[14px]">
            Your order was placed successfully.
          </p>
          <p className="mt-1 text-[12px] text-neutral-500 lg:text-[13px]">
            Confirmation sent to
          </p>
          <p
            className="text-[12px] font-semibold text-neutral-800 [overflow-wrap:anywhere] lg:text-[13px]"
            data-testid="order-email"
          >
            {order.email}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.05em] lg:text-[12px]">
            <span
              className="border border-neutral-200 px-3 py-1.5 text-neutral-950"
              data-testid="order-id"
            >
              Order #{order.display_id}
            </span>
            <span
              className="border border-neutral-200 px-3 py-1.5 text-neutral-600"
              data-testid="order-date"
            >
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Summary */}
        <section className="border border-neutral-200">
          <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 lg:px-6">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-neutral-950 lg:text-[14px]">
              Summary
            </h2>
            <span className="text-[12px] text-neutral-500">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </header>

          <div className="px-5 lg:px-6">
            <Items order={order} />
          </div>

          <div className="flex flex-col gap-y-2.5 border-t border-neutral-200 px-5 py-5 text-[12px] text-neutral-800 lg:px-6 lg:text-[13px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#BA0000]">
                <span>Discount</span>
                <span>-{money(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{order.shipping_total === 0 ? "FREE" : money(order.shipping_total)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-neutral-200 pt-3 text-[13px] font-bold uppercase tracking-[0.05em] text-neutral-950 lg:text-[14px]">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
            <span className="text-[11px] text-neutral-400">Taxes included</span>
          </div>
        </section>

        <ShippingDetails order={order} />
        <PaymentDetails order={order} />
        <Help />

        <LocalizedClientLink
          href="/"
          className="mt-2 flex h-12 w-full items-center justify-center border border-neutral-950 bg-neutral-950 text-[12px] font-bold uppercase tracking-[0.05em] text-white transition-colors hover:bg-white hover:text-neutral-950 lg:text-[14px]"
        >
          Continue shopping
        </LocalizedClientLink>
      </div>
    </div>
  )
}
