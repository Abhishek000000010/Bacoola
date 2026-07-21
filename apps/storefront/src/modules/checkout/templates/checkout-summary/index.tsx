import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const itemCount =
    cart.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

  return (
    <div className="sticky top-0 flex flex-col-reverse gap-y-8 py-6 small:flex-col small:py-0">
      <div className="flex w-full flex-col bg-white small:pt-0">
        <Divider className="my-5 border-neutral-200 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row items-baseline text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950"
        >
          Your Shopping Bag
        </Heading>
        <div className="my-5">
          <DiscountCode cart={cart} />
        </div>
        <CartTotals totals={cart} />
        <div className="mb-3 mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950">
          Items ({itemCount})
        </div>
        <ItemsPreviewTemplate cart={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
