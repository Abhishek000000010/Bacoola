import { Button } from "@modules/common/components/ui"
import { useMemo } from "react"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const formatStatus = (str?: string | null) => {
    if (!str) return "Processing"
    const formatted = str.split("_").join(" ")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col mb-6" 
      data-testid="order-card"
    >
      {/* Header Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 uppercase tracking-wider text-[11px] font-semibold">Order #</span>
            <span className="font-semibold text-gray-900" data-testid="order-display-id">{order.display_id}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 uppercase tracking-wider text-[11px] font-semibold">Order Placed</span>
            <span className="text-gray-700 font-medium" data-testid="order-created-at">
              {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 uppercase tracking-wider text-[11px] font-semibold">Total</span>
            <span className="font-semibold text-gray-900" data-testid="order-amount">
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 uppercase tracking-wider text-[11px] font-semibold">Items</span>
            <span className="text-gray-700 font-medium">{numberOfLines} {numberOfLines === 1 ? "item" : "items"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-gray-200 text-gray-800 text-xs px-2.5 py-1 rounded-full font-medium">
            {formatStatus(order.status)}
          </span>
        </div>
      </div>

      {/* Product List */}
      <div className="p-6 flex flex-col gap-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0" data-testid="order-item">
            <div className="w-[80px] h-[100px] shrink-0 rounded bg-gray-50 overflow-hidden relative border border-gray-100">
              <Thumbnail 
                thumbnail={item.thumbnail} 
                images={[]} 
                size="full" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-medium text-gray-900 text-sm hover:text-black transition-colors" data-testid="item-title">
                {item.title}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Qty: <span data-testid="item-quantity">{item.quantity}</span>
              </span>
            </div>
            <div className="text-right text-sm font-medium text-gray-900">
              {convertToLocale({
                amount: item.unit_price * item.quantity,
                currency_code: order.currency_code,
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Card Footer Actions */}
      <div className="bg-gray-50/50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Order ID: {order.id}
        </span>
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary" className="text-xs py-1.5 px-4">
            See details
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
