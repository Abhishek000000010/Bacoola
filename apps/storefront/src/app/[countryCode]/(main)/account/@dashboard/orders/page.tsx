import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import Divider from "@modules/common/components/divider"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full h-full flex flex-col" data-testid="orders-page-wrapper">
      <div className="mb-12">
        <h1 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.05em] text-neutral-950">
          My Purchases
        </h1>
      </div>
      <OrderOverview orders={orders} />
    </div>
  )
}
