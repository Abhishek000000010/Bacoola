import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div className="w-full">
      <div className="pb-6 mb-6 flex items-center">
        <h1 className="text-[13px] font-semibold uppercase tracking-widest text-neutral-900">
          SHOPPING BAG ({items?.length || 0})
        </h1>
      </div>
      <div className="flex flex-col w-full gap-y-8">
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
          : repeat(5).map((i) => <SkeletonLineItem key={i} />)}
      </div>

      <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-y-2">
        <span className="text-[13px] text-neutral-900 font-medium">Enjoy a faster shopping experience</span>
        <LocalizedClientLink href="/account" className="text-[11px] font-bold uppercase tracking-widest hover:underline text-black">
          SIGN IN
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default ItemsTemplate
