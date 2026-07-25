import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DiscountCode from "@modules/checkout/components/discount-code"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const itemCount =
    cart.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

  return (
    <div className="flex flex-col gap-y-4">
      {/* Shopping Bag Summary Box */}
      <div className="flex flex-col border border-neutral-300 p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.05em] text-black">
            Your shopping bag ({itemCount})
          </h2>
          <LocalizedClientLink
            href="/cart"
            className="text-[11px] font-bold text-black underline underline-offset-[3px] hover:text-neutral-500 transition-colors"
          >
            View
          </LocalizedClientLink>
        </div>

        <div className="flex items-center gap-x-2 mb-6 overflow-x-auto no-scrollbar">
          {cart.items?.map((item) => (
            <div key={item.id} className="w-16 h-20 shrink-0">
              <Thumbnail
                thumbnail={item.thumbnail}
                images={item.variant?.product?.images}
                size="full"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-x-2 text-[11px] font-bold text-black uppercase tracking-[0.05em]">
          <span>Total</span>
          <span>
            {convertToLocale({
              amount: cart.total || 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
      </div>

      {/* Promotional Code */}
      <div className="border border-neutral-300 bg-white">
        <DiscountCode cart={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
