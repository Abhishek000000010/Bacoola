import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const totalQuantity =
    items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) || 0
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center pl-4 lg:pl-6">
        <h1 className="text-[13px] lg:text-[18px] font-semibold uppercase tracking-widest text-neutral-900">
          SHOPPING BAG ({totalQuantity})
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-1 gap-y-[2px] lg:gap-y-10 w-full">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={cart?.currency_code}
                />
              ))
          : repeat(3).map((i) => <SkeletonLineItem key={i} />)}
      </div>
    </div>
  )
}

export default ItemsTemplate
