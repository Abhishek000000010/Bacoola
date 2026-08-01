import { HttpTypes } from "@medusajs/types"

import Item from "@modules/order/components/item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="divide-y divide-neutral-100" data-testid="products-table">
      {items
        ?.slice()
        .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
        .map((item) => (
          <Item key={item.id} item={item} currencyCode={order.currency_code} />
        ))}
    </div>
  )
}

export default Items
