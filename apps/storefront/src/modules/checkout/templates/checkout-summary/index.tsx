import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DiscountCode from "@modules/checkout/components/discount-code"
import SummaryPayNow from "@modules/checkout/components/summary-pay-now"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const itemCount =
    cart.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

  return (
    <div className="flex flex-col">
      <h2 className="hidden lg:block text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.05em] text-neutral-950 mb-4">
        Your shopping bag
      </h2>

      {/* Promotional Code */}
      <div className="hidden lg:block bg-white mb-6">
        <DiscountCode cart={cart} />
      </div>

      {/* Totals */}
      <div className="flex flex-col gap-y-3 pt-6 border-t border-b border-neutral-200 pb-6">
        <div className="flex items-center justify-between text-[12px] lg:text-[14px] text-neutral-950">
          <span>Subtotal</span>
          <span>
            {convertToLocale({
              amount: cart.subtotal || 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px] lg:text-[14px] text-neutral-950">
          <span>Delivery</span>
          <span>
            {cart.shipping_total === 0 ? "FREE" : convertToLocale({
              amount: cart.shipping_total || 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px] lg:text-[14px] font-bold text-neutral-950 pt-3">
          <span className="uppercase tracking-[0.05em]">Total</span>
          <span>
            {convertToLocale({
              amount: cart.total || 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
      </div>

      {/* Pay-now action (only shown on the payment step) */}
      <SummaryPayNow cart={cart} />

      {/* Items */}
      <div className="hidden lg:block pt-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.05em] text-neutral-950">
            Items ({itemCount})
          </h3>
          <LocalizedClientLink
            href="/cart"
            className="text-[12px] lg:text-[14px] font-bold text-neutral-950 underline underline-offset-[3px] hover:text-neutral-500 transition-colors uppercase tracking-[0.05em]"
          >
            Edit
          </LocalizedClientLink>
        </div>

        <div className="flex flex-col gap-y-6">
          {cart.items?.map((item) => {
            const rawLabels = (item.variant?.title ?? "").split(" / ")
            let sizeLabel = rawLabels[0]
            let colorLabel = rawLabels.length > 1 ? rawLabels.slice(1).join(" / ") : ""

            if (rawLabels.length === 2 && rawLabels[0].length > rawLabels[1].length) {
              sizeLabel = rawLabels[1]
              colorLabel = rawLabels[0]
            }

            return (
              <div key={item.id} className="flex gap-x-4">
                <div className="w-[100px] shrink-0">
                  <Thumbnail
                    thumbnail={item.thumbnail}
                    images={item.variant?.product?.images}
                    size="full"
                  />
                </div>
                <div className="flex flex-col flex-1 text-[12px] lg:text-[14px] text-neutral-950 gap-y-1.5 min-w-0">
                  <div className="flex justify-between items-start gap-x-2">
                    <span className="truncate">
                      {item.title}
                    </span>
                    <span className="shrink-0">
                      {convertToLocale({
                        amount: item.unit_price,
                        currency_code: cart.currency_code,
                      })}
                    </span>
                  </div>
                  <span>Quantity: {item.quantity}</span>
                  {sizeLabel && <span>Size: {sizeLabel}</span>}
                  {colorLabel && <span>{colorLabel}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
