import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  const money = (amount?: number | null) =>
    convertToLocale({ amount: amount || 0, currency_code: currencyCode })

  return (
    <div className="flex gap-x-4 py-4" data-testid="product-row">
      <div className="w-16 shrink-0">
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </div>

      <div className="flex min-w-0 flex-1 justify-between gap-x-3">
        <div className="min-w-0">
          <p
            className="line-clamp-2 text-[13px] text-neutral-950"
            data-testid="product-name"
          >
            {item.product_title}
          </p>
          {item.variant?.title && (
            <p className="mt-1 text-[12px] capitalize text-neutral-500" data-testid="product-variant">
              {item.variant.title}
            </p>
          )}
          <p className="mt-1 text-[12px] text-neutral-500">
            Qty <span data-testid="product-quantity">{item.quantity}</span>
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[13px] text-neutral-950">{money(item.total)}</p>
          <p className="mt-1 text-[12px] text-neutral-400">
            {item.quantity} × {money(item.unit_price)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Item
