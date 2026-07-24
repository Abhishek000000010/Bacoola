"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"
import { convertToLocale } from "@lib/util/money"
import Thumbnail from "@modules/products/components/thumbnail"
import { Text } from "@modules/common/components/ui"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) return convertToLocale({ amount: 0, currency_code: order.currency_code })
    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  const formatStatus = (str: string) => {
    if (!str) return "N/A"
    const formatted = str.split("_").join(" ")
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  const totalItems = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return (
    <div className="flex flex-col justify-center gap-y-6 max-w-4xl mx-auto w-full py-8">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="text-2xl-semi text-neutral-900">Order details</h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
          data-testid="back-to-overview-button"
        >
          <XMark /> Back to overview
        </LocalizedClientLink>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col" data-testid="order-details-container">
        
        {/* HEADER SECTION */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 flex flex-wrap gap-8 items-center justify-between text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Order #</span>
            <span className="font-medium text-gray-900">{order.display_id}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Order Date</span>
            <span className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Status</span>
            <span className="font-medium text-gray-900 bg-gray-200 px-3 py-1 rounded-full text-xs">{formatStatus(order.status)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Items</span>
            <span className="font-medium text-gray-900">{totalItems} {totalItems === 1 ? "Item" : "Items"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold">Total Amount</span>
            <span className="font-medium text-gray-900">{getAmount(order.total)}</span>
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="flex flex-col p-6 gap-6">
          {order.items?.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="w-[120px] h-[150px] shrink-0 rounded shadow-sm overflow-hidden bg-gray-50 relative">
                <Thumbnail 
                  thumbnail={item.thumbnail} 
                  images={item.variant?.product?.images} 
                  size="full" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col flex-1 justify-center">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <LocalizedClientLink href={`/products/${item.product_handle}`}>
                      <Text className="text-base font-semibold text-gray-900 mb-1 hover:text-black transition-colors">{item.product_title}</Text>
                    </LocalizedClientLink>
                    <div className="text-sm text-gray-500 mb-2">
                      <LineItemOptions variant={item.variant} data-testid="product-variant" />
                    </div>
                    <Text className="text-sm text-gray-600">Qty: {item.quantity}</Text>
                  </div>
                  <div className="text-right">
                    <LineItemPrice item={item} style="tight" currencyCode={order.currency_code} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ORDER INFORMATION & TOTALS SECTION */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Address & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold mb-1">Shipping Address</span>
              <span className="font-medium text-gray-900">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</span>
              <span className="text-gray-600">{order.shipping_address?.address_1}</span>
              {order.shipping_address?.address_2 && <span className="text-gray-600">{order.shipping_address?.address_2}</span>}
              <span className="text-gray-600">{order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}</span>
              <span className="text-gray-600">{order.shipping_address?.country_code?.toUpperCase()}</span>
            </div>
            
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold mb-1">Contact</span>
                <span className="text-gray-600">{order.email}</span>
                {order.shipping_address?.phone && <span className="text-gray-600">{order.shipping_address?.phone}</span>}
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold mb-1">Payment</span>
                <span className="text-gray-600 capitalize">
                  {order.payment_collections?.[0]?.payments?.[0]?.provider_id || "N/A"} 
                  <span className="text-gray-400 ml-1">({formatStatus(order.payment_status)})</span>
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold mb-1">Shipping Method</span>
                <span className="text-gray-600 capitalize">
                  {(order as any).shipping_methods?.[0]?.name || "Standard Shipping"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Totals */}
          <div className="flex flex-col text-sm border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
            <span className="text-gray-500 uppercase tracking-wider text-xs font-semibold mb-4">Order Summary</span>
            <div className="flex flex-col gap-3 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{getAmount(order.subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- {getAmount(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{getAmount(order.shipping_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>{getAmount(order.tax_total)}</span>
              </div>
              <div className="h-px w-full bg-gray-200 my-1" />
              <div className="flex justify-between font-semibold text-lg text-gray-900 mt-1">
                <span>Total</span>
                <span>{getAmount(order.total)}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
