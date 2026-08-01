import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DiscountCode from "@modules/checkout/components/discount-code"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"

const MobileShoppingBag = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const itemCount =
    cart.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

  return (
    <div className="lg:hidden flex flex-col mb-8">
      {/* Shopping Bag Box */}
      <div className="border border-neutral-200 bg-white p-4 flex flex-col mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-neutral-950">
            Your shopping bag ({itemCount})
          </h2>
          <LocalizedClientLink
            href="/cart"
            className="text-[12px] font-bold text-neutral-950 transition-colors hover:text-neutral-500 uppercase tracking-[0.05em]"
          >
            Edit
          </LocalizedClientLink>
        </div>

        <div className="flex gap-x-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
          {cart.items?.map((item) => (
            <div key={item.id} className="w-[70px] h-[90px] shrink-0">
              <Thumbnail
                thumbnail={item.thumbnail}
                images={item.variant?.product?.images}
                size="full"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[12px] font-bold text-neutral-950 pt-3 border-t border-neutral-100">
          <span className="uppercase tracking-[0.05em]">Total</span>
          <span>
            {convertToLocale({
              amount: cart.total || 0,
              currency_code: cart.currency_code,
            })}
          </span>
        </div>
      </div>

      {/* Promotional Code */}
      <div className="border border-neutral-200 bg-white px-4 py-5">
        <DiscountCode cart={cart} />
      </div>
    </div>
  )
}

export default MobileShoppingBag
