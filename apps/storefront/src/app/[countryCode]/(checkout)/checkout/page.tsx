import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="content-container mx-auto grid max-w-[1720px] grid-cols-1 gap-y-10 py-8 small:grid-cols-[minmax(0,1fr)_440px] small:gap-x-16 small:gap-y-0 small:py-12">
      <div className="w-full small:max-w-[980px]">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
      </div>
      <div className="w-full small:max-w-[440px]">
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
