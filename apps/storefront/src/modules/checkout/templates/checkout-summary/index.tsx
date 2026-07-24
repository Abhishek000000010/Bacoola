import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const itemCount =
    cart.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0

  return (
    <div className="sticky top-6 flex flex-col gap-y-6 py-6 small:py-0">
      <div className="flex w-full flex-col bg-white">
        <Heading
          level="h2"
          className="text-lg font-medium text-neutral-950 mb-4"
        >
          Your shopping bag
        </Heading>
        
        <div className="mb-4">
          <DiscountCode cart={cart} />
        </div>

        <CartTotals totals={cart} />

        <div className="mt-2 mb-4 text-base font-medium text-neutral-950">
          Items ({itemCount})
        </div>

        <ItemsPreviewTemplate cart={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
